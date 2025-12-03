<script setup lang="ts">
const heroLines = [
  { prefix: 'THIS IS', highlight: 'A TEMPLATE.' },
  { prefix: 'BRO.', highlight: null },
]
</script>

<template>
  <h1>
    <template v-for="(line, index) in heroLines" :key="index"
      >{{ line.prefix }} <span v-if="line.highlight" class="zda-blue">{{ line.highlight }}</span
      ><br v-if="index < heroLines.length - 1"
    /></template>
  </h1>

  <h2></h2>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 10vh;
  text-align: right;
}

span {
  font-weight: 500;
  font-size: 10vh;
}

h2 {
  margin-top: -100px;
  text-align: right;
  font-size: 2rem;
}
</style>
