'use client';

import React from 'react';
import { Plus, Fish, X } from 'lucide-react';
import { useAquariumStore } from '../../store/useAquariumStore';

interface CatalogDrawerProps {
  onClose?: () => void;
}

export default function CatalogDrawer({ onClose }: CatalogDrawerProps) {
  const { catalog, selectedCategory, setSelectedCategory, addToTank } = useAquariumStore();

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'baliklar', label: 'Balıklar' },
    { id: 'bitkiler', label: 'Bitkiler' },
    { id: 'kumlar', label: 'Kumlar' },
    { id: 'malzemeler', label: 'Ekipman' },
  ];

  const filtered = selectedCategory === 'all'
    ? catalog
    : catalog.filter(p => p.category === selectedCategory);

  return (
    <div className="w-80 max-h-[72vh] bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Fish className="w-4 h-4 text-cyan-400" /> Ürün Kataloğu
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Kategori Sekmeleri */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 rounded-lg px-2.5 py-1 text-xs font-medium transition'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent rounded-lg px-2.5 py-1 text-xs transition'
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Ürün Listesi */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
        {filtered.map(product => (
          <div
            key={product.id}
            className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-2 transition"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-100 truncate">{product.name}</div>
              <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">{product.description}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-bold text-cyan-400">{product.price.toFixed(2)} ₺</span>
                <span className="text-[11px] text-slate-500">• Min {product.min_liters}L</span>
              </div>
            </div>
            <button
              onClick={() => addToTank(product)}
              className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 transition shadow-md shadow-cyan-500/20"
              title="Akvaryuma Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

