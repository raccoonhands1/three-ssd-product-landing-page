<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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
const bagPhysics = ref<any>(null)

onMounted(async () => {
  if (import.meta.env.DEV) {
    studio.initialize()
  }

  const { scene, camera, renderer, composer, theaterObjects, fallingCubes } = threeSetup()
  const lights = setupLights(scene)
  bagPhysics.value = await loadAllModels(scene)

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

    if (bagPhysics.value.bagBone) {
      bagPhysics.value.bagBone.quaternion.multiplyQuaternions(rotationQuat, bagPhysics.value.bagBone.quaternion)
    }

    if (bagPhysics.value.outlineBone) {
      bagPhysics.value.outlineBone.quaternion.multiplyQuaternions(
        rotationQuat,
        bagPhysics.value.outlineBone.quaternion,
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
    if (bagPhysics.value.position) {
      bagPhysics.value.position.x = values.position.x
      bagPhysics.value.position.y = values.position.y
      bagPhysics.value.position.z = values.position.z
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

      if (bagPhysics.value.wireframeModel) {
        bagPhysics.value.wireframeModel.traverse((child: any) => {
          if (child.isLineSegments && child.material) {
            const r = Math.round(0 + (255 - 0) * progress)
            const g = Math.round(0 + (255 - 0) * progress)
            const b = Math.round(0 + (255 - 0) * progress)
            child.material.color.setRGB(r / 255, g / 255, b / 255)
          }
        })
      }
      if (bagPhysics.value.labelLines) {
        bagPhysics.value.labelLines.forEach((labelLine: any) => {
          if (labelLine.line.material) {
            const r = Math.round(0 + (255 - 0) * progress)
            const g = Math.round(0 + (255 - 0) * progress)
            const b = Math.round(0 + (255 - 0) * progress)
            labelLine.line.material.color.setRGB(r / 255, g / 255, b / 255)
            labelLine.line.material.opacity = progress
          }
        })
      }
      if (bagPhysics.value.labeledObjects) {
        bagPhysics.value.labeledObjects.forEach((item: any, index: number) => {
          const label = document.getElementById(`label-${index}`)
          if (label) {
            label.style.opacity = `${progress}`
          }
        })
      }
    } else if (scrollPercent > 70) {
      glbOpacity = 0
      if (viewportElement) {
        viewportElement.style.backgroundColor = '#252525'
      }
      if (bagPhysics.value.wireframeModel) {
        bagPhysics.value.wireframeModel.traverse((child: any) => {
          if (child.isLineSegments && child.material) {
            child.material.color.setRGB(1, 1, 1)
          }
        })
      }
      if (bagPhysics.value.labelLines) {
        bagPhysics.value.labelLines.forEach((labelLine: any) => {
          if (labelLine.line.material) {
            labelLine.line.material.color.setRGB(1, 1, 1)
            labelLine.line.material.opacity = 1
          }
        })
      }
      if (bagPhysics.value.labeledObjects) {
        bagPhysics.value.labeledObjects.forEach((item: any, index: number) => {
          const label = document.getElementById(`label-${index}`)
          if (label) {
            label.style.opacity = '1'
          }
        })
      }
    } else {
      glbOpacity = 1
      if (viewportElement) {
        viewportElement.style.backgroundColor = '#ffffff'
      }
      if (bagPhysics.value.wireframeModel) {
        bagPhysics.value.wireframeModel.traverse((child: any) => {
          if (child.isLineSegments && child.material) {
            child.material.color.setRGB(0, 0, 0)
          }
        })
      }
      if (bagPhysics.value.labelLines) {
        bagPhysics.value.labelLines.forEach((labelLine: any) => {
          if (labelLine.line.material) {
            labelLine.line.material.color.setRGB(0, 0, 0)
            labelLine.line.material.opacity = 0
          }
        })
      }
      if (bagPhysics.value.labeledObjects) {
        bagPhysics.value.labeledObjects.forEach((item: any, index: number) => {
          const label = document.getElementById(`label-${index}`)
          if (label) {
            label.style.opacity = '0'
          }
        })
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

    if (bagPhysics.value.labeledObjects && bagPhysics.value.labelLines) {
      bagPhysics.value.labeledObjects.forEach((item: any, index: number) => {
        const worldPos = new THREE.Vector3()
        item.object.getWorldPosition(worldPos)
        const labelPos = worldPos.clone().add(item.offset)

        const screenPos = labelPos.clone().project(camera)
        const label = document.getElementById(`label-${index}`)
        if (label && container) {
          let x = (screenPos.x * 0.5 + 0.5) * container.clientWidth
          let y = (-(screenPos.y) * 0.5 + 0.5) * container.clientHeight

          const labelWidth = label.offsetWidth
          const labelHeight = label.offsetHeight
          const padding = 10

          x = Math.max(padding + labelWidth / 2, Math.min(container.clientWidth - padding - labelWidth / 2, x))
          y = Math.max(padding + labelHeight / 2, Math.min(container.clientHeight - padding - labelHeight / 2, y))

          label.style.left = `${x}px`
          label.style.top = `${y}px`

          const clampedScreenX = (x / container.clientWidth) * 2 - 1
          const clampedScreenY = -(y / container.clientHeight) * 2 + 1
          const clampedScreenPos = new THREE.Vector3(clampedScreenX, clampedScreenY, screenPos.z)
          const clampedWorldPos = clampedScreenPos.unproject(camera)

          if (bagPhysics.value.labelLines[index]) {
            const labelLine = bagPhysics.value.labelLines[index]
            const positions = labelLine.line.geometry.attributes.position.array as Float32Array
            positions[0] = worldPos.x
            positions[1] = worldPos.y
            positions[2] = worldPos.z
            positions[3] = clampedWorldPos.x
            positions[4] = clampedWorldPos.y
            positions[5] = clampedWorldPos.z
            labelLine.line.geometry.attributes.position.needsUpdate = true
          }
        }
      })
    }

    if (bagPhysics.value.punchingBag && bagPhysics.value.position) {
      bagPhysics.value.punchingBag.position.set(
        bagPhysics.value.position.x,
        bagPhysics.value.position.y,
        bagPhysics.value.position.z,
      )
    }
    if (bagPhysics.value.wireframeModel && bagPhysics.value.position) {
      bagPhysics.value.wireframeModel.position.set(
        bagPhysics.value.position.x,
        bagPhysics.value.position.y,
        bagPhysics.value.position.z,
      )
    }

    if (bagPhysics.value.punchingBag) {
      bagPhysics.value.punchingBag.traverse((child) => {
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
  <div id="viewport">
    <div
      v-for="(item, index) in bagPhysics?.labeledObjects || []"
      :key="index"
      :id="`label-${index}`"
      class="floating-label"
    >
      {{ item.name }}
    </div>
  </div>
  <video id="headtracker-video" autoplay style="display: none"></video>
  <canvas id="headtracker-canvas" width="320" height="240" style="display: none"></canvas>
</template>

<style scoped>
#viewport {
  height: 100%;
  width: 100%;
  position: relative;
}

.floating-label {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #000;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}
</style>
