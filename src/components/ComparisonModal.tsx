import React from 'react';
import { GRADIENT_VARIANTS } from '../data/gradients';
import { GradientId } from '../types';
import { X, Check, Eye, Plus, Home, Sparkles, ArrowRight } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGradientId: GradientId;
  onSelectGradient: (id: GradientId) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  currentGradientId,
  onSelectGradient,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-purple-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                Светлая лаванда
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                4 варианта градиента «от светлого к тёмному»
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Сравнение переливов для активных пунктов меню (Главная, Карта...) и кнопки «+ Заявка»
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {(Object.keys(GRADIENT_VARIANTS) as GradientId[]).map((gradId) => {
            const grad = GRADIENT_VARIANTS[gradId];
            const isSelected = currentGradientId === gradId;

            return (
              <div
                key={gradId}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-400/40 bg-purple-50/30 shadow-md'
                    : 'border-purple-100 bg-white hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                      Вариант {grad.number}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Выбран
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {grad.name}
                  </h3>
                  <div className="text-[11px] text-purple-700 font-semibold mb-2">
                    {grad.badge}
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    {grad.description}
                  </p>

                  {/* LIVE PREVIEW: Active Menu Item + +Заявка Button */}
                  <div className="rounded-xl p-3 bg-[#F3EEFA] border border-purple-200/80 space-y-3 mb-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Живое превью:
                    </div>

                    {/* Preview 1: Active Nav item */}
                    <div
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-between shadow-xs"
                      style={{
                        background: grad.activeItemGradient,
                        boxShadow: grad.glowShadow,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Home className="w-3.5 h-3.5 text-white" />
                        <span>Главная</span>
                      </div>
                      <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-bold">
                        Активно
                      </span>
                    </div>

                    {/* Preview 2: + Заявка Button */}
                    <div className="flex items-center justify-center pt-1">
                      <div
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
                        style={{
                          background: grad.cssGradient,
                          boxShadow: grad.buttonShadow,
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ Заявка</span>
                      </div>
                    </div>
                  </div>

                  {/* Gradient Steps Bar (from light to dark) */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      <span>Светлый край</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>Тёмный край</span>
                    </div>

                    {/* Continuous color bar */}
                    <div
                      className="w-full h-4 rounded-lg border border-black/10 shadow-2xs mb-2"
                      style={{ background: grad.cssGradient }}
                    />

                    {/* Hex breakdown */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                      {grad.hexSteps.map((hex, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                          <span className="mt-0.5 text-[9px]">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-1 pt-2 border-t border-purple-100">
                    {grad.keyFeatures.map((feat, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <span className="text-purple-500 font-bold shrink-0">•</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-5 pt-3 border-t border-purple-100">
                  <button
                    onClick={() => {
                      onSelectGradient(gradId);
                      onClose();
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-900'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Выбран в системе
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Применить этот градиент
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div>
            <strong className="text-purple-900 font-bold">
              Как работает градиент «от светлого к тёмному»:
            </strong>
            <p className="text-slate-600 mt-0.5">
              Светлая часть градиента создаёт ощущение естественного верхнего освещения (блик), а переход в глубокий фиолетовый обеспечивает чёткий контраст для белого текста и пиктограмм (соответствие WCAG AA).
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shrink-0 font-bold text-xs"
          >
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};
