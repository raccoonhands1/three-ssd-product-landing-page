<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { threeSetup, setupLights, loadAllModels, animate } from './three-setup'

onMounted(async () => {
  const { scene, camera, renderer, composer, world } = threeSetup()
  const { directionalLight } = setupLights(scene)
  const bagPhysics = await loadAllModels(scene, world)

  const container = document.getElementById('viewport')
  if (!container) return

  renderer.setSize(container.clientWidth, container.clientHeight)
  composer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let isDragging = false
  let previousMouse = new THREE.Vector2()
  let hasMoved = false
  let dragVelocity = 0
  const impulseStrength = 2.5

  container.addEventListener('mousedown', (event) => {
    isDragging = true
    hasMoved = false
    dragVelocity = 0
    const rect = container.getBoundingClientRect()
    previousMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    previousMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  })

  container.addEventListener('mousemove', (event) => {
    if (!isDragging || !bagPhysics.bagBone) return

    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const deltaX = mouse.x - previousMouse.x

    if (Math.abs(deltaX) > 0.001) {
      hasMoved = true
    }

    dragVelocity = deltaX

    const rotationSpeed = 2.0
    const up = new THREE.Vector3(0, 1, 0)
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(up, deltaX * rotationSpeed)

    bagPhysics.bagBone.quaternion.multiplyQuaternions(rotationQuat, bagPhysics.bagBone.quaternion)
    bagPhysics.angularVelocity.set(0, 0, 0)

    previousMouse.copy(mouse)
  })

  container.addEventListener('mouseleave', () => {
    isDragging = false
  })

  animate(composer, directionalLight, world, bagPhysics)
})
</script>

<template><div id="viewport"></div></template>

<style scoped>
#viewport {
  height: 100%;
  width: 100%;
}
</style>
