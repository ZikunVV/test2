import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';
import { useLanguage } from '../utils/i18n';
import { Smartphone, Download, X, WifiOff, Share2, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { t } = useLanguage();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all shadow-2xs cursor-pointer"
        title={t('Установить приложение на телефон или компьютер')}
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="hidden sm:inline">{t('На телефон')}</span>
        <Download className="w-3 h-3 text-emerald-600 shrink-0" />
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-purple-200 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Мобильное приложение (PWA)
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Установка WORKFLOW на телефон / ПК
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 bg-purple-50/70 p-3.5 rounded-xl border border-purple-100">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-purple-700" />
                  <span>Как установить на iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                  <li>
                    Нажмите кнопку <strong>«Поделиться»</strong> в нижней панели Safari.
                  </li>
                  <li>
                    Прокрутите меню вниз и выберите <strong>«На экран «Домой»»</strong> (Add to Home Screen).
                  </li>
                  <li>
                    Нажмите <strong>«Добавить»</strong> в правом верхнем углу.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 bg-purple-50/70 p-3.5 rounded-xl border border-purple-100">
                  <div className="font-bold text-purple-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Android (Chrome) или Компьютер:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                    <li>
                      Откройте прямую ссылку сайта в отдельной вкладке браузера.
                    </li>
                    <li>
                      В меню браузера (три точки справа вверху) выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.
                    </li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold">Преимущества установки:</div>
                  <p className="text-[11px] text-emerald-800">
                    Иконка WORKFLOW появится прямо на рабочем столе телефона, приложение будет открываться на весь экран без адресной строки и работать даже при слабом сигнале связи в подвалах и на выезде.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-400">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        {t('Автономный режим (Offline) — работа из локального кэша, синхронизация при появлении сети.')}
      </span>
    </div>
  );
};
