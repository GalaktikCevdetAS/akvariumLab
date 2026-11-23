import { buildAnatomicalBettaAssets, ProceduralBettaAssets } from './betaAnatomyBuilder';

export function createAnatomicalBetaErkek(): ProceduralBettaAssets {
  return buildAnatomicalBettaAssets('erkek');
}

export function createBetaErkekGeometry() {
  const assets = buildAnatomicalBettaAssets('erkek');
  return {
    geometry: assets.bodyGeometry,
    material: assets.bodyMaterial,
  };
}

export default createAnatomicalBetaErkek;