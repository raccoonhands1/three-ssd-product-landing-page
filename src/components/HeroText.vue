<script setup lang="ts">
const heroLines = [
  { prefix: 'MORE', highlight: 'GROWTH.' },
  { prefix: 'MORE', highlight: 'CLIENTS.' },
  { prefix: 'GUARANTEED.', highlight: null },
]
</script>

<template>
  <h1>
    <template v-for="(line, index) in heroLines" :key="index"
      >{{ line.prefix }} <span v-if="line.highlight" class="zda-blue">{{ line.highlight }}</span
      ><br v-if="index < heroLines.length - 1"
    /></template>
  </h1>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 8vh;
  text-align: right;
}

span {
  font-weight: 500;
  font-size: 8vh;
}
</style>
