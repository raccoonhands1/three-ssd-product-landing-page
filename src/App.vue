<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HeroText from './components/HeroText.vue'
import BuyNow from './components/BuyNow.vue'
import ContactUsButton from './components/ContactUsButton.vue'
import Navbar from './components/Navbar.vue'
</script>

<template>
  <Navbar />
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

#hero > :deep(*) {
  flex: 1;
}
</style>
