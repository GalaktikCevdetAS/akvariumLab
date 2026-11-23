import { create } from 'zustand';
import {
  Product,
  TankItem,
  CompatibilityRule,
  fetchCatalogWithStatus,
} from '../lib/supabase/catalogService';
import {
  EcosystemStatus,
  evaluateEcosystem,
  getMaxPlantsForTank,
} from '../lib/simulation/ecosystemEngine';

interface AquariumState {
  tankCapacity: number; // 50, 100 veya 200 Litre
  lightHours: number;   // 0 - 16 saat günlük aydınlatma süresi
  catalog: Product[];
  compatibilityRules: CompatibilityRule[];
  catalogSource: 'supabase' | 'error' | 'loading';
  tankItems: TankItem[];
  searchQuery: string;
  selectedCategory: string;
  ecosystemStatus: EcosystemStatus;

  setTankCapacity: (capacity: number) => void;
  setLightHours: (hours: number) => void;
  loadCatalog: () => Promise<void>;
  addToTank: (product: Product) => void;
  decrementFromTank: (productId: string) => void;
  removeFromTank: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
}

export const useAquariumStore = create<AquariumState>((set, get) => ({
  tankCapacity: 50,
  lightHours: 8,
  catalog: [],
  compatibilityRules: [],
  catalogSource: 'loading',
  tankItems: [],
  searchQuery: '',
  selectedCategory: 'canlilar',
  ecosystemStatus: evaluateEcosystem(50, [], [], 8),

  setTankCapacity: (capacity) => {
    const state = get();
    set({
      tankCapacity: capacity,
      ecosystemStatus: evaluateEcosystem(
        capacity,
        state.tankItems,
        state.compatibilityRules,
        state.lightHours
      ),
    });
  },

  setLightHours: (hours) => {
    const clamped = Math.min(16, Math.max(0, hours));
    const state = get();
    set({
      lightHours: clamped,
      ecosystemStatus: evaluateEcosystem(
        state.tankCapacity,
        state.tankItems,
        state.compatibilityRules,
        clamped
      ),
    });
  },

  loadCatalog: async () => {
    const res = await fetchCatalogWithStatus();
    if (res.source === 'error' && res.errorMessage) {
      console.error('[Supabase Hatası]:', res.errorMessage);
    }

    const currentTankItems = get().tankItems;
    const syncedTankItems = currentTankItems.map((item) => {
      const updatedProduct = res.products.find(
        (p) => p.id === item.product.id || p.slug === item.product.slug
      );
      return updatedProduct ? { ...item, product: updatedProduct } : item;
    });

    const state = get();
    set({
      catalog: res.products,
      compatibilityRules: res.rules,
      catalogSource: res.source,
      tankItems: syncedTankItems,
      ecosystemStatus: evaluateEcosystem(
        state.tankCapacity,
        syncedTankItems,
        res.rules,
        state.lightHours
      ),
    });
  },

  addToTank: (product) => {
    const state = get();
    const currentSandKg = state.tankItems
      .filter((i) => i.product.category === 'kumlar')
      .reduce((acc, i) => acc + i.quantity, 0);

    if (product.category === 'bitkiler') {
      if (currentSandKg <= 0) {
        const msg = 'Bitki eklemek için önce akvaryuma taban kumu eklemelisiniz!';
        const warnings = state.ecosystemStatus.warnings.includes(msg)
          ? state.ecosystemStatus.warnings
          : [...state.ecosystemStatus.warnings, msg];
        set({ ecosystemStatus: { ...state.ecosystemStatus, warnings, isHealthy: false } });
        return;
      }

      const currentPlants = state.tankItems
        .filter((i) => i.product.category === 'bitkiler')
        .reduce((acc, i) => acc + i.quantity, 0);
      const maxPlants = getMaxPlantsForTank(state.tankCapacity);

      if (currentPlants + 1 > maxPlants) {
        const msg = `Maksimum bitki sınırına ulaşıldı! (${state.tankCapacity}L tabanı için max ${maxPlants} adet)`;
        const warnings = state.ecosystemStatus.warnings.includes(msg)
          ? state.ecosystemStatus.warnings
          : [...state.ecosystemStatus.warnings, msg];
        set({ ecosystemStatus: { ...state.ecosystemStatus, warnings, isHealthy: false } });
        return;
      }
    }

    if (product.category === 'kumlar') {
      const maxSandKg = Math.floor((state.tankCapacity * 0.25) / 0.65);
      if (currentSandKg + 1 > maxSandKg) {
        const msg = `Maksimum kum sınırına ulaşıldı! (${state.tankCapacity}L için max ${maxSandKg} kg)`;
        const warnings = state.ecosystemStatus.warnings.includes(msg)
          ? state.ecosystemStatus.warnings
          : [...state.ecosystemStatus.warnings, msg];
        set({ ecosystemStatus: { ...state.ecosystemStatus, warnings, isHealthy: false } });
        return;
      }
    }

    const existing = state.tankItems.find((item) => item.product.id === product.id);
    const newItems = existing
      ? state.tankItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      : [...state.tankItems, { product, quantity: 1 }];

    set({
      tankItems: newItems,
      ecosystemStatus: evaluateEcosystem(
        state.tankCapacity,
        newItems,
        state.compatibilityRules,
        state.lightHours
      ),
    });
  },

  decrementFromTank: (productId) => {
    const state = get();
    const existing = state.tankItems.find((item) => item.product.id === productId);
    if (!existing) return;

    if (existing.quantity <= 1) {
      state.removeFromTank(productId);
    } else {
      state.updateQuantity(productId, existing.quantity - 1);
    }
  },

  removeFromTank: (productId) => {
    const state = get();
    const newItems = state.tankItems.filter((item) => item.product.id !== productId);
    set({
      tankItems: newItems,
      ecosystemStatus: evaluateEcosystem(
        state.tankCapacity,
        newItems,
        state.compatibilityRules,
        state.lightHours
      ),
    });
  },

  updateQuantity: (productId, quantity) => {
    const state = get();
    if (quantity <= 0) {
      state.removeFromTank(productId);
      return;
    }

    const targetItem = state.tankItems.find((item) => item.product.id === productId);
    if (!targetItem) return;

    if (targetItem.product.category === 'bitkiler') {
      const otherPlants = state.tankItems
        .filter((i) => i.product.category === 'bitkiler' && i.product.id !== productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      const maxPlants = getMaxPlantsForTank(state.tankCapacity);
      if (otherPlants + quantity > maxPlants) return;
    }

    if (targetItem.product.category === 'kumlar') {
      const otherSandKg = state.tankItems
        .filter((i) => i.product.category === 'kumlar' && i.product.id !== productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      const maxSandKg = Math.floor((state.tankCapacity * 0.25) / 0.65);
      if (otherSandKg + quantity > maxSandKg) return;
    }

    const newItems = state.tankItems.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );

    set({
      tankItems: newItems,
      ecosystemStatus: evaluateEcosystem(
        state.tankCapacity,
        newItems,
        state.compatibilityRules,
        state.lightHours
      ),
    });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));