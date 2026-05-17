---
theme: ../../templates/slidev/linaro
---

# Flutter on OpenHarmony: A New Embedder Direction

Davide Ricci, Vice President, Linaro's Solutions and Services  

HDC 2026 - Shenzhen  

---

# Abstract

Flutter's architecture wasn't designed for OpenHarmony's ecosystem (Cangjie rendering, ArkUI framework,
HAP packaging) making it fundamentally incompatible with the existing Android embedder. Based on a joint
Huawei-Linaro engineering review, we evaluated three directions and converged on a pragmatic path:
leveraging the Flutter Web engine compiled to Cangjie, bridged to device capabilities via native APIs.
This approach respects OpenHarmony's architecture while maximizing code reuse. We'll cover the
evaluation, architecture, Phase 1 results, and the upcoming roadmap — including a Phase 2 kick-off
in Q3 2026. We'll close by reflecting on Linaro's unique position as a bridge between open-source
communities, the Flutter ecosystem, and industry players — supporting Huawei's own divisions
(Consumer, Compute, Cloud, Networking) and other OpenHarmony-adopting OEMs with adaptation,
development, testing, compliance (CRA, ISO 27001), deployment and long-term support.