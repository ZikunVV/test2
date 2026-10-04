import React, { useState } from 'react';
import { ThemeConfig, GradientOption, UserItem, Organization } from '../types';
import { getUserSurname } from '../utils/userUtils';
import { useLanguage } from '../utils/i18n';
import {
  Home,
  MapPin,
  Building2,
  Calendar,
  CheckSquare,
  CheckCircle2,
  History,
  Bell,
  Users2,
  MessageSquare,
  Settings,
  LogOut,
  UserCheck,
  Send,
  ChevronDown,
  Shield,
  Building,
} from 'lucide-react';

interface SidebarProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  activeNav: string;
  onSelectNav: (id: string) => void;
  unreadNotificationsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenNewMessage: () => void;
  currentUser?: UserItem;
  users?: UserItem[];
  onSwitchUser?: (userId: number) => void;
  organizations?: Organization[];
  currentOrganizationId?: string;
  onSelectOrganization?: (id: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  gradient,
  showFlatFallback,
  activeNav,
  onSelectNav,
  unreadNotificationsCount,
  isOpenMobile,
  onCloseMobile,
  onOpenNewMessage,
  currentUser,
  users = [],
  onSwitchUser,
  organizations = [],
  currentOrganizationId = 'org-1',
  onSelectOrganization,
  onLogout,
}) => {
  const { t } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const userSurname = getUserSurname(currentUser);

  const canSwitchOrganizations =
    !currentUser ||
    currentUser.role === 'admin' ||
    currentUser.organization_id === 'all';

  const currentOrg = organizations.find((o) => o.id === currentOrganizationId) || organizations[0];

  const rawNavItems = [
    { id: 'home', label: t('Главная'), icon: Home, perm: 'home' },
    { id: 'map', label: t('Карта объектов'), icon: MapPin, perm: 'map' },
    { id: 'buildings', label: t('Дома в управлении'), icon: Building2, perm: 'houses' },
    { id: 'scheduled', label: t('Плановые работы'), icon: Calendar, perm: 'planned' },
    { id: 'my_tasks', label: t(`Личный список дел (${userSurname})`), icon: CheckSquare, perm: 'my_tasks_view' },
    { id: 'people', label: t('Сотрудники'), icon: Users2, perm: 'people_view' },
    { id: 'completed', label: t('Выполненные работы'), icon: CheckCircle2, perm: 'search' },
    { id: 'history', label: t('История действий'), icon: History, perm: 'audit' },
    {
      id: 'notifications',
      label: t('Уведомления'),
      icon: Bell,
      perm: 'notifications',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: 'messages', label: t('Сообщения'), icon: MessageSquare, perm: 'messages' },
    { id: 'admin', label: t('Администрирование'), icon: Settings, perm: 'admin' },
  ];

  // Filter items by current user permissions
  const navItems = rawNavItems.filter((item) => {
    if (!item.perm) return true;
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    if (item.perm === 'people_view') {
      return (
        currentUser.permissions?.includes('people_view') ||
        currentUser.permissions?.includes('internal') ||
        currentUser.permissions?.includes('add_employee')
      );
    }
    return currentUser.permissions?.includes(item.perm);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <aside
        style={{
          backgroundColor: theme.keyColors.sidebarBg,
          borderColor: theme.keyColors.cardBorder,
        }}
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 flex flex-col justify-between z-30 transition-transform duration-200 border-r overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Logo Section */}
        <div>
          <div className="p-5 pb-4 flex items-center gap-3 border-b border-purple-200/60">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 text-white"
              style={{
                background: showFlatFallback
                  ? '#7652B5'
                  : gradient.cssGradient,
                boxShadow: showFlatFallback ? 'none' : gradient.glowShadow,
              }}
            >
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-extrabold tracking-wider text-base uppercase"
                  style={{ color: theme.keyColors.textPrimary }}
                >
                  WORK
                </span>
                <span
                  className="font-light tracking-widest text-base uppercase opacity-75"
                  style={{ color: theme.keyColors.textSecondary }}
                >
                  FLOW
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-700 opacity-90 flex items-center gap-1">
                <span>ЖКХ</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Multi-Tenant Organization Switcher */}
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (canSwitchOrganizations) {
                    setOrgDropdownOpen(!orgDropdownOpen);
                  }
                }}
                className={`w-full p-2.5 rounded-xl border border-purple-200/90 bg-white/95 text-left transition-all shadow-2xs flex items-center justify-between gap-2 group ${
                  canSwitchOrganizations
                    ? 'hover:bg-white hover:shadow-xs cursor-pointer'
                    : 'cursor-default opacity-95'
                }`}
                title={
                  canSwitchOrganizations
                    ? t('Сменить активную организацию')
                    : t('Вы привязаны к этой организации')
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1">
                      <span>{t('Организация')}</span>
                    </div>
                    <div className="text-xs font-black text-slate-900 truncate">
                      {currentOrg?.name || 'КП «ЖЄК-10»'}
                    </div>
                  </div>
                </div>
                {canSwitchOrganizations && (
                  <ChevronDown
                    className={`w-4 h-4 text-purple-600 transition-transform shrink-0 ${
                      orgDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {orgDropdownOpen && canSwitchOrganizations && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('Выберите организацию')}
                  </div>

                  {organizations.map((org) => {
                    const isSelected = org.id === currentOrganizationId;
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          if (onSelectOrganization) {
                            onSelectOrganization(org.id);
                          }
                          setOrgDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-100 text-purple-950 font-bold border border-purple-200'
                            : 'hover:bg-purple-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs truncate">{org.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {org.slug}.azikun.com
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-purple-700 shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {currentUser?.role === 'admin' && (
                    <div className="pt-1 border-t border-purple-100 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOrgDropdownOpen(false);
                          onSelectNav('admin');
                        }}
                        className="w-full text-left px-2 py-1.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>{t('Управление организациями')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links with Gradient Selection */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectNav(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative overflow-hidden ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                  }`}
                  style={{
                    background: isActive
                      ? showFlatFallback
                        ? '#7652B5'
                        : gradient.activeItemGradient
                      : 'transparent',
                    boxShadow:
                      isActive && !showFlatFallback
                        ? gradient.buttonShadow
                        : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5 z-10">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-white stroke-[2.5]'
                          : 'text-purple-700 stroke-2'
                      }`}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${
                        isActive
                          ? 'bg-white text-purple-900 font-extrabold shadow-2xs'
                          : 'bg-rose-500 text-white font-bold'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-purple-200/60 space-y-3">
          {/* User selector */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/60 hover:bg-white border border-purple-200/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-white shadow-2xs"
                  style={{
                    background: showFlatFallback
                      ? '#7652B5'
                      : gradient.cssGradient,
                  }}
                >
                  {currentUser?.role === 'admin' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div
                    className="text-xs font-bold truncate leading-tight"
                    style={{ color: theme.keyColors.textPrimary }}
                  >
                    {currentUser?.full_name || 'Главный администратор'}
                  </div>
                  <div className="text-[10px] font-medium text-purple-700 flex items-center gap-1">
                    <span>
                      {currentUser?.role === 'admin'
                        ? 'Администратор'
                        : currentUser?.role === 'editor'
                        ? 'Редактор'
                        : 'Наблюдатель'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* User switch dropdown */}
            {userDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 p-1.5 bg-white rounded-xl shadow-xl border border-purple-200 z-40 space-y-1">
                {currentUser?.role === 'admin' && (
                  <>
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Сменить аккаунт (режим Админа):
                    </div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (onSwitchUser) onSwitchUser(u.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentUser?.id === u.id
                            ? 'bg-purple-50 text-purple-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{u.full_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {u.role === 'admin'
                              ? 'Полный доступ (Админ)'
                              : u.role === 'editor'
                              ? 'Диспетчер/Мастер'
                              : 'Только чтение'}
                          </div>
                        </div>
                        {currentUser?.id === u.id && (
                          <span className="w-2 h-2 rounded-full bg-purple-700" />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {onLogout && (
                  <div className={currentUser?.role === 'admin' ? 'pt-1 mt-1 border-t border-purple-100' : ''}>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('Выйти из аккаунта')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onOpenNewMessage();
                onCloseMobile();
              }}
              className="flex-1 flex items-center gap-2 py-2 px-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/90 border border-purple-200/70 text-[11px] text-purple-800 hover:text-purple-950 font-bold transition-all cursor-pointer active:scale-98 min-w-0"
            >
              <Send className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="truncate">{t('Написать администратору')}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title={t('Выйти из аккаунта (Экран входа)')}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
