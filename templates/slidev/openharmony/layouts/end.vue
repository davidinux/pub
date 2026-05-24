<template>
  <div class="oh-thankyou slidev-layout">

    <div class="bg-accent"></div>

    <div class="oh-header dark">
      <img src="/images/oh-logo.png" class="logo" alt="OpenHarmony" />
    </div>

    <div class="content-block">
      <slot />
    </div>

    <div class="oh-page-num dark"><SlideCurrentNo /></div>
  </div>
</template>

<style scoped>
.oh-thankyou {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0D2B45 0%, #0070B8 50%, #00A1DF 100%);
  overflow: hidden;
}

.bg-accent {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 70% 40% at 50% 80%, rgba(0,161,223,0.3) 0%, transparent 70%),
    radial-gradient(ellipse 50% 50% at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 60%);
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
.oh-header .logo { height: 24px; }

.content-block {
  position: absolute;
  left: 0;
  right: 0;
  top: 30%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 0 10%;
}

.content-block :deep(h1) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 3.2em;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.1;
  letter-spacing: 0.06em;
}

.content-block :deep(p) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1em;
  color: rgba(255,255,255,0.75);
  margin: 0;
}

.content-block :deep(a) {
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  font-size: 0.85em;
}
.content-block :deep(a:hover) { color: #fff; }

.content-block :deep(img) {
  width: 90px;
  height: 90px;
  border-radius: 4px;
}
</style>
