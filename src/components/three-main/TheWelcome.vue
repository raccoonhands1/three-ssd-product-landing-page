<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'
import studio from '@theatre/studio'
import { threeSetup, setupLights, loadAllModels } from './three-setup'
import { mainSheet } from './theater-config'

onMounted(async () => {
  if (import.meta.env.DEV) {
    studio.initialize()
  }

  const { scene, camera, renderer, composer, theaterObjects } = threeSetup()
  const lights = setupLights(scene)
  const bagPhysics = await loadAllModels(scene)

  const container = document.getElementById('viewport')
  if (!container) return

  renderer.setSize(container.clientWidth, container.clientHeight)
  composer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()

  const mouse = new THREE.Vector2()
  let isDragging = false
  let previousMouse = new THREE.Vector2()

  container.addEventListener('mousedown', (event) => {
    isDragging = true
    const rect = container.getBoundingClientRect()
    previousMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    previousMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  })

  container.addEventListener('mousemove', (event) => {
    if (!isDragging) return

    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const deltaX = mouse.x - previousMouse.x

    const rotationSpeed = 2.0
    const up = new THREE.Vector3(0, 1, 0)
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(up, deltaX * rotationSpeed)

    if (bagPhysics.bagBone) {
      bagPhysics.bagBone.quaternion.multiplyQuaternions(rotationQuat, bagPhysics.bagBone.quaternion)
    }

    if (bagPhysics.outlineBone) {
      bagPhysics.outlineBone.quaternion.multiplyQuaternions(rotationQuat, bagPhysics.outlineBone.quaternion)
    }

    previousMouse.copy(mouse)
  })

  container.addEventListener('mouseleave', () => {
    isDragging = false
  })

  container.addEventListener('mouseup', () => {
    isDragging = false
  })

  theaterObjects.cameraObj.onValuesChange((values) => {
    camera.position.set(values.position.x, values.position.y, values.position.z)
    camera.lookAt(values.lookAt.x, values.lookAt.y, values.lookAt.z)
  })

  theaterObjects.modelObj.onValuesChange((values) => {
    if (bagPhysics.punchingBag) {
      bagPhysics.punchingBag.rotation.set(
        values.rotation.x,
        values.rotation.y,
        values.rotation.z
      )
      bagPhysics.punchingBag.position.set(
        values.position.x,
        values.position.y,
        values.position.z
      )
    }
    if (bagPhysics.wireframeModel) {
      bagPhysics.wireframeModel.rotation.set(
        values.rotation.x,
        values.rotation.y,
        values.rotation.z
      )
      bagPhysics.wireframeModel.position.set(
        values.position.x,
        values.position.y,
        values.position.z
      )
    }
  })

  theaterObjects.lightsObj.onValuesChange((values) => {
    lights.keyLight.intensity = values.keyLight.intensity
    lights.keyLight.position.set(
      values.keyLight.position.x,
      values.keyLight.position.y,
      values.keyLight.position.z
    )

    lights.fillLight.intensity = values.fillLight.intensity
    lights.fillLight.position.set(
      values.fillLight.position.x,
      values.fillLight.position.y,
      values.fillLight.position.z
    )

    lights.rimLight.intensity = values.rimLight.intensity
    lights.rimLight.position.set(
      values.rimLight.position.x,
      values.rimLight.position.y,
      values.rimLight.position.z
    )

    lights.topLight.intensity = values.topLight.intensity
    lights.topLight.position.set(
      values.topLight.position.x,
      values.topLight.position.y,
      values.topLight.position.z
    )
  })


  const tick = () => {
    composer.render()
    requestAnimationFrame(tick)
  }
  tick()
})
</script>

<template><div id="viewport"></div></template>

<style scoped>
#viewport {
  height: 100%;
  width: 100%;
}
</style>
