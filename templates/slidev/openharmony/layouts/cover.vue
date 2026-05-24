<template>
  <div class="oh-cover-light slidev-layout">

    <div class="bg-overlay"></div>

    <div class="oh-header">
      <img src="/theme/images/oh-logo.png" class="logo" alt="OpenHarmony" />
    </div>

    <div class="content-area">
      <slot />
    </div>

    <div class="oh-page-num">
      <SlideCurrentNo />
    </div>
  </div>
</template>

<style scoped>
.oh-cover-light {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0D2B45 0%, #00A1DF 60%, #0070B8 100%);
  overflow: hidden;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 80%, rgba(0,161,223,0.3) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,112,184,0.4) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.oh-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 36px;
  z-index: 10;
}
.oh-header .logo { height: 30px; width: auto; }

.content-area {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  top: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 10% 60px;
  z-index: 5;
}

.content-area :deep(h1) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 2.6em;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.3em;
  line-height: 1.15;
  letter-spacing: 0.02em;
}

.content-area :deep(p),
.content-area :deep(.subtitle) {
  font-family: 'Noto Sans SC', Arial, 'Microsoft YaHei', sans-serif;
  font-size: 1em;
  font-weight: 400;
  color: rgba(255,255,255,0.8);
  margin: 0;
}
</style>
