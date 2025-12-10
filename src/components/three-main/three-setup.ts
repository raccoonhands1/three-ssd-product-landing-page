import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { mainSheet, cameraConfig, modelConfig, lightsConfig } from './theater-config'

export function setupLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
  keyLight.position.set(5, 8, 5)
  keyLight.target.position.set(0, 0, 0)
  scene.add(keyLight)
  scene.add(keyLight.target)

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8)
  fillLight.position.set(-5, 3, 3)
  fillLight.target.position.set(0, 0, 0)
  scene.add(fillLight)
  scene.add(fillLight.target)

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5)
  rimLight.position.set(0, 5, -5)
  rimLight.target.position.set(0, 0, 0)
  scene.add(rimLight)
  scene.add(rimLight.target)

  const topLight = new THREE.DirectionalLight(0xffffff, 0.6)
  topLight.position.set(0, 10, 0)
  topLight.target.position.set(0, 0, 0)
  scene.add(topLight)
  scene.add(topLight.target)

  return { ambientLight, keyLight, fillLight, rimLight, topLight }
}

export function threeSetup() {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 0, -1)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
  const fallingCubes: Array<{ mesh: THREE.Mesh; speed: number; resetY: number }> = []

  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]

  for (let i = 0; i < 20; i++) {
    const cube = new THREE.Mesh(
      cubeGeometry,
      new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        wireframe: true,
      }),
    )

    cube.position.x = (Math.random() - 0.5) * 10
    cube.position.y = Math.random() * 15 + 5
    cube.position.z = Math.random() * 10 + 1

    cube.rotation.x = Math.random() * Math.PI * 2
    cube.rotation.y = Math.random() * Math.PI * 2
    cube.rotation.z = Math.random() * Math.PI * 2

    scene.add(cube)

    fallingCubes.push({
      mesh: cube,
      speed: 0.02 + Math.random() * 0.03,
      resetY: 20 + Math.random() * 5,
    })
  }

  const cameraObj = mainSheet.object('Camera', cameraConfig)
  const modelObj = mainSheet.object('Model', modelConfig)
  const lightsObj = mainSheet.object('Lights', lightsConfig)

  return {
    scene,
    camera,
    renderer,
    composer,
    theaterObjects: { cameraObj, modelObj, lightsObj },
    fallingCubes,
  }
}

export async function loadAllModels(scene: THREE.Scene) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('/3d/three-d-test-bone.glb')
  gltf.scene.position.set(0, 3, 0)
  gltf.scene.scale.setScalar(10)
  gltf.scene.rotation.set(0, Math.PI / 2 - Math.PI / 12, (3 * Math.PI) / 2 + Math.PI / 24)

  gltf.scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      child.material.transparent = true
    }
  })

  scene.add(gltf.scene)

  let bagBone = null
  let outlineBone = null

  const bone = gltf.scene.getObjectByName('BONE')
  if (bone) {
    bagBone = bone
  }

  const labeledObjects = [
    { object: gltf.scene.getObjectByName('SSD'), name: 'SSD Storage', offset: new THREE.Vector3(2, 1, 0) },
    { object: gltf.scene.getObjectByName('BOARD'), name: 'Main Board', offset: new THREE.Vector3(-2, 0.5, 0) },
    { object: gltf.scene.getObjectByName('ENCLOSURE'), name: 'Enclosure', offset: new THREE.Vector3(2, -1, 0) },
    { object: bone, name: 'Drive Mount', offset: new THREE.Vector3(-2, -0.5, 0) },
    { object: gltf.scene.getObjectByName('Default'), name: 'Chassis', offset: new THREE.Vector3(2, 0, 1) },
    { object: gltf.scene.getObjectByName('Part 1'), name: 'Housing', offset: new THREE.Vector3(-2, 1, 1) },
    { object: gltf.scene.getObjectByName('sm3zs067u310amr1200'), name: 'Component', offset: new THREE.Vector3(0, -1.5, 0) },
  ]

  const labelLines: Array<{ line: THREE.Line; object: THREE.Object3D; offset: THREE.Vector3 }> = []

  labeledObjects.forEach((item) => {
    if (item.object) {
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 2,
        transparent: true,
        opacity: 0
      })
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ])
      const line = new THREE.Line(lineGeometry, lineMaterial)
      scene.add(line)
      labelLines.push({ line, object: item.object, offset: item.offset })
    }
  })

  const outlineGroup = gltf.scene.clone()
  outlineGroup.position.set(0, 3, 0)
  outlineGroup.scale.setScalar(10 * 1.001)
  outlineGroup.rotation.set(0, Math.PI / 2 - Math.PI / 12, (3 * Math.PI) / 2 + Math.PI / 24)

  const replacementMap = new Map<THREE.Object3D, THREE.LineSegments>()

  outlineGroup.traverse((child: any) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const edges = new THREE.EdgesGeometry(mesh.geometry, 15)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
      const lineSegments = new THREE.LineSegments(edges, lineMaterial)

      lineSegments.position.copy(mesh.position)
      lineSegments.rotation.copy(mesh.rotation)
      lineSegments.scale.copy(mesh.scale)
      lineSegments.quaternion.copy(mesh.quaternion)

      replacementMap.set(mesh, lineSegments)
    }
  })

  for (const [mesh, outline] of replacementMap.entries()) {
    if (mesh.parent) {
      mesh.parent.add(outline)
      mesh.parent.remove(mesh)
    }
  }

  if (bagBone) {
    outlineGroup.traverse((child: any) => {
      if (child.name === 'Bone') {
        outlineBone = child
      }
    })
  }

  scene.add(outlineGroup)

  const modelPosition = { x: 0, y: 0, z: 2 }

  return {
    punchingBag: gltf.scene,
    wireframeModel: outlineGroup,
    bagBone,
    outlineBone,
    position: modelPosition,
    labeledObjects: labeledObjects.filter((item) => item.object),
    labelLines,
  }
}
