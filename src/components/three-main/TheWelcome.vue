<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import studio from '@theatre/studio'
import { threeSetup, setupLights, loadAllModels } from './three-setup'
import { mainSheet } from './theater-config'
import { HeadTracker } from '@/modules/head-tracking'
let theaterCameraPosition = { x: 0, y: 0, z: -1 }
let theaterCameraLookAt = { x: 0, y: 0, z: 0 }
let glbOpacity = 1.0
let viewportElement: HTMLElement | null = null
let headTracker: HeadTracker | null = null

onMounted(async () => {
  if (import.meta.env.DEV) {
    studio.initialize()
  }

  const { scene, camera, renderer, composer, theaterObjects, fallingCubes } = threeSetup()
  const lights = setupLights(scene)
  const bagPhysics = await loadAllModels(scene)

  const container = document.getElementById('viewport')
  if (!container) return

  viewportElement = container

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
      bagPhysics.outlineBone.quaternion.multiplyQuaternions(
        rotationQuat,
        bagPhysics.outlineBone.quaternion,
      )
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
    theaterCameraPosition = { ...values.position }
    theaterCameraLookAt = { ...values.lookAt }
  })

  theaterObjects.modelObj.onValuesChange((values) => {
    if (bagPhysics.position) {
      bagPhysics.position.x = values.position.x
      bagPhysics.position.y = values.position.y
      bagPhysics.position.z = values.position.z
    }
  })

  theaterObjects.lightsObj.onValuesChange((values) => {
    lights.keyLight.intensity = values.keyLight.intensity
    lights.keyLight.position.set(
      values.keyLight.position.x,
      values.keyLight.position.y,
      values.keyLight.position.z,
    )

    lights.fillLight.intensity = values.fillLight.intensity
    lights.fillLight.position.set(
      values.fillLight.position.x,
      values.fillLight.position.y,
      values.fillLight.position.z,
    )

    lights.rimLight.intensity = values.rimLight.intensity
    lights.rimLight.position.set(
      values.rimLight.position.x,
      values.rimLight.position.y,
      values.rimLight.position.z,
    )

    lights.topLight.intensity = values.topLight.intensity
    lights.topLight.position.set(
      values.topLight.position.x,
      values.topLight.position.y,
      values.topLight.position.z,
    )
  })

  headTracker = new HeadTracker('headtracker-video', 'headtracker-canvas')
  try {
    await headTracker.init()
    headTracker.start()
  } catch (error) {
    console.warn('Head tracking failed to initialize:', error)
  }

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = (scrollTop / docHeight) * 100

    if (scrollPercent >= 50 && scrollPercent <= 70) {
      glbOpacity = 1 - (scrollPercent - 50) / 20
      const progress = (scrollPercent - 50) / 20
      if (viewportElement) {
        const r = Math.round(255 - (255 - 37) * progress)
        const g = Math.round(255 - (255 - 37) * progress)
        const b = Math.round(255 - (255 - 37) * progress)
        viewportElement.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
      }
    } else if (scrollPercent > 70) {
      glbOpacity = 0
      if (viewportElement) {
        viewportElement.style.backgroundColor = '#252525'
      }
    } else {
      glbOpacity = 1
      if (viewportElement) {
        viewportElement.style.backgroundColor = '#ffffff'
      }
    }
  }

  window.addEventListener('scroll', handleScroll)

  const tick = () => {
    if (headTracker) {
      headTracker.update()
      const offset = headTracker.getOffset()
      camera.position.set(
        theaterCameraPosition.x + offset.x,
        theaterCameraPosition.y + offset.y,
        theaterCameraPosition.z + offset.z,
      )
    } else {
      camera.position.set(
        theaterCameraPosition.x,
        theaterCameraPosition.y,
        theaterCameraPosition.z,
      )
    }

    camera.lookAt(0, 0, 100)

    if (bagPhysics.punchingBag && bagPhysics.position) {
      bagPhysics.punchingBag.position.set(
        bagPhysics.position.x,
        bagPhysics.position.y,
        bagPhysics.position.z,
      )
    }
    if (bagPhysics.wireframeModel && bagPhysics.position) {
      bagPhysics.wireframeModel.position.set(
        bagPhysics.position.x,
        bagPhysics.position.y,
        bagPhysics.position.z,
      )
    }

    if (bagPhysics.punchingBag) {
      bagPhysics.punchingBag.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = glbOpacity
          child.material.transparent = true
        }
      })
    }

    fallingCubes.forEach((cube) => {
      cube.mesh.position.y -= cube.speed

      cube.mesh.rotation.x += 0.01
      cube.mesh.rotation.y += 0.01

      if (cube.mesh.position.y < -5) {
        cube.mesh.position.y = cube.resetY
        cube.mesh.position.x = (Math.random() - 0.5) * 10
        cube.mesh.position.z = Math.random() * 10 + 1
      }
    })

    composer.render()
    requestAnimationFrame(tick)
  }
  tick()
})

onUnmounted(() => {
  if (headTracker) {
    headTracker.destroy()
  }
})
</script>

<template>
  <div id="viewport"></div>
  <video id="headtracker-video" autoplay style="display: none"></video>
  <canvas id="headtracker-canvas" width="320" height="240" style="display: none"></canvas>
</template>

<style scoped>
#viewport {
  height: 100%;
  width: 100%;
}
</style>
