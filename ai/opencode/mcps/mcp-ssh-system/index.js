#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { homedir, tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const SSH_CONFIG_PATH = join(homedir(), ".ssh", "config");
const DEFAULT_TIMEOUT = 30_000;
const MAX_SESSION_BUFFER = 1_048_576;
const CTL_DIR = join(tmpdir(), "mcp-ssh-ctl");
const SSH_PERSIST_TIMEOUT = parseInt(process.env.SSH_PERSIST_TIMEOUT || "300", 10);

try { mkdirSync(CTL_DIR, { recursive: true }); } catch {}

function buildSshArgs(extra) {
  return [
    "-o", `ControlMaster=auto`,
    "-o", `ControlPath=${CTL_DIR}/%r@%h:%p`,
    "-o", `ControlPersist=${SSH_PERSIST_TIMEOUT}`,
    ...extra,
  ];
}

const sessions = new Map();
let sessionConfig = { default_host: null, persist_timeout: 300 };

function resolveHost(host) {
  return host || sessionConfig.default_host || null;
}

const TOOLS = [
  {
    name: "ssh_configure",
    description: "Set default SSH configuration for this session. Call this first to set default_host so subsequent tools can omit it. Returns the current config.",
    inputSchema: {
      type: "object",
      properties: {
        default_host: {
          type: "string",
          description: "Default SSH host for subsequent commands (alias from ~/.ssh/config or user@host)",
        },
        persist_timeout: {
          type: "number",
          description: "SSH ControlMaster idle timeout in seconds (default: 300)",
        },
      },
      required: [],
    },
  },
  {
    name: "ssh_list_hosts",
    description: "List known SSH hosts from ~/.ssh/config",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "ssh_exec",
    description: "Execute a command on a remote host via SSH and return the output. Uses default_host from ssh_configure if 'host' is omitted.",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "SSH host alias (from ~/.ssh/config) or user@hostname or user@ip:port. Optional if default_host is set via ssh_configure.",
        },
        command: {
          type: "string",
          description: "Shell command to execute on the remote host",
        },
        timeout: {
          type: "number",
          description: "Command timeout in milliseconds",
        },
        sudo: {
          type: "boolean",
          description: "If true, run command via sudo. Prompts for password via zenity/kdialog when sudo_password is not provided.",
        },
        sudo_password: {
          type: "string",
          description: "Password for remote sudo. When provided, prepends sudo -S and pipes password to stdin on the remote host.",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "ssh_upload",
    description: "Upload a local file or directory to a remote host via SCP. Uses default_host from ssh_configure if 'host' is omitted.",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "SSH host alias (from ~/.ssh/config) or user@hostname or user@ip:port. Optional if default_host is set via ssh_configure.",
        },
        local_path: {
          type: "string",
          description: "Absolute path to the local file or directory to upload",
        },
        remote_path: {
          type: "string",
          description: "Absolute path on the remote host where files will be copied",
        },
        recursive: {
          type: "boolean",
          description: "If true, copy directories recursively (uses scp -r)",
        },
      },
      required: ["local_path", "remote_path"],
    },
  },
  {
    name: "ssh_download",
    description: "Download a file or directory from a remote host to local machine via SCP. Uses default_host from ssh_configure if 'host' is omitted.",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "SSH host alias (from ~/.ssh/config) or user@hostname or user@ip:port. Optional if default_host is set via ssh_configure.",
        },
        remote_path: {
          type: "string",
          description: "Absolute path on the remote host to the file or directory to download",
        },
        local_path: {
          type: "string",
          description: "Absolute path on the local machine where files will be saved",
        },
        recursive: {
          type: "boolean",
          description: "If true, copy directories recursively (uses scp -r)",
        },
      },
      required: ["remote_path", "local_path"],
    },
  },
  {
    name: "ssh_session_start",
    description: "Start a persistent interactive SSH session on a remote host. Returns a session_id for use with ssh_session_send/ssh_session_read/ssh_session_close. Uses default_host from ssh_configure if 'host' is omitted.",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "SSH host alias (from ~/.ssh/config) or user@hostname or user@ip:port. Optional if default_host is set via ssh_configure.",
        },
      },
      required: [],
    },
  },
  {
    name: "ssh_session_send",
    description: "Send input to an active SSH session.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: {
          type: "string",
          description: "Session ID returned by ssh_session_start",
        },
        input: {
          type: "string",
          description: "Text to send to the session",
        },
        press_enter: {
          type: "boolean",
          description: "If true, append a newline after the input",
        },
      },
      required: ["session_id", "input"],
    },
  },
  {
    name: "ssh_session_read",
    description: "Read output accumulated since the last read from an active SSH session.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: {
          type: "string",
          description: "Session ID returned by ssh_session_start",
        },
      },
      required: ["session_id"],
    },
  },
  {
    name: "ssh_session_close",
    description: "Close an active SSH session and release resources.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: {
          type: "string",
          description: "Session ID returned by ssh_session_start",
        },
      },
      required: ["session_id"],
    },
  },
];

function parseSshConfig() {
  if (!existsSync(SSH_CONFIG_PATH)) return [];
  const content = readFileSync(SSH_CONFIG_PATH, "utf-8");
  const hosts = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.length === 0) continue;
    const match = trimmed.match(/^Host\s+(.+)$/i);
    if (match) {
      const names = match[1].split(/\s+/);
      for (const name of names) {
        if (name !== "*") hosts.push(name);
      }
    }
  }
  return [...new Set(hosts)].sort();
}

function buildScpTarget(host, path) {
  return `${host}:${path}`;
}

function spawnProcess(bin, args, timeout, stdinCallback) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: timeout || DEFAULT_TIMEOUT,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    if (stdinCallback) {
      stdinCallback(proc.stdin);
    }

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`Process timed out after ${timeout || DEFAULT_TIMEOUT}ms`));
    }, timeout || DEFAULT_TIMEOUT);

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

const ZENITY_TIMEOUT = 10_000;

function promptPassword(host) {
  return new Promise((resolve, reject) => {
    if (!process.env.DISPLAY) {
      reject(new Error("sudo requires a password. Either pass sudo_password or set DISPLAY for an interactive prompt."));
      return;
    }
    const bin = "zenity";
    let cancelled = false;
    const timer = setTimeout(() => {
      cancelled = true;
      reject(new Error("sudo password prompt timed out. Either pass sudo_password or ensure DISPLAY is accessible."));
    }, ZENITY_TIMEOUT);
    const proc = spawn(bin, ["--password", "--title", `sudo password for ${host}`], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    let pwd = "";
    proc.stdout.on("data", (d) => { if (!cancelled) pwd += d.toString(); });
    proc.on("close", (code) => {
      if (cancelled) return;
      clearTimeout(timer);
      if (code === 0) {
        const result = pwd.trim().replace(/\n$/, "");
        if (result) resolve(result);
        else reject(new Error("Empty password"));
      } else if (code === 1) reject(new Error("Password prompt cancelled"));
      else reject(new Error(`Password prompt exited with code ${code}`));
    });
    proc.on("error", (err) => {
      if (cancelled) return;
      clearTimeout(timer);
      reject(new Error(`Cannot show password prompt: ${err.message}`));
    });
  });
}

function appendBuffer(buf, data) {
  buf += data;
  if (buf.length > MAX_SESSION_BUFFER) {
    buf = buf.slice(buf.length - MAX_SESSION_BUFFER);
  }
  return buf;
}

function cleanupOldSessions() {
  const now = Date.now();
  for (const [id, ses] of sessions) {
    if (now - ses.lastActivity > 3_600_000) {
      try { ses.proc.kill("SIGTERM"); } catch {}
      sessions.delete(id);
    }
  }
}

async function handleToolCall(name, args) {
  switch (name) {
    case "ssh_configure": {
      const { default_host, persist_timeout } = args;
      if (default_host !== undefined) sessionConfig.default_host = default_host;
      if (persist_timeout !== undefined) sessionConfig.persist_timeout = persist_timeout;
      return {
        content: [{ type: "text", text: JSON.stringify(sessionConfig, null, 2) }],
      };
    }
    case "ssh_list_hosts": {
      const hosts = parseSshConfig();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ hosts }, null, 2),
          },
        ],
      };
    }
    case "ssh_exec": {
      const { host: rawHost, command, timeout, sudo, sudo_password } = args;
      if (!command) throw new Error("'command' is required");
      const host = resolveHost(rawHost);
      if (!host) {
        return {
          content: [{ type: "text", text: "No SSH host configured. Call ssh_configure to set default_host, or pass 'host' parameter." }],
          isError: true,
        };
      }
      let password = sudo_password;
      if (sudo && !password) {
        password = await promptPassword(host);
      }
      const finalCommand = password ? `sudo -S ${command}` : command;
      const sshArgs = buildSshArgs([host, "--", finalCommand]);
      const stdinCallback = password
        ? (stdin) => { stdin.write(password + "\n"); stdin.end(); }
        : undefined;
      const result = await spawnProcess("ssh", sshArgs, timeout, stdinCallback);
      if (result.exitCode === 0) {
        return { content: [{ type: "text", text: result.stdout }] };
      }
      return {
        content: [{ type: "text", text: result.stderr || result.stdout }],
        isError: true,
      };
    }
    case "ssh_upload": {
      const { host: rawHost, local_path, remote_path, recursive } = args;
      const host = resolveHost(rawHost);
      if (!host) {
        return {
          content: [{ type: "text", text: "No SSH host configured. Call ssh_configure to set default_host, or pass 'host' parameter." }],
          isError: true,
        };
      }
      const scpArgs = [];
      if (recursive) scpArgs.push("-r");
      scpArgs.push(...buildSshArgs([]), local_path, buildScpTarget(host, remote_path));
      const result = await spawnProcess("scp", scpArgs);
      if (result.exitCode === 0) {
        return { content: [{ type: "text", text: "OK" }] };
      }
      return { content: [{ type: "text", text: result.stderr }], isError: true };
    }
    case "ssh_download": {
      const { host: rawHost, remote_path, local_path, recursive } = args;
      const host = resolveHost(rawHost);
      if (!host) {
        return {
          content: [{ type: "text", text: "No SSH host configured. Call ssh_configure to set default_host, or pass 'host' parameter." }],
          isError: true,
        };
      }
      const scpArgs = [];
      if (recursive) scpArgs.push("-r");
      scpArgs.push(...buildSshArgs([]), buildScpTarget(host, remote_path), local_path);
      const result = await spawnProcess("scp", scpArgs);
      if (result.exitCode === 0) {
        return { content: [{ type: "text", text: "OK" }] };
      }
      return { content: [{ type: "text", text: result.stderr }], isError: true };
    }
    case "ssh_session_start": {
      const { host: rawHost } = args;
      const host = resolveHost(rawHost);
      if (!host) {
        return {
          content: [{ type: "text", text: "No SSH host configured. Call ssh_configure to set default_host, or pass 'host' parameter." }],
          isError: true,
        };
      }
      cleanupOldSessions();
      const id = randomUUID();
      const proc = spawn("ssh", buildSshArgs(["-tt", host]), {
        stdio: ["pipe", "pipe", "pipe"],
      });
      let outputBuffer = "";
      proc.stdout.on("data", (data) => {
        outputBuffer = appendBuffer(outputBuffer, data.toString());
      });
      proc.stderr.on("data", (data) => {
        outputBuffer = appendBuffer(outputBuffer, data.toString());
      });
      let alive = true;
      proc.on("close", (code) => {
        alive = false;
        outputBuffer = appendBuffer(outputBuffer, `\n[Session exited with code ${code}]\n`);
      });
      proc.on("error", () => {
        alive = false;
      });
      const session = { id, host, proc, outputBuffer, lastRead: 0, alive, createdAt: Date.now(), lastActivity: Date.now() };
      sessions.set(id, session);
      return {
        content: [{ type: "text", text: `Session started: ${id}\nHost: ${host}` }],
      };
    }
    case "ssh_session_send": {
      const { session_id, input, press_enter } = args;
      if (!session_id || input === undefined) {
        throw new Error("'session_id' and 'input' are required");
      }
      const session = sessions.get(session_id);
      if (!session) throw new Error(`Session not found: ${session_id}`);
      if (!session.alive) throw new Error(`Session ${session_id} is no longer active (SSH connection closed)`);
      try {
        const data = press_enter !== false ? input + "\n" : input;
        session.proc.stdin.write(data);
        session.lastActivity = Date.now();
        return {
          content: [{ type: "text", text: "OK" }],
        };
      } catch (err) {
        throw new Error(`Failed to write to session: ${err.message}`);
      }
    }
    case "ssh_session_read": {
      const { session_id } = args;
      if (!session_id) throw new Error("'session_id' is required");
      const session = sessions.get(session_id);
      if (!session) throw new Error(`Session not found: ${session_id}`);
      const newOutput = session.outputBuffer.slice(session.lastRead);
      session.lastRead = session.outputBuffer.length;
      session.lastActivity = Date.now();
      const parts = [{ type: "text", text: newOutput || "(no new output)" }];
      if (!session.alive) {
        parts.push({ type: "text", text: "\n[Session ended]" });
      }
      return { content: parts };
    }
    case "ssh_session_close": {
      const { session_id } = args;
      if (!session_id) throw new Error("'session_id' is required");
      const session = sessions.get(session_id);
      if (!session) throw new Error(`Session not found: ${session_id}`);
      try { session.proc.kill("SIGTERM"); } catch {}
      setTimeout(() => {
        try { session.proc.kill("SIGKILL"); } catch {}
      }, 2000);
      sessions.delete(session_id);
      return {
        content: [{ type: "text", text: `Session closed: ${session_id}` }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  { name: "mcp-ssh-system", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await handleToolCall(request.params.name, request.params.arguments ?? {});
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
