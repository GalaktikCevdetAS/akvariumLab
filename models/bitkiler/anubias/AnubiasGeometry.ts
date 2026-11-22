import * as THREE from 'three';

export function createAnubiasGeometry(): { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial } {
  const geometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 6);
  // Kök tabanını (alt yüzeyi) tam Y = 0 seviyesine taşıyarak sandTopY'ye kusursuz oturmasını sağla
  geometry.translate(0, 0.75, 0);

  const material = new THREE.MeshStandardMaterial({
    color: '#2b8a3e',
    roughness: 0.5,
  });

  return { geometry, material };
}
