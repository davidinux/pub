<template>
  <div class="linaro-section slidev-layout">

    <img src="/images/bg-section.png" class="bg-section-wave" aria-hidden="true" />

    <div class="linaro-header">
      <img src="/images/linaro-logo-dark.png" class="logo" alt="Linaro" />
    </div>

    <div class="section-content">
      <slot />
    </div>

    <div class="linaro-page-num">
      <SlideCurrentNo />
    </div>
  </div>
</template>

<style scoped>
.linaro-section {
  position: relative;
  width: 100%;
  height: 100%;
  background: #FFCF00;
  overflow: hidden;
}

.bg-section-wave {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  z-index: 10;
}
.linaro-header .logo { height: 22px; width: auto; }

.section-content {
  position: absolute;
  top: 68px; left: 48px; right: 48px; bottom: 40px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  z-index: 5;
}

.section-content :deep(h1),
.section-content :deep(h2) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 2.6em;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 0.2em;
  line-height: 1.1;
}

.section-content :deep(p) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1em;
  color: #1a1a1a;
  margin: 0;
}
</style>