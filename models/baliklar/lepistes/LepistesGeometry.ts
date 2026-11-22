import React from 'react';
import * as THREE from 'three';

export function createLepistesGeometry(): { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial } {
  // Saf Three.js prosedürel Lepistes (Gövde + Kuyruk)
  const geometry = new THREE.ConeGeometry(0.3, 1.2, 8);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: '#ff6b6b',
    roughness: 0.3,
    metalness: 0.2,
  });

  return { geometry, material };
}
