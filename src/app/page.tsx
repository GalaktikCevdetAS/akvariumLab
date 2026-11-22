'use client';

import { useEffect, useState } from 'react';
import { Fish, ShoppingCart } from 'lucide-react';
import { useAquariumStore } from '@/store/useAquariumStore';
import AquariumScene from '@/components/scene/AquariumScene';
import SearchBar from '@/components/ui/SearchBar';
import CatalogDrawer from '@/components/ui/CatalogDrawer';
import SideStatusPanel from '@/components/ui/SideStatusPanel';
import ShoppingCartPanel from '@/components/ui/ShoppingCartPanel';

export default function HomePage() {
  const loadCatalog = useAquariumStore((state) => state.loadCatalog);
  const tankItems = useAquariumStore((state) => state.tankItems);
  const [fps, setFps] = useState(60);
  const [activePanel, setActivePanel] = useState<'catalog' | 'cart' | null>(null);

  useEffect(() => {
    if (loadCatalog) {
      loadCatalog();
    }
  }, [loadCatalog]);

  const totalItemsCount = tankItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = tankItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const togglePanel = (panel: 'catalog' | 'cart') => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#060d18] select-none"
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#060d18' }}
    >
      {/* 1. Tam Ekran 3D Akvaryum Sahnesi */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 0 }}
      >
        <AquariumScene onFpsUpdate={setFps} />
      </div>

      {/* 2. Sol Üst Marka & Gerçek Zamanlı FPS Kartı */}
      <header className="fixed top-4 left-4 z-20 pointer-events-auto">
        <div className="bg-slate-900/75 backdrop-blur-md border border-cyan-500/20 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-lg">
          <Fish className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">
              fishLab
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              3D Akvaryum Simülasyonu
            </p>
          </div>
          <span
            className={`ml-2 text-xs font-mono px-2.5 py-0.5 rounded-full border ${
              fps >= 50
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : fps >= 30
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            {fps} FPS
          </span>
        </div>
      </header>

      {/* 3. Sağ Üst Kompakt Ekosistem & Litre Paneli (Sağ alt tamamen boş) */}
      <aside className="fixed top-4 right-4 z-20 w-72 pointer-events-auto">
        <SideStatusPanel />
      </aside>

      {/* 4. Sol Kenar Tetikleyiciler & Açılır/Kapanır Çekmeceler */}
      <aside className="fixed left-4 top-24 z-30 flex items-start gap-3 pointer-events-auto">
        {/* Tetikleyici Butonlar */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => togglePanel('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border backdrop-blur-md shadow-lg transition ${
              activePanel === 'catalog'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/25'
                : 'bg-slate-900/80 text-slate-200 border-slate-700/70 hover:bg-slate-800'
            }`}
          >
            <Fish className="w-4 h-4" />
            <span>Katalog</span>
          </button>

          <button
            onClick={() => togglePanel('cart')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border backdrop-blur-md shadow-lg transition ${
              activePanel === 'cart'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/25'
                : 'bg-slate-900/80 text-slate-200 border-slate-700/70 hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              Sepet ({totalItemsCount} • {totalPrice.toFixed(0)} ₺)
            </span>
          </button>
        </div>

        {/* Açılır Panel */}
        {activePanel === 'catalog' && (
          <CatalogDrawer onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'cart' && (
          <ShoppingCartPanel onClose={() => setActivePanel(null)} />
        )}
      </aside>

      {/* 5. Alt Orta SearchBar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[440px] max-w-[90vw] pointer-events-auto">
        <SearchBar />
      </div>
    </main>
  );
}
