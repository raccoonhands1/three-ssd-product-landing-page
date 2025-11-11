import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import * as CANNON from 'cannon-es'

const DitherShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    varying vec2 vUv;

    #define DITHER_LEVELS 3.

    float dither( float v, vec2 fragCoord )
    {
        float x = v * DITHER_LEVELS;

        int ditherLevel = int(floor(fract( x ) * 4.));

        float dither = 0.;

        int ix = int(fragCoord.x);
        int iy = int(fragCoord.y);

        if (ditherLevel == 1) {
            if (ix % 4 == (2*iy) % 4) {
                dither = 1.;
            }
        }

        else if (ditherLevel == 2) {
            if (ix % 2 != iy % 2) {
                dither = 1.;
            }
        }

        else if (ditherLevel == 3) {
            if (ix % 4 != (2*iy) % 4) {
                dither = 1.;
            }
        }

        return floor(x + dither) / DITHER_LEVELS;
    }

    void main() {
      vec2 fragCoord = vUv * resolution;
      vec4 color = texture2D(tDiffuse, vUv);

      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gray = dither(gray, fragCoord);

      gl_FragColor = vec4(vec3(gray), color.a);
    }
  `,
}

export function setupLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 5.94)
  directionalLight.position.set(3, -3, 3)
  directionalLight.target.position.set(0, -3, 0)
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  const backLight = new THREE.DirectionalLight(0xffffff, 0.8)
  backLight.position.set(-5, 3, -5)
  backLight.target.position.set(0, -3, 0)
  scene.add(backLight)
  scene.add(backLight.target)

  return { ambientLight, directionalLight, backLight }
}

export function threeSetup() {
  const scene = new THREE.Scene()

  const frustumSize = 9
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
  camera.position.set(3, 0.5, 3)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const ditherPass = new ShaderPass(DitherShader)
  ditherPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
  composer.addPass(ditherPass)

  // Physics world
  const world = new CANNON.World()
  world.gravity.set(0, -9.82, 0)
  world.defaultContactMaterial.friction = 0.3

  return { scene, camera, renderer, composer, frustumSize, world }
}

export function updateOrthographicCamera(
  camera: THREE.OrthographicCamera,
  width: number,
  height: number,
  frustumSize: number,
) {
  const aspect = width / height
  camera.left = (-frustumSize * aspect) / 2
  camera.right = (frustumSize * aspect) / 2
  camera.top = frustumSize / 2
  camera.bottom = -frustumSize / 2
  camera.updateProjectionMatrix()
}

export async function loadAllModels(scene: THREE.Scene, world: CANNON.World) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('/3d/punching-bag/punchbag_origin_fix.glb')
  gltf.scene.position.y = -3
  scene.add(gltf.scene)

  console.log('=== All objects in GLB ===')
  gltf.scene.traverse((object) => {
    console.log('Object:', object.name, 'Type:', object.type)
  })
  console.log('========================')

  let bagBone = null

  const bone = gltf.scene.getObjectByName('Bone')
  if (bone) {
    bagBone = bone
    console.log('Found bone:', bagBone?.name)
    if (bagBone) {
      bagBone.rotation.set(0.3, 0, 0.2)
    }
  }

  const angularVelocity = new CANNON.Vec3(0, 0, 0)
  const damping = 0.98
  const gravity = 9.82
  const length = 1.5

  return {
    punchingBag: gltf.scene,
    bagBone,
    angularVelocity,
    damping,
    gravity,
    length,
  }
}

export function animate(
  composer: EffectComposer,
  directionalLight: THREE.DirectionalLight,
  world: CANNON.World,
  bagPhysics?: {
    bagBone: any
    angularVelocity: CANNON.Vec3
    damping: number
    gravity: number
    length: number
  },
) {
  requestAnimationFrame(() => animate(composer, directionalLight, world, bagPhysics))

  const time = Date.now() * 0.0005
  const swayAmount = 2
  directionalLight.position.x = 5 + Math.sin(time) * swayAmount
  directionalLight.position.z = 5 + Math.cos(time * 0.7) * swayAmount

  if (bagPhysics && bagPhysics.bagBone) {
    const { bagBone, angularVelocity, damping, gravity, length } = bagPhysics
    const deltaTime = 1 / 60

    const down = new THREE.Vector3(0, -1, 0)
    const currentDown = down.clone().applyQuaternion(bagBone.quaternion)

    const torqueAxis = new THREE.Vector3().crossVectors(currentDown, down)
    const torqueMagnitude = (gravity / length) * torqueAxis.length()

    if (torqueAxis.length() > 0.001) {
      torqueAxis.normalize()

      angularVelocity.x += torqueAxis.x * torqueMagnitude * deltaTime
      angularVelocity.y += torqueAxis.y * torqueMagnitude * deltaTime
      angularVelocity.z += torqueAxis.z * torqueMagnitude * deltaTime
    }

    angularVelocity.x *= damping
    angularVelocity.y *= damping
    angularVelocity.z *= damping

    const angularSpeed = Math.sqrt(
      angularVelocity.x * angularVelocity.x +
        angularVelocity.y * angularVelocity.y +
        angularVelocity.z * angularVelocity.z,
    )

    if (angularSpeed > 0.001) {
      const axis = new THREE.Vector3(
        angularVelocity.x / angularSpeed,
        angularVelocity.y / angularSpeed,
        angularVelocity.z / angularSpeed,
      )
      const angle = angularSpeed * deltaTime
      const deltaQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle)
      bagBone.quaternion.multiplyQuaternions(deltaQuat, bagBone.quaternion)
      bagBone.quaternion.normalize()
    }
  }

  composer.render()
}
