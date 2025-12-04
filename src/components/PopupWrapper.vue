<script setup lang="ts">
import BasePopup from './BasePopup.vue'
import IconClose from './icons/IconClose.vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}>()

console.log('PopupWrapper props.closeOnBackdrop:', props.closeOnBackdrop)
console.log('PopupWrapper props.showCloseButton:', props.showCloseButton)
console.log('showCloseButton ?? true:', props.showCloseButton ?? true)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <BasePopup
    :model-value="modelValue"
    close-on-backdrop
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="popup-wrapper">
      <div class="popup-header">
        <h2>{{ title }}</h2>
        <button class="popup-close-btn" @click="handleClose">
          <IconClose />
        </button>
      </div>
      <div class="popup-content">
        <slot></slot>
      </div>
    </div>
  </BasePopup>
</template>

<style scoped>
.popup-wrapper {
  min-width: 300px;
}

.popup-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.popup-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.popup-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms ease-in-out;
  color: var(--dark);
}

.popup-close-btn:hover {
  color: var(--grey);
}

.popup-content {
  padding: 1.5rem;
}
</style>
