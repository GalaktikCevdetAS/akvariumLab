import { buildAnatomicalGuppyAssets, ProceduralFishAssets } from './lepistesAnatomyBuilder';

export function createAnatomicalLepistesDisi(): ProceduralFishAssets {
  return buildAnatomicalGuppyAssets('disi');
}

export function createLepistesDisiGeometry() {
  const assets = buildAnatomicalGuppyAssets('disi');
  return {
    geometry: assets.bodyGeometry,
    material: assets.bodyMaterial,
  };
}

export default createAnatomicalLepistesDisi;