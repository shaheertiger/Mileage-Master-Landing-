/* ============================================================
   MILEAGE MASTER — 3D PISTON ENGINE SIMULATION
   Three.js procedural inline 4-cylinder | friction.js
   ============================================================ */

export const initFrictionScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const THREE = window.THREE;
  
  if (!gsap || !ScrollTrigger || !THREE) {
    console.warn("Missing dependencies for friction scene.");
    return;
  }

  const section = document.getElementById('friction');
  const sticky  = section?.querySelector('.friction-sticky');
  const simContainer = section?.querySelector('.friction-sim');
  
  if (!section || !sticky || !simContainer) return;

  // Clear existing canvas if any
  simContainer.innerHTML = '';

  const meterFriction   = section.querySelector('.meter-friction');
  const meterHeat       = section.querySelector('.meter-heat');
  const meterProtection = section.querySelector('.meter-protection');
  const textGroup       = section.querySelector('.friction-text');

  // ── Engine State ─────────────────────────────────────────
  const state = {
    progress: 0,
    crankAngle: 0,
    oilLevel: 0,
    speed: 0.05,
    heatAlpha: 1.0,
    jitter: 0,
  };

  // ── 1. THREE.JS SETUP ────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);

  const camera = new THREE.PerspectiveCamera(35, sticky.offsetWidth / sticky.offsetHeight, 1, 1000);
  camera.position.set(0, 5, 90);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(sticky.offsetWidth, sticky.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  simContainer.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = sticky.offsetWidth / sticky.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sticky.offsetWidth, sticky.offsetHeight);
  }, { passive: true });

  // ── 2. CREATE PROCEDURAL ENVIRONMENT MAP FOR METAL ────────
  // Metal needs an env map to look real. We draw a fake studio setup on a canvas.
  const envCanvas = document.createElement('canvas');
  envCanvas.width = 512;
  envCanvas.height = 256;
  const eCtx = envCanvas.getContext('2d');
  
  // Base dark gradient
  const grad = eCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#111');
  grad.addColorStop(0.5, '#444'); // horizon
  grad.addColorStop(1, '#050505');
  eCtx.fillStyle = grad;
  eCtx.fillRect(0, 0, 512, 256);
  
  // Draw studio lights (bright white rectangles)
  eCtx.fillStyle = '#ffffff';
  eCtx.fillRect(100, 50, 100, 40); // Top left light
  eCtx.fillRect(350, 60, 80, 30);  // Top right light
  eCtx.fillStyle = '#ffaa55';
  eCtx.fillRect(250, 150, 150, 20); // Warm bounce light below horizon
  
  const envTexture = new THREE.CanvasTexture(envCanvas);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  envTexture.encoding = THREE.sRGBEncoding;
  
  scene.environment = envTexture; // Apply to scene globally

  // ── 3. LIGHTING ──────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(10, 20, 30);
  scene.add(dirLight);

  const heatLight = new THREE.PointLight(0xff2200, 0, 100);
  heatLight.position.set(0, -10, 10);
  scene.add(heatLight);

  // ── 4. MATERIALS ─────────────────────────────────────────
  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 1.0,
    roughness: 0.15,
    envMap: envTexture,
    envMapIntensity: 2.0
  });

  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.9,
    roughness: 0.4,
    envMap: envTexture,
    envMapIntensity: 1.0
  });
  
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    envMap: envTexture,
    envMapIntensity: 3.0
  });

  // ── 5. BUILD ENGINE GEOMETRY ─────────────────────────────
  const engineGroup = new THREE.Group();
  engineGroup.position.y = 8; 
  scene.add(engineGroup);

  const N = 4;
  const crankR = 6;
  const rodLen = 22;
  const spacing = 15;
  const pistonR = 6.0;
  const pistonH = 10;
  const fireOffsets = [0, Math.PI, Math.PI * 1.5, Math.PI * 0.5];

  const startX = -((N - 1) * spacing) / 2;
  const pistons = [];
  const rods = [];
  const throws = [];

  const geoPiston = new THREE.CylinderGeometry(pistonR, pistonR, pistonH, 32);
  const geoPin = new THREE.CylinderGeometry(1.5, 1.5, pistonR * 2.1, 16);
  geoPin.rotateZ(Math.PI / 2);
  
  const geoCrankMain = new THREE.CylinderGeometry(2, 2, spacing * (N + 1), 16);
  geoCrankMain.rotateZ(Math.PI / 2);
  
  // Crank counterweight shape (squashed cylinder)
  const geoCounterweight = new THREE.CylinderGeometry(4.5, 4.5, 2, 16);
  geoCounterweight.scale(1, 1, 1.5); // elongate
  geoCounterweight.rotateZ(Math.PI / 2);
  
  const geoCrankPin = new THREE.CylinderGeometry(1.8, 1.8, spacing * 0.4, 16);
  geoCrankPin.rotateZ(Math.PI / 2);

  const mainCrank = new THREE.Mesh(geoCrankMain, matDarkMetal);
  mainCrank.position.y = -rodLen - crankR + 5;
  engineGroup.add(mainCrank);

  for (let i = 0; i < N; i++) {
    const cx = startX + i * spacing;

    // Piston
    const pGroup = new THREE.Group();
    pGroup.position.x = cx;
    const pistonMesh = new THREE.Mesh(geoPiston, matSteel);
    pGroup.add(pistonMesh);
    
    // Rings
    for(let r=0; r<3; r++){
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(pistonR + 0.15, pistonR + 0.15, 0.4, 32), matChrome);
      ring.position.y = pistonH/2 - 2 - (r * 1.5);
      pGroup.add(ring);
    }
    const pinMesh = new THREE.Mesh(geoPin, matChrome);
    pinMesh.position.y = -pistonH * 0.2;
    pGroup.add(pinMesh);
    engineGroup.add(pGroup);
    pistons.push(pGroup);

    // Connecting Rod (I-Beam style)
    const rGroup = new THREE.Group();
    rGroup.position.x = cx;
    
    const rodBody = new THREE.Mesh(new THREE.BoxGeometry(2, rodLen, 3), matSteel);
    rodBody.position.y = -rodLen / 2;
    rGroup.add(rodBody);
    
    // Flanges to make it an I-Beam
    const flange1 = new THREE.Mesh(new THREE.BoxGeometry(3, rodLen, 0.5), matSteel);
    flange1.position.set(0, -rodLen / 2, 1.5);
    rGroup.add(flange1);
    const flange2 = new THREE.Mesh(new THREE.BoxGeometry(3, rodLen, 0.5), matSteel);
    flange2.position.set(0, -rodLen / 2, -1.5);
    rGroup.add(flange2);
    
    engineGroup.add(rGroup);
    rods.push(rGroup);

    // Crank Throw
    const tGroup = new THREE.Group();
    tGroup.position.x = cx;
    tGroup.position.y = mainCrank.position.y;
    
    const cw1 = new THREE.Mesh(geoCounterweight, matDarkMetal);
    cw1.position.set(-2, -crankR*0.3, 0);
    const cw2 = new THREE.Mesh(geoCounterweight, matDarkMetal);
    cw2.position.set(2, -crankR*0.3, 0);
    const cPin = new THREE.Mesh(geoCrankPin, matChrome);
    cPin.position.y = crankR;

    tGroup.add(cw1);
    tGroup.add(cw2);
    tGroup.add(cPin);
    engineGroup.add(tGroup);
    throws.push(tGroup);
  }

  // ── 6. DYNAMIC FLUID (Wavy Plane) ─────────────────────────
  // We use a high-segment plane to modify vertices for fluid waves
  const fluidW = sticky.offsetWidth * 1.5;
  const fluidD = 100;
  const oilGeo = new THREE.PlaneGeometry(fluidW, fluidD, 64, 16);
  oilGeo.rotateX(-Math.PI / 2); // Lay flat
  
  const matOil = new THREE.MeshPhysicalMaterial({
    color: 0xffa600,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.8, // glass-like
    transparent: true,
    opacity: 0.9,
    ior: 1.4,
    side: THREE.DoubleSide
  });

  const oilMesh = new THREE.Mesh(oilGeo, matOil);
  oilMesh.position.y = -100;
  scene.add(oilMesh);
  
  // Sub-surface oil body (box below the plane so it looks deep)
  const oilBodyGeo = new THREE.BoxGeometry(fluidW, 100, fluidD);
  const matOilBody = new THREE.MeshBasicMaterial({
    color: 0x995500,
    transparent: true,
    opacity: 0.6
  });
  const oilBodyMesh = new THREE.Mesh(oilBodyGeo, matOilBody);
  oilMesh.add(oilBodyMesh);
  oilBodyMesh.position.y = -50; // offset down from surface

  // ── 7. SCROLL TRIGGER LOGIC ──────────────────────────────
  ScrollTrigger.create({
    trigger: section,
    pin: sticky,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      state.progress = p;
      if (p < 0.25) {
        state.oilLevel = 0;
        state.speed = 0.05;
        state.heatAlpha = 1.0;
        state.jitter = 0.8;
      } else if (p < 0.55) {
        const sub = (p - 0.25) / 0.30;
        state.oilLevel = sub;
        state.speed = 0.05 + sub * 0.25;
        state.heatAlpha = 1 - sub;
        state.jitter = 0.8 * (1 - sub);
      } else {
        state.oilLevel = 1;
        state.speed = 0.35;
        state.heatAlpha = 0;
        state.jitter = 0;
      }
      updateMeters(p, meterFriction, meterHeat, meterProtection);
    }
  });

  if (textGroup) gsap.fromTo(textGroup, { opacity: 0 }, { opacity: 1, duration: 0.5 });

  // ── 8. ANIMATION LOOP ────────────────────────────────────
  let rafId;
  const clock = new THREE.Clock();

  // Save original vertices for wave calculation
  const posAttribute = oilGeo.attributes.position;
  const v0 = new Float32Array(posAttribute.array.length);
  for(let i=0; i<posAttribute.array.length; i++) v0[i] = posAttribute.array[i];

  const render = () => {
    rafId = requestAnimationFrame(render);
    const time = clock.getElapsedTime();

    state.crankAngle += state.speed;

    for (let i = 0; i < N; i++) {
      const angle = state.crankAngle + fireOffsets[i];
      throws[i].rotation.z = angle;
      const ratio = crankR / rodLen;
      const pistonOffset = crankR * Math.cos(angle) + rodLen * Math.sqrt(1 - Math.pow(ratio * Math.sin(angle), 2));
      const pY = mainCrank.position.y + pistonOffset;
      
      const jY = (Math.random() - 0.5) * state.jitter;
      pistons[i].position.y = pY + jY;

      const wristPinY = pY - pistonH * 0.2;
      rods[i].position.y = wristPinY;
      rods[i].rotation.z = Math.asin((crankR * Math.sin(angle)) / rodLen);
    }

    if (state.oilLevel > 0) {
      const bottomY = mainCrank.position.y - crankR - 15;
      const topY = 15; 
      const range = topY - bottomY;
      oilMesh.position.y = bottomY + (range * state.oilLevel);
      
      // Animate Waves
      const v = posAttribute.array;
      for (let i = 0; i < v.length; i += 3) {
        const x = v0[i];
        const z = v0[i+2];
        // Complex wave function
        const wave = Math.sin(x * 0.05 + time * 3) * 1.5 + Math.cos(z * 0.05 - time * 2) * 1.5;
        v[i+1] = v0[i+1] + wave * state.oilLevel;
      }
      posAttribute.needsUpdate = true;
      oilGeo.computeVertexNormals(); // Crucial for lighting to reflect off waves

      matSteel.color.setHex(0xcccccc).lerp(new THREE.Color(0xffeeba), state.oilLevel * 0.3);
    } else {
      oilMesh.position.y = -200;
      matSteel.color.setHex(0xcccccc);
    }

    heatLight.intensity = state.heatAlpha * 3;
    
    if (state.jitter > 0) {
      camera.position.x = (Math.random() - 0.5) * state.jitter * 0.5;
      camera.position.y = 5 + (Math.random() - 0.5) * state.jitter * 0.5;
    } else {
      camera.position.x = 0;
      camera.position.y = 5;
    }

    renderer.render(scene, camera);
  };

  render();

  // Cleanup
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => cancelAnimationFrame(rafId),
    onEnterBack: () => render(),
  });
};

/* ── Dynamic Meter Updates ────────────────────────────────── */
const updateMeters = (p, frictionEl, heatEl, protEl) => {
  if (!frictionEl || !heatEl || !protEl) return;

  let frictionVal = 1.0, heatVal = 1.0, protVal = 0.0;
  if (p > 0.25 && p < 0.7) {
    const sub = (p - 0.25) / 0.45;
    frictionVal = 1 - sub;
    heatVal     = 1 - Math.pow(sub, 2);
    protVal     = sub;
  } else if (p >= 0.7) {
    frictionVal = 0; heatVal = 0; protVal = 1;
  }

  frictionEl.querySelector('.meter-fill').style.transform = `scaleY(${frictionVal})`;
  heatEl.querySelector('.meter-fill').style.transform     = `scaleY(${heatVal})`;
  protEl.querySelector('.meter-fill').style.transform     = `scaleY(${protVal})`;
  frictionEl.querySelector('.meter-value').textContent    = frictionVal > 0.7 ? 'HIGH' : frictionVal > 0.3 ? 'MED' : 'LOW';
  const heatFill = heatEl.querySelector('.meter-fill');
  heatEl.querySelector('.meter-value').textContent = heatVal > 0.8 ? 'CRITICAL' : heatVal > 0.4 ? 'WARM' : 'STABLE';
  if (heatVal > 0.8)      heatFill.style.background = 'var(--brand-red)';
  else if (heatVal > 0.4) heatFill.style.background = 'var(--oil-500)';
  else                    heatFill.style.background = 'var(--white-300)';
  protEl.querySelector('.meter-value').textContent = `${Math.floor(protVal * 100)}%`;
};
