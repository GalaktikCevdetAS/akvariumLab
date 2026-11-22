'use client';

import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X } from 'lucide-react';
import { useAquariumStore } from '../../store/useAquariumStore';

interface ShoppingCartPanelProps {
  onClose?: () => void;
}

export default function ShoppingCartPanel({ onClose }: ShoppingCartPanelProps) {
  const { tankItems, updateQuantity, removeFromTank } = useAquariumStore();

  const totalPrice = tankItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItemsCount = tankItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="w-80 max-h-[72vh] bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-4 shadow-2xl flex flex-col justify-between min-h-0">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-cyan-400" /> Alışveriş Listesi
          </h3>
          <span className="text-[11px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-medium">
            {totalItemsCount}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {tankItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-500 text-xs">
          <ShoppingCart className="w-7 h-7 mb-1.5 opacity-40" />
          Tankınızda henüz ürün yok.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1 min-h-0">
          {tankItems.map(item => (
            <div
              key={item.product.id}
              className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-medium text-white truncate">{item.product.name}</div>
                <div className="text-[11px] text-cyan-400 font-medium">{(item.product.price * item.quantity).toFixed(2)} ₺</div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center justify-center transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center justify-center transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromTank(item.product.id)}
                  className="w-6 h-6 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center transition ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alt Toplam ve Onay */}
      <div className="pt-3 border-t border-slate-700/70 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-400">Tahmini Toplam</div>
          <div className="text-base font-bold text-emerald-400">{totalPrice.toFixed(2)} ₺</div>
        </div>
        <button
          onClick={() => alert('Sipariş başarıyla oluşturuldu! Akvaryum ekosisteminiz hazırlanıyor.')}
          disabled={tankItems.length === 0}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-3.5 py-2 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
        >
          Sepeti Onayla
        </button>
      </div>
    </div>
  );
}

