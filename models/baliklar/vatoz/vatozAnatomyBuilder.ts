import * as THREE from 'three';

export type PlecoVariant = 'cuce' | 'leopar';

export interface ProceduralPlecoAssets {
  bodyGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  finGeometry: THREE.BufferGeometry;
  finMaterial: THREE.MeshPhysicalMaterial;
  eyeGeometry: THREE.BufferGeometry;
  eyeMaterial: THREE.MeshPhysicalMaterial;
  updateShaderTime: (time: number) => void;
}

function createPlecoSkinTexture(variant: PlecoVariant): {
  diffuseMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 256;

  const dCanvas = document.createElement('canvas');
  dCanvas.width = width;
  dCanvas.height = height;
  const dCtx = dCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = width;
  bCanvas.height = height;
  const bCtx = bCanvas.getContext('2d')!;

  // Açık taban (instanceColor ile koyu kahve, altın-albino veya leopar rengini alır)
  dCtx.fillStyle = '#e2e8f0';
  dCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#505050';
  bCtx.fillRect(0, 0, width, height);

  // Zırhlı kemik plakaları (Scutes) ve benek desenleri
  const spotCount = variant === 'leopar' ? 140 : 95;
  for (let i = 0; i < spotCount; i++) {
    const x = ((i * 73) % (width - 20)) + 10;
    const y = ((i * 41) % (height - 20)) + 10;
    const r = variant === 'leopar' ? 6 + (i % 5) : 3.5 + (i % 3);

    dCtx.fillStyle = variant === 'leopar' ? 'rgba(15, 23, 42, 0.62)' : 'rgba(255, 255, 255, 0.55)';
    dCtx.beginPath();
    dCtx.arc(x, y, r, 0, Math.PI * 2);
    dCtx.fill();

    bCtx.fillStyle = '#d4d4d4';
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.9, 0, Math.PI * 2);
    bCtx.fill();
  }

  const diffuseMap = new THREE.CanvasTexture(dCanvas);
  diffuseMap.colorSpace = THREE.SRGBColorSpace;
  diffuseMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.needsUpdate = true;

  return { diffuseMap, bumpMap };
}

function buildPlecoBodyGeometry(): THREE.BufferGeometry {
  // Karın kısmı düz (vantuzla cama/kuma yapışabilmesi için ryBot küçük), sırtı kubbeli zırhlı kesit
  const sections = [
    { z: 0.23, rx: 0.018, ryTop: 0.012, ryBot: 0.002, y: 0.002 }, // Geniş yuvarlak burun
    { z: 0.18, rx: 0.048, ryTop: 0.028, ryBot: 0.004, y: 0.004 }, // Geniş kafa & vantuz ağız
    { z: 0.11, rx: 0.056, ryTop: 0.038, ryBot: 0.005, y: 0.005 }, // Omuz genişliği
    { z: 0.03, rx: 0.050, ryTop: 0.040, ryBot: 0.005, y: 0.005 }, // Gövde ortası
    { z: -0.06, rx: 0.036, ryTop: 0.030, ryBot: 0.004, y: 0.004 },
    { z: -0.15, rx: 0.022, ryTop: 0.020, ryBot: 0.004, y: 0.004 },
    { z: -0.23, rx: 0.010, ryTop: 0.016, ryBot: 0.006, y: 0.006 }, // Kuyruk sapı
  ];

  const radialSegments = 22;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < sections.length; s++) {
    const sec = sections[s];
    const u = s / (sections.length - 1);
    for (let r = 0; r <= radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const x = sinT * sec.rx;
      const ry = cosT >= 0 ? sec.ryTop : sec.ryBot;
      const y = sec.y + cosT * ry;
      positions.push(x, y, sec.z);
      uvs.push(u, r / radialSegments);
    }
  }

  const stride = radialSegments + 1;
  for (let s = 0; s < sections.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const a = s * stride + r;
      const b = (s + 1) * stride + r;
      const c = (s + 1) * stride + (r + 1);
      const d = s * stride + (r + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildPlecoFinsGeometry(variant: PlecoVariant): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const addRibbon = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) => {
    const base = positions.length / 3;
    [p0, p1, p2, p3].forEach((p, idx) => {
      positions.push(p.x, p.y, p.z);
      uvs.push(idx < 2 ? 0 : 1, idx % 2);
    });
    indices.push(base, base + 2, base + 1);
    indices.push(base + 2, base + 3, base + 1);
  };

  const sailBoost = variant === 'leopar' ? 1.35 : 1.0;

  // 1. Yelken Sırt Yüzgeci (Dorsal Fin)
  addRibbon(
    new THREE.Vector3(0, 0.038, 0.05),
    new THREE.Vector3(0, 0.024, -0.10),
    new THREE.Vector3(0, 0.125 * sailBoost, 0.01),
    new THREE.Vector3(0, 0.105 * sailBoost, -0.15)
  );

  // 2. Güçlü Kuyruk Yüzgeci (Caudal Fin)
  addRibbon(
    new THREE.Vector3(0, 0.022, -0.225),
    new THREE.Vector3(0, -0.002, -0.225),
    new THREE.Vector3(0, 0.068, -0.35),
    new THREE.Vector3(0, -0.045, -0.36)
  );

  // 3. Geniş Yatay Göğüs Yüzgeçleri (Pectoral Fins - Tabana yayılır)
  [-1, 1].forEach((side) => {
    addRibbon(
      new THREE.Vector3(side * 0.052, 0.006, 0.12),
      new THREE.Vector3(side * 0.048, 0.005, 0.05),
      new THREE.Vector3(side * 0.135, 0.004, 0.05),
      new THREE.Vector3(side * 0.115, 0.003, -0.03)
    );
    // Karın yüzgeçleri
    addRibbon(
      new THREE.Vector3(side * 0.036, 0.004, -0.01),
      new THREE.Vector3(side * 0.030, 0.004, -0.06),
      new THREE.Vector3(side * 0.095, 0.003, -0.06),
      new THREE.Vector3(side * 0.080, 0.003, -0.12)
    );
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildPlecoEyesGeometry(): THREE.BufferGeometry {
  const left = new THREE.SphereGeometry(0.011, 12, 10);
  left.translate(0.034, 0.026, 0.155);
  const right = new THREE.SphereGeometry(0.011, 12, 10);
  right.translate(-0.034, 0.026, 0.155);

  const lNon = left.toNonIndexed();
  const rNon = right.toNonIndexed();
  const count = lNon.attributes.position.count + rNon.attributes.position.count;
  const pos = new Float32Array(count * 3);
  const norm = new Float32Array(count * 3);

  pos.set(lNon.attributes.position.array as Float32Array, 0);
  pos.set(rNon.attributes.position.array as Float32Array, lNon.attributes.position.count * 3);
  norm.set(lNon.attributes.normal.array as Float32Array, 0);
  norm.set(rNon.attributes.normal.array as Float32Array, lNon.attributes.normal.count * 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  return geo;
}

export function buildAnatomicalPlecoAssets(
  variant: PlecoVariant = 'cuce'
): ProceduralPlecoAssets {
  const timeUniform = { value: 0 };
  const bodyGeometry = buildPlecoBodyGeometry();
  const { diffuseMap, bumpMap } = createPlecoSkinTexture(variant);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map: diffuseMap,
    bumpMap,
    bumpScale: 0.025,
    roughness: 0.45,
    metalness: 0.08,
  });

  const finGeometry = buildPlecoFinsGeometry(variant);
  const finMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map: diffuseMap,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    roughness: 0.35,
  });

  // Vatoz kuyruk ve göğüs yüzgeci hafif dalgalanma shader'ı
  const applyWave = (mat: THREE.MeshPhysicalMaterial) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float tailMask = smoothstep(-0.10, -0.35, transformed.z);
        transformed.x += sin(uTime * 4.5 + transformed.z * 12.0) * tailMask * 0.025;
        `
      );
    };
  };
  applyWave(bodyMaterial);
  applyWave(finMaterial);

  const eyeGeometry = buildPlecoEyesGeometry();
  const eyeMaterial = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.1,
    clearcoat: 1.0,
  });

  return {
    bodyGeometry,
    bodyMaterial,
    finGeometry,
    finMaterial,
    eyeGeometry,
    eyeMaterial,
    updateShaderTime: (t: number) => {
      timeUniform.value = t;
    },
  };
}