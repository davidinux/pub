<script setup>
import logo from '../assets/images/oh-logo.png'
</script>

<template>
  <div class="oh-two-col-dark slidev-layout">

    <div class="oh-header dark">
      <img :src="logo" class="logo" alt="OpenHarmony" />
      <span class="tagline">Open Source, Open Future</span>
    </div>

    <div class="accent-bar"></div>

    <div class="main-content">
      <div class="slide-title"><slot name="title" /></div>

      <div class="columns">
        <div class="col"><slot name="left" /></div>
        <div class="col"><slot name="right" /></div>
      </div>

      <div class="fallback"><slot /></div>
    </div>

    <div class="oh-page-num dark"><SlideCurrentNo /></div>
  </div>
</template>

<style scoped>
.oh-two-col-dark {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0D2B45;
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
  background: rgba(13,43,69,0.95);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.oh-header .logo { height: 22px; width: auto; }
.oh-header .tagline {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 9px;
  color: rgba(255,255,255,0.5);
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slide-title :deep(h1) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1.8em;
  font-weight: 700;
  color: #00A1DF;
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
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1.15em;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.35em;
}

.col :deep(p), .col :deep(li) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 0.92em;
  color: rgba(255,255,255,0.85);
  line-height: 1.55;
}

.col :deep(ul) { padding-left: 1.2em; }
.col :deep(ul li::marker) { color: #00A1DF; }

.fallback:not(:empty) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex: 1;
}
</style>
