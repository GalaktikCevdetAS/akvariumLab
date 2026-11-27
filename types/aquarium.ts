import { Product } from '../lib/supabase/catalogService';

export type CatalogItem = Product;
export type ItemCategory = Product['category'];

export interface TankBounds {
  width: number;
  height: number;
  depth: number;
  waterLevel: number;
  glassThickness: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  substrateTop: number;
  waterTop: number;
}

export interface PlacedSceneItem {
  instanceId: string;
  catalogId?: string;
  catalogItem?: Product;
  product: Product;
  category?: string;
  quantity: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}