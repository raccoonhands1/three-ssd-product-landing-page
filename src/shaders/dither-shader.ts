import * as THREE from 'three'

export const DitherShader = {
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
