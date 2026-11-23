import * as THREE from 'three';

export type ShrimpVariant = 'neocaridina' | 'rilli' | 'amano';

export interface ProceduralShrimpAssets {
  bodyGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  appendageGeometry: THREE.BufferGeometry;
  appendageMaterial: THREE.MeshPhysicalMaterial;
  eyeGeometry: THREE.BufferGeometry;
  eyeMaterial: THREE.MeshPhysicalMaterial;
  updateShaderTime: (time: number) => void;
}

function createShrimpShellTexture(variant: ShrimpVariant): THREE.CanvasTexture {
  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Nötr beyaz-sedef taban (instanceColor ile çarpılır)
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0.0, '#f8fafc');
  grad.addColorStop(0.45, '#ffffff');
  grad.addColorStop(1.0, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Rilli varyantında orta segmentlerde şeffaf bant efekti
  if (variant === 'rilli') {
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.fillRect(width * 0.38, 0, width * 0.28, height);
  }

  // Amano varyantında yan çizgi benekleri
  if (variant === 'amano') {
    ctx.fillStyle = 'rgba(71, 85, 105, 0.55)';
    for (let x = width * 0.30; x < width * 0.85; x += 14) {
      ctx.beginPath();
      ctx.ellipse(x, height * 0.52, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Kabuk segment çizgileri (Carapace & Abdomen eklemleri)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.lineWidth = 2;
  const segments = [0.34, 0.46, 0.58, 0.70, 0.82];
  segments.forEach((u) => {
    ctx.beginPath();
    ctx.moveTo(width * u, 0);
    ctx.quadraticCurveTo(width * (u + 0.03), height * 0.5, width * u, height);
    ctx.stroke();
  });

  // Sırt yarış çizgisi (Racing stripe)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fillRect(width * 0.15, height * 0.45, width * 0.75, height * 0.10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildShrimpBodyGeometry(): THREE.BufferGeometry {
  // Karidesin karakteristik kambur/kavisli gövde kesitleri (+Z baş/rostrum, -Z telson kuyruk)
  const sections = [
    { z: 0.24, rx: 0.002, ry: 0.003, y: 0.025 }, // Rostrum sivri uç
    { z: 0.19, rx: 0.018, ry: 0.020, y: 0.022 }, // Ön kafa zırhı
    { z: 0.12, rx: 0.028, ry: 0.032, y: 0.024 }, // Carapace orta
    { z: 0.04, rx: 0.030, ry: 0.034, y: 0.028 }, // Abdomen 1 (kambur tepe)
    { z: -0.04, rx: 0.026, ry: 0.030, y: 0.024 }, // Abdomen 2
    { z: -0.11, rx: 0.020, ry: 0.023, y: 0.012 }, // Abdomen 3 (aşağı kıvrım)
    { z: -0.17, rx: 0.014, ry: 0.016, y: -0.004 }, // Abdomen 4
    { z: -0.22, rx: 0.008, ry: 0.010, y: -0.016 }, // Kuyruk sapı
  ];

  const radialSegments = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < sections.length; s++) {
    const sec = sections[s];
    const u = s / (sections.length - 1);
    for (let r = 0; r <= radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const x = Math.sin(theta) * sec.rx;
      const y = sec.y + Math.cos(theta) * sec.ry;
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

function buildShrimpAppendagesGeometry(): THREE.BufferGeometry {
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

  // 1. Uzun İki Çift Duyarga (Antennae)
  [-1, 1].forEach((side) => {
    addRibbon(
      new THREE.Vector3(side * 0.008, 0.024, 0.21),
      new THREE.Vector3(side * 0.011, 0.021, 0.21),
      new THREE.Vector3(side * 0.075, 0.095, 0.42),
      new THREE.Vector3(side * 0.078, 0.092, 0.42)
    );
    addRibbon(
      new THREE.Vector3(side * 0.006, 0.020, 0.21),
      new THREE.Vector3(side * 0.008, 0.017, 0.21),
      new THREE.Vector3(side * 0.055, 0.035, 0.36),
      new THREE.Vector3(side * 0.057, 0.032, 0.36)
    );
  });

  // 2. 5 Çift Yürüyüş Bacağı (Pereiopods)
  const legZs = [0.15, 0.11, 0.07, 0.03, -0.01];
  legZs.forEach((zPos, i) => {
    [-1, 1].forEach((side) => {
      const spread = 0.032 + (i % 2) * 0.006;
      addRibbon(
        new THREE.Vector3(side * 0.016, 0.004, zPos + 0.004),
        new THREE.Vector3(side * 0.016, 0.004, zPos - 0.004),
        new THREE.Vector3(side * spread, -0.036, zPos + 0.012),
        new THREE.Vector3(side * spread, -0.036, zPos + 0.004)
      );
    });
  });

  // 3. Yelpaze Telson ve Uropod Kuyruk
  addRibbon(
    new THREE.Vector3(-0.008, -0.015, -0.215),
    new THREE.Vector3(0.008, -0.015, -0.215),
    new THREE.Vector3(-0.036, -0.032, -0.285),
    new THREE.Vector3(0.036, -0.032, -0.285)
  );

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildShrimpEyesGeometry(): THREE.BufferGeometry {
  const left = new THREE.SphereGeometry(0.008, 10, 8);
  left.translate(0.015, 0.028, 0.195);
  const right = new THREE.SphereGeometry(0.008, 10, 8);
  right.translate(-0.015, 0.028, 0.195);

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

export function buildAnatomicalShrimpAssets(
  variant: ShrimpVariant = 'neocaridina'
): ProceduralShrimpAssets {
  const timeUniform = { value: 0 };
  const isTranslucent = variant === 'amano' || variant === 'rilli';

  const bodyGeometry = buildShrimpBodyGeometry();
  const shellTex = createShrimpShellTexture(variant);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map: shellTex,
    roughness: 0.25,
    metalness: 0.05,
    transparent: isTranslucent,
    opacity: variant === 'amano' ? 0.68 : variant === 'rilli' ? 0.85 : 0.96,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  });

  const appendageGeometry = buildShrimpAppendagesGeometry();
  const appendageMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.35,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });

  // Bacak yürüme ve duyarga titreşim shader'ı
  appendageMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      if (transformed.y < 0.0) {
        transformed.z += sin(uTime * 16.0 + transformed.z * 80.0 + transformed.x * 40.0) * 0.012;
      } else if (transformed.z > 0.22) {
        transformed.x += sin(uTime * 9.0 + transformed.z * 15.0) * 0.014;
      }
      `
    );
  };

  const eyeGeometry = buildShrimpEyesGeometry();
  const eyeMaterial = new THREE.MeshPhysicalMaterial({
    color: '#09090b',
    roughness: 0.1,
    clearcoat: 1.0,
  });

  return {
    bodyGeometry,
    bodyMaterial,
    appendageGeometry,
    appendageMaterial,
    eyeGeometry,
    eyeMaterial,
    updateShaderTime: (t: number) => {
      timeUniform.value = t;
    },
  };
}