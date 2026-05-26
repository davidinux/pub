---
theme: ../../templates/slidev/linaro
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@200..900&display=swap');
.slidev-layout, .slidev-layout h1, .slidev-layout p {
  font-family: 'Noto Sans SC', 'Reddit Sans', Arial, sans-serif !important;
}
</style>

# Flutter on OpenHarmony: 新的嵌入层方向

Davide Ricci, 副总裁, Linaro 解决方案与服务部  

HDC 2026 - 深圳  

---

# 摘要

Flutter 的多平台集成历来将平台特定代码散布在各层中，而非隔离在专用的 Embedder
层——Android、Linux、Tizen 等平台均存在这一模式。OpenHarmony 继承了同样的挑战。
基于华为与 Linaro 的联合工程评审，我们评估了三个方向并聚焦于一条务实路径：
将 Flutter Web 引擎编译为仓颉语言，通过原生 API 桥接设备能力。
该方法尊重 OpenHarmony 架构的同时最大化代码复用。

我们将介绍评估过程、架构方案、第一阶段成果以及后续路线图——
包括 2026 年第二季度启动的第二阶段。最后，我们将探讨 Linaro 作为
开源社区、Flutter 生态与产业界之间桥梁的独特定位——支持华为各业务部门
（消费者、计算、云、网络）及其他采用 OpenHarmony 的 OEM 厂商，
提供适配、开发、测试、合规（CRA、ISO 27001）、部署与长期维护服务。