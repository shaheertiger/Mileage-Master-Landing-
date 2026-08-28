/* ============================================================
   MILEAGE MASTER — THREE.JS ENGINE OIL WEBGL SCENE
   Power Under The Hood | engine-scene.js
   ============================================================ */

import { emit, EVENTS } from '../utils/events.js';

let renderer, scene, camera, mesh, uniforms, raf, running = false;

/**
 * Initializes a Three.js WebGL scene on the given canvas.
 * Renders an animated fluid oil surface using a custom GLSL shader.
 * The shader simulates oil flow: dark metallic surface with
 * amber/gold fluid ripples and iridescent sheen.
 */
export const initEngineScene = async (canvasEl) => {
  if (!window.THREE) {
    console.warn('[WebGL] Three.js not loaded');
    emit(EVENTS.WEBGL_ERROR, { reason: 'THREE not loaded' });
    return;
  }

  try {
    const THREE = window.THREE;
    const W = canvasEl.clientWidth  || window.innerWidth;
    const H = canvasEl.clientHeight || window.innerHeight;

    // ── Renderer ────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      alpha: true,
      antialias: false,  // Performance
      powerPreference: 'high-performance',
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    // ── Scene & Camera ───────────────────────────────────────
    scene  = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ── Shader Uniforms ──────────────────────────────────────
    uniforms = {
      uTime:     { value: 0 },
      uProgress: { value: 0 },  // Driven by scroll (0→1)
      uOilFlow:  { value: 0 },  // Oil entry intensity (0→1)
      uResolution: { value: new THREE.Vector2(W, H) },
    };

    // ── Vertex Shader ────────────────────────────────────────
    const vertexShader = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // ── Fragment Shader (Oil Surface) ────────────────────────
    const fragmentShader = /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform float uProgress;
      uniform float uOilFlow;
      uniform vec2  uResolution;

      varying vec2 vUv;

      // Simplex-like 2D noise
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453);
      }

      float voronoi(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float minDist = 1.0;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash2(i + neighbor);
            point = 0.5 + 0.5 * sin(uTime * 0.3 + 6.2831 * point);
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
          }
        }
        return minDist;
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * voronoi(p);
          p = p * 2.0 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      // Iridescent oil sheen
      vec3 oilSheen(float n, float time) {
        float hue = n + time * 0.05;
        vec3 amber  = vec3(0.78, 0.52, 0.04);
        vec3 gold   = vec3(0.94, 0.71, 0.16);
        vec3 dark   = vec3(0.05, 0.04, 0.03);
        vec3 red    = vec3(0.77, 0.07, 0.19);

        float t = smoothstep(0.0, 1.0, sin(hue * 6.28) * 0.5 + 0.5);
        vec3 col = mix(dark, amber, t);
        col = mix(col, gold, smoothstep(0.6, 1.0, t));
        col = mix(col, red,  smoothstep(0.0, 0.3, t) * 0.3);
        return col;
      }

      void main() {
        vec2 uv = vUv;
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
        vec2 p = uv * aspect * 3.0;

        // Flow direction: right to left with time
        p += vec2(-uTime * 0.12, uTime * 0.04);

        float n = fbm(p + vec2(uTime * 0.08));
        float n2 = fbm(p * 1.6 - vec2(uTime * 0.05, uTime * 0.02));

        // Oil surface sheen
        vec3 color = oilSheen(n + n2 * 0.4, uTime);

        // Dark metallic base visible between oil
        float metallic = smoothstep(0.3, 0.6, n2);
        vec3 metalColor = vec3(0.08, 0.08, 0.10);
        color = mix(color, metalColor, metallic * 0.6);

        // Edge vignette
        float vign = 1.0 - smoothstep(0.3, 0.8, length(uv - 0.5) * 1.6);
        color *= vign;

        // Radial expansion mask driven by uOilFlow
        // Impact point: Right side, slightly down (where the stream hits)
        vec2 impactPoint = vec2(0.65, 0.3);
        float distToImpact = length(uv - impactPoint);
        
        // Flow expands outward from impact point
        float spreadRadius = uOilFlow * 1.5; 
        float spreadMask = 1.0 - smoothstep(spreadRadius - 0.2, spreadRadius + 0.05, distToImpact);

        // Highlight the flow edges to simulate spreading fluid in channels
        float edgeGlow = smoothstep(spreadRadius + 0.05, spreadRadius - 0.1, distToImpact) 
                       * smoothstep(spreadRadius - 0.25, spreadRadius, distToImpact);
        
        // Add golden glow at the expanding front
        color += vec3(0.94, 0.71, 0.16) * edgeGlow * (1.5 + n * 0.5);

        // Oil flow intensity applied via the radial mask
        float alpha = spreadMask * (0.5 + 0.5 * n) * vign;

        // Fade in with uProgress
        alpha *= smoothstep(0.0, 0.3, uProgress);

        gl_FragColor = vec4(color, alpha * 0.85);
      }
    `;

    // ── Full-screen quad ────────────────────────────────────
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Resize handler ───────────────────────────────────────
    window.addEventListener('resize', () => {
      const W = window.innerWidth, H = window.innerHeight;
      renderer.setSize(W, H);
      uniforms.uResolution.value.set(W, H);
    }, { passive: true });

    running = true;
    tick();

    emit(EVENTS.WEBGL_READY);
    return { setProgress, setOilFlow };

  } catch (err) {
    console.error('[WebGL] Scene init failed:', err);
    emit(EVENTS.WEBGL_ERROR, { reason: err.message });
  }
};

const tick = () => {
  if (!running) return;
  raf = requestAnimationFrame(tick);
  uniforms.uTime.value += 0.016;
  renderer.render(scene, camera);
};

export const setProgress = (p) => {
  if (uniforms) uniforms.uProgress.value = p;
};

export const setOilFlow = (f) => {
  if (uniforms) uniforms.uOilFlow.value = f;
};

export const destroyEngineScene = () => {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  renderer?.dispose();
  mesh?.geometry.dispose();
  mesh?.material.dispose();
};
