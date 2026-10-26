import React, { useState, useEffect } from 'react';
import { UserItem, Organization } from '../types';
import {
  canUserManageAccessRights,
  PHONE_STATUS_STYLES,
} from '../utils/phoneAccess';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Lock,
  Unlock,
  Key,
  Building,
  Check,
  X,
  AlertTriangle,
  Info,
  Sliders,
  Users,
} from 'lucide-react';

export interface AccountAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserItem | null;
  currentUser: UserItem | null | undefined;
  organizations?: Organization[];
  onSaveAccess: (userId: number, updates: Partial<UserItem>) => void;
}

export const AccountAccessModal: React.FC<AccountAccessModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  organizations = [],
  onSaveAccess,
}) => {
  const canManage = canUserManageAccessRights(currentUser);

  // Form states
  const [phoneAccessEnabled, setPhoneAccessEnabled] = useState(false);
  const [phoneAccessLevel, setPhoneAccessLevel] = useState<number>(1);
  const [canManageAccess, setCanManageAccess] = useState(false);
  const [userPhoneStatus, setUserPhoneStatus] = useState<number>(1);
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [orgId, setOrgId] = useState<string>('org-1');
  const [approved, setApproved] = useState(true);
  const [personalLimit, setPersonalLimit] = useState<number>(100);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync state when targetUser changes
  useEffect(() => {
    if (targetUser) {
      const hasPhoneLevel =
        typeof targetUser.phone_access_level === 'number' &&
        targetUser.phone_access_level > 0;
      setPhoneAccessEnabled(hasPhoneLevel || targetUser.role === 'admin');
      setPhoneAccessLevel(
        targetUser.role === 'admin'
          ? 10
          : typeof targetUser.phone_access_level === 'number' && targetUser.phone_access_level >= 1
          ? targetUser.phone_access_level
          : 1
      );
      setCanManageAccess(
        targetUser.role === 'admin'
          ? true
          : Boolean(
              targetUser.can_manage_access ||
                targetUser.permissions?.includes('manage_user_access')
            )
      );
      setUserPhoneStatus(
        typeof targetUser.phone_status === 'number' && targetUser.phone_status >= 1
          ? targetUser.phone_status
          : targetUser.role === 'admin'
          ? 10
          : 1
      );
      setRole(targetUser.role);
      setOrgId(targetUser.organization_id || 'org-1');
      setApproved(targetUser.approved);
      setPersonalLimit(
        typeof targetUser.personal_tasks_limit === 'number'
          ? targetUser.personal_tasks_limit
          : 100
      );
      setPermissions(targetUser.permissions || []);
      setSavedNotice(false);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const ALL_PERMISSIONS = [
    // Разделы меню
    { key: 'home', label: 'Главная (список работ)', group: 'Разделы меню' },
    { key: 'map', label: 'Карта объектов', group: 'Разделы меню' },
    { key: 'houses', label: 'Дома в управлении', group: 'Разделы меню' },
    { key: 'planned', label: 'Плановые работы и календарь', group: 'Разделы меню' },
    { key: 'my_tasks_view', label: 'Личный список дел', group: 'Разделы меню' },
    { key: 'people_view', label: 'Сотрудники (список персонала)', group: 'Разделы меню' },
    { key: 'search', label: 'Выполненные работы (архив)', group: 'Разделы меню' },
    { key: 'audit', label: 'История действий и аудит', group: 'Разделы меню' },
    { key: 'notifications', label: 'Уведомления', group: 'Разделы меню' },
    { key: 'messages', label: 'Личные сообщения', group: 'Разделы меню' },
    { key: 'admin', label: 'Раздел: Администрирование', group: 'Разделы меню' },

    // Действия с заявками
    { key: 'new_request', label: 'Подать новую заявку', group: 'Действия с заявками' },
    { key: 'send_messenger', label: 'Отправка в Telegram/Viber', group: 'Действия с заявками' },
    { key: 'accept_request', label: 'Принять заявку', group: 'Действия с заявками' },
    { key: 'in_progress_request', label: 'Изменение статуса «В работу»', group: 'Действия с заявками' },
    { key: 'complete_request', label: 'Завершить заявку', group: 'Действия с заявками' },
    { key: 'edit_request', label: 'Редактировать заявку и акты', group: 'Действия с заявками' },
    { key: 'delete_request', label: 'Удалить / Снять заявку', group: 'Действия с заявками' },

    // Дома и сотрудники
    { key: 'new_house', label: 'Добавить новый дом', group: 'Дома и сотрудники' },
    { key: 'edit_house', label: 'Изменить данные дома/координаты', group: 'Дома и сотрудники' },
    { key: 'delete_house', label: 'Удалять дома в управлении', group: 'Дома и сотрудники' },
    { key: 'view_employee_card', label: 'Видеть карточку сотрудника', group: 'Дома и сотрудники' },
    { key: 'add_employee', label: 'Добавить сотрудника', group: 'Дома и сотрудники' },
    { key: 'internal', label: 'Редактировать сотрудника', group: 'Дома и сотрудники' },
    { key: 'delete_employee', label: 'Удалить сотрудника', group: 'Дома и сотрудники' },

    // Безопасность и спецфункции
    { key: 'manage_user_access', label: 'Управление правами доступа аккаунтов', group: 'Управление и безопасность' },
    { key: 'view_phone_statuses', label: 'Видеть цифровые статусы (1-10) телефонов', group: 'Управление и безопасность' },
    { key: 'voice_control', label: 'Голосовой набор заметок и навигация', group: 'Управление и безопасность' },
    { key: 'voice_reminder', label: 'Звуковое напоминание и будильник', group: 'Управление и безопасность' },
    { key: 'database_backup', label: 'Резервная копия базы данных', group: 'Управление и безопасность' },
    { key: 'project_download', label: 'Скачивание архива проекта', group: 'Управление и безопасность' },
  ];

  const handleTogglePerm = (key: string) => {
    if (!canManage) return;
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllPerms = () => {
    if (!canManage) return;
    setPermissions(ALL_PERMISSIONS.map((p) => p.key));
  };

  const handleSelectBasicPerms = () => {
    if (!canManage) return;
    setPermissions(['home', 'map', 'houses', 'search']);
  };

  const handleClearPerms = () => {
    if (!canManage) return;
    setPermissions([]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    // Compile final permissions
    let finalPerms = [...permissions];
    if (canManageAccess && !finalPerms.includes('manage_user_access')) {
      finalPerms.push('manage_user_access');
    }
    if (!canManageAccess) {
      finalPerms = finalPerms.filter((p) => p !== 'manage_user_access');
    }

    const updates: Partial<UserItem> = {
      role,
      organization_id: orgId,
      approved,
      phone_access_level: phoneAccessEnabled ? phoneAccessLevel : null,
      can_manage_access: canManageAccess,
      phone_status: userPhoneStatus,
      personal_tasks_limit: Math.max(0, Math.min(5000, Number(personalLimit) || 100)),
      permissions: finalPerms,
    };

    onSaveAccess(targetUser.id, updates);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 900);
  };

  const assignedOrg = organizations.find((o) => o.id === orgId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-purple-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-amber-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Настройка прав доступа аккаунта
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    targetUser.role === 'admin'
                      ? 'bg-amber-400 text-slate-950'
                      : targetUser.role === 'editor'
                      ? 'bg-blue-400 text-slate-950'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {targetUser.role === 'admin'
                    ? 'Администратор'
                    : targetUser.role === 'editor'
                    ? 'Редактор'
                    : 'Наблюдатель'}
                </span>
              </div>
              <div className="text-xs text-purple-200 mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="font-bold text-white">{targetUser.full_name}</span>
                <span className="font-mono text-purple-300">@{targetUser.username}</span>
                <span>Тел: {targetUser.phone}</span>
                <span>ID: #{targetUser.id}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Warning banner if current user cannot manage */}
        {!canManage && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2 px-5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Режим просмотра:</strong> Изменять настройки прав доступа может только{' '}
              <strong>Администратор</strong> или пользователь, которому отдельно предоставлены полномочия на управление доступом.
            </span>
          </div>
        )}

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SECTION 1: Права на просмотр номеров телефонов (Цифровой уровень 1-10) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                    <span>Права на просмотр номеров телефонов</span>
                    <span className="text-[11px] font-normal text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      Настройка 1–10
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    По умолчанию аккаунт не видит номера телефонов. Настраивается независимо для каждого аккаунта.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto select-none">
                <input
                  type="checkbox"
                  checked={phoneAccessEnabled}
                  disabled={!canManage || targetUser.role === 'admin'}
                  onChange={(e) => setPhoneAccessEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-purple-700 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  {phoneAccessEnabled ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-800">Просмотр включен</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Скрыты (по умолчанию)</span>
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* Level Selector 1 to 10 */}
            {phoneAccessEnabled && (
              <div className="pt-3 border-t border-purple-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-950">
                    Цифровой уровень доступа:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-800 text-white">
                      Уровень {phoneAccessLevel} из 10
                    </span>
                    <span className="text-[11px] text-purple-800 font-semibold">
                      (видит номера со статусом от 1 до {phoneAccessLevel})
                    </span>
                  </div>
                </div>

                {/* 10 Step Buttons */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
                    const isSelected = phoneAccessLevel === lvl;
                    const style = PHONE_STATUS_STYLES[lvl];
                    return (
                      <button
                        key={lvl}
                        type="button"
                        disabled={!canManage || targetUser.role === 'admin'}
                        onClick={() => setPhoneAccessLevel(lvl)}
                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                          isSelected
                            ? 'bg-purple-800 text-white border-purple-950 shadow-md ring-2 ring-purple-300 scale-105'
                            : `${style.bg} ${style.text} ${style.border} hover:scale-102`
                        }`}
                        title={`Уровень ${lvl}: просмотр номеров со статусом от 1 до ${lvl}`}
                      >
                        <span className="text-sm">{lvl}</span>
                        <span className="text-[9px] opacity-80 font-normal">ур.</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation text on hierarchy */}
                <div className="p-3 rounded-xl bg-white border border-purple-100 text-[11px] text-slate-700 space-y-1">
                  <div className="font-bold text-purple-900 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-purple-600" />
                    <span>Правило иерархии доступа:</span>
                  </div>
                  <p className="text-slate-600">
                    • Пользователь с правом <strong>{phoneAccessLevel}</strong> видит номера со статусом{' '}
                    <strong>
                      {phoneAccessLevel === 1
                        ? 'только 1'
                        : Array.from({ length: phoneAccessLevel }, (_, i) => i + 1).join(', ')}
                    </strong>.
                    {phoneAccessLevel < 10 && (
                      <span className="text-rose-700">
                        {' '}Номера со статусом <strong>{phoneAccessLevel + 1}..10</strong> скрыты и недоступны.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Полномочия на управление правами доступа и цифровой статус номера */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box A: Право управлять правами доступа */}
            <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-xs text-purple-950">
                  Полномочия администратора доступов
                </h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Разрешить этому аккаунту изменять права доступа других пользователей и назначать цифровые статусы номеров.
              </p>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/70 border border-purple-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={canManageAccess}
                  disabled={!canManage || targetUser.role === 'admin'}
                  onChange={(e) => setCanManageAccess(e.target.checked)}
                  className="w-4 h-4 rounded accent-purple-700 cursor-pointer"
                />
                <span className="text-xs font-bold text-purple-950">
                  Разрешить управление правами доступа
                </span>
              </label>
            </div>

            {/* Box B: Цифровой статус номера телефона самого пользователя */}
            <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-xs text-purple-950">
                  Цифровой статус номера телефона (1–10)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Статус номера телефона этого сотрудника ({targetUser.phone}). Кто с каким уровнем может его видеть.
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={userPhoneStatus}
                  disabled={!canManage}
                  onChange={(e) => setUserPhoneStatus(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 font-bold text-xs text-purple-950 focus:ring-2 focus:ring-purple-300 w-full"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>
                      Статус {s} (доступен с уровня {s} и выше)
                    </option>
                  ))}
                </select>
                <span
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border ${
                    PHONE_STATUS_STYLES[userPhoneStatus]?.bg || 'bg-slate-100'
                  } ${PHONE_STATUS_STYLES[userPhoneStatus]?.text || 'text-slate-800'} ${
                    PHONE_STATUS_STYLES[userPhoneStatus]?.border || 'border-slate-200'
                  }`}
                >
                  Ур. {userPhoneStatus}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Роль, Организация, Одобрение и Лимит */}
          <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-3">
            <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-700" />
              <span>Роль в системе, организация и параметры аккаунта</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Role */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Роль аккаунта
                </label>
                <select
                  value={role}
                  disabled={!canManage || targetUser.username === 'admin'}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 font-bold text-xs text-purple-950"
                >
                  <option value="viewer">Наблюдатель</option>
                  <option value="editor">Редактор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              {/* Organization */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Привязка к организации
                </label>
                <select
                  value={orgId}
                  disabled={!canManage || targetUser.username === 'admin'}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 font-bold text-xs text-purple-950"
                >
                  <option value="all">Все организации</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account approval status */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Статус одобрения
                </label>
                <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approved}
                    disabled={!canManage || targetUser.username === 'admin'}
                    onChange={(e) => setApproved(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-700"
                  />
                  <span>{approved ? 'Одобрен' : 'Ожидает'}</span>
                </label>
              </div>

              {/* Personal tasks limit */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Лимит личных дел (шт.)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={personalLimit}
                  disabled={!canManage}
                  onChange={(e) => setPersonalLimit(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white font-mono font-bold text-xs text-purple-950 text-center"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Разрешения на разделы и действия */}
          <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Матрица разрешений на разделы меню и действия ({permissions.length})</span>
              </h4>

              {canManage && targetUser.role !== 'admin' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="px-2 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Все права
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectBasicPerms}
                    className="px-2 py-1 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 font-bold text-[10px] cursor-pointer"
                  >
                    Базовые
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPerms}
                    className="px-2 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-[10px] cursor-pointer"
                  >
                    Снять все
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = targetUser.role === 'admin' || permissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] select-none transition-colors ${
                      isChecked
                        ? 'bg-purple-50/70 border-purple-200 text-purple-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-purple-200'
                    } ${canManage && targetUser.role !== 'admin' ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!canManage || targetUser.role === 'admin'}
                      onChange={() => handleTogglePerm(perm.key)}
                      className="w-3.5 h-3.5 rounded accent-purple-700 shrink-0"
                    />
                    <span className="leading-tight">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-purple-50/70 border-t border-purple-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {savedNotice ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Права доступа успешно сохранены!</span>
              </span>
            ) : (
              <span>Изменения вступают в силу немедленно после сохранения.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 font-bold text-xs cursor-pointer transition-colors"
            >
              Отмена
            </button>
            {canManage && (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить настройки прав</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
