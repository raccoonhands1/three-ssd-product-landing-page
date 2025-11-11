<template>
  <button class="btn-intrusive">Get Started</button>
</template>

<script setup lang="ts">
</script>

<style scoped>
* {
  --dark: #000;
  --default-button-padding: 0.8rem;
}

.btn-intrusive {
  white-space: nowrap;
  border-radius: 0.75rem;
  color: white;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  background-color: var(--dark);
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
  padding-top: var(--default-button-padding);
  padding-bottom: var(--default-button-padding);
  cursor: pointer;
  border: none;
  font-size: 1rem;
}
</style>
