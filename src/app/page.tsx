'use client';

import { useEffect, useState } from 'react';
import { Fish, ShoppingCart, AlertTriangle, Sun } from 'lucide-react';
import { useAquariumStore } from '@/store/useAquariumStore';
import AquariumScene from '@/components/3d/AquariumScene';
import SearchBar from '@/components/ui/SearchBar';
import CatalogDrawer from '@/components/ui/CatalogDrawer';
import SideStatusPanel from '@/components/ui/SideStatusPanel';
import ShoppingCartPanel from '@/components/ui/ShoppingCartPanel';

export default function HomePage() {
  const loadCatalog = useAquariumStore((state) => state.loadCatalog);
  const tankItems = useAquariumStore((state) => state.tankItems);
  const ecosystemStatus = useAquariumStore((state) => state.ecosystemStatus);
  const lightHours = useAquariumStore((state) => state.lightHours);
  const setLightHours = useAquariumStore((state) => state.setLightHours);

  const [fps, setFps] = useState(60);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (loadCatalog) {
      loadCatalog();
    }
  }, [loadCatalog]);

  const totalItemsCount = tankItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = tankItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Tanka LED aydınlatma eklendi mi kontrolü
  const hasLightAdded = tankItems.some((item) => item.product.lumen > 0 && item.quantity > 0);
  const warnings = ecosystemStatus.warnings;

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#060d18] select-none flex"
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#060d18' }}
    >
      {/* 1. Sol Genişletilmiş Katalog Paneli (Açıldığında sağ tarafı sıkıştırır) */}
      {isCatalogOpen && (
        <aside className="w-[38vw] min-w-[380px] max-w-[540px] h-full z-30 shrink-0 pointer-events-auto">
          <CatalogDrawer onClose={() => setIsCatalogOpen(false)} />
        </aside>
      )}

      {/* 2. Sağ / Ana Sahne Alanı (Katalog açılınca kalan alana göre otomatik daralır) */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Tam Alan 3D Akvaryum Sahnesi */}
        <div className="absolute inset-0 w-full h-full z-0">
          <AquariumScene onFpsUpdate={setFps} />
        </div>

        {/* Sol Üst Marka & Gerçek Zamanlı FPS Kartı */}
        <header className="absolute top-4 left-4 z-30 pointer-events-auto">
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

        {/* Sol Üst Katalog Tetikleyici Butonu (Katalog kapalıyken görünür) */}
        {!isCatalogOpen && (
          <div className="absolute left-4 top-24 z-20 pointer-events-auto">
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border backdrop-blur-md shadow-lg transition bg-slate-900/80 text-slate-200 border-slate-700/70 hover:bg-slate-800 hover:border-cyan-500/40"
            >
              <Fish className="w-4 h-4 text-cyan-400" />
              <span>Katalog</span>
            </button>
          </div>
        )}

        {/* Sayfanın En Üst Kısmında Kullanıcının Göreceği Uyarı Şeridi */}
        {warnings.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[44%] w-max pointer-events-auto">
            <div className="bg-rose-950/85 backdrop-blur-xl border border-rose-500/50 text-rose-100 px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span className="font-medium truncate">{warnings[0]}</span>
              {warnings.length > 1 && (
                <span className="text-[10px] font-bold bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded-full shrink-0">
                  +{warnings.length - 1}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Işık Eklendiğinde Eklenen Işığın Tam Üst Hizasında Yarı Saydam Saat Çubuğu */}
        {hasLightAdded && (
          <div
            className={`absolute ${
              warnings.length > 0 ? 'top-16' : 'top-5'
            } left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all`}
          >
            <div className="bg-slate-900/55 hover:bg-slate-900/80 backdrop-blur-md border border-amber-400/30 rounded-full px-4 py-1.5 shadow-xl flex items-center gap-3 transition">
              <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={lightHours}
                onChange={(e) => setLightHours(Number(e.target.value))}
                className="w-32 h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-amber-400"
                title="Günlük Aydınlatma Süresi"
              />
              <span className="text-[11px] font-bold text-amber-200 whitespace-nowrap">
                {lightHours} saat/gün
              </span>
            </div>
          </div>
        )}

        {/* Sağ Üst Kompakt Ekosistem & Litre Paneli */}
        <aside className="absolute top-4 right-4 z-20 w-72 pointer-events-auto">
          <SideStatusPanel />
        </aside>

        {/* Alt Orta SearchBar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[400px] max-w-[60%] pointer-events-auto">
          <SearchBar />
        </div>

        {/* Sağ En Altta Sepet İkonu ve Açılır Sepet Penceresi */}
        <div className="absolute bottom-5 right-4 z-30 flex flex-col items-end gap-2.5 pointer-events-auto">
          {isCartOpen && (
            <ShoppingCartPanel onClose={() => setIsCartOpen(false)} />
          )}

          <button
            onClick={() => setIsCartOpen((prev) => !prev)}
            className={`relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition ${
              isCartOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-500/30'
                : 'bg-slate-900/85 text-slate-100 border-slate-700/80 hover:bg-slate-800 hover:border-cyan-500/40'
            }`}
            title="Alışveriş Sepeti"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span
                  className={`absolute -top-2 -right-2.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isCartOpen
                      ? 'bg-slate-950 text-cyan-300'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  {totalItemsCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold">
              {totalPrice.toFixed(0)} ₺
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}