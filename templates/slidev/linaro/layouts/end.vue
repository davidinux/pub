<template>
  <div class="linaro-thankyou slidev-layout">

    <img src="/images/bg-thankyou.png" class="bg-wave" aria-hidden="true" />

    <div class="linaro-header dark">
      <img src="/images/linaro-logo-white2.png" class="logo" alt="Linaro" />
    </div>

    <div class="content-block">
      <slot />
    </div>

    <div class="linaro-page-num dark"><SlideCurrentNo /></div>
  </div>
</template>

<style scoped>
.linaro-thankyou {
  position: relative;
  width: 100%;
  height: 100%;
  background: #6715E8;
  overflow: hidden;
}

.bg-wave {
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
.linaro-header .logo { height: 22px; }

.content-block {
  position: absolute;
  right: 7%;
  bottom: 10%;
  width: 38%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  gap: 10px;
}

.content-block :deep(h1) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 2.8em;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.1;
}

.content-block :deep(p) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 0.95em;
  color: rgba(255,255,255,0.8);
  margin: 0;
}

.content-block :deep(a) {
  color: rgba(255,255,255,0.7);
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