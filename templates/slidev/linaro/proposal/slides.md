---
theme: ../
layout: cover
---

# Triton-Ascend — Upstream Alignment

A proposal for bringing Huawei Ascend NPU support into the OpenAI Triton ecosystem

Linaro  |  July 2026

---
layout: cover-dark
---

# Arm Solutions at Lightspeed

Linaro bridges silicon to software — now bridging Ascend NPU to the Triton compiler ecosystem

---
layout: default
---

# Situation Overview

- Huawei's Triton-Ascend fork (v3.2.1) is ~15 months behind upstream Triton (v3.7.1)
- The gap is **widening** — not narrowing — under the current maintenance model
- Rebase cycles take **2.5 months** per release; target is **2-3 weeks**
- Triton maintainers have **limited bandwidth** and cannot accept new core backends
- But they **welcome** an official Ascend repo within the `triton-lang` organization

> *"We would be thrilled to create an official Ascend repo in triton-lang org where you can have an Ascend specific backend"* — Thomas Raoux, Triton Core Maintainer

---
layout: default
---

# Project Requirements

- **Align APIs** — Make existing interfaces consistent with the community; drive API extensions upstream rather than forking
- **Catch up on version** — Close the ~15-month gap from 3.2.1 to 3.7.1
- **Create an integrated Ascend third-party repo** — Minimum possible divergence from core Triton
- **Faster rebase** — From 2.5 months to 2-3 weeks per release, heavily automated
- **Standardize dependency install** — Out-of-the-box experience for CANN dependencies

---
layout: section
---

# The Linaro Advantage

---
layout: two-cols
---

::title::
## Why Linaro?

::left::

### Export Control Bridge

Huawei is on the US Entity List (since 2019). Linaro (UK) provides a **clean legal channel**:

- All contributions via public GitHub — protected as "published" under EAR 734.7
- Same model used by Linux kernel for Entity List participants
- Linaro assumes compliance responsibility
- No private technology transfers

::right::

### Arm-Native Expertise

Ascend NPU is an **Arm-based processor**, not x86. Linaro's core competency:

- Arm architecture and toolchains
- Heterogeneous compute
- Low-level device drivers
- LLVM toolchain integration
- 15+ years of Arm ecosystem engineering

This is more relevant than x86 GPU experience.

---
layout: two-cols
---

::title::
## Why Linaro? (cont.)

::left::

### Neutral Intermediary

- Neither Huawei, nor OpenAI, nor NVIDIA
- Triton maintainers already trust Linaro (repo moved to `triton-lang` org)
- Can mediate between Huawei's requirements and upstream constraints
- Staff with non-US, non-China nationals — no travel/export restrictions

::right::

### Proven Open-Source Upstreaming

- 47+ kernel patches merged in mainline Linux
- UEFI, TFA, OP-TEE upstream contributions
- CI/CD infrastructure for cross-vendor testing
- Track record of reducing downstream maintenance burden

---
layout: section
---

# The Plan

---
layout: default
---

# Phase 1: Investigation & Roadmap

**2 FTE · 4 months · $200K fixed price**

> Phase 1 is a funded scoping exercise — its output is a detailed technical report, not production code.

### Deliverables

1. **Complete diff analysis** — Every change in triton-ascend vs. upstream 3.7.1, categorized as:
   - Bug fixes (candidates for immediate upstream PRs)
   - Hardware-specific code (Ascend driver, CANN interface)
   - Core Triton changes (MLIR dialects, passes, compiler pipeline)
   - Infrastructure/build system changes

2. **Architecture alignment assessment** — How does the Ascend Linalg-based lowering map to Triton's BaseBackend plugin architecture?

3. **CI/CD architecture** — Automated rebase pipeline design, hardware requirements, estimated cycle times

4. **Refined Phase 2 plan** — Detailed budget, staffing with named roles, timeline, risks

5. **Updated Phase 3/4 estimates** — Re-forecast based on actual findings

6. **Go/no-go criteria** — Clear conditions for proceeding to Phase 2

---
layout: two-cols
---

::title::
## Phase 2: Upstream Alignment

::left::

**4 FTE · 18 months · ~$2.5M**

- Work with Huawei Triton team to maintain clean separation for upstreaming
- Create PRs for bug fixes and features to merge into mainline
- Work with upstream to define and implement a **hardware support API**
- CI/CD in place for automatic tracking of Triton mainline changes
- Isolate hardware-specific code from core changes

**Output:** Ascend third-party backend in `triton-lang` org, staying within 1-2 weeks of upstream mainline

::right::

### Two-Path Strategy

**Plan A (preferred):** Hardware support API in core Triton — enables out-of-tree backends cleanly

**Plan B (fallback):** Extension API via Triton plugin system — validated during Phase 1

Both paths keep Ascend close to mainline.

---
layout: two-cols
---

::title::
## Phase 3: Trusted Contributors

::left::

**3 FTE · 12 months · ~$0.8-1.2M**

- Continuous upstream engagement (review, issues, design)
- Grow Linaro and Huawei engineers into **trusted contributors**
- Ensure Huawei's strategic hardware interests are represented upstream
- Goal: invitation to maintain parts of Triton (at minimum, Ascend support)

::right::

### The AMD Precedent

AMD went from first contact to in-tree `third_party/amd/` in ~12 months:

- Jan 2023: Issue #1073 opened
- Jul 2023: Submodule backend merged
- Jan 2024: Moved in-tree
- Apr 2024: PyTorch switched to upstream

**Key:** AMD contributed CI hardware early and built trust through small, iterative PRs.

---
layout: two-cols
---

::title::
## Phase 4: Ongoing Maintenance

::left::

**3 FTE · 24 months · ~$2.5-3M (indicative)**

- Active maintenance phase
- Support Ascend backend mainline integrations
- Continue reducing technical debt
- Maintain rebase automation

*Budget to be re-forecasted based on Phase 2 outcomes.*

::right::

### End State

- Ascend is an **in-tree third_party backend** (like AMD)
- Community users can `pip install triton-ascend` for out-of-the-box Ascend support
- Rebase cycle: **2-3 weeks**, fully automated
- Linaro and Huawei are **trusted maintainers** of the Ascend backend
- Upstream Triton gains Ascend as an asset, not a liability

---
layout: default
---

# Timeline Overview

```
Year 1              Year 1-2             Year 3              Year 4-5
Phase 1             Phase 2              Phase 3             Phase 4
Design & Setup      Upstream & Bridge    Trusted             Ongoing Upstream
                    to Mainline          Contributors        & Maintenance

┌──────────┐    ┌──────────────────┐   ┌────────────┐   ┌──────────────────┐
│ 4 months │    │    18 months     │   │  12 months │   │    24 months     │
│ $200K    │    │    ~$2.5M        │   │ ~$0.8-1.2M │   │ ~$2.5-3M*        │
└──────────┘    └──────────────────┘   └────────────┘   └──────────────────┘
     │                  │                     │                   │
     ▼                  ▼                     ▼                   ▼
  Roadmap           In-tree 3rd            Trusted            Fully integrated
  + Go/No-Go        party backend          contributors       Ascend backend
```

*Phase 4 budget indicative only — re-forecasted after Phase 2*

---
layout: section
---

# Risk Mitigation

---
layout: default
---

# Risk Mitigation Overview

| Risk | Mitigation |
|------|-----------|
| **Export control** | Linaro (UK) as contributing entity; public GitHub only; EAR 734.7 "published" exemption; legal counsel engaged |
| **Maintainer rejects core API changes** | Plan B (extension API) validated in Phase 1 |
| **Rebase cost remains high** | CI/CD automation is a Phase 1 design requirement, not an afterthought |
| **Huawei internal team friction** | Joint governance model; Linaro augments, not replaces, Huawei engineers |
| **Triton project pivots** | Plugin architecture keeps Ascend portable across Triton versions |
| **Phase 2 budget overrun** | Phase 1 delivers refined budget with contingency; fixed-price Phase 1 |

---
layout: default
---

# Investment Summary

| Phase | Duration | FTE | Budget | Status |
|-------|----------|-----|--------|--------|
| Phase 1: Investigation | 4 months | 2 | **$200K fixed price** | Ready to start |
| Phase 2: Upstream Alignment | 18 months | 4 | ~$2.5M | Scoped in Phase 1 |
| Phase 3: Trusted Contributors | 12 months | 3 | ~$0.8-1.2M | Re-forecasted after Phase 2 |
| Phase 4: Ongoing Maintenance | 24 months | 3 | ~$2.5-3M* | Re-forecasted after Phase 2 |

**Total commitment:** Phase 1 ($200K) + Phase 2 (~$2.5M) = **~$2.7M for 22 months**

Phases 3-4 re-forecasted based on Phase 1 findings and Phase 2 outcomes.

*Phase 4 budget is indicative only.*

---
layout: default
---

# What Phase 1 Will Produce

After 4 months, Huawei receives:

1. **Complete categorized diff** between triton-ascend 3.2.1 and upstream 3.7.1
2. **Architecture alignment report** — how Linalg-based lowering maps to BaseBackend
3. **CI/CD system design** with infrastructure cost estimates
4. **Refined Phase 2 budget, timeline, and staffing** with named roles
5. **Updated Phase 3-4 cost ranges**
6. **Go/no-go criteria** and risk register
7. **Direct maintainer feedback** on specific proposed API changes

Phase 1 deliverable is a **comprehensive technical roadmap** that Huawei could take to any implementation partner.

---
layout: cover-dark
---

# Arm Solutions at Lightspeed

**Linaro: the safe bridge from Ascend NPU to the Triton ecosystem**

- UK-based, geopolitically neutral
- Arm-native engineering expertise
- Proven open-source upstreaming track record
- Fixed-price Phase 1 de-risks the engagement

---
layout: end
---

# Thank You

**Let's bring Ascend to the Triton community.**

linaro.org

Contact: [your contact details]

---
layout: cover
---

# Appendix

---
layout: two-cols
---

::title::
## AMD ROCm Precedent: Key Lessons

::left::

### Timeline

- Jan 2023: Issue opened
- Apr 2023: First PR (empty kernel)
- May 2023: BaseBackend API created
- Jul 2023: AMD added as submodule
- Jan 2024: In-tree `third_party/amd/`
- Apr 2024: PyTorch upstream switch

::right::

### Lessons for Ascend

1. **Start small** — first PR was "empty kernel works"
2. **Contribute CI hardware** — builds trust
3. **Iterate in public** — 908-line first backend PR
4. **Use extension points** — BaseBackend API existed because Intel created it for XPU
5. **Accept in-tree plugin, not core** — AMD is still in `third_party/`, not merged into core compiler

---
layout: two-cols
---

::title::
## Triton Plugin Architecture (3.7+)

::left::

### Current System

- `BaseBackend` / `DriverBase` abstract classes
- `TRITON_PLUGIN_DIRS` for C++ plugin discovery
- Python entry points for backend registration
- Runtime dialect loading via shared libraries
- Out-of-tree build support

### Built-in Backends
- NVIDIA (`third_party/nvidia/`)
- AMD (`third_party/amd/`)

::right::

### External Plugin Example
- Intel XPU Backend

### The Ascend Target

In-tree `third_party/ascend/` within `triton-lang/triton`, matching AMD's structure.

The Triton community has already accepted the `triton-ascend` repo under `triton-lang` org.

---
layout: default
---

# Triton-Ascend Current Architecture

```
           Triton IR (TTIR)
                 │
                 ▼
        ┌─────────────────┐
        │  Linalg IR      │  ← Architectural divergence from NVIDIA/AMD
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  AscendNPU IR    │  ← Custom MLIR dialect
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  BiSheng Compiler│  ← Huawei's LLVM-based compiler
        └─────────────────┘
                 │
                 ▼
        triton_xxx_kernel.o
```

**Key challenge:** The Linalg IR intermediate step is unique to Ascend — neither NVIDIA (TritonGPU -> PTX) nor AMD (TritonGPUROCM -> AMDGCN) use this approach. Phase 1 will assess alignment options.

---
layout: default
---

# Key Questions for Huawei Decision-Makers

1. **What is the right end-state?** In-tree `third_party/ascend/` (achievable) vs. merged into core compiler (maintainer has said no)
2. **What is Huawei team's role?** Linaro augments — does Huawei have internal engineers to pair with?
3. **CI infrastructure location?** Ascend hardware for CI — hosted where? By whom?
4. **Legal clearance?** Export control legal opinion obtained before proceeding?
5. **Phase 1 go/no-go criteria?** What must the Phase 1 report contain to justify Phase 2 investment?
6. **CANN community strategy?** How does proprietary CANN SDK become a standard install for open-source users?

---
layout: end
---

# Questions?

linaro.org | [Your Email]

_Triton-Ascend — Upstream Alignment Proposal · July 2026_
