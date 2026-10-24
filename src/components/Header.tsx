import React, { useState, useRef, useEffect } from 'react';
import { ThemeConfig, GradientOption, UserItem } from '../types';
import { useLanguage } from '../utils/i18n';
import { PWAInstallButton } from './PWAInstallButton';
import { ArrowLeft, Globe, ChevronDown, Menu, User, Bell, Database, FolderDown, Mic, ChevronLeft, ChevronRight, Palette } from 'lucide-react';

interface HeaderProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  onBackClick: () => void;
  onToggleMobileMenu: () => void;
  onOpenNotifications: () => void;
  onOpenVoiceControl?: () => void;
  unreadCount: number;
  isAdmin?: boolean;
  canAccessDatabase?: boolean;
  canAccessProject?: boolean;
  onOpenBackupModal?: () => void;
  onDownloadProject?: () => void;
  isDownloadingProject?: boolean;
  currentUser?: UserItem;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  gradient,
  showFlatFallback,
  onBackClick,
  onToggleMobileMenu,
  onOpenNotifications,
  onOpenVoiceControl,
  unreadCount,
  isAdmin = false,
  canAccessDatabase = isAdmin,
  canAccessProject = isAdmin,
  onOpenBackupModal,
  onDownloadProject,
  isDownloadingProject = false,
  currentUser,
}) => {
  const { lang, setLang, t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, select')) return;
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollStart(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollStart - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 200);
  };

  return (
    <header
      className="relative border-b sticky top-0 z-20 backdrop-blur-sm bg-white/95 transition-colors"
      style={{
        borderColor: theme.keyColors.cardBorder,
      }}
    >
      {/* Left scroll indicator / nudge button for phone / narrow viewports */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-180)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 p-1 rounded-full bg-white/90 shadow-md border border-purple-200 text-purple-800 hover:bg-purple-50 transition-all cursor-pointer"
          title="Листать влево"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Right scroll indicator / nudge button for phone / narrow viewports */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(180)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 p-1 rounded-full bg-white/90 shadow-md border border-purple-200 text-purple-800 hover:bg-purple-50 transition-all cursor-pointer"
          title="Листать вправо к пользователю"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Scrollable / Swipeable Header Row */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`px-3 sm:px-6 py-2.5 sm:py-3.5 overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x transition-colors ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
        }}
      >
        <div className="min-w-max flex items-center justify-between gap-2.5 sm:gap-4 w-full">
          {/* Left: Mobile trigger + Quick Voice Button on mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 rounded-lg lg:hidden text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
              title={t('Меню')}
            >
            <Menu className="w-5 h-5" />
          </button>

          {onOpenVoiceControl && (
            <button
              type="button"
              onClick={onOpenVoiceControl}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
              title="Голосовой набор заметок и голосовая навигация по сайту"
            >
              <Mic className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>Голосовой набор</span>
            </button>
          )}
        </div>

        {/* Right controls: Back button, Display Settings, Notifications, Language, User */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
        <button
          onClick={onBackClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
          style={{
            borderColor: theme.keyColors.cardBorder,
            color: theme.keyColors.textPrimary,
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('Назад')}</span>
        </button>

        {/* PWA Install Button (Шаг 5) */}
        <PWAInstallButton />


        {/* Notifications Icon button for quick access */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg border transition-colors hover:bg-black/5"
          style={{
            borderColor: theme.keyColors.cardBorder,
            color: theme.keyColors.textPrimary,
          }}
          title={t('Уведомления')}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Database Backup & Export/Import button (Visible ONLY to users with permissions) */}
        {canAccessDatabase && onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all hover:bg-purple-50 text-purple-900 border-purple-200 shadow-2xs cursor-pointer"
            style={{
              borderColor: theme.keyColors.cardBorder,
            }}
            title={t('Резервная копия (Экспорт/Импорт)')}
          >
            <Database className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden md:inline">{t('База данных')}</span>
          </button>
        )}

        {/* Project Archive Download Button ("проэкт") (Visible ONLY to users with permissions) */}
        {canAccessProject && onDownloadProject && (
          <button
            onClick={onDownloadProject}
            disabled={isDownloadingProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all hover:bg-purple-50 text-purple-900 border-purple-200 shadow-2xs cursor-pointer active:scale-95"
            style={{
              borderColor: theme.keyColors.cardBorder,
            }}
            title="Скачать последнюю версию проекта (ZIP архив для переноса в AI Studio / ChatGPT)"
          >
            <FolderDown className="w-3.5 h-3.5 text-purple-700" />
            <span className="font-bold">{isDownloadingProject ? t('Сборка...') : t('проэкт')}</span>
          </button>
        )}



        {/* Языковой переключатель (Всегда на виду, никогда не скрывается за фоном) */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50/90 border border-purple-200/90 shrink-0 shadow-2xs"
          title="Выбор языка интерфейса"
        >
          <Globe className="w-3.5 h-3.5 text-purple-700 shrink-0" />
          <div className="flex items-center p-0.5 rounded-lg bg-white border border-purple-200/80 gap-0.5">
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                lang === 'ru'
                  ? 'bg-purple-700 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
              }`}
              title="Русский язык"
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLang('ua')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                lang === 'ua'
                  ? 'bg-purple-700 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
              }`}
              title="Українська мова"
            >
              UA
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-purple-700 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
              }`}
              title="English"
            >
              EN
            </button>
          </div>
        </div>

        {/* User indicator (Image 1) with gradient - visible on all screens with horizontal swipe */}
        <div
          className="flex items-center gap-2 font-medium shrink-0"
          style={{ color: theme.keyColors.textPrimary }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-2xs shrink-0"
            style={{
              background: showFlatFallback
                ? '#7652B5'
                : gradient.cssGradient,
            }}
          >
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="shrink-0">{currentUser?.full_name || 'Главный администратор'}</span>
        </div>
      </div>
    </div>
  </div>
</header>
);
};
