<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'
import {
  threeSetup,
  setupLights,
  loadAllModels,
  animate,
  updateOrthographicCamera,
} from './three-setup'

onMounted(async () => {
  const { scene, camera, renderer, composer, frustumSize } = threeSetup()
  const { directionalLight } = setupLights(scene)
  const bagPhysics = await loadAllModels(scene)

  const container = document.getElementById('viewport')
  if (!container) return

  renderer.setSize(container.clientWidth, container.clientHeight)
  composer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)
  updateOrthographicCamera(camera, container.clientWidth, container.clientHeight, frustumSize)

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  container.addEventListener('click', (event) => {
    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    if (bagPhysics.bagMesh) {
      const intersects = raycaster.intersectObject(bagPhysics.bagMesh, true)

      if (intersects.length > 0) {
        const hit = intersects[0]
        const normal = hit.face?.normal

        if (normal) {
          const worldNormal = normal.clone()
          worldNormal.transformDirection(hit.object.matrixWorld)

          const force = worldNormal.multiplyScalar(-0.05)

          bagPhysics.angularVelocity.x += force.y * 0.5
          bagPhysics.angularVelocity.z += force.x * 0.5
        }
      }
    }
  })

  animate(composer, directionalLight, bagPhysics)
})
</script>

<template><div id="viewport"></div></template>

<style scoped>
#viewport {
  height: 100vh;
  width: 100%;
}
</style>
