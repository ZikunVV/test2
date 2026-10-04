import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';
import { useLanguage } from '../utils/i18n';
import { Smartphone, Download, X, WifiOff, Share2, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { t } = useLanguage();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) {
    return null;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://azikun.com';

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-purple-200 text-xs space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Ярлык приложения на телефон
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Установка иконки WORKFLOW
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

            {/* Interactive App Icon-Link Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between gap-3">
              <a
                href={appUrl}
                className="flex items-center gap-3 group min-w-0"
                title="Прямая иконка-ссылка WORKFLOW"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-900 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform relative">
                  W
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white absolute -top-1 -right-1" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-sm text-purple-950 truncate flex items-center gap-1">
                    <span>WORKFLOW ЖКХ</span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  </div>
                  <div className="text-[11px] font-mono text-purple-700 truncate">
                    {appUrl}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Нажмите на иконку или добавьте на экран «Домой»
                  </div>
                </div>
              </a>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-[11px] flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-700" />
                    <span>Ссылка</span>
                  </>
                )}
              </button>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={() => install()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Установить иконку на главный экран сейчас</span>
              </button>
            )}

            {isIOS ? (
              <div className="space-y-2.5 bg-purple-50/70 p-3.5 rounded-xl border border-purple-100">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-purple-700" />
                  <span>Как добавить иконку на экран iPhone / iPad:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                  <li>
                    Нажмите кнопку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх) внизу браузера.
                  </li>
                  <li>
                    Выберите <strong>«На экран «Домой»»</strong> (Add to Home Screen).
                  </li>
                  <li>
                    Нажмите <strong>«Добавить»</strong> — иконка <strong>W</strong> появится на экране телефона.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 bg-purple-50/70 p-3.5 rounded-xl border border-purple-100">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Как добавить иконку на экран Android / ПК:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                  <li>
                    Нажмите на <strong>три точки `⋮`</strong> в правом верхнем углу браузера телефона.
                  </li>
                  <li>
                    Нажмите <strong>«Добавить на главный экран»</strong> (или <strong>«Установить приложение»</strong>).
                  </li>
                  <li>
                    Подтвердите нажатием <strong>«Добавить»</strong> — иконка <strong>WORKFLOW</strong> появится среди приложений на вашем телефоне!
                  </li>
                </ol>
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
