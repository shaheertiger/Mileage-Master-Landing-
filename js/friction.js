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
  // Deep dark garage background
  scene.background = new THREE.Color(0x050505);
  // Add some subtle fog for depth
  scene.fog = new THREE.Fog(0x050505, 50, 150);

  const camera = new THREE.PerspectiveCamera(35, sticky.offsetWidth / sticky.offsetHeight, 1, 1000);
  camera.position.set(0, -5, 90); // Lowered camera to center the engine
  camera.lookAt(0, -5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Alpha true for background CSS
  renderer.setSize(sticky.offsetWidth, sticky.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5; // Increased exposure for brighter metal
  
  simContainer.appendChild(renderer.domElement);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = sticky.offsetWidth / sticky.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sticky.offsetWidth, sticky.offsetHeight);
  }, { passive: true });

  // ── 2. LIGHTING (High-Contrast Metallic Studio Setup) ─────
  const ambient = new THREE.AmbientLight(0xffffff, 0.6); // Brighter ambient
  scene.add(ambient);

  // Main Key light (Cool/Blueish)
  const keyLight = new THREE.DirectionalLight(0xe0f2ff, 4.0);
  keyLight.position.set(30, 40, 50);
  scene.add(keyLight);

  // Strong Fill light (Warm)
  const fillLight = new THREE.DirectionalLight(0xffddaa, 3.0);
  fillLight.position.set(-40, 10, 40);
  scene.add(fillLight);
  
  // Strong Rim Light (Backlight for edge highlights)
  const rimLight = new THREE.DirectionalLight(0xffffff, 5.0);
  rimLight.position.set(0, 50, -50);
  scene.add(rimLight);

  // Heat glow (Red light from bottom)
  const heatLight = new THREE.PointLight(0xff3300, 0, 150);
  heatLight.position.set(0, -20, 20);
  scene.add(heatLight);

  // ── 3. MATERIALS ─────────────────────────────────────────
  // Without envMaps, MeshPhongMaterial often gives a much sharper, "classic shiny metal" look 
  // than StandardMaterial. We use high shininess and bright specular colors.
  
  const matSteel = new THREE.MeshPhongMaterial({
    color: 0x888899, // Base grey
    specular: 0xffffff, // Bright white highlights
    shininess: 100, // Very sharp reflections
    reflectivity: 1,
  });

  const matDarkMetal = new THREE.MeshPhongMaterial({
    color: 0x333333,
    specular: 0xaaaaaa,
    shininess: 60,
  });
  
  const matChrome = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    specular: 0xffffff,
    shininess: 150,
  });

  // Physically based transparent fluid material for oil
  const matOil = new THREE.MeshPhysicalMaterial({
    color: 0xffa600,
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.9, // glass-like fluid
    transparent: true,
    opacity: 0.9,
    ior: 1.4,
    thickness: 10.0,
  });

  // ── 4. BUILD ENGINE ──────────────────────────────────────
  const engineGroup = new THREE.Group();
  // Move the entire engine up so it sits perfectly in the center of the screen
  engineGroup.position.y = 12; 
  scene.add(engineGroup);

  // Engine dimensions
  const N = 4;
  const crankR = 6;
  const rodLen = 22;
  const spacing = 14;
  const pistonR = 5.5;
  const pistonH = 10;
  const fireOffsets = [0, Math.PI, Math.PI * 1.5, Math.PI * 0.5]; // 1-3-4-2

  // Center engine
  const startX = -((N - 1) * spacing) / 2;

  const pistons = [];
  const rods = [];
  const throws = [];

  // Geometries
  const geoPiston = new THREE.CylinderGeometry(pistonR, pistonR, pistonH, 32);
  const geoPin = new THREE.CylinderGeometry(1.5, 1.5, pistonR * 2.2, 16);
  geoPin.rotateZ(Math.PI / 2);
  
  const geoRod = new THREE.BoxGeometry(pistonR * 0.8, rodLen, pistonR * 0.6);
  const geoCrankMain = new THREE.CylinderGeometry(2, 2, spacing * (N + 1), 16);
  geoCrankMain.rotateZ(Math.PI / 2);
  
  const geoCounterweight = new THREE.BoxGeometry(3, crankR * 2.5, pistonR * 1.5);
  const geoCrankPin = new THREE.CylinderGeometry(1.8, 1.8, pistonR * 1.2, 16);
  geoCrankPin.rotateZ(Math.PI / 2);

  // Main Crankshaft Axis
  const mainCrank = new THREE.Mesh(geoCrankMain, matDarkMetal);
  mainCrank.position.y = -rodLen - crankR + 10; // Base offset
  engineGroup.add(mainCrank);

  for (let i = 0; i < N; i++) {
    const cx = startX + i * spacing;

    // ── Piston ──
    const pGroup = new THREE.Group();
    pGroup.position.x = cx;
    
    const pistonMesh = new THREE.Mesh(geoPiston, matSteel);
    pGroup.add(pistonMesh);
    
    // Piston Rings (Visual details)
    for(let r=0; r<3; r++){
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(pistonR + 0.1, pistonR + 0.1, 0.4, 32),
        matChrome
      );
      ring.position.y = pistonH/2 - 2 - (r * 1.2);
      pGroup.add(ring);
    }

    // Wrist Pin
    const pinMesh = new THREE.Mesh(geoPin, matChrome);
    pinMesh.position.y = -pistonH * 0.2;
    pGroup.add(pinMesh);

    engineGroup.add(pGroup);
    pistons.push(pGroup);

    // ── Connecting Rod ──
    const rGroup = new THREE.Group();
    rGroup.position.x = cx;
    
    // We pivot the rod from the top (wrist pin)
    const rodMesh = new THREE.Mesh(geoRod, matDarkMetal);
    rodMesh.position.y = -rodLen / 2;
    rGroup.add(rodMesh);
    
    engineGroup.add(rGroup);
    rods.push(rGroup);

    // ── Crankshaft Throw ──
    const tGroup = new THREE.Group();
    tGroup.position.x = cx;
    tGroup.position.y = mainCrank.position.y;
    
    const cw1 = new THREE.Mesh(geoCounterweight, matDarkMetal);
    cw1.position.set(-pistonR*0.7, -crankR*0.5, 0);
    const cw2 = new THREE.Mesh(geoCounterweight, matDarkMetal);
    cw2.position.set(pistonR*0.7, -crankR*0.5, 0);
    
    const cPin = new THREE.Mesh(geoCrankPin, matChrome);
    cPin.position.y = crankR;

    tGroup.add(cw1);
    tGroup.add(cw2);
    tGroup.add(cPin);
    
    engineGroup.add(tGroup);
    throws.push(tGroup);
  }

  // ── 5. OIL FLUID MESH ────────────────────────────────────
  const oilGeo = new THREE.BoxGeometry(spacing * N + 20, rodLen * 2.5, 40);
  const oilMesh = new THREE.Mesh(oilGeo, matOil);
  oilMesh.position.y = -100; // start hidden below
  scene.add(oilMesh);

  // ── 6. SCROLL TRIGGER LOGIC ──────────────────────────────
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
        state.speed    = 0.05; // Slow, struggling
        state.heatAlpha = 1.0;
        state.jitter = 0.5;
      } else if (p < 0.55) {
        const sub = (p - 0.25) / 0.30;
        state.oilLevel  = sub;
        state.speed     = 0.05 + sub * 0.15;
        state.heatAlpha = 1 - sub;
        state.jitter = 0.5 * (1 - sub);
      } else {
        state.oilLevel  = 1;
        state.speed     = 0.3; // Fast, smooth
        state.heatAlpha = 0;
        state.jitter = 0;
      }

      updateMeters(p, meterFriction, meterHeat, meterProtection);
    }
  });

  if (textGroup) gsap.fromTo(textGroup, { opacity: 0 }, { opacity: 1, duration: 0.5 });

  // ── 7. ANIMATION LOOP ────────────────────────────────────
  let rafId;
  const clock = new THREE.Clock();

  const render = () => {
    rafId = requestAnimationFrame(render);
    const time = clock.getElapsedTime();

    // Advance engine phase
    state.crankAngle += state.speed;

    // Apply Engine Kinematics
    for (let i = 0; i < N; i++) {
      const angle = state.crankAngle + fireOffsets[i];
      
      // 1. Rotate Crank Throw
      throws[i].rotation.z = angle;

      // Crank pin world position Y relative to main crank axis
      const crankPinYLocal = crankR * Math.cos(angle);
      const crankPinXLocal = -crankR * Math.sin(angle); // negative because rotation Z is CCW

      // 2. Calculate Piston Position (Slider-Crank geometry)
      const ratio = crankR / rodLen;
      // Formula: Y = R*cos(A) + L*sqrt(1 - (R/L*sin(A))^2)
      const pistonOffset = crankR * Math.cos(angle) + rodLen * Math.sqrt(1 - Math.pow(ratio * Math.sin(angle), 2));
      
      const pY = mainCrank.position.y + pistonOffset;
      
      // Apply jitter if dry
      const jY = (Math.random() - 0.5) * state.jitter;
      pistons[i].position.y = pY + jY;

      // 3. Connect Rod
      const wristPinY = pY - pistonH * 0.2;
      rods[i].position.y = wristPinY;
      
      // Rod angle: asin((R * sin(A)) / L)
      const rodAngle = Math.asin((crankR * Math.sin(angle)) / rodLen);
      rods[i].rotation.z = rodAngle;
    }

    // Animate Oil
    if (state.oilLevel > 0) {
      // Base Y is bottom of engine
      const bottomY = mainCrank.position.y - crankR - 10;
      const topY = 20; // Top of stroke approx
      const range = topY - bottomY;
      
      oilMesh.position.y = bottomY + (range * state.oilLevel) - (oilGeo.parameters.height / 2);
      
      // Animate oil material a bit
      matOil.opacity = 0.7 + (state.oilLevel * 0.3);
      
      // Tint engine metal slightly golden when submerged
      matSteel.color.setHex(0xdddddd).lerp(new THREE.Color(0xffeeba), state.oilLevel * 0.4);
    } else {
      oilMesh.position.y = -100;
      matSteel.color.setHex(0xdddddd);
    }

    // Heat Light
    heatLight.intensity = state.heatAlpha * 5;
    
    // Slight camera shake when dry
    if (state.jitter > 0) {
      camera.position.x = (Math.random() - 0.5) * state.jitter * 0.5;
      camera.position.y = 15 + (Math.random() - 0.5) * state.jitter * 0.5;
    } else {
      camera.position.x = 0;
      camera.position.y = 15;
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
