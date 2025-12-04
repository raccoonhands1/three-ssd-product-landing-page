<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HeroText from './components/HeroText.vue'
import BuyNow from './components/BuyNow.vue'
import ContactUsButton from './components/ContactUsButton.vue'
</script>

<template>
  <div id="hero">
    <div class="get-started-shrink">
      <BuyNow />
      <ContactUsButton />
    </div>

    <RouterView />
  </div>
</template>

<style scoped>
#hero {
  width: 100%;
  height: 100vh;
  display: flex;
  padding: 0;
  margin: 0;
  position: relative;

  .get-started-shrink {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    position: absolute;
    left: 50%;
    bottom: 2rem;
    transform: translateX(-50%);
    z-index: 10;
  }
}
</style>
