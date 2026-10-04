import React from 'react';
import { GRADIENT_VARIANTS } from '../data/gradients';
import { GradientId } from '../types';
import { Columns, Check, Sparkles, Sliders } from 'lucide-react';

interface VariantSwitcherProps {
  currentGradientId: GradientId;
  onSelectGradient: (id: GradientId) => void;
  onOpenComparison: () => void;
  showOriginalOverlay: boolean;
  onToggleOriginalOverlay: () => void;
  onOpenDisplaySettings?: () => void;
}

export const VariantSwitcher: React.FC<VariantSwitcherProps> = ({
  currentGradientId,
  onSelectGradient,
  onOpenComparison,
  showOriginalOverlay,
  onToggleOriginalOverlay,
  onOpenDisplaySettings,
}) => {
  const currentGradient = GRADIENT_VARIANTS[currentGradientId];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-200/70 shadow-xs px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & current mode summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-xs"
              style={{
                background: currentGradient.cssGradient,
                boxShadow: currentGradient.glowShadow,
              }}
            >
              WF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Светлая лаванда
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  4 градиента: от светлого к тёмному
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Выделение пунктов и кнопка «+ Заявка»
              </div>
            </div>
          </div>
        </div>

        {/* Center: 4 Gradient Switcher Options */}
        <div className="flex items-center gap-1.5 p-1 bg-purple-100/60 rounded-xl overflow-x-auto max-w-full border border-purple-200/50">
          {(Object.keys(GRADIENT_VARIANTS) as GradientId[]).map((gradId) => {
            const grad = GRADIENT_VARIANTS[gradId];
            const isActive = currentGradientId === gradId;

            return (
              <button
                key={gradId}
                onClick={() => onSelectGradient(gradId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-purple-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {/* Visual miniature gradient preview pill */}
                <span
                  className="w-4 h-3 rounded-full shrink-0 border border-black/10 shadow-2xs"
                  style={{ background: grad.cssGradient }}
                  title={`${grad.fromColor} → ${grad.toColor}`}
                />
                <span>
                  {grad.number}. {grad.name}
                </span>
                {isActive && <Check className="w-3 h-3 text-purple-700 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right: Display settings, Compare & Before/After buttons */}
        <div className="flex items-center gap-2">
          {onOpenDisplaySettings && (
            <button
              onClick={onOpenDisplaySettings}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100"
              title="Настроить контрастность, насыщенность и яркость"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-700" />
              <span>Настройка цвета</span>
            </button>
          )}

          <button
            onClick={onToggleOriginalOverlay}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              showOriginalOverlay
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-200'
            }`}
            title="Сравнить с монотонным стилем без градиента"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Исходный плоский цвет</span>
            <span className="sm:hidden">Плоский цвет</span>
          </button>

          <button
            onClick={onOpenComparison}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-xs"
            style={{
              background: currentGradient.cssGradient,
              boxShadow: currentGradient.glowShadow,
            }}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Сравнить 4 градиента</span>
          </button>
        </div>
      </div>
    </header>
  );
};
