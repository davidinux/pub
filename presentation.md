---
theme: ../../templates/slidev/linaro
---

<style>
table {
  text-align: left !important;
}

th, td {
  text-align: left !important;
  padding: 8px;
}
</style>

# Flutter on OpenHarmony: A New Embedder Direction

Linaro Solutions & Services Group  
VP & GM, Linaro Solutions & Services  

HDC 2026 - Shenzhen  

---
layout: two-cols
---

::title::
# The Challenge

## Architecture Mismatch

Flutter's architecture mismatch with OpenHarmony

Key incompatibilities:
- **✓** Impeller/Vulkan graphics pipeline ≠ Cangjie rendering
- **✓** Android embedder ≠ ArkUI framework
- **✓** APK packaging ≠ HAP packaging

## Maintenance Burden

Current implementation requires adapting all patches to Flutter:
- **→** Every new Flutter engine release requires rework
- **→** Slows adoption of new Flutter features dramatically
- **→** Increases maintenance burden significantly

![Architecture Mismatch](./images/architecture-mismatch.png)

---

# Three Approaches Evaluated

<style>
table {
  text-align: left !important;
  width: 100%;
}

th, td {
  text-align: left !important;
  padding: 8px;
  vertical-align: top;
}
</style>

| Approach | Description | Effort | Risk |
|----------|-------------|--------|------|
| **A** | Full native embedder rewrite | Very High | High |
| **B** | Fork Impeller for OHOS | High | Medium |
| **C** | Flutter Web engine + OpenHarmony Embedder | Medium | Low |

---
layout: two-cols
---

::title::
# Recommended Solution (Direction C)

## Approach Overview

**Flutter Web Engine** → compiled to Cangjie  
**OpenHarmony Flutter Embedder**  
**Native API Bridge** → OHOS Capabilities  

![Architecture](./images/architecture.png)

::right::

## Key Benefits

- **✓** Respects OpenHarmony architecture
- **✓** Maximizes code reuse from Flutter ecosystem
- **✓** Production-ready path
- **✓** Google actively developing web engine

---

# Industry Trend — Everyone Is Building Embedders

**Google**: Android team actively migrating to Flutter's embedder API
- **→** GitHub issue #176649: "Migrate Android to embedder API"
- **→** Reference: https://github.com/flutter/flutter/issues/176649

**Sony**: flutter-embedded-linux (1,300+ stars)
- **→** Embedded Linux devices, smart displays, automotive

**Samsung**: Tizen-based Flutter initiatives
- **→** IoT and wearable devices

---

# Why Direction C Wins

- **✓** Maximum code reuse (Flutter web engine, widgets, tooling)
- **✓** Respects OpenHarmony's native architecture
- **✓** Production-ready path with manageable scope
- **✓** Leverages existing Flutter ecosystem
- **✓** Google actively developing web engine — long-term viability

---

# Phase 1 Results (Completed April 2025)

Feasibility validation: ✓ Confirmed

Cangjie compilation target: ✓ Working

Web engine performance: ✓ Acceptable for UX

**Key findings: Technical approach is sound**

---

# Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| Phase 1 | Apr 2025 | Feasibility study (COMPLETE) |
| Phase 2 | Q3 2026 | Development with Flutter community |
| Phase 3 | TBD | Production-ready features |

![Roadmap Timeline](./images/roadmap-timeline.png)

---

# Applications Migration Considerations

**Concurrent Activities During Phase 2:**

**Performance Evaluation**: New architecture vs current implementation  
**Migration Cost Analysis**: Identify and minimize costs for existing apps  
**Tooling Development**: Build migration tool and strategy  
**New App Development**: Develop new apps on new architecture  
**Migration Benchmarks**: Use old apps as benchmarks  

**Migration Strategy:**
- **→** New apps → Direct to new architecture (avoid future migration)
- **→** Existing apps → Migrate progressively as benchmarks
- **→** Risk mitigation through early challenge identification

**Migration Flow:**
![Migration Flow](./images/migration-flow-v2.png)

---
layout: two-cols
---

::title::
# Linaro's Role — Community Bridge

::left::

## Connecting Communities

- **✓** Open-source communities to device makers  
- **✓** Technical expertise in both Flutter and OHOS ecosystems  
- **✓** Bringing Flutter community knowledge to OHOS adaptation  

::right::

## Influence Direction

- **→** Influencing direction for production readiness

---
layout: two-cols
---

::title::
# Linaro's Role — Industry Mediator

::left::

## Supporting Huawei Divisions

- **✓** Consumer, Compute, Cloud, Networking
- **✓** Other OpenHarmony-adopting OEMs

::right::

## Services Offered

- **→** Adaptation and development
- **→** Testing and compliance (CRA, ISO 27001)  
- **→** Deployment and long-term support

---

# Thank You + Q&A

Contact information
Linaro website
Link to presentation materials
Questions welcome
