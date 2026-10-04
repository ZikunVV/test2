import React from 'react';
import { GRADIENT_VARIANTS } from '../data/gradients';
import { ThemeConfig, GradientId } from '../types';
import { Sparkles, X, Check, Info, ArrowRight } from 'lucide-react';

interface DesignInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  currentGradientId: GradientId;
  onSelectGradient: (id: GradientId) => void;
}

export const DesignInsightsDrawer: React.FC<DesignInsightsDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  currentGradientId,
  onSelectGradient,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-2xs" onClick={onClose}>
      <div
        className="w-full max-w-md h-full shadow-2xl p-6 border-l flex flex-col justify-between overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base">Гид по градиентам «Светлая лаванда»</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs leading-relaxed">
            {/* Context callout */}
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-purple-700" />
                <span>Градиенты от светлого к тёмному</span>
              </div>
              <p className="text-slate-600">
                По вашему запросу базовым стилем зафиксирована <strong>«Светлая лаванда»</strong>. Для выделения пунктов сайдбара и кнопки <strong>«+ Заявка»</strong> создано 4 варианта градиента с плавным нарастанием глубины цвета.
              </p>
            </div>

            {/* Status Gradients breakdown */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                Градиенты статусов (приглушенные, без давления на глаза):
              </h4>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl border border-rose-200/80 bg-rose-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ background: 'linear-gradient(135deg, #B58490 0%, #9A6874 50%, #764A54 100%)' }}
                    />
                    <div>
                      <div className="font-bold text-slate-900">В ожидании</div>
                      <div className="text-[10px] text-slate-500 font-mono">#B58490 → #9A6874 → #764A54</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #B58490 0%, #9A6874 50%, #764A54 100%)' }}>
                    Пыльная роза
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ background: 'linear-gradient(135deg, #BFA07C 0%, #A3825D 50%, #7E613E 100%)' }}
                    />
                    <div>
                      <div className="font-bold text-slate-900">В работе</div>
                      <div className="text-[10px] text-slate-500 font-mono">#BFA07C → #A3825D → #7E613E</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #BFA07C 0%, #A3825D 50%, #7E613E 100%)' }}>
                    Мягкий песок / лен
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ background: 'linear-gradient(135deg, #8AAFA0 0%, #6E9484 50%, #4D7363 100%)' }}
                    />
                    <div>
                      <div className="font-bold text-slate-900">Выполнено</div>
                      <div className="text-[10px] text-slate-500 font-mono">#8AAFA0 → #6E9484 → #4D7363</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #8AAFA0 0%, #6E9484 50%, #4D7363 100%)' }}>
                    Скандинавский шалфей
                  </span>
                </div>
              </div>
            </div>

            {/* Why light-to-dark gradient works better than flat color */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                Почему градиент лучше плоского цвета:
              </h4>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-purple-100 flex gap-2.5">
                  <span className="font-bold text-purple-600">01</span>
                  <div>
                    <strong className="block font-semibold">Ощущение объёма и нажатия</strong>
                    <span className="text-slate-500">
                      Светлый верхний левый край имитирует естественный световой блик, делая кнопку выпуклой и осязаемой.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-purple-100 flex gap-2.5">
                  <span className="font-bold text-purple-600">02</span>
                  <div>
                    <strong className="block font-semibold">Абсолютная чёткость текста</strong>
                    <span className="text-slate-500">
                      Переход в тёмный фиолетовый справа (#532E94, #4E1B85, #2C1E70) гарантирует контрастность белого шрифта выше 7:1 (стандарт WCAG AAA).
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-purple-100 flex gap-2.5">
                  <span className="font-bold text-purple-600">03</span>
                  <div>
                    <strong className="block font-semibold">Акцент без визуальной перегрузки</strong>
                    <span className="text-slate-500">
                      На светлом лавандовом фоне сайдбара (#F3EEFA) активный пункт меню смотрится естественно и не давит монотонным пятном.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Variants Interactive Switcher inside Drawer */}
            <div className="pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                Быстрое переключение градиента:
              </h4>
              <div className="space-y-2">
                {(Object.keys(GRADIENT_VARIANTS) as GradientId[]).map((id) => {
                  const g = GRADIENT_VARIANTS[id];
                  const isCur = currentGradientId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onSelectGradient(id)}
                      className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                        isCur
                          ? 'border-purple-600 bg-purple-50 font-bold ring-1 ring-purple-300'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-4 rounded-full shrink-0 border border-black/10 shadow-2xs"
                          style={{ background: g.cssGradient }}
                        />
                        <div>
                          <div className="text-xs text-slate-900 font-bold leading-tight">
                            {g.number}. {g.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {g.fromColor} → {g.toColor}
                          </div>
                        </div>
                      </div>
                      {isCur && <Check className="w-4 h-4 text-purple-700" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
