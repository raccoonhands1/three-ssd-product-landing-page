import * as THREE from 'three'

export const EdgeDetectionShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
    time: { value: 0.0 },
    mouse: { value: new THREE.Vector2() },
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
    uniform float time;
    uniform vec2 mouse;
    varying vec2 vUv;

    #define EDGE_WIDTH 0.15
    #define RAYMARCH_ITERATIONS 400

    float fSubtraction(float a, float b) {return max(-a,b);}
    float fIntersection(float d1, float d2) {return max(d1,d2);}
    void fUnion(inout float d1, float d2) {d1 = min(d1,d2);}
    float pSphere(vec3 p, float s) {return length(p)-s;}
    float pRoundBox(vec3 p, vec3 b, float r) {return length(max(abs(p)-b,0.0))-r;}
    float pTorus(vec3 p, vec2 t) {vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y;}
    float pCapsule(vec3 p, vec3 a, vec3 b, float r) {vec3 pa = p - a, ba = b - a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 ); return length( pa - ba*h ) - r;}

    float distf(vec3 p)
    {
        float d = 10000.0;

        fUnion(d, pRoundBox(vec3(0,0,10) + p, vec3(11,11,1), 1.0));
        fUnion(d, pRoundBox(vec3(0,0,-2) + p, vec3(5,5,12), 1.0));
        fUnion(d, pSphere(vec3(10,10,0) + p, 8.0));
        fUnion(d, pTorus(vec3(-10,-12,0) + p, vec2(9,5)));
        fUnion(d, pCapsule(p, vec3(-15,15,10), vec3(15,-15,-5), 1.5));
        fUnion(d, -pSphere(p, 80.0));

        return d;
    }

    vec4 raymarch(vec3 from, vec3 increment)
    {
        const float maxDist = 20.0;
        const float minDist = 0.001;
        const int maxIter = RAYMARCH_ITERATIONS;

        float dist = 0.0;

        float lastDistEval = 1e10;
        float edge = 0.0;

        for(int i = 0; i < maxIter; i++) {
            vec3 pos = (from + increment * dist);
            float distEval = distf(pos);

            if (lastDistEval < EDGE_WIDTH && distEval > lastDistEval + 0.001) {
                edge = 1.0;
            }

            if (distEval < minDist) {
                break;
            }

            dist += distEval;
            if (lastDistEval > distEval) lastDistEval = distEval;
        }

        return vec4(dist, 0.0, edge, 0);
    }

    vec4 getPixel(vec3 from, vec3 increment)
    {
        vec4 c = raymarch(from, increment);
        return mix(vec4(1,1,1,1),vec4(0,0,0,1),c.z);
    }

    void main()
    {
        vec2 fragCoord = vUv * resolution;

        vec2 q = fragCoord.xy/resolution.xy;
        vec2 p = -1.0+2.0*q;
        p.x *= -resolution.x/resolution.y;

        vec2 m = mouse;
        if (mouse.x == 0.0 && mouse.y == 0.0) {
            m = vec2(time * 0.06 + 2.86, 0.38);
        }
        m = -1.0 + 2.0 * m;
        m *= vec2(4.0,-1.5);

        float dist = 50.0;
        vec3 ta = vec3(0,0,0);
        vec3 ro = vec3(cos(m.x) * cos(m.y) * dist, sin(m.x) * cos(m.y) * dist, sin(m.y) * dist);

        vec3 cw = normalize( ta-ro );
        vec3 cp = vec3( 0.0, 0.0, 1.0 );
        vec3 cu = normalize( cross(cw,cp) );
        vec3 cv = normalize( cross(cu,cw) );
        vec3 rd = normalize( p.x*cu + p.y*cv + 2.5*cw );

        vec4 col = getPixel(ro, rd);

        vec4 sceneColor = texture2D(tDiffuse, vUv);
        gl_FragColor = mix(sceneColor, col, 0.8);
    }
  `,
}
