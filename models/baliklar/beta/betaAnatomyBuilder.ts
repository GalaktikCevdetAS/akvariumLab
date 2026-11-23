import * as THREE from 'three';

export type BettaSex = 'erkek' | 'disi';
export type BettaFinVariant = 'halfmoon' | 'crowntail' | 'plakat' | 'dumbo' | 'round';

export interface ProceduralBettaAssets {
  bodyGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  finGeometry: THREE.BufferGeometry;
  finMaterial: THREE.MeshPhysicalMaterial;
  eyeGeometry: THREE.BufferGeometry;
  eyeMaterial: THREE.MeshPhysicalMaterial;
  updateShaderTime: (time: number) => void;
}

function createBettaSkinTextures(sex: BettaSex): {
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

  // A. Açık Gümüş-İridofor Taban (instanceColor ile her rengi net verir)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, height);
  if (sex === 'erkek') {
    baseGrad.addColorStop(0.0, '#475569');
    baseGrad.addColorStop(0.30, '#cbd5e1');
    baseGrad.addColorStop(0.60, '#ffffff');
    baseGrad.addColorStop(0.88, '#f1f5f9');
    baseGrad.addColorStop(1.0, '#cbd5e1');
  } else {
    baseGrad.addColorStop(0.0, '#64748b');
    baseGrad.addColorStop(0.35, '#e2e8f0');
    baseGrad.addColorStop(0.75, '#f8fafc');
    baseGrad.addColorStop(1.0, '#ffffff');
  }
  dCtx.fillStyle = baseGrad;
  dCtx.fillRect(0, 0, width, height);

  // Kafa maskesi (pulsuz koyu kadife doku)
  const headGrad = dCtx.createLinearGradient(0, 0, width * 0.25, 0);
  headGrad.addColorStop(0.0, 'rgba(15, 23, 42, 0.72)');
  headGrad.addColorStop(0.75, 'rgba(30, 41, 59, 0.45)');
  headGrad.addColorStop(1.0, 'rgba(30, 41, 59, 0)');
  dCtx.fillStyle = headGrad;
  dCtx.fillRect(0, 0, width * 0.25, height);

  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = '#343434';
  rCtx.fillRect(0, 0, width, height);

  // B. Kiremit Dizilimli Sikloid Pullar
  const scaleStartX = Math.floor(width * 0.23);
  const scaleRadiusX = 9.5;
  const scaleRadiusY = 8.5;
  const stepX = 11.5;
  const stepY = 10.5;

  for (let row = 0; row < height / stepY + 2; row++) {
    const offsetX = (row % 2) * (stepX * 0.5);
    const cy = row * stepY;

    for (let cx = scaleStartX + offsetX; cx < width + stepX; cx += stepX) {
      const distFromMid = Math.abs(cy - height * 0.5) / (height * 0.5);
      if (distFromMid > 0.93) continue;

      const scaleGrad = dCtx.createRadialGradient(cx - 2, cy - 1, 1, cx, cy, scaleRadiusX);
      scaleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.52)');
      scaleGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.14)');
      scaleGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.34)');

      dCtx.beginPath();
      dCtx.ellipse(cx, cy, scaleRadiusX, scaleRadiusY, 0, -Math.PI * 0.46, Math.PI * 0.46);
      dCtx.fillStyle = scaleGrad;
      dCtx.fill();
      dCtx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
      dCtx.lineWidth = 1.1;
      dCtx.stroke();

      const bumpGrad = bCtx.createRadialGradient(cx - 1.5, cy, 1, cx, cy, scaleRadiusX);
      bumpGrad.addColorStop(0.0, '#ededed');
      bumpGrad.addColorStop(0.78, '#858585');
      bumpGrad.addColorStop(1.0, '#1c1c1c');

      bCtx.beginPath();
      bCtx.ellipse(cx, cy, scaleRadiusX, scaleRadiusY, 0, -Math.PI * 0.48, Math.PI * 0.48);
      bCtx.fillStyle = bumpGrad;
      bCtx.fill();

      rCtx.beginPath();
      rCtx.ellipse(cx, cy, scaleRadiusX * 0.78, scaleRadiusY * 0.78, 0, 0, Math.PI * 2);
      rCtx.fillStyle = 'rgba(22, 22, 22, 0.40)';
      rCtx.fill();
    }
  }

  // C. Dişi Ovipositor (Beyaz Üreme Papillası) & Dikey Üreme Bantları
  if (sex === 'disi') {
    dCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let x = width * 0.30; x < width * 0.72; x += 26) {
      dCtx.fillRect(x, height * 0.22, 9, height * 0.54);
    }

    const oviX = width * 0.52;
    const oviY = height * 0.93;
    const oviGrad = dCtx.createRadialGradient(oviX, oviY, 1, oviX, oviY, 11);
    oviGrad.addColorStop(0.0, '#ffffff');
    oviGrad.addColorStop(0.55, '#fef3c7');
    oviGrad.addColorStop(1.0, 'rgba(254, 243, 199, 0)');
    dCtx.fillStyle = oviGrad;
    dCtx.beginPath();
    dCtx.arc(oviX, oviY, 11, 0, Math.PI * 2);
    dCtx.fill();
  }

  // D. Kesikli Yan Çizgi (Lateral Line)
  const drawBettaLateralLine = (
    ctx: CanvasRenderingContext2D,
    color: string,
    dotRadius: number
  ) => {
    ctx.save();
    ctx.fillStyle = color;
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = width * (0.24 + t * 0.73);
      const y = height * (0.43 - Math.sin(t * Math.PI) * 0.045 + t * 0.05);
      ctx.beginPath();
      ctx.ellipse(x, y, dotRadius * 1.6, dotRadius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  drawBettaLateralLine(dCtx, 'rgba(255, 255, 255, 0.72)', 1.5);
  drawBettaLateralLine(bCtx, '#f5f5f5', 1.8);

  // E. Solungaç Kapağı + Koyu Branchiostegal Sakal
  dCtx.save();
  dCtx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  dCtx.lineWidth = 2.4;
  dCtx.beginPath();
  dCtx.arc(width * 0.175, height * 0.50, 26, -Math.PI * 0.34, Math.PI * 0.34);
  dCtx.stroke();

  dCtx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
  dCtx.lineWidth = 3.0;
  dCtx.beginPath();
  dCtx.arc(width * 0.195, height * 0.50, 28, -Math.PI * 0.42, Math.PI * 0.42);
  dCtx.stroke();

  dCtx.fillStyle = sex === 'erkek' ? 'rgba(5, 5, 10, 0.90)' : 'rgba(30, 12, 20, 0.65)';
  dCtx.beginPath();
  dCtx.ellipse(width * 0.16, height * 0.84, 24, 12, 0.15, 0, Math.PI * 2);
  dCtx.fill();
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

/**
 * Yüzgeç Işınları ve Zar Dokusu (Crowntail için zar gerilemesi alpha maskesi destekli)
 */
function createBettaFinTextures(
  sex: BettaSex,
  finVariant: BettaFinVariant
): {
  finDiffuse: THREE.CanvasTexture;
  finAlpha: THREE.CanvasTexture;
  finBump: THREE.CanvasTexture;
} {
  const width = 512;
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

  // Açık beyaz-gümüş butterfly gradyanı (instanceColor ile boyanır)
  const memGrad = dCtx.createLinearGradient(0, 0, width, 0);
  memGrad.addColorStop(0.0, '#cbd5e1');
  memGrad.addColorStop(0.35, '#ffffff');
  memGrad.addColorStop(0.85, '#f8fafc');
  memGrad.addColorStop(1.0, '#e2e8f0');
  dCtx.fillStyle = memGrad;
  dCtx.fillRect(0, 0, width, height);

  const alphaGrad = aCtx.createLinearGradient(0, 0, width, 0);
  if (finVariant === 'crowntail') {
    // Crowntail: %65'ten sonra zar içbükey çekilir, sadece kemik ışınları uzar
    alphaGrad.addColorStop(0.0, '#ffffff');
    alphaGrad.addColorStop(0.58, '#dcdcdc');
    alphaGrad.addColorStop(0.68, '#000000');
    alphaGrad.addColorStop(1.0, '#000000');
  } else if (sex === 'erkek') {
    alphaGrad.addColorStop(0.0, '#ffffff');
    alphaGrad.addColorStop(0.65, '#dcdcdc');
    alphaGrad.addColorStop(0.92, '#a8a8a8');
    alphaGrad.addColorStop(1.0, '#787878');
  } else {
    alphaGrad.addColorStop(0.0, '#e5e5e5');
    alphaGrad.addColorStop(0.7, '#9e9e9e');
    alphaGrad.addColorStop(1.0, '#666666');
  }
  aCtx.fillStyle = alphaGrad;
  aCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#2b2b2b';
  bCtx.fillRect(0, 0, width, height);

  const rayCount = sex === 'erkek' ? 24 : 16;
  for (let i = 0; i < rayCount; i++) {
    const vNorm = (i + 0.5) / rayCount;
    const yStart = vNorm * height;
    const fanAngle = (vNorm - 0.5) * 18;
    const split1X = width * 0.42;
    const split2X = width * 0.72;
    const y1 = yStart + fanAngle * 0.5;

    const primaryColor = 'rgba(15, 23, 42, 0.48)';
    const secondaryColor = 'rgba(15, 23, 42, 0.40)';

    drawBettaRay(dCtx, 0, yStart, split1X, y1, 2.6, primaryColor);
    drawBettaRay(aCtx, 0, yStart, split1X, y1, 3.2, '#ffffff');
    drawBettaRay(bCtx, 0, yStart, split1X, y1, 3.2, '#ffffff');

    const spread1 = 4.2;
    const y2Top = y1 - spread1 + fanAngle * 0.3;
    const y2Bot = y1 + spread1 + fanAngle * 0.3;

    drawBettaRay(dCtx, split1X, y1, split2X, y2Top, 1.8, secondaryColor);
    drawBettaRay(dCtx, split1X, y1, split2X, y2Bot, 1.8, secondaryColor);
    drawBettaRay(aCtx, split1X, y1, split2X, y2Top, 2.5, '#ffffff');
    drawBettaRay(aCtx, split1X, y1, split2X, y2Bot, 2.5, '#ffffff');
    drawBettaRay(bCtx, split1X, y1, split2X, y2Top, 2.2, '#e5e5e5');
    drawBettaRay(bCtx, split1X, y1, split2X, y2Bot, 2.2, '#e5e5e5');

    // Crowntail varyantında uçlara uzanan dikenli taç ışınları tam opak (#ffffff) çizilir
    const tipAlpha = finVariant === 'crowntail' ? '#ffffff' : '#e5e5e5';
    const tipWidth = finVariant === 'crowntail' ? 2.4 : 1.4;
    const spread2 = 2.4;
    [
      [y2Top, y2Top - spread2],
      [y2Top, y2Top + spread2 * 0.6],
      [y2Bot, y2Bot - spread2 * 0.6],
      [y2Bot, y2Bot + spread2],
    ].forEach(([ya, yb]) => {
      drawBettaRay(dCtx, split2X, ya, width, yb, 1.4, secondaryColor);
      drawBettaRay(aCtx, split2X, ya, width, yb, tipWidth, tipAlpha);
      drawBettaRay(bCtx, split2X, ya, width, yb, 1.6, '#cccccc');
    });
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

function drawBettaRay(
  ctx: CanvasRenderingContext2D,
  x1: number,
  yA: number,
  x2: number,
  yB: number,
  lw: number,
  style: string
) {
  ctx.strokeStyle = style;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, yA);
  ctx.lineTo(x2, yB);
  ctx.stroke();
}

function createBettaEyeTexture(sex: BettaSex): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  const irisGrad = ctx.createRadialGradient(cx, cy, 14, cx, cy, 56);
  if (sex === 'erkek') {
    irisGrad.addColorStop(0.0, '#38bdf8');
    irisGrad.addColorStop(0.55, '#1d4ed8');
    irisGrad.addColorStop(1.0, '#020617');
  } else {
    irisGrad.addColorStop(0.0, '#f472b6');
    irisGrad.addColorStop(0.55, '#9d174d');
    irisGrad.addColorStop(1.0, '#1f0913');
  }
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#030305';
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.arc(cx - 11, cy - 11, 7.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildBettaBodyGeometry(sex: BettaSex, finVariant: BettaFinVariant): THREE.BufferGeometry {
  interface CrossSection {
    z: number;
    rx: number;
    ryTop: number;
    ryBot: number;
    yCenter: number;
  }

  // Plakat varyantında daha kaslı/kalın peduncle ve gövde oranı
  const muscleBoost = finVariant === 'plakat' ? 1.12 : 1.0;

  const sections: CrossSection[] =
    sex === 'erkek'
      ? [
          { z: 0.230, rx: 0.010, ryTop: 0.008, ryBot: 0.012, yCenter: 0.022 },
          { z: 0.212, rx: 0.025, ryTop: 0.020, ryBot: 0.026, yCenter: 0.016 },
          { z: 0.175, rx: 0.038, ryTop: 0.035, ryBot: 0.040, yCenter: 0.008 },
          { z: 0.130, rx: 0.048 * muscleBoost, ryTop: 0.046 * muscleBoost, ryBot: 0.056, yCenter: 0.000 },
          { z: 0.075, rx: 0.046 * muscleBoost, ryTop: 0.054 * muscleBoost, ryBot: 0.054 * muscleBoost, yCenter: 0.000 },
          { z: 0.005, rx: 0.042 * muscleBoost, ryTop: 0.056 * muscleBoost, ryBot: 0.052 * muscleBoost, yCenter: 0.000 },
          { z: -0.070, rx: 0.034 * muscleBoost, ryTop: 0.048 * muscleBoost, ryBot: 0.044 * muscleBoost, yCenter: 0.001 },
          { z: -0.145, rx: 0.024 * muscleBoost, ryTop: 0.036 * muscleBoost, ryBot: 0.034 * muscleBoost, yCenter: 0.002 },
          { z: -0.218, rx: 0.015 * muscleBoost, ryTop: 0.030 * muscleBoost, ryBot: 0.028 * muscleBoost, yCenter: 0.002 },
          { z: -0.230, rx: 0.004, ryTop: 0.022, ryBot: 0.022, yCenter: 0.002 },
        ]
      : [
          { z: 0.215, rx: 0.010, ryTop: 0.008, ryBot: 0.012, yCenter: 0.020 },
          { z: 0.198, rx: 0.026, ryTop: 0.022, ryBot: 0.026, yCenter: 0.014 },
          { z: 0.162, rx: 0.040, ryTop: 0.036, ryBot: 0.042, yCenter: 0.007 },
          { z: 0.118, rx: 0.050, ryTop: 0.048, ryBot: 0.056, yCenter: 0.000 },
          { z: 0.055, rx: 0.056, ryTop: 0.056, ryBot: 0.074, yCenter: -0.005 },
          { z: -0.015, rx: 0.054, ryTop: 0.054, ryBot: 0.076, yCenter: -0.006 },
          { z: -0.080, rx: 0.038, ryTop: 0.044, ryBot: 0.052, yCenter: -0.001 },
          { z: -0.148, rx: 0.024, ryTop: 0.034, ryBot: 0.032, yCenter: 0.002 },
          { z: -0.215, rx: 0.014, ryTop: 0.028, ryBot: 0.026, yCenter: 0.002 },
          { z: -0.228, rx: 0.004, ryTop: 0.020, ryBot: 0.020, yCenter: 0.002 },
        ];

  const radialSegments = 26;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const zMin = sections[sections.length - 1].z;
  const zMax = sections[0].z;

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
 * Beta Varyant Yüzgeçleri:
 * - halfmoon: 180° geniş yarım daire yelpaze
 * - crowntail: Dikenli taç uzantılı 180° kuyruk
 * - plakat: Kısa ve kompakt kürek/yarım-delta yüzgeçler
 * - dumbo: Fil kulağı gibi aşırı genişlemiş yelpaze göğüs yüzgeçleri + Halfmoon/Delta kuyruk
 * - round: Dişi yuvarlak kompakt yüzgeçler
 */
function buildBettaFinsGeometry(sex: BettaSex, finVariant: BettaFinVariant): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const addFinRibbon = (
    rootPoints: THREE.Vector3[],
    tipPoints: THREE.Vector3[],
    uSteps = 8
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

  if (sex === 'erkek' && finVariant === 'plakat') {
    // Plakat (Kısa Yüzgeçli Geleneksel): Kompakt kürek/yarım-delta kuyruk + kısa dorsal ve anal
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.028, -0.215),
        new THREE.Vector3(0, 0.010, -0.222),
        new THREE.Vector3(0, -0.010, -0.222),
        new THREE.Vector3(0, -0.028, -0.215),
      ],
      [
        new THREE.Vector3(0, 0.115, -0.340),
        new THREE.Vector3(0, 0.048, -0.375),
        new THREE.Vector3(0, -0.048, -0.375),
        new THREE.Vector3(0, -0.115, -0.340),
      ],
      7
    );

    addFinRibbon(
      [
        new THREE.Vector3(0, 0.056, -0.015),
        new THREE.Vector3(0, 0.048, -0.075),
        new THREE.Vector3(0, 0.038, -0.135),
      ],
      [
        new THREE.Vector3(0, 0.125, -0.045),
        new THREE.Vector3(0, 0.135, -0.115),
        new THREE.Vector3(0, 0.105, -0.175),
      ],
      6
    );

    addFinRibbon(
      [
        new THREE.Vector3(0, -0.052, -0.030),
        new THREE.Vector3(0, -0.042, -0.100),
        new THREE.Vector3(0, -0.032, -0.170),
      ],
      [
        new THREE.Vector3(0, -0.128, -0.055),
        new THREE.Vector3(0, -0.135, -0.130),
        new THREE.Vector3(0, -0.102, -0.195),
      ],
      6
    );

    // Pelvik yüzgeçler
    addFinRibbon(
      [
        new THREE.Vector3(0.016, -0.052, 0.085),
        new THREE.Vector3(0.014, -0.052, 0.058),
      ],
      [
        new THREE.Vector3(0.028, -0.175, 0.030),
        new THREE.Vector3(0.022, -0.185, 0.005),
      ],
      5
    );
    addFinRibbon(
      [
        new THREE.Vector3(-0.016, -0.052, 0.085),
        new THREE.Vector3(-0.014, -0.052, 0.058),
      ],
      [
        new THREE.Vector3(-0.028, -0.175, 0.030),
        new THREE.Vector3(-0.022, -0.185, 0.005),
      ],
      5
    );
  } else if (sex === 'erkek') {
    // Halfmoon / Crowntail / Dumbo (Uzun gösterişli yüzgeç seti)
    const rayReach = finVariant === 'crowntail' ? 1.08 : 1.0;

    addFinRibbon(
      [
        new THREE.Vector3(0, 0.028, -0.215),
        new THREE.Vector3(0, 0.014, -0.222),
        new THREE.Vector3(0, 0.000, -0.225),
        new THREE.Vector3(0, -0.014, -0.222),
        new THREE.Vector3(0, -0.028, -0.215),
      ],
      [
        new THREE.Vector3(0, 0.245 * rayReach, -0.255),
        new THREE.Vector3(0, 0.175 * rayReach, -0.425 * rayReach),
        new THREE.Vector3(0, 0.000, -0.485 * rayReach),
        new THREE.Vector3(0, -0.175 * rayReach, -0.425 * rayReach),
        new THREE.Vector3(0, -0.245 * rayReach, -0.255),
      ],
      10
    );

    addFinRibbon(
      [
        new THREE.Vector3(0, 0.054, 0.015),
        new THREE.Vector3(0, 0.050, -0.050),
        new THREE.Vector3(0, 0.042, -0.115),
        new THREE.Vector3(0, 0.034, -0.175),
      ],
      [
        new THREE.Vector3(0, 0.185 * rayReach, -0.010),
        new THREE.Vector3(0, 0.225 * rayReach, -0.110),
        new THREE.Vector3(0, 0.220 * rayReach, -0.215),
        new THREE.Vector3(0, 0.175 * rayReach, -0.295),
      ],
      8
    );

    addFinRibbon(
      [
        new THREE.Vector3(0, -0.050, -0.020),
        new THREE.Vector3(0, -0.045, -0.080),
        new THREE.Vector3(0, -0.038, -0.145),
        new THREE.Vector3(0, -0.030, -0.200),
      ],
      [
        new THREE.Vector3(0, -0.195 * rayReach, -0.045),
        new THREE.Vector3(0, -0.235 * rayReach, -0.135),
        new THREE.Vector3(0, -0.240 * rayReach, -0.230),
        new THREE.Vector3(0, -0.205 * rayReach, -0.310),
      ],
      8
    );

    addFinRibbon(
      [
        new THREE.Vector3(0.016, -0.052, 0.085),
        new THREE.Vector3(0.014, -0.052, 0.058),
      ],
      [
        new THREE.Vector3(0.032, -0.220, 0.015),
        new THREE.Vector3(0.026, -0.235, -0.015),
      ],
      6
    );
    addFinRibbon(
      [
        new THREE.Vector3(-0.016, -0.052, 0.085),
        new THREE.Vector3(-0.014, -0.052, 0.058),
      ],
      [
        new THREE.Vector3(-0.032, -0.220, 0.015),
        new THREE.Vector3(-0.026, -0.235, -0.015),
      ],
      6
    );
  } else {
    // Dişi Roundtail
    addFinRibbon(
      [
        new THREE.Vector3(0, 0.026, -0.212),
        new THREE.Vector3(0, 0.008, -0.220),
        new THREE.Vector3(0, -0.008, -0.220),
        new THREE.Vector3(0, -0.026, -0.212),
      ],
      [
        new THREE.Vector3(0, 0.085, -0.315),
        new THREE.Vector3(0, 0.035, -0.350),
        new THREE.Vector3(0, -0.035, -0.350),
        new THREE.Vector3(0, -0.085, -0.315),
      ],
      6
    );

    addFinRibbon(
      [
        new THREE.Vector3(0, 0.052, -0.025),
        new THREE.Vector3(0, 0.046, -0.075),
        new THREE.Vector3(0, 0.038, -0.125),
      ],
      [
        new THREE.Vector3(0, 0.105, -0.055),
        new THREE.Vector3(0, 0.112, -0.115),
        new THREE.Vector3(0, 0.088, -0.165),
      ],
      5
    );

    addFinRibbon(
      [
        new THREE.Vector3(0, -0.056, -0.045),
        new THREE.Vector3(0, -0.044, -0.105),
        new THREE.Vector3(0, -0.032, -0.165),
      ],
      [
        new THREE.Vector3(0, -0.118, -0.065),
        new THREE.Vector3(0, -0.115, -0.130),
        new THREE.Vector3(0, -0.088, -0.185),
      ],
      5
    );

    addFinRibbon(
      [
        new THREE.Vector3(0.018, -0.065, 0.075),
        new THREE.Vector3(0.016, -0.068, 0.050),
      ],
      [
        new THREE.Vector3(0.030, -0.145, 0.030),
        new THREE.Vector3(0.025, -0.152, 0.010),
      ],
      4
    );
    addFinRibbon(
      [
        new THREE.Vector3(-0.018, -0.065, 0.075),
        new THREE.Vector3(-0.016, -0.068, 0.050),
      ],
      [
        new THREE.Vector3(-0.030, -0.145, 0.030),
        new THREE.Vector3(-0.025, -0.152, 0.010),
      ],
      4
    );
  }

  // E. Göğüs Yüzgeçleri (Dumbo varyantında "Fil Kulağı" gibi 2.1 kat büyük yelpaze!)
  const isDumbo = finVariant === 'dumbo';
  const pecY = sex === 'erkek' ? -0.014 : -0.020;
  const pecX = sex === 'erkek' ? 0.044 : 0.048;
  const pecSpan = isDumbo ? 0.235 : sex === 'erkek' ? 0.115 : 0.095;
  const pecZ = sex === 'erkek' ? 0.115 : 0.105;

  if (isDumbo) {
    // Dumbo: Geniş 4 noktalı yelpaze fil kulağı pektoral yüzgeç
    addFinRibbon(
      [
        new THREE.Vector3(pecX, pecY + 0.020, pecZ + 0.005),
        new THREE.Vector3(pecX, pecY + 0.000, pecZ - 0.005),
        new THREE.Vector3(pecX, pecY - 0.020, pecZ - 0.015),
      ],
      [
        new THREE.Vector3(pecX + pecSpan, pecY + 0.075, pecZ - 0.065),
        new THREE.Vector3(pecX + pecSpan * 1.05, pecY - 0.010, pecZ - 0.095),
        new THREE.Vector3(pecX + pecSpan * 0.90, pecY - 0.085, pecZ - 0.085),
      ],
      7
    );
    addFinRibbon(
      [
        new THREE.Vector3(-pecX, pecY + 0.020, pecZ + 0.005),
        new THREE.Vector3(-pecX, pecY + 0.000, pecZ - 0.005),
        new THREE.Vector3(-pecX, pecY - 0.020, pecZ - 0.015),
      ],
      [
        new THREE.Vector3(-pecX - pecSpan, pecY + 0.075, pecZ - 0.065),
        new THREE.Vector3(-pecX - pecSpan * 1.05, pecY - 0.010, pecZ - 0.095),
        new THREE.Vector3(-pecX - pecSpan * 0.90, pecY - 0.085, pecZ - 0.085),
      ],
      7
    );
  } else {
    addFinRibbon(
      [
        new THREE.Vector3(pecX, pecY + 0.015, pecZ),
        new THREE.Vector3(pecX, pecY - 0.015, pecZ - 0.012),
      ],
      [
        new THREE.Vector3(pecX + pecSpan, pecY + 0.025, pecZ - 0.075),
        new THREE.Vector3(pecX + pecSpan * 0.92, pecY - 0.045, pecZ - 0.085),
      ],
      5
    );
    addFinRibbon(
      [
        new THREE.Vector3(-pecX, pecY + 0.015, pecZ),
        new THREE.Vector3(-pecX, pecY - 0.015, pecZ - 0.012),
      ],
      [
        new THREE.Vector3(-pecX - pecSpan, pecY + 0.025, pecZ - 0.075),
        new THREE.Vector3(-pecX - pecSpan * 0.92, pecY - 0.045, pecZ - 0.085),
      ],
      5
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildBettaEyesGeometry(sex: BettaSex): THREE.BufferGeometry {
  const eyeRadius = sex === 'erkek' ? 0.018 : 0.019;
  const eyeX = sex === 'erkek' ? 0.030 : 0.032;
  const eyeY = 0.015;
  const eyeZ = sex === 'erkek' ? 0.168 : 0.156;

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

function applyBettaSwimShader(
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
      float normalizedBack = clamp((0.18 - transformed.z) / 0.68, 0.0, 1.4);
      float spineWave = sin(uTime * 5.2 + transformed.z * 11.5) * pow(normalizedBack, 1.65) * 0.048 * uFinAmp;
      transformed.x += spineWave;

      float radialDist = length(vec2(transformed.y, min(0.0, transformed.z + 0.05)));
      float veilRipple = sin(uTime * 4.4 + transformed.y * 18.0 + transformed.z * 14.0) * smoothstep(0.06, 0.28, radialDist) * 0.022 * (uFinAmp - 0.8);
      transformed.x += max(0.0, uFinAmp - 1.0) * veilRipple;

      float pectoralMask = smoothstep(0.046, 0.13, abs(transformed.x));
      transformed.y += sin(uTime * 11.5 + transformed.x * 18.0) * pectoralMask * 0.024;
      transformed.z += cos(uTime * 11.5) * pectoralMask * 0.012;
      `
    );
  };
}

export function buildAnatomicalBettaAssets(
  sex: BettaSex,
  finVariant: BettaFinVariant = sex === 'erkek' ? 'halfmoon' : 'round'
): ProceduralBettaAssets {
  const timeUniform = { value: 0 };

  const bodyGeometry = buildBettaBodyGeometry(sex, finVariant);
  const { diffuseMap, bumpMap, roughnessMap } = createBettaSkinTextures(sex);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', // instanceColor ile tüm renk varyantlarını boyar
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.02,
    roughnessMap: roughnessMap,
    roughness: 0.34,
    metalness: 0.16,
    iridescence: sex === 'erkek' ? 0.92 : 0.52,
    iridescenceIOR: 1.42,
    iridescenceThicknessRange: [200, 520],
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
  });
  applyBettaSwimShader(bodyMaterial, timeUniform, 1.0);

  const finGeometry = buildBettaFinsGeometry(sex, finVariant);
  const { finDiffuse, finAlpha, finBump } = createBettaFinTextures(sex, finVariant);

  const finMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', // instanceColor ile yüzgeç renklerini boyar
    map: finDiffuse,
    alphaMap: finAlpha,
    bumpMap: finBump,
    bumpScale: 0.014,
    transparent: true,
    opacity: sex === 'erkek' ? 0.90 : 0.80,
    alphaTest: finVariant === 'crowntail' ? 0.45 : 0.06,
    side: THREE.DoubleSide,
    roughness: 0.26,
    metalness: 0.08,
    iridescence: sex === 'erkek' ? 0.75 : 0.35,
    depthWrite: false,
  });
  applyBettaSwimShader(finMaterial, timeUniform, finVariant === 'plakat' ? 1.15 : 1.55);

  const eyeGeometry = buildBettaEyesGeometry(sex);
  const eyeTexture = createBettaEyeTexture(sex);

  const eyeMaterial = new THREE.MeshPhysicalMaterial({
    map: eyeTexture,
    roughness: 0.08,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  applyBettaSwimShader(eyeMaterial, timeUniform, 0.15);

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