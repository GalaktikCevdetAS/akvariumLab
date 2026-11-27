import { create } from 'zustand';
import {
  PlacedSceneItem,
  TankBounds,
} from '../types/aquarium';
import {
  evaluateEcosystem,
  calculateTankBounds,
  findValidPlacement,
  isSpongeOrAirFilter,
  EcosystemStatus,
} from '../lib/simulation/ecosystemEngine';
import {
  fetchCatalogWithStatus,
  Product,
  CatalogCategory,
  CompatibilityRule,
  TankItem,
} from '../lib/supabase/catalogService';

interface AquariumState {
  tankCapacity: number;
  tankBounds: TankBounds;
  lightHours: number;

  catalog: Product[];
  categories: CatalogCategory[];
  rules: CompatibilityRule[];
  catalogSource: 'idle' | 'loading' | 'supabase' | 'error';
  catalogError: string | null;
  selectedCategory: Product['category'];
  searchQuery: string;

  tankItems: TankItem[];
  placedItems: PlacedSceneItem[];
  selectedItemId: string | null;
  hoveredItemId: string | null;

  ecosystemStatus: EcosystemStatus;

  loadCatalog: () => Promise<void>;
  setSelectedCategory: (category: Product['category']) => void;
  setSearchQuery: (query: string) => void;
  setTankCapacity: (liters: number) => void;
  setLightHours: (hours: number) => void;

  addToTank: (item: Product) => void;
  decrementFromTank: (catalogId: string) => void;
  updateQuantity: (catalogId: string, newQuantity: number) => void;
  removeFromTank: (catalogId: string) => void;
  removePlacedInstance: (instanceId: string) => void;

  updateItemTransform: (
    instanceId: string,
    position: [number, number, number],
    rotation?: [number, number, number]
  ) => void;
  selectItem: (instanceId: string | null) => void;
  setHoveredItem: (instanceId: string | null) => void;
  clearTank: () => void;
}

const DEFAULT_CAPACITY = 100;
const DEFAULT_LIGHT_HOURS = 8;

function getItemCatalogId(item: PlacedSceneItem): string {
  return item.catalogId ?? item.product.id;
}

function buildTankItemsFromPlaced(placed: PlacedSceneItem[]): TankItem[] {
  const map = new Map<string, TankItem>();
  for (const item of placed) {
    const cId = getItemCatalogId(item);
    const existing = map.get(cId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(cId, {
        product: item.product,
        quantity: item.quantity,
      });
    }
  }
  return Array.from(map.values());
}

function getTotalSandKg(placed: PlacedSceneItem[]): number {
  return placed
    .filter((i) => i.product.category === 'kumlar')
    .reduce((sum, i) => sum + i.quantity, 0);
}

function syncState(
  placedItems: PlacedSceneItem[],
  tankCapacity: number,
  lightHours: number,
  rules: CompatibilityRule[]
) {
  const totalSand = getTotalSandKg(placedItems);
  const tankBounds = calculateTankBounds(tankCapacity, totalSand);
  const tankItems = buildTankItemsFromPlaced(placedItems);
  const ecosystemStatus = evaluateEcosystem(
    tankCapacity,
    tankItems,
    rules,
    lightHours
  );
  return { placedItems, tankBounds, tankItems, ecosystemStatus };
}

export const useAquariumStore = create<AquariumState>((set, get) => ({
  tankCapacity: DEFAULT_CAPACITY,
  tankBounds: calculateTankBounds(DEFAULT_CAPACITY, 0),
  lightHours: DEFAULT_LIGHT_HOURS,

  catalog: [],
  categories: [],
  rules: [],
  catalogSource: 'idle',
  catalogError: null,
  selectedCategory: 'canlilar',
  searchQuery: '',

  tankItems: [],
  placedItems: [],
  selectedItemId: null,
  hoveredItemId: null,

  ecosystemStatus: evaluateEcosystem(DEFAULT_CAPACITY, [], [], DEFAULT_LIGHT_HOURS),

  loadCatalog: async () => {
    set({ catalogSource: 'loading', catalogError: null });
    const res = await fetchCatalogWithStatus();
    const { placedItems, tankCapacity, lightHours } = get();
    set({
      catalog: res.products,
      categories: res.categories,
      rules: res.rules,
      catalogSource: res.source === 'supabase' ? 'supabase' : 'error',
      catalogError: res.errorMessage ?? null,
      ecosystemStatus: evaluateEcosystem(
        tankCapacity,
        buildTankItemsFromPlaced(placedItems),
        res.rules,
        lightHours
      ),
    });
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setTankCapacity: (liters) => {
    const { placedItems, lightHours, rules } = get();
    const newBounds = calculateTankBounds(liters, getTotalSandKg(placedItems));

    const adjustedItems = placedItems.map((item) => {
      const currentPos = item.position ?? [0, newBounds.substrateTop, 0];

      if (item.product.sub_category === 'hava-motorlari') {
        return {
          ...item,
          position: [
            -newBounds.width / 2 - 0.78,
            -newBounds.height / 2,
            currentPos[2],
          ] as [number, number, number],
        };
      }
      if (item.product.sub_category === 'aydinlatmalar') {
        return {
          ...item,
          position: [0, newBounds.height / 2, 0] as [number, number, number],
        };
      }
      const halfW = newBounds.width / 2 - 0.25;
      const halfD = newBounds.depth / 2 - 0.25;
      const [x, y, z] = currentPos;
      return {
        ...item,
        position: [
          Math.max(-halfW, Math.min(halfW, x)),
          Math.max(newBounds.substrateTop, Math.min(newBounds.waterTop - 0.1, y)),
          Math.max(-halfD, Math.min(halfD, z)),
        ] as [number, number, number],
      };
    });

    set({
      tankCapacity: liters,
      ...syncState(adjustedItems, liters, lightHours, rules),
    });
  },

  setLightHours: (hours) => {
    const clamped = Math.max(0, Math.min(24, hours));
    const { placedItems, tankCapacity, rules } = get();
    set({
      lightHours: clamped,
      ...syncState(placedItems, tankCapacity, clamped, rules),
    });
  },

  addToTank: (item) => {
    const { placedItems, tankBounds, tankCapacity, lightHours, rules } = get();

    if (item.category === 'kumlar') {
      const existing = placedItems.find((p) => getItemCatalogId(p) === item.id);
      const updated = existing
        ? placedItems.map((p) =>
            getItemCatalogId(p) === item.id ? { ...p, quantity: p.quantity + 1 } : p
          )
        : [
            ...placedItems,
            {
              instanceId: `${item.id}-${Date.now()}`,
              catalogId: item.id,
              catalogItem: item,
              product: item,
              category: item.sub_category || item.category,
              quantity: 1,
              position: [0, 0, 0] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number],
              scale: 1,
            },
          ];

      set(syncState(updated, tankCapacity, lightHours, rules));
      return;
    }

    const pos = findValidPlacement(item, placedItems, tankBounds);
    const newInstance: PlacedSceneItem = {
      instanceId: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      catalogId: item.id,
      catalogItem: item,
      product: item,
      category: item.sub_category || item.category,
      quantity: 1,
      position: pos,
      rotation:
        item.category === 'malzemeler'
          ? [0, 0, 0]
          : [0, Math.random() * Math.PI * 2, 0],
      scale: 1,
    };

    const updated = [...placedItems, newInstance];
    set({
      selectedItemId: newInstance.instanceId,
      ...syncState(updated, tankCapacity, lightHours, rules),
    });
  },

  decrementFromTank: (catalogId) => {
    const { placedItems, tankCapacity, lightHours, rules, selectedItemId } = get();
    const matching = placedItems.filter((p) => getItemCatalogId(p) === catalogId);
    if (matching.length === 0) return;

    const last = matching[matching.length - 1];
    const updated =
      last.quantity > 1
        ? placedItems.map((p) =>
            p.instanceId === last.instanceId ? { ...p, quantity: p.quantity - 1 } : p
          )
        : placedItems.filter((p) => p.instanceId !== last.instanceId);

    set({
      selectedItemId: selectedItemId === last.instanceId ? null : selectedItemId,
      ...syncState(updated, tankCapacity, lightHours, rules),
    });
  },

  updateQuantity: (catalogId, newQuantity) => {
    const { catalog, placedItems, tankBounds, tankCapacity, lightHours, rules } = get();
    const targetQty = Math.max(0, Math.floor(newQuantity));
    if (targetQty === 0) {
      get().removeFromTank(catalogId);
      return;
    }

    const product =
      catalog.find((c) => c.id === catalogId) ||
      placedItems.find((p) => getItemCatalogId(p) === catalogId)?.product;
    if (!product) return;

    if (product.category === 'kumlar') {
      const existing = placedItems.find((p) => getItemCatalogId(p) === catalogId);
      const updated = existing
        ? placedItems.map((p) =>
            getItemCatalogId(p) === catalogId ? { ...p, quantity: targetQty } : p
          )
        : [
            ...placedItems,
            {
              instanceId: `${catalogId}-${Date.now()}`,
              catalogId,
              catalogItem: product,
              product,
              category: product.sub_category || product.category,
              quantity: targetQty,
              position: [0, 0, 0] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number],
              scale: 1,
            },
          ];
      set(syncState(updated, tankCapacity, lightHours, rules));
      return;
    }

    const currentTotal = placedItems
      .filter((p) => getItemCatalogId(p) === catalogId)
      .reduce((sum, p) => sum + p.quantity, 0);

    let updated = [...placedItems];
    if (targetQty > currentTotal) {
      for (let i = 0; i < targetQty - currentTotal; i++) {
        updated.push({
          instanceId: `${catalogId}-${Date.now()}-${i}`,
          catalogId,
          catalogItem: product,
          product,
          category: product.sub_category || product.category,
          quantity: 1,
          position: findValidPlacement(product, updated, tankBounds),
          rotation:
            product.category === 'malzemeler'
              ? [0, 0, 0]
              : [0, Math.random() * Math.PI * 2, 0],
          scale: 1,
        });
      }
    } else if (targetQty < currentTotal) {
      let toRemove = currentTotal - targetQty;
      for (let i = updated.length - 1; i >= 0 && toRemove > 0; i--) {
        if (getItemCatalogId(updated[i]) === catalogId) {
          updated.splice(i, 1);
          toRemove--;
        }
      }
    }

    set(syncState(updated, tankCapacity, lightHours, rules));
  },

  removeFromTank: (catalogId) => {
    const { placedItems, tankCapacity, lightHours, rules, selectedItemId } = get();
    const removedIds = new Set(
      placedItems
        .filter((p) => getItemCatalogId(p) === catalogId)
        .map((p) => p.instanceId)
    );
    const updated = placedItems.filter((p) => getItemCatalogId(p) !== catalogId);
    set({
      selectedItemId:
        selectedItemId && removedIds.has(selectedItemId) ? null : selectedItemId,
      ...syncState(updated, tankCapacity, lightHours, rules),
    });
  },

  removePlacedInstance: (instanceId) => {
    const { placedItems, tankCapacity, lightHours, rules, selectedItemId } = get();
    const updated = placedItems.filter((p) => p.instanceId !== instanceId);
    set({
      selectedItemId: selectedItemId === instanceId ? null : selectedItemId,
      ...syncState(updated, tankCapacity, lightHours, rules),
    });
  },

  updateItemTransform: (instanceId, position, rotation) => {
    const { placedItems } = get();
    set({
      placedItems: placedItems.map((item) =>
        item.instanceId === instanceId
          ? { ...item, position, rotation: rotation ?? item.rotation }
          : item
      ),
    });
  },

  selectItem: (instanceId) => set({ selectedItemId: instanceId }),
  setHoveredItem: (instanceId) => set({ hoveredItemId: instanceId }),

  clearTank: () => {
    const { tankCapacity, lightHours, rules } = get();
    set({
      selectedItemId: null,
      hoveredItemId: null,
      ...syncState([], tankCapacity, lightHours, rules),
    });
  },
}));

export type PlacedEquipment = PlacedSceneItem;
export { isSpongeOrAirFilter };