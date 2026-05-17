<template>
  <div class="linaro-content-light slidev-layout">

    <img src="/images/linaro-symbol-dark.png" class="deco-symbol" aria-hidden="true" />

    <div class="linaro-header">
      <img src="/images/linaro-logo-dark.png" class="logo" alt="Linaro" />
      <span class="tagline">Arm Solutions at Lightspeed</span>
    </div>

    <div class="main-content">
      <slot />
    </div>

    <div class="linaro-page-num">
      <SlideCurrentNo />
    </div>
  </div>
</template>

<style scoped>
.linaro-content-light {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

.deco-symbol {
  position: absolute;
  bottom: -10%;
  right: -8%;
  width: 38%;
  opacity: 0.06;
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
  color: #555;
  letter-spacing: 0.04em;
}

.main-content {
  position: absolute;
  top: 60px; left: 48px; right: 48px; bottom: 36px;
  z-index: 5;
  overflow: hidden;
}

.main-content :deep(h1) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1.8em;
  font-weight: 700;
  color: #6715E8;
  margin: 0 0 0.5em;
  line-height: 1.15;
}

.main-content :deep(p),
.main-content :deep(li) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1em;
  color: #1a1a1a;
  line-height: 1.55;
}

.main-content :deep(ul) { padding-left: 1.4em; }
.main-content :deep(ul li::marker) { color: #6715E8; }
</style>