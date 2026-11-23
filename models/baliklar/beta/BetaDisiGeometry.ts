import { buildAnatomicalBettaAssets, ProceduralBettaAssets } from './betaAnatomyBuilder';

export function createAnatomicalBetaDisi(): ProceduralBettaAssets {
  return buildAnatomicalBettaAssets('disi');
}

export function createBetaDisiGeometry() {
  const assets = buildAnatomicalBettaAssets('disi');
  return {
    geometry: assets.bodyGeometry,
    material: assets.bodyMaterial,
  };
}

export default createAnatomicalBetaDisi;