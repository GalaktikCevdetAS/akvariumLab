import * as THREE from 'three';

export type GuppySex = 'erkek' | 'disi';
export type GuppyTailVariant = 'delta' | 'double-sword' | 'lyra' | 'round';

export interface ProceduralFishAssets {
  bodyGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  finGeometry: THREE.BufferGeometry;
  finMaterial: THREE.MeshPhysicalMaterial;
  eyeGeometry: THREE.BufferGeometry;
  eyeMaterial: THREE.MeshPhysicalMaterial;
  updateShaderTime: (time: number) => void;
}

/**
 * Nötr İridofor + Sikloid Pul + Lateral Çizgi + Kromatofor Desen Dokusu
 * (instanceColor ile çarpıldığında Golden, Moscow Blue, Blue Neon, Full Red vb. her rengi taşır)
 */
function createGuppySkinTextures(sex: GuppySex): {
  diffuseMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 256;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  // A. Açık Gümüşi-İnci Baz (instanceColor tonunu bozmadan derinlik verir)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, height);
  if (sex === 'erkek') {
    baseGrad.addColorStop(0.0, '#64748b'); // Sırt gölgesi
    baseGrad.addColorStop(0.28, '#cbd5e1'); // Üst yan
    baseGrad.addColorStop(0.55, '#ffffff'); // Parlak iridofor orta hat
    baseGrad.addColorStop(0.88, '#f8fafc'); // İnci karın
    baseGrad.addColorStop(1.0, '#e2e8f0');
  } else {
    baseGrad.addColorStop(0.0, '#78716c');
    baseGrad.addColorStop(0.32, '#d6d3d1');
    baseGrad.addColorStop(0.65, '#f5f5f4');
    baseGrad.addColorStop(1.0, '#ffffff');
  }
  dCtx.fillStyle = baseGrad;
  dCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = '#343434';
  rCtx.fillRect(0, 0, width, height);

  // B. Kiremit Dizilimli Sikloid Pullar
  const scaleStartX = Math.floor(width * 0.24);
  const scaleRadiusX = 9;
  const scaleRadiusY = 8;
  const stepX = 11;
  const stepY = 10;

  for (let row = 0; row < height / stepY + 2; row++) {
    const offsetX = (row % 2) * (stepX * 0.5);
    const cy = row * stepY;

    for (let cx = scaleStartX + offsetX; cx < width + stepX; cx += stepX) {
      const distFromMid = Math.abs(cy - height * 0.5) / (height * 0.5);
      if (distFromMid > 0.92) continue;

      const scaleGrad = dCtx.createRadialGradient(cx - 2, cy - 1, 1, cx, cy, scaleRadiusX);
      scaleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      scaleGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)');
      scaleGrad.addColorStop(1, 'rgba(15, 23, 42, 0.28)');

      dCtx.beginPath();
      dCtx.ellipse(cx, cy, scaleRadiusX, scaleRadiusY, 0, -Math.PI * 0.45, Math.PI * 0.45);
      dCtx.fillStyle = scaleGrad;
      dCtx.fill();
      dCtx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
      dCtx.lineWidth = 1;
      dCtx.stroke();

      const bumpGrad = bCtx.createRadialGradient(cx - 1, cy, 1, cx, cy, scaleRadiusX);
      bumpGrad.addColorStop(0, '#e8e8e8');
      bumpGrad.addColorStop(0.8, '#808080');
      bumpGrad.addColorStop(1, '#202020');

      bCtx.beginPath();
      bCtx.ellipse(cx, cy, scaleRadiusX, scaleRadiusY, 0, -Math.PI * 0.48, Math.PI * 0.48);
      bCtx.fillStyle = bumpGrad;
      bCtx.fill();

      rCtx.beginPath();
      rCtx.ellipse(cx, cy, scaleRadiusX * 0.8, scaleRadiusY * 0.8, 0, 0, Math.PI * 2);
      rCtx.fillStyle = 'rgba(24, 24, 24, 0.35)';
      rCtx.fill();
    }
  }

  // C. Cinsiyet Desenleri
  if (sex === 'erkek') {
    // Hafif Cobra/Snakeskin melanofor şeritleri (renk katmanının altından seçilir)
    dCtx.strokeStyle = 'rgba(15, 23, 42, 0.36)';
    dCtx.lineWidth = 2.6;
    for (let x = width * 0.32; x < width * 0.88; x += 15) {
      dCtx.beginPath();
      dCtx.moveTo(x, height * 0.24);
      dCtx.quadraticCurveTo(x + 4, height * 0.5, x - 2, height * 0.74);
      dCtx.stroke();
    }
  } else {
    // Dişi Gravid Spot (gebelik lekesi)
    const gravidGrad = dCtx.createRadialGradient(
      width * 0.56,
      height * 0.74,
      2,
      width * 0.56,
      height * 0.74,
      22
    );
    gravidGrad.addColorStop(0, 'rgba(15, 10, 10, 0.90)');
    gravidGrad.addColorStop(0.6, 'rgba(69, 26, 3, 0.48)');
    gravidGrad.addColorStop(1, 'rgba(69, 26, 3, 0)');
    dCtx.fillStyle = gravidGrad;
    dCtx.beginPath();
    dCtx.ellipse(width * 0.56, height * 0.74, 22, 14, -0.2, 0, Math.PI * 2);
    dCtx.fill();
  }

  // D. Lateral Çizgi & Operculum
  dCtx.save();
  dCtx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  dCtx.lineWidth = 1.6;
  ctxDashedLine(dCtx, width, height);
  dCtx.restore();

  bCtx.save();
  bCtx.strokeStyle = '#ffffff';
  bCtx.lineWidth = 2.4;
  ctxDashedLine(bCtx, width, height);
  bCtx.restore();

  // Solungaç kapağı
  dCtx.save();
  dCtx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
  dCtx.lineWidth = 2.4;
  dCtx.beginPath();
  dCtx.arc(width * 0.19, height * 0.50, 26, -Math.PI * 0.42, Math.PI * 0.42);
  dCtx.stroke();
  dCtx.restore();

  const diffuseMap = new THREE.CanvasTexture(diffCanvas);
  diffuseMap.colorSpace = THREE.SRGBColorSpace;
  diffuseMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.needsUpdate = true;

  return { diffuseMap, bumpMap, roughnessMap };
}

function ctxDashedLine(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.setLineDash([4, 2]);
  ctx.beginPath();
  ctx.moveTo(width * 0.24, height * 0.44);
  ctx.bezierCurveTo(
    width * 0.45,
    height * 0.40,
    width * 0.70,
    height * 0.47,
    width * 0.98,
    height * 0.49
  );
  ctx.stroke();
}

/**
 * Yüzgeç Işınları (Lepidotrichia) ve Yarı Şeffaf Zar Dokusu (Renk instanceColor'dan gelir)
 */
function createFinTextures(sex: GuppySex): {
  finDiffuse: THREE.CanvasTexture;
  finAlpha: THREE.CanvasTexture;
  finBump: THREE.CanvasTexture;
} {
  const width = 256;
  const height = 256;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d')!;

  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = width;
  alphaCanvas.height = height;
  const aCtx = alphaCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Açık beyaz-gümüş zar gradyanı (instanceColor ile çarpıldığında saf, canlı renk verir)
  const memGrad = dCtx.createLinearGradient(0, 0, width, 0);
  memGrad.addColorStop(0.0, '#cbd5e1');
  memGrad.addColorStop(0.35, '#ffffff');
  memGrad.addColorStop(0.85, '#f8fafc');
  memGrad.addColorStop(1.0, '#e2e8f0');
  dCtx.fillStyle = memGrad;
  dCtx.fillRect(0, 0, width, height);

  const alphaGrad = aCtx.createLinearGradient(0, 0, width, 0);
  if (sex === 'erkek') {
    alphaGrad.addColorStop(0.0, '#ffffff');
    alphaGrad.addColorStop(0.7, '#dadada');
    alphaGrad.addColorStop(1.0, '#9e9e9e');
  } else {
    alphaGrad.addColorStop(0.0, '#d4d4d4');
    alphaGrad.addColorStop(0.6, '#888888');
    alphaGrad.addColorStop(1.0, '#555555');
  }
  aCtx.fillStyle = alphaGrad;
  aCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#303030';
  bCtx.fillRect(0, 0, width, height);

  const rayCount = 18;
  for (let i = 0; i < rayCount; i++) {
    const vNorm = (i + 0.5) / rayCount;
    const yStart = vNorm * height;
    const yMid = yStart + (vNorm - 0.5) * 14;
    const splitX = width * 0.48;

    const rayColor = 'rgba(15, 23, 42, 0.42)';
    drawRaySeg(dCtx, 0, yStart, splitX, yMid, 2.0, rayColor);
    drawRaySeg(aCtx, 0, yStart, splitX, yMid, 2.4, '#ffffff');
    drawRaySeg(bCtx, 0, yStart, splitX, yMid, 2.6, '#ffffff');

    const branchSpread = 5.5;
    drawRaySeg(dCtx, splitX, yMid, width, yMid - branchSpread, 1.2, rayColor);
    drawRaySeg(dCtx, splitX, yMid, width, yMid + branchSpread, 1.2, rayColor);
    drawRaySeg(aCtx, splitX, yMid, width, yMid - branchSpread, 1.6, '#f5f5f5');
    drawRaySeg(aCtx, splitX, yMid, width, yMid + branchSpread, 1.6, '#f5f5f5');
    drawRaySeg(bCtx, splitX, yMid, width, yMid - branchSpread, 1.8, '#e5e5e5');
    drawRaySeg(bCtx, splitX, yMid, width, yMid + branchSpread, 1.8, '#e5e5e5');
  }

  // Erkek kuyruğunda zarif koyu leopar benekleri
  if (sex === 'erkek') {
    dCtx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    for (let i = 0; i < 32; i++) {
      const sx = width * (0.30 + ((i * 37) % 65) / 100);
      const sy = height * (((i * 53) % 88 + 6) / 100);
      const r = 2.0 + (i % 3) * 0.9;
      dCtx.beginPath();
      dCtx.arc(sx, sy, r, 0, Math.PI * 2);
      dCtx.fill();
    }
  }

  const finDiffuse = new THREE.CanvasTexture(diffCanvas);
  finDiffuse.colorSpace = THREE.SRGBColorSpace;
  finDiffuse.needsUpdate = true;

  const finAlpha = new THREE.CanvasTexture(alphaCanvas);
  finAlpha.needsUpdate = true;

  const finBump = new THREE.CanvasTexture(bumpCanvas);
  finBump.needsUpdate = true;

  return { finDiffuse, finAlpha, finBump };
}

function drawRaySeg(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lw: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function createEyeTexture(sex: GuppySex): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, size, size);

  const irisGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 56);
  irisGrad.addColorStop(0, sex === 'erkek' ? '#fef08a' : '#f1f5f9');
  irisGrad.addColorStop(0.6, sex === 'erkek' ? '#eab308' : '#94a3b8');
  irisGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(cx - 10, cy - 10, 7, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildAnatomicalBodyGeometry(sex: GuppySex): THREE.BufferGeometry {
  interface CrossSection {
    z: number;
    rx: number;
    ryTop: number;
    ryBot: number;
    yCenter: number;
  }

  const sections: CrossSection[] =
    sex === 'erkek'
      ? [
          { z: 0.230, rx: 0.008, ryTop: 0.006, ryBot: 0.010, yCenter: 0.018 },
          { z: 0.215, rx: 0.022, ryTop: 0.018, ryBot: 0.022, yCenter: 0.014 },
          { z: 0.180, rx: 0.036, ryTop: 0.032, ryBot: 0.034, yCenter: 0.008 },
          { z: 0.135, rx: 0.044, ryTop: 0.042, ryBot: 0.044, yCenter: 0.002 },
          { z: 0.080, rx: 0.042, ryTop: 0.048, ryBot: 0.048, yCenter: 0.000 },
          { z: 0.010, rx: 0.038, ryTop: 0.050, ryBot: 0.046, yCenter: 0.000 },
          { z: -0.065, rx: 0.030, ryTop: 0.042, ryBot: 0.036, yCenter: 0.002 },
          { z: -0.145, rx: 0.020, ryTop: 0.030, ryBot: 0.026, yCenter: 0.003 },
          { z: -0.220, rx: 0.012, ryTop: 0.024, ryBot: 0.022, yCenter: 0.003 },
          { z: -0.230, rx: 0.003, ryTop: 0.018, ryBot: 0.018, yCenter: 0.003 },
        ]
      : [
          { z: 0.230, rx: 0.009, ryTop: 0.007, ryBot: 0.011, yCenter: 0.020 },
          { z: 0.215, rx: 0.024, ryTop: 0.020, ryBot: 0.024, yCenter: 0.015 },
          { z: 0.175, rx: 0.040, ryTop: 0.036, ryBot: 0.040, yCenter: 0.008 },
          { z: 0.130, rx: 0.048, ryTop: 0.046, ryBot: 0.052, yCenter: 0.002 },
          { z: 0.065, rx: 0.054, ryTop: 0.054, ryBot: 0.068, yCenter: -0.004 },
          { z: -0.010, rx: 0.056, ryTop: 0.055, ryBot: 0.074, yCenter: -0.006 },
          { z: -0.075, rx: 0.042, ryTop: 0.046, ryBot: 0.056, yCenter: -0.002 },
          { z: -0.145, rx: 0.024, ryTop: 0.032, ryBot: 0.030, yCenter: 0.002 },
          { z: -0.220, rx: 0.014, ryTop: 0.026, ryBot: 0.024, yCenter: 0.002 },
          { z: -0.230, rx: 0.003, ryTop: 0.020, ryBot: 0.020, yCenter: 0.002 },
        ];

  const radialSegments = 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const zMin = -0.23;
  const zMax = 0.23;

  for (let s = 0; s < sections.length; s++) {
    const sec = sections[s];
    const u = (zMax - sec.z) / (zMax - zMin);

    for (let r = 0; r <= radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const x = sinT * sec.rx;
      const ry = cosT >= 0 ? sec.ryTop : sec.ryBot;
      const y = sec.yCenter + cosT * ry;
      const v = 0.5 - cosT * 0.5;

      positions.push(x, y, sec.z);
      uvs.push(u, v);
    }
  }

  const ringStride = radialSegments + 1;
  for (let s = 0; s < sections.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const a = s * ringStride + r;
      const b = (s + 1) * ringStride + r;
      const c = (s + 1) * ringStride + (r + 1);
      const d = s * ringStride + (r + 1);

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

/**
 * Kuyruk Varyantlarına Göre Yüzgeç Geometrisi:
 * - delta: Geniş üçgen yelpaze kuyruk
 * - double-sword: Üst ve alt kenarlarından ince kılıç uzantılı (Double Swordtail) kuyruk
 * - lyra: Üst ve alt uçları çatal gibi uzayan, ortası oyuk Lira (Lyretail) kuyruk
 * - round: Dişi yuvarlak kuyruk
 */
function buildFinsGeometry(sex: GuppySex, tailVariant: GuppyTailVariant): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const addFinRibbon = (
    rootPoints: THREE.Vector3[],
    tipPoints: THREE.Vector3[],
    uSteps = 6
  ) => {
    const vSteps = rootPoints.length;
    const baseVertexIndex = positions.length / 3;

    for (let ui = 0; ui <= uSteps; ui++) {
      const u = ui / uSteps;
      for (let vi = 0; vi < vSteps; vi++) {
        const v = vi / Math.max(1, vSteps - 1);
        const p = new THREE.Vector3().lerpVectors(rootPoints[vi], tipPoints[vi], u);
        positions.push(p.x, p.y, p.z);
        uvs.push(u, v);
      }
    }

    for (let ui = 0; ui < uSteps; ui++) {
      for (let vi = 0; vi < vSteps - 1; vi++) {
        const a = baseVertexIndex + ui * vSteps + vi;
        const b = baseVertexIndex + (ui + 1) * vSteps + vi;
        const c = baseVertexIndex + (ui + 1) * vSteps + (vi + 1);
        const d = baseVertexIndex + ui * vSteps + (vi + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
  };

  // A. Kuyruk Yüzgeci (Caudal Fin)
  if (sex === 'disi' || tailVariant === 'round') {
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.024, -0.22),
        new THREE.Vector3(0, 0.008, -0.225),
        new THREE.Vector3(0, -0.008, -0.225),
        new THREE.Vector3(0, -0.024, -0.22),
      ],
      [
        new THREE.Vector3(0, 0.068, -0.34),
        new THREE.Vector3(0, 0.026, -0.365),
        new THREE.Vector3(0, -0.026, -0.365),
        new THREE.Vector3(0, -0.068, -0.34),
      ],
      6
    );
  } else if (tailVariant === 'double-sword') {
    // Çift Kılıç (Double Swordtail): Üst ve alt kılıç uzantıları + ortada yuvarlak zar
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.024, -0.22),
        new THREE.Vector3(0, 0.016, -0.222),
        new THREE.Vector3(0, 0.000, -0.225),
        new THREE.Vector3(0, -0.016, -0.222),
        new THREE.Vector3(0, -0.024, -0.22),
      ],
      [
        new THREE.Vector3(0, 0.115, -0.52), // Üst kılıç ucu
        new THREE.Vector3(0, 0.048, -0.37),
        new THREE.Vector3(0, 0.000, -0.38),
        new THREE.Vector3(0, -0.048, -0.37),
        new THREE.Vector3(0, -0.115, -0.52), // Alt kılıç ucu
      ],
      9
    );
  } else if (tailVariant === 'lyra') {
    // Lira Kuyruk (Lyretail): Üst ve alt uçlar dışa kavisli uzar, orta içbükey oyuk kalır
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.024, -0.22),
        new THREE.Vector3(0, 0.012, -0.223),
        new THREE.Vector3(0, 0.000, -0.225),
        new THREE.Vector3(0, -0.012, -0.223),
        new THREE.Vector3(0, -0.024, -0.22),
      ],
      [
        new THREE.Vector3(0, 0.155, -0.49),
        new THREE.Vector3(0, 0.065, -0.37),
        new THREE.Vector3(0, 0.000, -0.34), // Orta içbükey oyuk
        new THREE.Vector3(0, -0.065, -0.37),
        new THREE.Vector3(0, -0.155, -0.49),
      ],
      9
    );
  } else {
    // Delta / Triangle Yelpaze Kuyruk
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.022, -0.22),
        new THREE.Vector3(0, 0.008, -0.225),
        new THREE.Vector3(0, -0.008, -0.225),
        new THREE.Vector3(0, -0.022, -0.22),
      ],
      [
        new THREE.Vector3(0, 0.135, -0.43),
        new THREE.Vector3(0, 0.050, -0.46),
        new THREE.Vector3(0, -0.045, -0.46),
        new THREE.Vector3(0, -0.130, -0.43),
      ],
      8
    );
  }

  // B. Sırt Yüzgeci (Dorsal Fin)
  if (sex === 'erkek') {
    const dorsalHeight = tailVariant === 'lyra' || tailVariant === 'double-sword' ? 0.135 : 0.118;
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.048, 0.02),
        new THREE.Vector3(0, 0.045, -0.025),
        new THREE.Vector3(0, 0.038, -0.07),
      ],
      [
        new THREE.Vector3(0, dorsalHeight, -0.05),
        new THREE.Vector3(0, dorsalHeight + 0.012, -0.12),
        new THREE.Vector3(0, dorsalHeight - 0.02, -0.19),
      ],
      5
    );
  } else {
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.054, 0.00),
        new THREE.Vector3(0, 0.050, -0.035),
        new THREE.Vector3(0, 0.044, -0.07),
      ],
      [
        new THREE.Vector3(0, 0.092, -0.03),
        new THREE.Vector3(0, 0.095, -0.07),
        new THREE.Vector3(0, 0.076, -0.105),
      ],
      4
    );
  }

  // C. Göğüs Yüzgeçleri (Pectoral Fins)
  const pecY = sex === 'erkek' ? -0.015 : -0.022;
  const pecX = sex === 'erkek' ? 0.040 : 0.046;
  const pecSpan = sex === 'erkek' ? 0.088 : 0.076;

  addFinRibbon(
    [
      new THREE.Vector3(pecX, pecY + 0.012, 0.12),
      new THREE.Vector3(pecX, pecY - 0.012, 0.11),
    ],
    [
      new THREE.Vector3(pecX + pecSpan, pecY + 0.005, 0.04),
      new THREE.Vector3(pecX + pecSpan * 0.9, pecY - 0.035, 0.03),
    ],
    4
  );
  addFinRibbon(
    [
      new THREE.Vector3(-pecX, pecY + 0.012, 0.12),
      new THREE.Vector3(-pecX, pecY - 0.012, 0.11),
    ],
    [
      new THREE.Vector3(-pecX - pecSpan, pecY + 0.005, 0.04),
      new THREE.Vector3(-pecX - pecSpan * 0.9, pecY - 0.035, 0.03),
    ],
    4
  );

  // D. Karın Yüzgeçleri (Pelvic Fins)
  const pelvY = sex === 'erkek' ? -0.045 : -0.068;
  addFinRibbon(
    [
      new THREE.Vector3(0.016, pelvY, 0.04),
      new THREE.Vector3(0.014, pelvY, 0.015),
    ],
    [
      new THREE.Vector3(0.034, pelvY - 0.038, -0.01),
      new THREE.Vector3(0.030, pelvY - 0.042, -0.035),
    ],
    3
  );
  addFinRibbon(
    [
      new THREE.Vector3(-0.016, pelvY, 0.04),
      new THREE.Vector3(-0.014, pelvY, 0.015),
    ],
    [
      new THREE.Vector3(-0.034, pelvY - 0.038, -0.01),
      new THREE.Vector3(-0.030, pelvY - 0.042, -0.035),
    ],
    3
  );

  // E. Erkek Gonopodium / Dişi Anal Yüzgeç
  if (sex === 'erkek') {
    addFinRibbon(
      [
        new THREE.Vector3(0, -0.042, -0.025),
        new THREE.Vector3(0, -0.040, -0.038),
      ],
      [
        new THREE.Vector3(0, -0.088, -0.125),
        new THREE.Vector3(0, -0.084, -0.132),
      ],
      4
    );
  } else {
    addFinRibbon(
      [
        new THREE.Vector3(0, -0.062, -0.055),
        new THREE.Vector3(0, -0.052, -0.095),
      ],
      [
        new THREE.Vector3(0, -0.105, -0.085),
        new THREE.Vector3(0, -0.092, -0.125),
      ],
      4
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildEyesGeometry(sex: GuppySex): THREE.BufferGeometry {
  const eyeRadius = sex === 'erkek' ? 0.016 : 0.018;
  const eyeX = sex === 'erkek' ? 0.028 : 0.031;
  const eyeY = 0.014;
  const eyeZ = 0.172;

  const leftEye = new THREE.SphereGeometry(eyeRadius, 14, 12);
  leftEye.rotateY(Math.PI / 2);
  leftEye.translate(eyeX, eyeY, eyeZ);

  const rightEye = new THREE.SphereGeometry(eyeRadius, 14, 12);
  rightEye.rotateY(-Math.PI / 2);
  rightEye.translate(-eyeX, eyeY, eyeZ);

  const nonIdxLeft = leftEye.toNonIndexed();
  const nonIdxRight = rightEye.toNonIndexed();

  const totalVerts = nonIdxLeft.attributes.position.count + nonIdxRight.attributes.position.count;
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);

  positions.set(nonIdxLeft.attributes.position.array as Float32Array, 0);
  positions.set(nonIdxRight.attributes.position.array as Float32Array, nonIdxLeft.attributes.position.count * 3);

  normals.set(nonIdxLeft.attributes.normal.array as Float32Array, 0);
  normals.set(nonIdxRight.attributes.normal.array as Float32Array, nonIdxLeft.attributes.normal.count * 3);

  uvs.set(nonIdxLeft.attributes.uv.array as Float32Array, 0);
  uvs.set(nonIdxRight.attributes.uv.array as Float32Array, nonIdxLeft.attributes.uv.count * 2);

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return merged;
}

function applySwimVertexShader(
  material: THREE.MeshPhysicalMaterial,
  timeUniform: { value: number },
  finMultiplier: number
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform;
    shader.uniforms.uFinAmp = { value: finMultiplier };

    shader.vertexShader =
      `
      uniform float uTime;
      uniform float uFinAmp;
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float normalizedBack = clamp((0.20 - transformed.z) / 0.65, 0.0, 1.4);
      float spineWave = sin(uTime * 8.5 + transformed.z * 14.0) * pow(normalizedBack, 1.7) * 0.042 * uFinAmp;
      transformed.x += spineWave;

      float pectoralMask = smoothstep(0.042, 0.11, abs(transformed.x));
      transformed.y += sin(uTime * 11.0 + transformed.x * 20.0) * pectoralMask * 0.018;
      `
    );
  };
}

export function buildAnatomicalGuppyAssets(
  sex: GuppySex,
  tailVariant: GuppyTailVariant = sex === 'erkek' ? 'delta' : 'round'
): ProceduralFishAssets {
  const timeUniform = { value: 0 };

  const bodyGeometry = buildAnatomicalBodyGeometry(sex);
  const { diffuseMap, bumpMap, roughnessMap } = createGuppySkinTextures(sex);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', // instanceColor ile tam uyumlu beyaz taban
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.018,
    roughnessMap: roughnessMap,
    roughness: 0.35,
    metalness: 0.14,
    iridescence: sex === 'erkek' ? 0.85 : 0.45,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [180, 480],
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
  });
  applySwimVertexShader(bodyMaterial, timeUniform, 1.0);

  const finGeometry = buildFinsGeometry(sex, tailVariant);
  const { finDiffuse, finAlpha, finBump } = createFinTextures(sex);

  const finMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', // instanceColor ile tam uyumlu beyaz taban
    map: finDiffuse,
    alphaMap: finAlpha,
    bumpMap: finBump,
    bumpScale: 0.012,
    transparent: true,
    opacity: sex === 'erkek' ? 0.92 : 0.78,
    alphaTest: 0.08,
    side: THREE.DoubleSide,
    roughness: 0.28,
    metalness: 0.08,
    iridescence: sex === 'erkek' ? 0.65 : 0.25,
    depthWrite: false,
  });
  applySwimVertexShader(finMaterial, timeUniform, 1.45);

  const eyeGeometry = buildEyesGeometry(sex);
  const eyeTexture = createEyeTexture(sex);

  const eyeMaterial = new THREE.MeshPhysicalMaterial({
    map: eyeTexture,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  applySwimVertexShader(eyeMaterial, timeUniform, 0.2);

  return {
    bodyGeometry,
    bodyMaterial,
    finGeometry,
    finMaterial,
    eyeGeometry,
    eyeMaterial,
    updateShaderTime: (time: number) => {
      timeUniform.value = time;
    },
  };
}