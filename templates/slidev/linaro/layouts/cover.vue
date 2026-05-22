<template>
  <div class="linaro-cover-light slidev-layout">

    <img src="/images/bg-title-light.png" class="bg-blobs" aria-hidden="true" />

    <div class="linaro-header">
      <img src="/images/linaro-logo-purple.png" class="logo" alt="Linaro" />
    </div>

    <div class="content-area">
      <slot />
    </div>

    <div class="linaro-page-num">
      <SlideCurrentNo />
    </div>
  </div>
</template>

<style scoped>
.linaro-cover-light {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

.bg-blobs {
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
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 36px;
  z-index: 10;
}
.linaro-header .logo { height: 24px; width: auto; }

.content-area {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  top: 44%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 10% 60px;
  z-index: 5;
}

.content-area :deep(h1) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 2.4em;
  font-weight: 700;
  color: #6715E8;
  margin: 0 0 0.3em;
  line-height: 1.15;
}

.content-area :deep(p),
.content-area :deep(.subtitle) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1em;
  font-weight: 400;
  color: #333;
  margin: 0;
}
</style>