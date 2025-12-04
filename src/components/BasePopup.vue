<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  closeOnBackdrop?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const handleBackdropClick = () => {
  if (props.closeOnBackdrop ?? true) {
    emit('update:modelValue', false)
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div
        v-if="modelValue"
        class="popup-backdrop"
        @click="handleBackdropClick"
      >
        <div class="popup-container drop-shadow-dark-generic border-radius-standard" @click.stop>
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popup-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  outline: none;
}

.popup-container {
  background: white;
  padding: 0;
  max-width: 90%;
  max-width: 40vw;
  max-height: 90%;
  overflow: auto;
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 150ms ease-in-out;
}

.popup-fade-enter-active .popup-container,
.popup-fade-leave-active .popup-container {
  transition: transform 150ms ease-in-out;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.popup-fade-enter-from .popup-container,
.popup-fade-leave-to .popup-container {
  transform: scale(0.95);
}
</style>
