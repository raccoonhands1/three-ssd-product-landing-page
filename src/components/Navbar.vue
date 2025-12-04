<template>
  <nav>
    <div id="nav-wrapper">
      <div id="nav-logo">
        <img src="/logo.png" id="logo"></img>
      </div>
    </div>
  </nav>
</template>

<script setup>
import BuyNow from './BuyNow.vue'

const handleNavClick = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
* {
  font-family: 'Jost', sans-serif;
}

#logo {
  height: 2.5rem;
  margin-top: 0;
  padding-top: 0;
  transform: translateY(-0.75rem);
}

.large-box-shadow {
  box-shadow:
    rgba(61, 61, 61, 0.72) 0px 0.602187px 1.08394px -1.25px,
    rgba(61, 61, 61, 0.64) 0px 2.28853px 4.11936px -2.5px,
    rgba(61, 61, 61, 0.25) 0px 10px 18px -3.75px,
    rgba(0, 0, 0, 0.35) 0px 0.706592px 0.706592px -0.583333px,
    rgba(0, 0, 0, 0.34) 0px 1.80656px 1.80656px -1.16667px,
    rgba(0, 0, 0, 0.33) 0px 3.62176px 3.62176px -1.75px,
    rgba(0, 0, 0, 0.3) 0px 6.8656px 6.8656px -2.33333px,
    rgba(0, 0, 0, 0.26) 0px 13.6468px 13.6468px -2.91667px,
    rgba(0, 0, 0, 0.15) 0px 30px 30px -3.5px;
}

.elevated-foreground-material {
  border-radius: 0.75rem;
  padding: 0.375rem 0.375rem 0.5rem 0.375rem;
  background-color: var(--foreground-color);
  box-shadow:
    rgba(158, 158, 158, 0.69) 0px 0.706592px 0.706592px -0.583333px,
    rgba(158, 158, 158, 0.68) 0px 1.80656px 1.80656px -1.16667px,
    rgba(158, 158, 158, 0.65) 0px 3.62176px 3.62176px -1.75px,
    rgba(158, 158, 158, 0.61) 0px 6.8656px 6.8656px -2.33333px,
    rgba(158, 158, 158, 0.52) 0px 13.6468px 13.6468px -2.91667px,
    rgba(158, 158, 158, 0.3) 0px 30px 30px -3.5px,
    rgb(255, 255, 255) 0px 3px 1px 0px inset;
}

.landscape-only {
  display: flex;
  gap: 1rem;
}

@media (orientation: portrait) {
  .landscape-only {
    display: none;
  }
}

.portrait-only {
  display: none;
}

@media (orientation: portrait) {
  .portrait-only {
    display: flex;
  }
}

.mobile-message {
  border-radius: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: var(--dark);
  border-bottom: 1px solid black;
  background: linear-gradient(180deg, rgba(62, 105, 184, 0.5) 0%, var(--dark) 16.216216216216218%);
  box-shadow:
    rgba(61, 61, 61, 0.72) 0px 0.602187px 1.08394px -1.25px,
    rgba(61, 61, 61, 0.64) 0px 2.28853px 4.11936px -2.5px,
    rgba(61, 61, 61, 0.25) 0px 10px 18px -3.75px,
    rgba(0, 0, 0, 0.35) 0px 0.706592px 0.706592px -0.583333px,
    rgba(0, 0, 0, 0.34) 0px 1.80656px 1.80656px -1.16667px,
    rgba(0, 0, 0, 0.33) 0px 3.62176px 3.62176px -1.75px,
    rgba(0, 0, 0, 0.3) 0px 6.8656px 6.8656px -2.33333px,
    rgba(0, 0, 0, 0.26) 0px 13.6468px 13.6468px -2.91667px,
    rgba(0, 0, 0, 0.15) 0px 30px 30px -3.5px;
  border: 1px solid var(--dark);
  color: white;
}

nav {
  width: 100%;
  height: 4.5rem;
  align-items: center;
  backdrop-filter: blur(5px);
  background-color: var(--navbar-color);
  border-bottom: 2px solid var(--navbar-border-color);
  position: fixed;
  display: flex;
  justify-content: center;
  z-index: 1000;
  left: 0;
  top: 0;
}

#nav-wrapper {
  justify-content: space-between;
  padding-left: 2rem;
  padding-right: 2rem;
  display: flex;
  gap: 1rem;
  z-index: 20;
  max-width: 1400px;
  width: 100%;
  align-items: center;
  height: 100%;
}

#nav-wrapper > div {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

#nav-logo {
  display: flex;
  align-items: center;
}


#nav-middle {
  display: flex;
  gap: 0.5rem;
}

#nav-middle button {
  white-space: nowrap;
  border-radius: 0.75rem;
  color: var(--dark);
  padding: 0.625rem 1rem;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: none;
  background: transparent;
}

#nav-middle button:hover {
  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 2px 0px inset;
}

@media (max-width: 1000px) {
  #nav-middle {
    display: none;
  }
}

#nav-right {
  gap: 1rem;
  display: flex;
  align-items: center;
}
</style>
