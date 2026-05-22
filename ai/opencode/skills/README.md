# opencode Skills

A collection of reusable [opencode](https://opencode.ai) agent skills for system administration and maintenance.

## Available Skills

### `system-upgrade`

Analyze Ubuntu/Debian package updates, assess risk levels, check CVEs, and recommend upgrade strategy with reboot detection.

**Invocation**: `/system-upgrade` or ask "check for updates"

**Features**:
- Detects available updates via `apt list --upgradable`
- Categorizes risk (HIGH/MEDIUM/LOW) per package
- Cross-references CVEs from both **Ubuntu USN** and **NVD** databases
- Detects CVE mismatches between Ubuntu and NVD sources
- Weighted risk scoring: `Net Risk = Functional Risk + CVE Severity`
- Identifies packages requiring reboot (displays **in bold**)
- Generates two reports:
  - **Report A**: Risk Assessment Table
  - **Report B**: CVE vs Functional Trade-off Analysis
- Interactive upgrade strategy recommendation

**Risk Categories**:
| Level | Examples |
|-------|----------|
| **HIGH** | Kernel, GPU drivers, systemd, X11/Wayland, compilers, audio/video frameworks, packages with >50 reverse deps, reboot-required |
| **MEDIUM** | Desktop environments, network tools, security packages, important utilities |
| **LOW** | Documentation, language packs, fonts, non-critical apps |

**Upgrade Strategies**:
1. All at once (highest risk)
2. By risk tier (LOW → MEDIUM → HIGH)
3. Security only
4. Switch to Ubuntu official packages
5. Skip & pin specific packages
6. Dry run only

## Installation

Skills are auto-discovered from these locations:
- `~/.claude/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

To install any skill:

```bash
cp -r <skill-name> ~/.agents/skills/<skill-name>
```

Then restart opencode or reconnect the session.

## Adding New Skills

Create a directory with a `SKILL.md` file:

```text
skills/
├── your-skill/
│   └── SKILL.md
└── README.md
```

Each `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: your-skill
description: Brief description of what the skill does
compatibility: opencode
---
```

## License

MIT
