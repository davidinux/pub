<template>
  <div class="linaro-two-col-dark slidev-layout">

    <img src="/images/linaro-symbol-dark.png" class="deco-symbol" aria-hidden="true" />

    <div class="linaro-header dark">
      <img src="/images/linaro-logo-white2.png" class="logo" alt="Linaro" />
      <span class="tagline">Arm Solutions at Lightspeed</span>
    </div>

    <div class="main-content">
      <div class="slide-title"><slot name="title" /></div>

      <div class="columns">
        <div class="col"><slot name="left" /></div>
        <div class="col"><slot name="right" /></div>
      </div>

      <div class="fallback"><slot /></div>
    </div>

    <div class="linaro-page-num dark"><SlideCurrentNo /></div>
  </div>
</template>

<style scoped>
.linaro-two-col-dark {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  overflow: hidden;
}

.deco-symbol {
  position: absolute;
  bottom: -10%;
  right: -8%;
  width: 38%;
  opacity: 0.12;
  filter: invert(1);
  pointer-events: none;
  z-index: 0;
}

.linaro-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 10px;
  z-index: 10;
}
.linaro-header .logo { height: 20px; width: auto; }
.linaro-header .tagline {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 9px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.04em;
}

.main-content {
  position: absolute;
  top: 60px; left: 48px; right: 48px; bottom: 36px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slide-title :deep(h1) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1.8em;
  font-weight: 700;
  color: #FFCF00;
  margin: 0 0 0.4em;
  line-height: 1.15;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex: 1;
  min-height: 0;
}

.col { overflow: hidden; }

.col :deep(h2), .col :deep(h3) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1.15em;
  font-weight: 700;
  color: #FFCF00;
  margin: 0 0 0.35em;
}

.col :deep(p), .col :deep(li) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 0.92em;
  color: #ffffff;
  line-height: 1.55;
}

.col :deep(ul) { padding-left: 1.2em; }
.col :deep(ul li::marker) { color: #FFCF00; }

.fallback:not(:empty) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex: 1;
}
</style>