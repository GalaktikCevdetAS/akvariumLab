import { buildAnatomicalGuppyAssets, ProceduralFishAssets } from './lepistesAnatomyBuilder';

export function createAnatomicalLepistesErkek(): ProceduralFishAssets {
  return buildAnatomicalGuppyAssets('erkek');
}

export function createLepistesGeometry() {
  const assets = buildAnatomicalGuppyAssets('erkek');
  return {
    geometry: assets.bodyGeometry,
    material: assets.bodyMaterial,
  };
}

export default createAnatomicalLepistesErkek;