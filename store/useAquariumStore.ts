import { create } from 'zustand';
import { Product, TankItem, fetchCatalog } from '../lib/supabase/catalogService';
import { EcosystemStatus, evaluateEcosystem } from '../lib/simulation/ecosystemEngine';

interface AquariumState {
  tankCapacity: number; // 50, 100 veya 200 Litre
  catalog: Product[];
  tankItems: TankItem[];
  searchQuery: string;
  selectedCategory: string;
  ecosystemStatus: EcosystemStatus;
  
  setTankCapacity: (capacity: number) => void;
  loadCatalog: () => Promise<void>;
  addToTank: (product: Product) => void;
  removeFromTank: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
}

export const useAquariumStore = create<AquariumState>((set, get) => ({
  tankCapacity: 50,
  catalog: [],
  tankItems: [],
  searchQuery: '',
  selectedCategory: 'all',
  ecosystemStatus: { ph: 7.2, temperature: 25, bioLoad: 0, warnings: [], isHealthy: true },

  setTankCapacity: (capacity) => {
    set({ tankCapacity: capacity });
    const state = get();
    set({ ecosystemStatus: evaluateEcosystem(capacity, state.tankItems) });
  },

  loadCatalog: async () => {
    const catalog = await fetchCatalog();
    set({ catalog });
  },

  addToTank: (product) => {
    const state = get();
    const currentSandKg = state.tankItems
      .filter(i => i.product.category === 'kumlar')
      .reduce((acc, i) => acc + i.quantity, 0);

    // Kural 3: Bitki Ekleme Kuralı (Kum Kontrolü)
    if (product.category === 'bitkiler' && currentSandKg <= 0) {
      const msg = 'Bitki eklemek için önce akvaryuma taban kumu eklemelisiniz!';
      const warnings = state.ecosystemStatus.warnings.includes(msg)
        ? state.ecosystemStatus.warnings
        : [...state.ecosystemStatus.warnings, msg];
      set({
        ecosystemStatus: {
          ...state.ecosystemStatus,
          warnings,
          isHealthy: false,
        }
      });
      return;
    }

    // Kural 1: Maksimum Kum Sınırı (Litreye Göre)
    if (product.category === 'kumlar') {
      const maxSandKg = Math.floor((state.tankCapacity * 0.25) / 0.65);
      if (currentSandKg + 1 > maxSandKg) {
        const msg = `Maksimum kum sınırına ulaşıldı! (${state.tankCapacity}L tank için en fazla ${maxSandKg} kg kum eklenebilir.)`;
        const warnings = state.ecosystemStatus.warnings.includes(msg)
          ? state.ecosystemStatus.warnings
          : [...state.ecosystemStatus.warnings, msg];
        set({
          ecosystemStatus: {
            ...state.ecosystemStatus,
            warnings,
            isHealthy: false,
          }
        });
        return;
      }
    }

    const existing = state.tankItems.find(item => item.product.id === product.id);
    let newItems: TankItem[];

    if (existing) {
      newItems = state.tankItems.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...state.tankItems, { product, quantity: 1 }];
    }

    set({
      tankItems: newItems,
      ecosystemStatus: evaluateEcosystem(state.tankCapacity, newItems)
    });
  },

  removeFromTank: (productId) => {
    const state = get();
    const newItems = state.tankItems.filter(item => item.product.id !== productId);
    set({
      tankItems: newItems,
      ecosystemStatus: evaluateEcosystem(state.tankCapacity, newItems)
    });
  },

  updateQuantity: (productId, quantity) => {
    const state = get();
    if (quantity <= 0) {
      state.removeFromTank(productId);
      return;
    }

    const targetItem = state.tankItems.find(item => item.product.id === productId);
    if (!targetItem) return;

    // Kum artırımı sınırı kontrolü
    if (targetItem.product.category === 'kumlar') {
      const otherSandKg = state.tankItems
        .filter(i => i.product.category === 'kumlar' && i.product.id !== productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      const newTotalSandKg = otherSandKg + quantity;
      const maxSandKg = Math.floor((state.tankCapacity * 0.25) / 0.65);

      if (newTotalSandKg > maxSandKg) {
        const msg = `Maksimum kum sınırına ulaşıldı! (${state.tankCapacity}L tank için en fazla ${maxSandKg} kg kum eklenebilir.)`;
        const warnings = state.ecosystemStatus.warnings.includes(msg)
          ? state.ecosystemStatus.warnings
          : [...state.ecosystemStatus.warnings, msg];
        set({
          ecosystemStatus: {
            ...state.ecosystemStatus,
            warnings,
            isHealthy: false,
          }
        });
        return;
      }
    }

    const newItems = state.tankItems.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );

    set({
      tankItems: newItems,
      ecosystemStatus: evaluateEcosystem(state.tankCapacity, newItems)
    });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));
