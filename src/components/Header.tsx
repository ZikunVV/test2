import React, { useState } from 'react';
import { ThemeConfig, GradientOption, UserItem } from '../types';
import { useLanguage } from '../utils/i18n';
import { PWAInstallButton } from './PWAInstallButton';
import { ArrowLeft, Globe, ChevronDown, Menu, User, Bell, Database, FolderDown, Mic } from 'lucide-react';

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
  onOpenBackupModal,
  onDownloadProject,
  isDownloadingProject = false,
  currentUser,
}) => {
  const { lang, setLang, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  return (
    <header
      className="px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-2 sm:gap-4 transition-colors sticky top-0 z-20 backdrop-blur-sm bg-white/95"
      style={{
        borderColor: theme.keyColors.cardBorder,
      }}
    >
      {/* Left: Mobile trigger + Quick Voice Button on mobile */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg lg:hidden text-slate-500 hover:text-slate-800"
          title={t('Меню')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {onOpenVoiceControl && (
          <button
            type="button"
            onClick={onOpenVoiceControl}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Голосовой набор заметок и голосовая навигация по сайту"
          >
            <Mic className="w-3.5 h-3.5 text-purple-700 shrink-0" />
            <span className="hidden xs:inline sm:inline">Голосовой набор</span>
          </button>
        )}
      </div>

      {/* Right controls: Back button, Display Settings, Notifications, Language, User */}
      <div className="flex items-center gap-3 text-xs">
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

        {/* Database Backup & Export/Import button (Visible ONLY to Chief Administrator) */}
        {isAdmin && onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all hover:bg-purple-50 text-purple-900 border-purple-200 shadow-2xs"
            style={{
              borderColor: theme.keyColors.cardBorder,
            }}
            title={t('Резервная копия (Экспорт/Импорт)')}
          >
            <Database className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden md:inline">{t('База данных')}</span>
          </button>
        )}

        {/* Project Archive Download Button ("проэкт") (Visible ONLY to Chief Administrator) */}
        {isAdmin && onDownloadProject && (
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

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
            style={{ color: theme.keyColors.textSecondary }}
          >
            <Globe className="w-3.5 h-3.5 opacity-70" />
            <span>
              {t('Язык:')}{' '}
              <strong style={{ color: theme.keyColors.textPrimary }}>
                {lang === 'ru' ? 'Русский' : lang === 'ua' ? 'Українська' : 'English'}
              </strong>
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {langDropdownOpen && (
            <div
              className="absolute right-0 mt-1 w-36 rounded-lg shadow-lg border p-1 z-30 bg-white"
              style={{
                borderColor: theme.keyColors.cardBorder,
              }}
            >
              <button
                onClick={() => {
                  setLang('ru');
                  setLangDropdownOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-purple-50 font-medium ${
                  lang === 'ru' ? 'bg-purple-50 text-purple-900 font-bold' : ''
                }`}
                style={{ color: lang === 'ru' ? undefined : theme.keyColors.textPrimary }}
              >
                Русский (RU)
              </button>
              <button
                onClick={() => {
                  setLang('ua');
                  setLangDropdownOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-purple-50 font-medium ${
                  lang === 'ua' ? 'bg-purple-50 text-purple-900 font-bold' : ''
                }`}
                style={{ color: lang === 'ua' ? undefined : theme.keyColors.textPrimary }}
              >
                Українська (UA)
              </button>
              <button
                onClick={() => {
                  setLang('en');
                  setLangDropdownOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-purple-50 font-medium ${
                  lang === 'en' ? 'bg-purple-50 text-purple-900 font-bold' : ''
                }`}
                style={{ color: lang === 'en' ? undefined : theme.keyColors.textPrimary }}
              >
                English (EN)
              </button>
            </div>
          )}
        </div>

        {/* User indicator (Image 1) with gradient */}
        <div
          className="hidden sm:flex items-center gap-2 font-medium"
          style={{ color: theme.keyColors.textPrimary }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-2xs"
            style={{
              background: showFlatFallback
                ? '#7652B5'
                : gradient.cssGradient,
            }}
          >
            <User className="w-3.5 h-3.5" />
          </div>
          <span>{currentUser?.full_name || 'Главный администратор'}</span>
        </div>
      </div>
    </header>
  );
};
