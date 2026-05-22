---
name: system-upgrade
description: Analyze Ubuntu/Debian package updates, assess risk levels, check CVEs, and recommend upgrade strategy with reboot detection
compatibility: opencode
---

## What I do

This skill performs a comprehensive system upgrade risk analysis:

1. **Detect Updates**: Run `apt list --upgradable` to find available packages
2. **Gather Metadata**: Collect versions, dependencies, changelogs
3. **CVE Analysis**: Query both Ubuntu USN and NVD databases for CVEs in new versions
4. **Risk Categorization**: Classify each package by functional risk level
5. **Dependency Analysis**: Identify interconnected packages and version locks
6. **Reboot Detection**: Check if packages require system restart
7. **Generate Reports**: Two reports - Risk Assessment and CVE Trade-off Analysis
8. **Recommend Strategy**: Present upgrade options and wait for confirmation

## Risk Categories

### HIGH Risk (requires caution)
- **Kernel/Drivers**: nvidia-*, amdgpu, linux-image-*, kernel modules
- **System Core**: systemd, glibc, grub, boot-related packages
- **Display/X11**: Xorg, wayland, mesa, vulkan-loader, i965, ansel
- **Compilers**: gcc, clang, rustc, golang-* (build toolchains)
- **Audio Frameworks**: pipewire, pulseaudio, alsa-lib, libpulse
- **Video/Graphics**: ffmpeg, mesa, intel-media-driver, va-api drivers
- **Many Dependents**: packages with >50 reverse dependencies
- **Reboot Required**: kernel-modules, DKMS, systemd units needing restart

### MEDIUM Risk
- Desktop environment core: gnome-*, kde-*, cinnamon-*
- Network tools: network-manager, wpa-supplicant, iproute2
- Important utilities: systemd-*, util-linux, coreutils
- Video codecs: libavcodec, vlc, gstreamer plugins
- Security packages: openssh, openssl, libssl

### LOW Risk
- Documentation packages: *-doc
- Language packs: *-lang, translations-*
- Fonts and themes: fonts-*, icon-*, cursor-*
- Non-critical apps: snapd (sometimes), flatpak

## CVE Data Sources

### Ubuntu Security Notices (USN)
- API: `https://usn.ubuntu.com/usn-db/all-releases.json.bz2`
- Query: Match package name and version against CVE list
- Priority: Ubuntu-specific CVEs

### NIST National Vulnerability Database (NVD)
- API: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- Query: Match package name in CVE descriptions
- Priority: Broader CVE coverage

### CVE Severity Scoring

| Severity | CVSS Score | Weight |
|----------|------------|--------|
| CRITICAL | 9.0-10.0 | +10 |
| HIGH | 7.0-8.9 | +7 |
| MEDIUM | 4.0-6.9 | +4 |
| LOW | 0.1-3.9 | +1 |
| NONE | 0.0 | 0 |

### CVE Mismatch Detection
- **Ubuntu-only CVE**: Found in USN but not NVD → Ubuntu-specific risk
- **NVD-only CVE**: Found in NVD but not USN → May be unpatched in Ubuntu
- **Both match**: Confirmed vulnerability in both sources

## Risk Calculation Formula

```
Net Risk = Functional Risk Score + CVE Weighted Score
```

Where:
- Functional Risk Score: HIGH=10, MEDIUM=5, LOW=1
- CVE Weighted Score: Sum of all CVE weights for the package

### Decision Matrix

| Net Risk | CVE Only | Recommendation |
|----------|----------|----------------|
| >15 | Yes | 🚨 MUST UPGRADE - Critical security |
| 10-15 | Yes | ⚠️ Strong recommendation to upgrade |
| 5-10 | No | 🟡 Proceed with caution |
| <5 | No | ✅ Safe to upgrade |
| HIGH functional + No CVE | No | ⚠️ Upgrade with recovery plan ready |

## Commands to Execute

### 1. Detect Updates
```bash
apt list --upgradable 2>/dev/null
```

### 2. Check Held Packages
```bash
apt-mark showhold
```

### 3. Get Package Dependencies
```bash
apt-cache depends <package>
apt-cache rdepends <package>
```

### 4. Check Version Policy
```bash
apt-cache policy <package>
```

### 5. Get Changelog
```bash
apt-get changelog <package>
```

### 6. Check System Info
```bash
uname -r  # kernel version
lsb_release -a  # OS version
systemd-analyze security  # security level
```

### 7. Check Reboot Required
```bash
# Check if reboot needed for kernel
[ -f /run/reboot-required ] && echo "REBOOT REQUIRED" || echo "No reboot needed"
# Check systemd updates requiring restart
systemctl list-units --type=service --state=running | grep -E "(snapd|systemd)"
```

### 8. Query Ubuntu USN API
```bash
# Get all CVEs for a package
curl -s "https://usn.ubuntu.com/usn-db/query?package=<package>" | jq '.'
```

### 9. Query NVD API (requires API key for rate limits)
```bash
# Search CVEs by keyword
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=<package>" | jq '.'
```

## Report Formats

### Report A: Risk Assessment Table

| Package | Current → New | Risk Level | Reason | Dependents | Reboot? |
|---------|---------------|------------|--------|------------|---------|
| nvidia-driver-580 | 580.126 → 580.159 | HIGH | GPU driver, kernel module | 15+ | YES |

### Report B: CVE vs Functional Trade-off

| Package | CVEs Found | Ubuntu CVEs | NVD CVEs | Max Severity | Mismatch? | Functional Changes | Net Risk | Rec |
|---------|------------|-------------|----------|--------------|------------|-------------------|----------|-----|
| libgl1-mesa | 2 | 1 | 2 | CRITICAL (9.1) | NVD-only | Security fix only | 14 (HIGH) | 🚨 |
| nvidia-driver | 3 | 3 | 2 | HIGH (7.8) | Ubuntu-only | Bug fixes, minor | 17 (HIGH) | ⚠️ |

## Upgrade Strategy Options

1. **All at once**: `apt upgrade` - Upgrade everything together
   - Risk: HIGH (one failure blocks all)
   - Best for: When you have recovery access

2. **By risk tier**: Upgrade LOW first, then MEDIUM, then HIGH
   - Risk: MEDIUM (sequential, testable)
   - Best for: Production systems

3. **Security only**: `apt-get upgrade -s` with security pocket only
   - Risk: LOW
   - Best for: Minimal change production servers

4. **Use official**: Switch to Ubuntu official packages (remove PPA)
   - Risk: MEDIUM
   - Best for: More stable, tested versions

5. **Skip & pin**: `apt-mark hold <package>` to skip specific packages
   - Risk: NONE
   - Best for: When you need specific version stability

6. **Dry run**: `apt-get upgrade -s` - Simulate without installing
   - Risk: NONE
   - Best for: Always recommended first

## Output Format

Generate output with clear sections:

```
## 📊 System Upgrade Risk Assessment

### System Info
- OS: Ubuntu 24.04 LTS
- Kernel: 6.8.0-49-generic
- Reboot Required: ⚠️ YES (kernel modules updated)

### 📋 Report A: Risk Assessment
[Table]

### 🔒 Report B: CVE Trade-off Analysis
[Table]

### 🚦 Recommendation Summary
- 🚨 Critical (must upgrade): X packages
- ⚠️ High risk (recommended): X packages
- 🟡 Medium risk (proceed with caution): X packages
- ✅ Low risk (safe): X packages

### 🎯 Recommended Strategy
[Strategy name] - [brief explanation]

### ⚠️ Reboot Notice
**SYSTEM REBOOT REQUIRED** after applying updates!

### ❓ User Confirmation
Please choose a strategy:
- A) Upgrade all packages
- B) Upgrade by risk tier
- C) Security only
- D) Use official Ubuntu packages
- E) Skip specific packages
- F) Cancel (no changes)

**Enter your choice [A-F]:**
```

## When to use me

- Before running `apt upgrade` or `apt-get dist-upgrade`
- After adding a new PPA or repository
- When system shows "restart required" notification
- Before major version upgrades (e.g., 22.04 → 24.04)
- On a schedule (weekly/monthly) for maintenance

## Important Notes

1. **Always run dry-run first**: `apt-get upgrade -s` to preview changes
2. **Check backup**: Ensure you have a backup before HIGH-risk upgrades
3. **Recovery access**: For kernel/driver updates, have recovery mode ready
4. **Time window**: Schedule upgrades during maintenance windows
5. **Read the room**: If upgrading remotely, consider screen/tmux session