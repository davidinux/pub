<script setup>
import logo from '../assets/images/oh-logo.png'
</script>

<template>
  <div class="oh-content-light slidev-layout">

    <div class="oh-header">
      <img :src="logo" class="logo" alt="OpenHarmony" />
      <span class="tagline">Open Source, Open Future</span>
    </div>

    <div class="accent-bar"></div>

    <div class="main-content">
      <slot />
    </div>

    <div class="oh-page-num">
      <SlideCurrentNo />
    </div>
  </div>
</template>

<style scoped>
.oh-content-light {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

.oh-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 10px;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  border-bottom: 1px solid #e8eef3;
}
.oh-header .logo { height: 22px; width: auto; }
.oh-header .tagline {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 9px;
  color: #889;
  letter-spacing: 0.04em;
}

.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, #00A1DF 0%, #0070B8 100%);
  z-index: 9;
}

.main-content {
  position: absolute;
  top: 60px; left: 48px; right: 48px; bottom: 36px;
  z-index: 5;
  overflow: hidden;
}

.main-content :deep(h1) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1.8em;
  font-weight: 700;
  color: #00A1DF;
  margin: 0 0 0.5em;
  line-height: 1.15;
}

.main-content :deep(h2) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1.2em;
  font-weight: 700;
  color: #0070B8;
  margin: 0 0 0.35em;
}

.main-content :deep(p),
.main-content :deep(li) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1em;
  color: #1a1a1a;
  line-height: 1.55;
}

.main-content :deep(ul) { padding-left: 1.4em; }
.main-content :deep(ul li::marker) { color: #00A1DF; }
</style>
