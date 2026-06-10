---
theme: ../../templates/slidev/openharmony
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

::left::
## Cross-Layer Coupling

Flutter's platform integrations have historically scattered platform code across all layers instead of isolating it in the Embedder. This pattern repeats across Android, Linux, Tizen, iOS — and OpenHarmony is the latest to face it.

- **→** Platform and non-platform code intertwined
- **→** Clean upstream contributions blocked by platform-specific tangling

::right::
## Impact

- **→** Every Flutter release requires significant rework
- **→** Adoption of new Flutter features dramatically slowed
- **→** Maintenance burden compounds over time

Minor incompatibilities (ArkUI, APK) are secondary, not the root cause.

---
layout: two-cols
---

::title::
# But First — What Is a Flutter Embedder?

<!-- Per-slide <style> constrains the image to the right column height.
     Pure Markdown ![alt](src) has no dimension attributes,
     so a local CSS block avoids HTML <img> tags. -->

::left::
## Flutter's Layered Architecture

**Framework** *(Dart)* — Widgets, layout, gestures  
**Engine** *(C++)* — Rendering, text, I/O, Dart runtime  
**Embedder** *(Platform-specific)* — Entry point, render surface, input, accessibility

- **→** A dedicated Embedder isolates platform code, keeping Framework and Engine clean for upstream contributions

::right::
![Flutter Architecture](./images/flutter-architecture.png)

<style>
.col:last-child img {
  max-height: 100%;
  max-width: 100%;
  object-fit: scale-down;
}
</style>

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
| **A** | Port all layers natively (Framework + Engine + Embedder) | Very High | High |
| **B** | Fork Engine rendering (Impeller) for OpenHarmony | High | Medium |
| **C** | Flutter Engine + OpenHarmony Embedder (recommended) | Medium | Low |

---
layout: two-cols
---

::title::
# Recommended Solution: Architecture

::left::
## Flutter Embedder API

The Embedder API defines a stable C interface between Flutter Engine and platform code. Only the Embedder layer varies per OS.

| API | Purpose |
|-----|---------|
| `FlutterEngineRun(sz, config, user_data)` | Initialize and run the engine |
| `FlutterEngineSendMessage(engine, msg)` | Send platform message to Dart |
| `FlutterEngineRegisterExternalTexture(engine, id)` | Bind an external render surface |
| `FlutterEngineDispatchPointerDataPacket(engine, pkt)` | Forward touch/pointer events to engine |

::right::
![Architecture Diagram](./images/architecture.png)

<style>
.col:last-child img {
  max-height: 100%;
  max-width: 100%;
  object-fit: scale-down;
}
</style>

---

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

# Embedder API Across Platforms

| Platform | Embedder | Render Surface | Input |
|----------|----------|---------------|-------|
| **Android** | JNI Embedder | SurfaceTexture | MotionEvent |
| **Linux** | flutter-embedded-linux | EGL / Wayland | libinput |
| **iOS** | UIKit Embedder | Metal CAMetalLayer | UIEvent |
| **OpenHarmony** | Native OHOS Embedder | ArkUI Surface | OHOS Input Handler |

The Embedder API interface is identical across platforms — only the platform-specific implementation behind it differs. OpenHarmony follows the same pattern as Android, iOS, and Linux.

---
layout: two-cols
---

::title::
# Solution Architecture

::left::
## Direction C Approach

Flutter Engine + OpenHarmony Embedder approach:
- **→** OpenHarmony Flutter Embedder handles platform integration
- **→** Native API Bridge connects to OpenHarmony capabilities

::right::
## Key Benefits

- **✓** Minimizes porting costs — only the Embedder layer needs platform adaptation
- **✓** Maximizes adoption speed — new Flutter releases land without rework
- **✓** Leverages existing Flutter ecosystem (widgets, tooling, packages)
- **✓** Production-ready path with manageable scope
- **✓** Respects OpenHarmony architecture

---

# Industry Trend — Everyone Is Building Embedders

**Google**: Android team actively migrating to Flutter's embedder API
- **→** GitHub issue #176649: "Migrate Android to embedder API"
- **→** Reference: https://github.com/flutter/flutter/issues/176649

**Sony**: flutter-embedded-linux (1,300+ stars)
- **→** Embedded Linux devices, smart displays, automotive

**Apple**: Adopting UIScene lifecycle for iOS embedder
- **→** Issue #170171: "Adopting UIScene lifecycle in Flutter"
- **→** Reference: https://github.com/flutter/flutter/issues/170171

**Samsung**: Tizen-based Flutter initiatives
- **→** IoT and wearable devices

---

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

# Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| Phase 1 | Apr 2025 | Feasibility study (COMPLETE) |
| Phase 2 | Q2 2026 | Development with Flutter community |
| Phase 3 | Q3 2027 | Production-ready features |


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

---

# Migration Flow

## Migration Strategy

New apps → Direct to new architecture  
Existing apps → Migrate progressively as benchmarks  


![Migration Flow](./images/migration-flow-v2.png)

---
layout: two-cols
---

::title::
# Linaroʼs Role — Community Bridge

::left::
## Across the Open Source Ecosystem

- **→** Active contributors across multiple open source communities
- **→** Bridging open-source communities to device makers
- **→** Technical expertise in Flutter, OpenHarmony, and broader ecosystems
- **→** Influencing direction for production readiness

::right::
![Linaro Contributions](./images/linaro-contribs.png)

<style>
.col:last-child img {
  max-height: 100%;
  max-width: 100%;
  object-fit: scale-down;
}
</style>

---
layout: two-cols
---

::title::
# Linaroʼs Role — Industry Mediator

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

<div style="display: flex; align-items: center; gap: 2em; margin: 1.5em 0;">
<img src="./images/Davide_Ricci_headshot.jpeg" style="width: 140px; border-radius: 50%;" />
<img src="./images/qr-slides.png" style="width: 140px;" />
<div>
**Slides:** github.com/davidinux/pub/conferences/hdc26<br/>
**OH Slidev Theme:** github.com/davidinux/pub/templates/slidev/openharmony<br/>
<br/>
Questions welcome
</div>
</div>
