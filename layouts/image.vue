<template>
  <div class="linaro-image-light slidev-layout">

    <div class="linaro-header">
      <img src="/images/linaro-logo-dark.png" class="logo" alt="Linaro" />
      <span class="tagline">Arm Solutions at Lightspeed</span>
    </div>

    <div class="text-content">
      <slot />
    </div>

    <div class="image-pane">
      <div class="image-wrapper" :style="image ? `background-image:url('${image}')` : ''">
        <div v-if="!image" class="placeholder">
          <span>Add image via<br><code>image: '/your-image.jpg'</code></span>
        </div>
      </div>
    </div>

    <div class="linaro-page-num"><SlideCurrentNo /></div>
  </div>
</template>

<script setup>
defineProps({ image: { type: String, default: '' } })
</script>

<style scoped>
.linaro-image-light {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
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
.linaro-header .logo { height: 20px; }
.linaro-header .tagline {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 9px;
  color: #555;
  letter-spacing: 0.04em;
}

.text-content {
  position: absolute;
  top: 60px; left: 48px; width: 44%; bottom: 36px;
  z-index: 5;
  overflow: hidden;
}

.text-content :deep(h1) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 1.6em;
  font-weight: 700;
  color: #6715E8;
  margin: 0 0 0.5em;
}

.text-content :deep(p), .text-content :deep(li) {
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 0.88em;
  color: #1a1a1a;
  line-height: 1.55;
}

.text-content :deep(ul) { padding-left: 1.2em; }
.text-content :deep(ul li::marker) { color: #6715E8; }

.image-pane {
  position: absolute;
  top: 0; right: 0;
  width: 58%;
  height: 100%;
  z-index: 2;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 50%);
}

.placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #f0e8ff;
  color: #6715E8;
  font-family: 'Reddit Sans', Arial, sans-serif;
  font-size: 0.85em;
  text-align: center;
  padding: 2em;
}
</style>