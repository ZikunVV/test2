import React from 'react';
import { ThemeConfig } from '../types';
import { MANAGED_BUILDINGS } from '../data/mockData';
import { X, Building2, MapPin, Calendar, MessageSquare, Settings, Users, Shield, Sliders } from 'lucide-react';

interface OtherViewsModalProps {
  viewId: string | null;
  onClose: () => void;
  theme: ThemeConfig;
  onOpenDisplaySettings?: () => void;
}

export const OtherViewsModal: React.FC<OtherViewsModalProps> = ({
  viewId,
  onClose,
  theme,
  onOpenDisplaySettings,
}) => {
  if (!viewId || viewId === 'home') return null;

  const renderContent = () => {
    switch (viewId) {
      case 'buildings':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base">Дома в управлении</h3>
            </div>
            <p className="text-xs text-slate-500">
              Список жилых многоквартирных домов под управлением компании.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MANAGED_BUILDINGS.map((b, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border flex flex-col justify-between text-xs"
                  style={{ borderColor: theme.keyColors.cardBorder }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{b.address}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        b.activeTickets > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-500">
                    <div>Квартир: {b.apartmentsCount}</div>
                    <div>Год постройки: {b.year}</div>
                    <div className="text-purple-600 dark:text-purple-400 font-medium">
                      Активных заявок: {b.activeTickets}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base">Карта объектов и заявок</h3>
            </div>
            <div
              className="w-full h-64 rounded-xl border flex flex-col items-center justify-center p-4 relative overflow-hidden"
              style={{
                backgroundColor: '#F7F5FC',
                borderColor: theme.keyColors.cardBorder,
              }}
            >
              {/* Stylized schematic map */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#9B78D4_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="z-10 text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-purple-100 text-purple-700 shadow-sm">
                  <MapPin className="w-6 h-6 animate-bounce" />
                </div>
                <div className="font-bold text-sm">Интерактивная карта района</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  4 жилых дома на ул. Доценка, 4 активные бригады сантехников и электриков на маршруте.
                </p>
              </div>
            </div>
          </div>
        );

      case 'scheduled':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base">Плановые работы (Сентябрь 2026)</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border" style={{ borderColor: theme.keyColors.cardBorder }}>
                <div className="font-bold">Опрессовка отопительной системы</div>
                <div className="text-slate-500 mt-0.5">Доценка, 1 и 1а · 28.09.2026 · Бригада теплотехников</div>
              </div>
              <div className="p-3 rounded-xl border" style={{ borderColor: theme.keyColors.cardBorder }}>
                <div className="font-bold">Осмотр кровли и водостоков перед осенним сезоном</div>
                <div className="text-slate-500 mt-0.5">Доценка, 5а · 30.09.2026 · Инженер технадзора</div>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base">Внутренний чат и служебные сообщения</h3>
            </div>
            <div className="p-3 rounded-xl border text-xs" style={{ borderColor: theme.keyColors.cardBorder }}>
              <div className="font-bold">Мастер Смирнов А.</div>
              <div className="text-slate-500 mt-1">«Заменил прокладку на Доценка, 1а. Давление в норме, течь устранена.»</div>
              <span className="text-[10px] text-slate-400 mt-1 block">15 минут назад</span>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base">Администрирование системы ЖКХ Контроль</h3>
            </div>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p>Права доступа: <strong>Суперадминистратор</strong></p>
              <p>Интеграция ГИС ЖКХ: <strong>Синхронизировано</strong></p>
              <p>База абонентов: <strong>432 лицевых счёта</strong></p>
            </div>

            {/* Display Settings Quick Action */}
            {onOpenDisplaySettings && (
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Sliders className="w-4 h-4 text-purple-700" />
                  <span>Настройки экрана и контрастности</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ползунки настройки насыщенности, контрастности, яркости и фильтра защиты глаз от синего света.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDisplaySettings();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Открыть ползунки настройки цвета</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-xs text-slate-500 py-4">
            Раздел «{viewId}» находится в активном режиме.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="rounded-2xl max-w-lg w-full p-6 shadow-2xl border transition-all"
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderContent()}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-black/5"
            style={{ borderColor: theme.keyColors.cardBorder }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
