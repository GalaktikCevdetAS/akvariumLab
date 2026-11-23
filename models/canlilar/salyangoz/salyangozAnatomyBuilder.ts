import * as THREE from 'three';

export type SnailSpeciesType = 'elma' | 'nerite';

export interface SnailAnatomyGeometries {
  shellGeometry: THREE.BufferGeometry;
  bodyGeometry: THREE.BufferGeometry;
}

export function buildSnailGeometries(
  species: SnailSpeciesType = 'elma'
): SnailAnatomyGeometries {
  const isNerite = species === 'nerite';

  // 1. KABUK GEOMETRİSİ (Logaritmik Sarmal + Vertex Renk Deseni)
  const turns = isNerite ? 2.1 : 2.8;
  const uSteps = 56;
  const vSteps = 24;

  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const baseColor = new THREE.Color(isNerite ? '#d97706' : '#f59e0b');
  const stripeColor = new THREE.Color(isNerite ? '#18181b' : '#b45309');
  const tmpColor = new THREE.Color();

  for (let i = 0; i <= uSteps; i++) {
    const u = i / uSteps;
    const theta = u * turns * Math.PI * 2;
    const growth = Math.pow(u, isNerite ? 0.72 : 0.85);
    const tubeRadius = (isNerite ? 0.011 : 0.014) * growth + 0.0015;
    const spiralRadius = (isNerite ? 0.008 : 0.012) * growth;
    const spireOffset = isNerite
      ? (1 - u) * 0.004
      : (1 - u) * 0.011;

    for (let j = 0; j <= vSteps; j++) {
      const v = j / vSteps;
      const phi = v * Math.PI * 2;

      const localR = spiralRadius + tubeRadius * Math.cos(phi);
      const x = localR * Math.cos(theta);
      const z = localR * Math.sin(theta);
      const y = tubeRadius * Math.sin(phi) + spireOffset + 0.008;

      positions.push(x, y, z);
      uvs.push(u, v);

      if (isNerite) {
        // Zebra Nerite karakteristik siyah-kehribar zikzak çizgiler
        const stripeWave = Math.sin(theta * 5.0 + Math.sin(phi * 2.0) * 0.9);
        const factor = stripeWave > 0.05 ? 1.0 : 0.0;
        tmpColor.copy(baseColor).lerp(stripeColor, factor);
      } else {
        // Elma salyangozu yumuşak büyüme halkaları
        const band = (Math.sin(theta * 3.0) + 1) * 0.12;
        tmpColor.copy(baseColor).lerp(stripeColor, band);
      }

      colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * (vSteps + 1) + j;
      const b = (i + 1) * (vSteps + 1) + j;
      const c = (i + 1) * (vSteps + 1) + (j + 1);
      const d = i * (vSteps + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const shellGeometry = new THREE.BufferGeometry();
  shellGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  shellGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  shellGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  shellGeometry.setIndex(indices);
  shellGeometry.computeVertexNormals();

  // 2. AYAK / GÖVDE + ANTENLER
  const bodyGeo = new THREE.CapsuleGeometry(
    isNerite ? 0.006 : 0.0075,
    isNerite ? 0.014 : 0.022,
    8,
    14
  );
  bodyGeo.rotateX(Math.PI / 2);
  bodyGeo.scale(1.15, 0.45, 1.0);
  bodyGeo.translate(0, 0.002, 0.002);

  return {
    shellGeometry,
    bodyGeometry: bodyGeo,
  };
}