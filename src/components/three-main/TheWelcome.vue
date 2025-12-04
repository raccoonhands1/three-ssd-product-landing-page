<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'
import studio from '@theatre/studio'
import { threeSetup, setupLights, loadAllModels } from './three-setup'
import { mainSheet } from './theater-config'

interface FacetrackingEvent extends Event {
  x: number
  y: number
  width: number
  height: number
  angle: number
  detection: string
}

interface HeadtrackrStatusEvent extends Event {
  status: string
}

declare global {
  interface Window {
    headtrackr: any
  }
}

const FACE_TRACKING_SCALE = {
  x: 3,
  y: 2
}

const CAMERA_SMOOTHING = 0.05

const CANVAS_CENTER_X = 160
const CANVAS_CENTER_Y = 120

const CAMERA_LIMITS = {
  x: 2.0,
  y: 1.5
}

function applySoftLimit(value: number, limit: number): number {
  const absValue = Math.abs(value)
  const sign = Math.sign(value)

  const k = 3.0
  const normalized = absValue / limit
  const limited = limit * (1 - Math.exp(-k * normalized))

  return sign * limited
}

const targetHeadOffset = { x: 0, y: 0, z: 0 }
const currentHeadOffset = { x: 0, y: 0, z: 0 }
let theaterCameraPosition = { x: 0, y: 0, z: -1 }
let theaterCameraLookAt = { x: 0, y: 0, z: 0 }

onMounted(async () => {
  if (import.meta.env.DEV) {
    studio.initialize()
  }

  const { scene, camera, renderer, composer, theaterObjects, fallingCubes } = threeSetup()
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

  const videoElement = document.getElementById('headtracker-video') as HTMLVideoElement
  const canvasElement = document.getElementById('headtracker-canvas') as HTMLCanvasElement

  if (videoElement && canvasElement && window.headtrackr) {
    try {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoElement.srcObject = stream
          videoElement.play()

          const htracker = new window.headtrackr.Tracker({
            ui: false,
            smoothing: true,
            retryDetection: true,
            detectionInterval: 20,
            fadeVideo: false,
            calcAngles: true,
            headPosition: false
          })

          htracker.init(videoElement, canvasElement, false)
          htracker.start()

          console.log('Head tracking initialized')
        })
        .catch((error) => {
          console.warn('Camera access denied or unavailable:', error)
        })
    } catch (error) {
      console.warn('Head tracking failed to initialize:', error)
    }
  }

  document.addEventListener('facetrackingEvent', (event) => {
    const faceEvent = event as FacetrackingEvent

    if (faceEvent.detection === 'CS') {
      if (Math.random() < 0.02) {
        console.log('Face position:', { x: faceEvent.x, y: faceEvent.y })
      }

      const offsetX = ((faceEvent.x - CANVAS_CENTER_X) * FACE_TRACKING_SCALE.x) / 100
      const offsetY = ((faceEvent.y - CANVAS_CENTER_Y) * FACE_TRACKING_SCALE.y) / 100

      const limitedX = applySoftLimit(offsetX, CAMERA_LIMITS.x)
      const limitedY = applySoftLimit(-offsetY, CAMERA_LIMITS.y)

      targetHeadOffset.x = limitedX
      targetHeadOffset.y = limitedY
      targetHeadOffset.z = 0
    }
  })

  document.addEventListener('headtrackrStatus', (event) => {
    const statusEvent = event as HeadtrackrStatusEvent
    console.log('Headtrackr status:', statusEvent.status)
  })

  const tick = () => {
    currentHeadOffset.x += (targetHeadOffset.x - currentHeadOffset.x) * CAMERA_SMOOTHING
    currentHeadOffset.y += (targetHeadOffset.y - currentHeadOffset.y) * CAMERA_SMOOTHING
    currentHeadOffset.z += (targetHeadOffset.z - currentHeadOffset.z) * CAMERA_SMOOTHING

    camera.position.set(
      theaterCameraPosition.x + currentHeadOffset.x,
      theaterCameraPosition.y + currentHeadOffset.y,
      theaterCameraPosition.z + currentHeadOffset.z
    )

    camera.lookAt(0, 0, 100)

    if (bagPhysics.punchingBag && bagPhysics.position) {
      bagPhysics.punchingBag.position.set(
        bagPhysics.position.x,
        bagPhysics.position.y,
        bagPhysics.position.z
      )
    }
    if (bagPhysics.wireframeModel && bagPhysics.position) {
      bagPhysics.wireframeModel.position.set(
        bagPhysics.position.x,
        bagPhysics.position.y,
        bagPhysics.position.z
      )
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
