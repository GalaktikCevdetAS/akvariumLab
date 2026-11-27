'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Fish,
  X,
  Trash2,
  Sun,
  Sprout,
  Layers,
  Wrench,
  Shell,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAquariumStore, isSpongeOrAirFilter } from '../../store/useAquariumStore';
import { Product } from '../../lib/supabase/catalogService';

interface CatalogDrawerProps {
  onClose?: () => void;
}

/** Hava Taşı & Kabarcıklar Özel SVG İkonu */
function AirStoneIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="15" width="16" height="5" rx="2.5" />
      <line x1="8" y1="17.5" x2="8.01" y2="17.5" />
      <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
      <line x1="16" y1="17.5" x2="16.01" y2="17.5" />
      <circle cx="8" cy="10" r="1.3" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="16" cy="10.5" r="1.2" />
      <circle cx="10.5" cy="3.5" r="1" />
      <circle cx="14.5" cy="4" r="1" />
    </svg>
  );
}

/** Akvaryum İç Filtre Özel SVG İkonu */
function InternalFilterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Motor kafası ve gövde */}
      <rect x="7" y="4" width="10" height="17" rx="2" />
      {/* Motor / kartuş ayrım çizgisi */}
      <line x1="7" y1="10" x2="17" y2="10" />
      {/* Su çıkış nozulu */}
      <path d="M17 7h3v2h-3" />
      {/* Emiş ızgaraları */}
      <line x1="10" y1="13.5" x2="14" y2="13.5" />
      <line x1="10" y1="16.5" x2="14" y2="16.5" />
      {/* Üst güç kablosu */}
      <path d="M12 4V2h3" />
    </svg>
  );
}

/** Pipo (Sünger) Filtre Özel SVG İkonu */
function SpongeFilterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Yükseltici su çıkış borusu */}
      <path d="M11 3h2v8h-2z" />
      {/* Silindirik biyo-sünger gövde */}
      <rect x="6" y="11" width="12" height="8" rx="2" />
      {/* Ağır alt taban */}
      <line x1="4" y1="21" x2="20" y2="21" />
      {/* Kabarcıklar */}
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="5" r="1.2" />
    </svg>
  );
}

/** Hava Motoru (Hava Pompası) Özel SVG İkonu */
function AirPumpIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Pompa gövdesi */}
      <rect x="4" y="7" width="13" height="10" rx="3" />
      {/* Hava çıkış nozulları */}
      <line x1="17" y1="10" x2="21" y2="10" />
      <line x1="17" y1="14" x2="21" y2="14" />
      {/* LED & soğutma çizgisi */}
      <circle cx="8" cy="11" r="1" />
      <line x1="8" y1="14" x2="13" y2="14" />
      {/* Kauçuk ayaklar */}
      <line x1="7" y1="17" x2="7" y2="19" />
      <line x1="14" y1="17" x2="14" y2="19" />
    </svg>
  );
}

interface SubCategoryConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryThemeConfig {
  id: Product['category'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeTabClass: string;
  activeSubClass: string;
  badgeTextClass: string;
  borderAccentClass: string;
  subCategories: SubCategoryConfig[];
}

const CATEGORY_THEMES: CategoryThemeConfig[] = [
  {
    id: 'canlilar',
    label: 'Canlılar',
    icon: Fish,
    activeTabClass:
      'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm shadow-cyan-500/15',
    activeSubClass: 'bg-cyan-500 text-slate-950 font-bold',
    badgeTextClass: 'text-cyan-400',
    borderAccentClass: 'hover:border-cyan-500/40',
    subCategories: [
      { id: 'baliklar', label: 'Balıklar', icon: Fish },
      { id: 'karidesler', label: 'Karidesler', icon: Sparkles },
      { id: 'salyangozlar', label: 'Salyangozlar', icon: Shell },
    ],
  },
  {
    id: 'bitkiler',
    label: 'Bitkiler',
    icon: Sprout,
    activeTabClass:
      'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-sm shadow-emerald-500/15',
    activeSubClass: 'bg-emerald-500 text-slate-950 font-bold',
    badgeTextClass: 'text-emerald-400',
    borderAccentClass: 'hover:border-emerald-500/40',
    subCategories: [
      { id: 'bitkiler', label: 'Tüm Bitkiler', icon: Sprout },
    ],
  },
  {
    id: 'kumlar',
    label: 'Taban & Kumlar',
    icon: Layers,
    activeTabClass:
      'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm shadow-amber-500/15',
    activeSubClass: 'bg-amber-400 text-slate-950 font-bold',
    badgeTextClass: 'text-amber-300',
    borderAccentClass: 'hover:border-amber-500/40',
    subCategories: [
      { id: 'kumlar', label: 'Taban Kumları', icon: Layers },
    ],
  },
  {
    id: 'malzemeler',
    label: 'Malzemeler',
    icon: Wrench,
    activeTabClass:
      'bg-violet-500/20 text-violet-300 border-violet-400/60 shadow-sm shadow-violet-500/15',
    activeSubClass: 'bg-violet-400 text-slate-950 font-bold',
    badgeTextClass: 'text-violet-300',
    borderAccentClass: 'hover:border-violet-500/40',
    subCategories: [
      { id: 'aydinlatmalar', label: 'Aydınlatma', icon: Sun },
      { id: 'filtreler', label: 'Filtreler', icon: InternalFilterIcon },
      { id: 'hava-motorlari', label: 'Hava Motorları', icon: AirPumpIcon },
      { id: 'hava-taslari', label: 'Hava Taşları', icon: AirStoneIcon },
    ],
  },
];

function ProductThumbnail({ product }: { product: Product }) {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        className="w-16 h-16 rounded-xl object-contain p-1 border border-slate-700/70 shrink-0 bg-slate-950"
      />
    );
  }

  if (product.sub_category === 'aydinlatmalar' || product.slug.startsWith('led-')) {
    const isThreeColor = product.light_spectrum === 'uc-renk';
    const isBlueWhite = product.light_spectrum === 'beyaz-mavi';
    return (
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-950/80 to-slate-950 border border-violet-500/30 shrink-0 flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
        <div className="w-12 h-2 rounded-full bg-slate-600 mb-1.5 shadow" />
        <div
          className="w-11 h-1.5 rounded-full blur-[0.5px]"
          style={{
            background: isThreeColor
              ? 'linear-gradient(90deg, #f43f5e, #fef08a, #38bdf8)'
              : isBlueWhite
              ? 'linear-gradient(90deg, #f8fafc, #0284c7)'
              : product.kelvin && product.kelvin >= 10000
              ? '#bae6fd'
              : '#fef3c7',
          }}
        />
        <span className="text-[9px] font-bold text-amber-300 mt-1.5">
          {product.length_cm}cm
        </span>
      </div>
    );
  }

  if (product.category === 'canlilar') {
    const IconComp =
      product.sub_category === 'salyangozlar'
        ? Shell
        : product.sub_category === 'karidesler'
        ? Sparkles
        : Fish;
    return (
      <div
        className="w-16 h-16 rounded-xl border border-cyan-500/30 shrink-0 flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${product.color}44, #082f49 90%)`,
        }}
      >
        <IconComp className="w-7 h-7" style={{ color: product.color }} />
        <span className="text-[9px] font-medium text-cyan-200/80 mt-0.5 capitalize">
          {product.variant && product.variant !== 'standart'
            ? product.variant
            : product.sub_category}
        </span>
      </div>
    );
  }

  if (product.category === 'bitkiler') {
    return (
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 shrink-0 flex flex-col items-center justify-center">
        <Sprout className="w-7 h-7 text-emerald-400" />
        <span className="text-[9px] font-medium text-emerald-300 mt-0.5">Bitki</span>
      </div>
    );
  }

  if (product.category === 'kumlar') {
    return (
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-950/70 to-stone-900 border border-amber-500/30 shrink-0 flex flex-col items-center justify-center">
        <Layers className="w-7 h-7 text-amber-300" />
        <span className="text-[9px] font-medium text-amber-200/80 mt-0.5">Taban</span>
      </div>
    );
  }

  // Hava Taşı Özel Thumbnail İkonu
  if (product.sub_category === 'hava-taslari') {
    const isLong =
      product.slug.includes('uzun') ||
      product.slug.includes('cubuk') ||
      (product.length_cm || 0) >= 8;
    const isDisc =
      product.slug.includes('disk') || product.slug.includes('difuzor');

    return (
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-950/80 to-slate-900 border border-sky-500/35 shrink-0 flex flex-col items-center justify-center">
        <AirStoneIcon className="w-7 h-7 text-sky-400" />
        <span className="text-[9px] font-medium text-sky-300 mt-0.5">
          {isDisc ? 'Disk' : isLong ? `${product.length_cm || 15}cm` : 'Silindir'}
        </span>
      </div>
    );
  }

  // Filtreler Özel Thumbnail İkonu (Pipo Filtre vs Motorlu İç Filtre)
  if (product.sub_category === 'filtreler') {
    const isPipo = isSpongeOrAirFilter(product);
    const FilterIcon = isPipo ? SpongeFilterIcon : InternalFilterIcon;
    return (
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/35 shrink-0 flex flex-col items-center justify-center">
        <FilterIcon className="w-7 h-7 text-indigo-400" />
        <span className="text-[9px] font-medium text-indigo-300 mt-0.5">
          {isPipo ? 'Pipo' : 'İç Filtre'}
        </span>
      </div>
    );
  }

  // Hava Motoru Özel Thumbnail İkonu
  return (
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-950/75 to-slate-900 border border-violet-500/35 shrink-0 flex flex-col items-center justify-center">
      <AirPumpIcon className="w-7 h-7 text-violet-400" />
      <span className="text-[9px] font-medium text-violet-300 mt-0.5">
        {product.outlet_count && product.outlet_count >= 2 ? '2 Çıkış' : '1 Çıkış'}
      </span>
    </div>
  );
}

export default function CatalogDrawer({ onClose }: CatalogDrawerProps) {
  const {
    catalog,
    catalogSource,
    catalogError,
    loadCatalog,
    tankItems,
    selectedCategory,
    setSelectedCategory,
    addToTank,
    decrementFromTank,
    removeFromTank,
    ecosystemStatus,
  } = useAquariumStore();

  const activeTheme =
    CATEGORY_THEMES.find((t) => t.id === selectedCategory) || CATEGORY_THEMES[0];

  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
    activeTheme.subCategories[0].id
  );
  const [lightLengthFilter, setLightLengthFilter] = useState<number | null>(null);
  const [lightColorFilter, setLightColorFilter] = useState<string | null>(null);
  const [lightKelvinFilter, setLightKelvinFilter] = useState<number | null>(null);

  useEffect(() => {
    if (catalog.length === 0) {
      loadCatalog();
    }
  }, []);

  useEffect(() => {
    setSelectedSubCategory(activeTheme.subCategories[0].id);
  }, [activeTheme]);

  const filtered = catalog.filter((p) => {
    if (p.category !== activeTheme.id) return false;
    if (p.sub_category !== selectedSubCategory) return false;

    if (activeTheme.id === 'malzemeler' && p.sub_category === 'aydinlatmalar') {
      if (lightLengthFilter !== null && p.length_cm !== lightLengthFilter) return false;
      if (lightColorFilter !== null && p.light_spectrum !== lightColorFilter) return false;
      if (lightKelvinFilter !== null && p.kelvin !== lightKelvinFilter) return false;
    }
    return true;
  });

  const getItemQuantity = (productId: string) => {
    const found = tankItems.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="w-full h-full bg-slate-900/95 backdrop-blur-2xl border-r border-slate-700/80 p-4 shadow-2xl flex flex-col gap-3">
      {/* Üst Başlık */}
      <div className="flex items-center justify-between pt-14 pb-2 border-b border-slate-800">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <activeTheme.icon className={`w-5 h-5 ${activeTheme.badgeTextClass}`} />
          <span>Ürün Kataloğu</span>
          <span className="text-[11px] font-normal text-slate-400">
            ({catalog.length})
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => loadCatalog()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
            title="Supabase'den Yenile"
          >
            <RefreshCw
              className={`w-4 h-4 ${catalogSource === 'loading' ? 'animate-spin text-cyan-400' : ''}`}
            />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Kataloğu Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Supabase Bağlantı / RLS Hata Bildirimi */}
      {catalogError && (
        <div className="bg-rose-950/70 border border-rose-500/40 rounded-xl p-2.5 text-[11px] text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="break-words">{catalogError}</div>
        </div>
      )}

      {/* 1. Ana Kategori Sekmeleri */}
      <div className="grid grid-cols-2 gap-1.5">
        {CATEGORY_THEMES.map((cat) => {
          const isActive = activeTheme.id === cat.id;
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                isActive
                  ? cat.activeTabClass
                  : 'bg-slate-800/55 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <IconComp className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Aktif Kategorinin Alt Kategorileri */}
      {activeTheme.subCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
          {activeTheme.subCategories.map((sub) => {
            const isSubActive = selectedSubCategory === sub.id;
            const SubIcon = sub.icon;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubCategory(sub.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition ${
                  isSubActive
                    ? activeTheme.activeSubClass
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <SubIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Malzemeler -> Aydınlatma seçiliyken LED Boy / Renk / Kelvin Filtresi */}
      {activeTheme.id === 'malzemeler' && selectedSubCategory === 'aydinlatmalar' && (
        <div className="bg-violet-950/25 border border-violet-500/25 rounded-xl p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-violet-300 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-300" /> LED Armatür Filtresi (Boy • Renk • Kelvin)
          </div>

          <div className="flex flex-wrap gap-1">
            {[30, 40, 50, 60, 100, 200].map((len) => (
              <button
                key={len}
                onClick={() =>
                  setLightLengthFilter((prev) => (prev === len ? null : len))
                }
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  lightLengthFilter === len
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {len}cm
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
            <div className="flex gap-1">
              {[
                { id: 'beyaz', label: 'Beyaz' },
                { id: 'beyaz-mavi', label: 'B-Mavi' },
                { id: 'uc-renk', label: '3 Renk' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  onClick={() =>
                    setLightColorFilter((prev) => (prev === sp.id ? null : sp.id))
                  }
                  className={`px-2 py-0.5 rounded text-[10px] transition ${
                    lightColorFilter === sp.id
                      ? 'bg-violet-400 text-slate-950 font-bold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              {[6500, 10000].map((kv) => (
                <button
                  key={kv}
                  onClick={() =>
                    setLightKelvinFilter((prev) => (prev === kv ? null : kv))
                  }
                  className={`px-2 py-0.5 rounded text-[10px] transition ${
                    lightKelvinFilter === kv
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {kv / 1000}K
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bitki Sekmesinde Kapasite Bilgisi */}
      {activeTheme.id === 'bitkiler' && (
        <div className="text-[11px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-xl flex justify-between">
          <span>Tank Bitki Kapasitesi:</span>
          <span className="font-bold">
            {ecosystemStatus.currentPlants} / {ecosystemStatus.maxPlants} adet
          </span>
        </div>
      )}

      {/* 4. Resimli Ürün Listesi */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
        {catalogSource === 'loading' ? (
          <div className="text-center py-10 text-xs text-cyan-400">
            Ürünler Supabase&apos;den yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Bu alt kategoride henüz ürün bulunmuyor.
          </div>
        ) : (
          filtered.map((product) => {
            const qty = getItemQuantity(product.id);

            return (
              <div
                key={product.id}
                className={`bg-slate-800/55 hover:bg-slate-800/85 border border-slate-700/60 ${activeTheme.borderAccentClass} rounded-2xl p-2.5 flex items-center gap-3 transition`}
              >
                <ProductThumbnail product={product} />

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-100 truncate">
                    {product.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {product.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs font-bold ${activeTheme.badgeTextClass}`}>
                      {product.price.toFixed(2)} ₺
                    </span>
                    {product.lumen > 0 && (
                      <span className="text-[10px] font-semibold text-amber-300">
                        • {product.lumen} lm ({product.kelvin || 6500}K)
                      </span>
                    )}
                    {product.watt !== undefined && product.watt > 0 && (
                      <span className="text-[10px] text-violet-300">
                        • {product.watt}W
                      </span>
                    )}
                    {product.min_liters > 0 && (
                      <span className="text-[10px] text-slate-500">
                        • Min {product.min_liters}L
                      </span>
                    )}
                  </div>
                </div>

                {qty === 0 ? (
                  <button
                    onClick={() => addToTank(product)}
                    className="w-8 h-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 transition shadow-md shadow-cyan-500/20"
                    title="Akvaryuma Ekle"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => decrementFromTank(product.id)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-500/30 text-slate-200 hover:text-rose-200 flex items-center justify-center transition"
                        title={qty === 1 ? 'Tanktan Kaldır' : 'Adet Azalt'}
                      >
                        {qty === 1 ? (
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-xs font-bold text-cyan-300 w-5 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => addToTank(product)}
                        className="w-6 h-6 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition"
                        title="Adet Artır"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromTank(product.id)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition pr-0.5"
                    >
                      Kaldır
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}