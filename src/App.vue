<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HeroText from './components/HeroText.vue'
import Navbar from './components/Navbar.vue'
import GetStartedButton from './components/GetStartedButton.vue'
import ContactUsButton from './components/ContactUsButton.vue'
</script>

<template>
  <Navbar />

  <div id="hero">
    <div id="hero-lhs-wrapper">
      <HeroText />
      <div class="get-started-shrink">
        <GetStartedButton />
        <ContactUsButton />
      </div>
    </div>

    <RouterView />
  </div>
</template>

<style scoped>
#hero {
  width: 100vw;
  height: 100vh;
  display: flex;
  padding: 0;
  margin: 0;

  #hero-lhs-wrapper {
    width: 44%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 2rem;
    margin-bottom: 2rem;
    gap: 8rem;

    .get-started-shrink {
      width: min;
      align-self: flex-end;
    }
  }
}

#hero > :deep(*) {
  flex: 1;
}
</style>
