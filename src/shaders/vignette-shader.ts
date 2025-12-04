import * as THREE from 'three'

export const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
    time: { value: 0.0 },
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

    #define kVignetteStrength 0.5
    #define kVignetteScale 0.6
    #define kVignetteExponent 3.0
    #define kRoot2 1.414213562

    float Vignette(in vec2 fragCoord)
    {
        vec2 uv = fragCoord / resolution;
        uv.x = (uv.x - 0.5) * (resolution.x / resolution.y) + 0.5;

        float x = 2.0 * (uv.x - 0.5);
        float y = 2.0 * (uv.y - 0.5);

        float dist = sqrt(x*x + y*y) / kRoot2;

        return mix(1.0, max(0.0, 1.0 - pow(dist * kVignetteScale, kVignetteExponent)), kVignetteStrength);
    }

    void main() {
      vec2 fragCoord = vUv * resolution;
      vec4 color = texture2D(tDiffuse, vUv);

      vec3 rgb = color.rgb;
      rgb = clamp(rgb, 0.0, 1.0);
      rgb = pow(rgb, vec3(0.8));
      rgb = mix(vec3(0.1), vec3(0.9), rgb);
      rgb *= Vignette(fragCoord);
      rgb = clamp(rgb, 0.0, 1.0);

      gl_FragColor = vec4(rgb, color.a);
    }
  `,
}
