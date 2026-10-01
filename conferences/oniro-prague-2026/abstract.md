---
theme: ../../templates/slidev/linaro
---

# OpenHarmony Flutter Embedder: A 12-Months Roadmap

Davide Ricci, VP & GM, Solutions and Services, Linaro  

Oniro Global Ecosystem 2026 - Prague  

---

# Abstract

The OpenHarmony Flutter ecosystem is scaling rapidly, yet the current port relies on monolithic,
out-of-tree patchsets inherited from legacy implementations. While functional, this technical debt
complicates upgrades, limits architectural stability, and fragments the OHOS Flutter fork from the
upstream Flutter project.

In this talk, we present a 12-month roadmap to decouple, rewrite, and secure the OpenHarmony Flutter
architecture. Building on a Phase 1 feasibility study, the program has two pillars: implementing a
production-ready native C Embedder on the stable, platform-agnostic Flutter Embedder C API, and
upstreaming critical platform-agnostic OpenHarmony patches to the Flutter community. Because the
Embedder API is forward- and backward-compatible, OpenHarmony gains the freedom to track any
upstream Flutter release without maintaining a fork.

We will walk through the four-phase program — from engineering baseline and an Alpha C Embedder,
through upstreaming variable refresh rate (LTPO), zero-copy textures, and wide color gamut support,
to a robust, optimized embedder with multi-display, multi-window, accessibility, and password
autofill — culminating in a Beta release sign-off within 12 months. We close with the success
criteria, including recognition on the official Flutter website, and the future phases focused on
performance tuning, ecosystem support, and infrastructure sovereignty.