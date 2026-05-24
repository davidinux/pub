<script setup>
import logo from '../assets/images/oh-logo.png'
</script>

<template>
  <div class="oh-section slidev-layout">

    <div class="bg-shapes"></div>

    <div class="oh-header">
      <img :src="logo" class="logo" alt="OpenHarmony" />
    </div>

    <div class="section-content">
      <slot />
    </div>

    <div class="oh-page-num dark">
      <SlideCurrentNo />
    </div>
  </div>
</template>

<style scoped>
.oh-section {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0D2B45 0%, #00A1DF 100%);
  overflow: hidden;
}

.bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle 300px at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 70%),
    radial-gradient(circle 200px at 20% 80%, rgba(0,161,223,0.2) 0%, transparent 60%);
}

.oh-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  z-index: 10;
}
.oh-header .logo { height: 24px; width: auto; }

.section-content {
  position: absolute;
  top: 68px; left: 48px; right: 48px; bottom: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 5;
}

.section-content :deep(h1),
.section-content :deep(h2) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 2.8em;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.2em;
  line-height: 1.1;
  letter-spacing: 0.02em;
}

.section-content :deep(p) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1.1em;
  color: rgba(255,255,255,0.8);
  margin: 0;
}
</style>
