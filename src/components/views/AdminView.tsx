import React, { useState } from 'react';
import {
  ThemeConfig,
  GradientOption,
  UserItem,
  AuditLogItem,
  StreetItem,
  Organization,
} from '../../types';
import {
  Settings,
  Users,
  History,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Lock,
  Plus,
  Edit2,
  Building,
  Key,
  Database,
  RefreshCw,
  Trash2,
  Globe,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface AdminViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  users: UserItem[];
  auditLogs: AuditLogItem[];
  streets: StreetItem[];
  organizations?: Organization[];
  currentOrganizationId?: string;
  housesCountByOrg?: Record<string, number>;
  ticketsCountByOrg?: Record<string, number>;
  onSelectOrganization?: (id: string) => void;
  onCreateOrganization?: (org: Organization) => void;
  onUpdateOrganization?: (org: Organization) => void;
  onDeleteOrganization?: (orgId: string) => void;
  onUpdateStreets: (streets: StreetItem[]) => void;
  onBatchRenameStreet?: (oldName: string, newName: string) => void;
  onUpdateUserRole: (
    userId: number,
    role: 'admin' | 'editor' | 'viewer'
  ) => void;
  onUpdateUserOrganization?: (userId: number, organizationId: string) => void;
  onCreateUser?: (
    newUser: Omit<UserItem, 'id' | 'created_at' | 'approved' | 'permissions'>
  ) => void;
  onDeleteUser?: (userId: number) => void;
  onToggleUserApproved: (userId: number) => void;
  onUpdateUserPermissions?: (userId: number, permissions: string[]) => void;
  onUpdateUserPersonalLimit?: (userId: number, limit: number) => void;
  onUndoAuditAction: (logId: number) => void;
  onBackToHome: () => void;
  onOpenBackupModal?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  users,
  auditLogs,
  streets,
  organizations = [],
  currentOrganizationId = 'org-1',
  housesCountByOrg = {},
  ticketsCountByOrg = {},
  onSelectOrganization,
  onCreateOrganization,
  onUpdateOrganization,
  onDeleteOrganization,
  onUpdateStreets,
  onBatchRenameStreet,
  onUpdateUserRole,
  onUpdateUserOrganization,
  onCreateUser,
  onDeleteUser,
  onToggleUserApproved,
  onUpdateUserPermissions,
  onUpdateUserPersonalLimit,
  onUndoAuditAction,
  onBackToHome,
  onOpenBackupModal,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'streets' | 'audit'>('users');
  const [undoSuccessMsg, setUndoSuccessMsg] = useState<string | null>(null);

  // Expanded user permissions matrix
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // Active organization for quick 6-digit code editing in AdminView
  const currentOrgObj =
    organizations.find((o) => o.id === currentOrganizationId) || organizations[0];
  const [quickRegCode, setQuickRegCode] = useState<string>(
    currentOrgObj?.registration_code || '101010'
  );

  React.useEffect(() => {
    if (currentOrgObj?.registration_code) {
      setQuickRegCode(currentOrgObj.registration_code);
    }
  }, [currentOrgObj?.id, currentOrgObj?.registration_code]);

  const handleSaveQuickRegCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrgObj || !onUpdateOrganization) return;
    const digits = quickRegCode.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) {
      alert('Код регистрации должен состоять ровно из 6 цифр.');
      return;
    }
    onUpdateOrganization({
      ...currentOrgObj,
      registration_code: digits,
    });
    setUndoSuccessMsg(
      `6-значный код регистрации для «${currentOrgObj.name}» обновлён на: ${digits}`
    );
    setTimeout(() => setUndoSuccessMsg(null), 4000);
  };

  const handleGenerateRandomRegCode = () => {
    const random6 = String(Math.floor(100000 + Math.random() * 900000));
    setQuickRegCode(random6);
    if (currentOrgObj && onUpdateOrganization) {
      onUpdateOrganization({
        ...currentOrgObj,
        registration_code: random6,
      });
      setUndoSuccessMsg(
        `Сгенерирован и сохранён новый 6-значный код для «${currentOrgObj.name}»: ${random6}`
      );
      setTimeout(() => setUndoSuccessMsg(null), 4000);
    }
  };

  // Add User Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserOrgId, setNewUserOrgId] = useState<string>(currentOrganizationId || 'org-1');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFullName.trim() || !newUserUsername.trim() || !onCreateUser) return;
    onCreateUser({
      full_name: newUserFullName.trim(),
      username: newUserUsername.trim(),
      password: newUserPassword.trim() || '123',
      phone: newUserPhone.trim() || '—',
      organization_id: newUserOrgId,
      role: newUserRole,
    });
    setNewUserFullName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserPhone('');
    setIsAddUserModalOpen(false);
  };

  // Organization modal state
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgRegCode, setOrgRegCode] = useState('101010');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgContact, setOrgContact] = useState('');
  const [orgActive, setOrgActive] = useState(true);

  // Transliteration helper for slug
  const generateSlug = (text: string) => {
    const ruToEn: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
      я: 'ya', ' ': '-', '«': '', '»': '', '"': '', '.': '', ',': '',
    };
    return text
      .toLowerCase()
      .split('')
      .map((char) => ruToEn[char] || char)
      .join('')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'org';
  };

  const handleOpenCreateOrg = () => {
    setEditingOrg(null);
    setOrgName('');
    setOrgSlug('');
    setOrgRegCode(String(Math.floor(100000 + Math.random() * 900000)));
    setOrgPhone('');
    setOrgAddress('');
    setOrgContact('');
    setOrgActive(true);
    setIsOrgModalOpen(true);
  };

  const handleOpenEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgSlug(org.slug);
    setOrgRegCode(org.registration_code || '101010');
    setOrgPhone(org.phone || '');
    setOrgAddress(org.address || '');
    setOrgContact(org.contact_person || '');
    setOrgActive(org.active ?? true);
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    const finalSlug = (orgSlug.trim() || generateSlug(orgName)).toLowerCase();
    const cleanCode = orgRegCode.replace(/\D/g, '').slice(0, 6);
    const finalRegCode = cleanCode.length === 6 ? cleanCode : '101010';

    if (editingOrg) {
      if (onUpdateOrganization) {
        onUpdateOrganization({
          ...editingOrg,
          name: orgName.trim(),
          slug: finalSlug,
          registration_code: finalRegCode,
          phone: orgPhone.trim(),
          address: orgAddress.trim(),
          contact_person: orgContact.trim(),
          active: orgActive,
        });
      }
    } else {
      if (onCreateOrganization) {
        const newOrg: Organization = {
          id: `org-${Date.now()}`,
          name: orgName.trim(),
          slug: finalSlug,
          registration_code: finalRegCode,
          phone: orgPhone.trim(),
          address: orgAddress.trim(),
          contact_person: orgContact.trim(),
          active: orgActive,
          created_at: new Date().toISOString().split('T')[0],
        };
        onCreateOrganization(newOrg);
      }
    }
    setIsOrgModalOpen(false);
  };

  // Comprehensive permissions matrix for sections and granular actions
  const ALL_PERMISSIONS = [
    // Разделы и просмотр
    { key: 'home', label: 'Раздел: Главная (список работ)', group: 'Разделы меню' },
    { key: 'map', label: 'Раздел: Карта объектов', group: 'Разделы меню' },
    { key: 'houses', label: 'Раздел: Дома в управлении', group: 'Разделы меню' },
    { key: 'planned', label: 'Раздел: Плановые работы и календарь', group: 'Разделы меню' },
    { key: 'my_tasks_view', label: 'Раздел: Видеть Личный список дел (и изменять свой список)', group: 'Разделы меню' },
    { key: 'people_view', label: 'Раздел: Видеть раздел «Сотрудники»', group: 'Разделы меню' },
    { key: 'search', label: 'Раздел: Выполненные работы (архив)', group: 'Разделы меню' },
    { key: 'audit', label: 'Раздел: История действий и отмена', group: 'Разделы меню' },
    { key: 'notifications', label: 'Раздел: Уведомления', group: 'Разделы меню' },
    { key: 'messages', label: 'Раздел: Личные сообщения', group: 'Разделы меню' },
    { key: 'admin', label: 'Раздел: Администрирование', group: 'Разделы меню' },

    // Действия с заявками
    { key: 'new_request', label: 'Заявки: Подать заявку', group: 'Разрешения на действия с заявками' },
    { key: 'send_messenger', label: 'Заявки: Отправить мастеру на Telegram или Viber', group: 'Разрешения на действия с заявками' },
    { key: 'accept_request', label: 'Заявки: Принять заявку в работу', group: 'Разрешения на действия с заявками' },
    { key: 'edit_request', label: 'Заявки: Редактировать заявку, акты и отчёты', group: 'Разрешения на действия с заявками' },
    { key: 'complete_request', label: 'Заявки: Завершить заявку', group: 'Разрешения на действия с заявками' },
    { key: 'delete_request', label: 'Заявки: Удалить / Снять заявку', group: 'Разрешения на действия с заявками' },

    // Действия с домами и картой
    { key: 'new_house', label: 'Дома: Добавить дом', group: 'Разрешения на действия с домами и сотрудниками' },
    { key: 'edit_house', label: 'Дома: Изменить данные дома и координаты на карте', group: 'Разрешения на действия с домами и сотрудниками' },

    // Сотрудники и дополнительные функции
    { key: 'view_employee_card', label: 'Сотрудники: Видеть «Карточку сотрудника» (по двойному клику на ФИО)', group: 'Разрешения на действия с домами и сотрудниками' },
    { key: 'add_employee', label: 'Сотрудники: Добавить сотрудника', group: 'Разрешения на действия с домами и сотрудниками' },
    { key: 'internal', label: 'Сотрудники: Редактировать сотрудника', group: 'Разрешения на действия с домами и сотрудниками' },
    { key: 'delete_employee', label: 'Сотрудники: Удалить сотрудника', group: 'Разрешения на действия с домами и сотрудниками' },
    { key: 'voice_control', label: 'Голосовой набор: Пользование голосовым набором заметок и навигацией по сайту', group: 'Разрешения на действия с домами и сотрудниками' },
  ];

  const [newStreetName, setNewStreetName] = useState('');
  const [renameStreetId, setRenameStreetId] = useState<number | null>(null);
  const [renameNewName, setRenameNewName] = useState('');
  const [autoReplaceInObjects, setAutoReplaceInObjects] = useState(true);

  const handleUndo = (logId: number) => {
    onUndoAuditAction(logId);
    setUndoSuccessMsg(`Действие #${logId} успешно отменено! Снимок восстановлен.`);
    setTimeout(() => setUndoSuccessMsg(null), 3500);
  };

  const handleTogglePermission = (user: UserItem, permKey: string) => {
    if (!onUpdateUserPermissions) return;
    const currentPerms = user.permissions || [];
    const updated = currentPerms.includes(permKey)
      ? currentPerms.filter((p) => p !== permKey)
      : [...currentPerms, permKey];
    onUpdateUserPermissions(user.id, updated);
  };

  const handleAddStreet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreetName.trim()) return;
    const newItem: StreetItem = {
      id: Date.now(),
      current_name: newStreetName.trim(),
      old_names: '',
    };
    onUpdateStreets([...streets, newItem]);
    setNewStreetName('');
  };

  const handleRenameStreet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameStreetId || !renameNewName.trim()) return;

    const targetStreet = streets.find((s) => s.id === renameStreetId);
    if (!targetStreet) return;

    const oldName = targetStreet.current_name;
    const newName = renameNewName.trim();

    const updatedOld = targetStreet.old_names
      ? `${targetStreet.old_names}, ${oldName}`
      : oldName;

    const updatedList = streets.map((s) => {
      if (s.id === renameStreetId) {
        return {
          ...s,
          current_name: newName,
          old_names: updatedOld,
        };
      }
      return s;
    });

    onUpdateStreets(updatedList);

    if (autoReplaceInObjects && onBatchRenameStreet) {
      onBatchRenameStreet(oldName, newName);
      setUndoSuccessMsg(
        `Улица успешно переименована в «${newName}». Название автоматически обновлено во всех домах и заявках!`
      );
    } else {
      setUndoSuccessMsg(`Улица успешно переименована в «${newName}».`);
    }

    setRenameStreetId(null);
    setRenameNewName('');
    setTimeout(() => setUndoSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Главная</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">Администрирование</span>
        </div>
      </div>

      {/* Header with Tab switcher */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-700" />
              <span>Панель администрирования (WORKFLOW)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Управление пользователями, матрица 12 прав доступа, переименование улиц и журнал аудита с откатом.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="px-3.5 py-1.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-900 font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5 text-xs shadow-2xs"
                title="Резервная копия и восстановление базы данных"
              >
                <Database className="w-3.5 h-3.5 text-purple-700" />
                <span>Резервная копия (Экспорт/Импорт)</span>
              </button>
            )}

            <div className="flex items-center p-1 rounded-xl border border-purple-200 bg-white text-xs">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Пользователи ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('organizations')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'organizations'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Организации ({organizations.length})
              </button>
              <button
                onClick={() => setActiveTab('streets')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'streets'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Улицы ({streets.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Журнал аудита ({auditLogs.length})
              </button>
            </div>
          </div>
        </div>

        {undoSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{undoSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* TAB 1: USERS & PERMISSIONS MATRIX */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* 6-Digit Registration Code Control Card for Administrator */}
          {currentOrgObj && (
            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl border border-purple-400/40 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                    Защита от спама и посторонних регистраций
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  Секретный 6-значный код для регистрации новых сотрудников ({currentOrgObj.name})
                </h3>
                <p className="text-xs text-purple-100 max-w-2xl">
                  Сообщите эти 6 цифр сотруднику лично при встрече или по телефону. Без этого кода никто не сможет зарегистрироваться на сайте. Вы можете изменить код в любой момент.
                </p>
              </div>

              <form
                onSubmit={handleSaveQuickRegCode}
                className="flex flex-wrap items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  maxLength={6}
                  value={quickRegCode}
                  onChange={(e) =>
                    setQuickRegCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="6 цифр"
                  className="w-32 px-3 py-2 rounded-xl bg-white text-purple-950 font-mono font-black text-base tracking-widest text-center border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить код</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateRandomRegCode}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Случайные 6 цифр"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Случайный</span>
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Пользователи, привязка к организациям и права доступа
              </h3>
              <span className="text-xs text-slate-500">
                Роли: Администратор, Редактор, Наблюдатель · Привязка к КП «ЖЄК-10» или другим компаниям
              </span>
            </div>
            {onCreateUser && (
              <button
                type="button"
                onClick={() => {
                  setNewUserOrgId(currentOrganizationId || 'org-1');
                  setIsAddUserModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить пользователя</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-purple-100 text-xs">
            {users.map((user) => {
              const isExpanded = expandedUserId === user.id;
              const userPerms = user.permissions || [];
              const assignedOrg = organizations.find((o) => o.id === user.organization_id);

              return (
                <div key={user.id} className="p-4 space-y-3 hover:bg-purple-50/20 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">
                          {user.full_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : user.role === 'editor'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role === 'admin'
                            ? 'Администратор'
                            : user.role === 'editor'
                            ? 'Редактор'
                            : 'Наблюдатель'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Building className="w-3 h-3 text-purple-600" />
                          <span>
                            {user.organization_id === 'all' || user.username === 'admin'
                              ? 'Все организации'
                              : assignedOrg?.name || 'КП «ЖЄК-10»'}
                          </span>
                        </span>
                      </div>

                      <div className="text-slate-500 text-[11px] mt-1 space-x-3 font-mono">
                        <span>Тел: {user.phone}</span>
                        <span>Логин: {user.username}</span>
                        <span>Пароль: {user.password || (user.username === 'admin' ? 'admin' : '123')}</span>
                        <span>Регистрация: {user.created_at}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
                      {/* Approved toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={user.approved}
                          disabled={user.username === 'admin'}
                          onChange={() => onToggleUserApproved(user.id)}
                          className="rounded accent-purple-700 w-4 h-4 cursor-pointer"
                        />
                        <span>{user.approved ? 'Одобрен' : 'Ожидает'}</span>
                      </label>

                      {/* Organization Binding Select */}
                      {user.username !== 'admin' && onUpdateUserOrganization && (
                        <select
                          value={user.organization_id || 'org-1'}
                          onChange={(e) =>
                            onUpdateUserOrganization(user.id, e.target.value)
                          }
                          title="Привязка пользователя к организации"
                          className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50/60 text-purple-950 font-bold text-xs focus:ring-2 focus:ring-purple-300"
                        >
                          <option value="all">Все организации</option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Role select */}
                      {user.username !== 'admin' ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            onUpdateUserRole(
                              user.id,
                              e.target.value as 'admin' | 'editor' | 'viewer'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-300"
                        >
                          <option value="viewer">Наблюдатель</option>
                          <option value="editor">Редактор</option>
                          <option value="admin">Администратор</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold text-purple-700 px-2.5 py-1 bg-purple-50 rounded-lg">
                          Главный доступ
                        </span>
                      )}

                      {/* Permissions toggle button */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedUserId(isExpanded ? null : user.id)
                        }
                        className="px-3 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-purple-600" />
                        <span>Права ({userPerms.length})</span>
                      </button>

                      {user.username !== 'admin' && onDeleteUser && (
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Удалить пользователя"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Permissions Checkboxes */}
                  {isExpanded && (
                    <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 animate-in fade-in duration-150 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-bold text-purple-950">
                          Матрица разрешений на разделы и действия для {user.full_name}:
                        </div>
                        {user.role !== 'admin' && onUpdateUserPermissions && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateUserPermissions(
                                  user.id,
                                  ALL_PERMISSIONS.map((p) => p.key)
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Включить все права
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateUserPermissions(user.id, [
                                  'home',
                                  'map',
                                  'houses',
                                  'search',
                                ])
                              }
                              className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 font-bold text-[10px] cursor-pointer"
                            >
                              Только чтение (базовые)
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {ALL_PERMISSIONS.map((perm) => {
                          const hasPerm =
                            user.role === 'admin' ||
                            userPerms.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-purple-100 cursor-pointer hover:border-purple-300 select-none text-[11px]"
                            >
                              <input
                                type="checkbox"
                                checked={hasPerm}
                                disabled={user.role === 'admin'}
                                onChange={() =>
                                  handleTogglePermission(user, perm.key)
                                }
                                className="w-3.5 h-3.5 rounded accent-purple-700 cursor-pointer shrink-0"
                              />
                              <span
                                className={
                                  hasPerm
                                    ? 'font-bold text-purple-950'
                                    : 'text-slate-500'
                                }
                              >
                                {perm.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Per-user Personal Tasks Limit Setting inside "Права" */}
                      <div className="mt-3 pt-3 border-t border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-purple-200">
                        <div>
                          <div className="font-bold text-xs text-purple-950">
                            Лимит записей в «Личном списке дел» (задач и личных контактов):
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Максимальное количество личных заметок, которое может создать этот сотрудник (по умолчанию: 100 шт.)
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={5000}
                            value={
                              typeof user.personal_tasks_limit === 'number'
                                ? user.personal_tasks_limit
                                : 100
                            }
                            onChange={(e) =>
                              onUpdateUserPersonalLimit &&
                              onUpdateUserPersonalLimit(
                                user.id,
                                Number(e.target.value)
                              )
                            }
                            className="w-24 px-3 py-1.5 rounded-lg border border-purple-300 font-mono font-black text-xs text-center text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                          <span className="text-xs font-bold text-slate-600">
                            записей
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* TAB 2: STREETS & RENAMING DIRECTORY */}
      {activeTab === 'streets' && (
        <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-700" />
                <span>Справочник улиц и переименований</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                При переименовании старые названия сохраняются в истории алиасов, позволяя находить дома по старым названиям.
              </p>
            </div>

            {/* Add Street Form */}
            <form onSubmit={handleAddStreet} className="flex gap-2">
              <input
                type="text"
                value={newStreetName}
                onChange={(e) => setNewStreetName(e.target.value)}
                placeholder="Новая улица..."
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs flex items-center gap-1 hover:bg-purple-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить</span>
              </button>
            </form>
          </div>

          {/* Streets Table */}
          <div className="border border-purple-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50 text-purple-900 font-bold border-b border-purple-100">
                <tr>
                  <th className="p-3">Текущее название</th>
                  <th className="p-3">Предыдущие (старые) названия</th>
                  <th className="p-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {streets.map((st) => (
                  <tr key={st.id} className="hover:bg-purple-50/30">
                    <td className="p-3 font-bold text-slate-900">
                      ул. {st.current_name}
                    </td>
                    <td className="p-3 text-slate-600">
                      {st.old_names ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {st.old_names}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Не переименовывалась</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {st.old_names && onBatchRenameStreet && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Выполнить автозамену старых названий («${st.old_names}») на актуальное («${st.current_name}») во всех существующих домах и заявках?`)) {
                                onBatchRenameStreet(st.old_names.split(',')[0].trim(), st.current_name);
                                setUndoSuccessMsg(`Старое название улицы заменено на «${st.current_name}» во всех объектах и заявках!`);
                                setTimeout(() => setUndoSuccessMsg(null), 3500);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold text-xs inline-flex items-center gap-1"
                            title="Автоматически обновить название во всех домах и заявках"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="hidden sm:inline">Обновить в объектах</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRenameStreetId(st.id);
                            setRenameNewName('');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Переименовать</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rename Modal / Form */}
          {renameStreetId && (
            <div className="p-4 rounded-xl border border-purple-300 bg-purple-50/70 space-y-3">
              <div className="font-bold text-purple-950">
                Переименование улицы:{' '}
                {streets.find((s) => s.id === renameStreetId)?.current_name}
              </div>
              <form onSubmit={handleRenameStreet} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={renameNewName}
                    onChange={(e) => setRenameNewName(e.target.value)}
                    placeholder="Введите новое официальное название..."
                    className="flex-1 px-3 py-2 rounded-xl border border-purple-300 bg-white text-xs font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenameStreetId(null)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 text-xs font-semibold"
                  >
                    Отмена
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-purple-950 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReplaceInObjects}
                    onChange={(e) => setAutoReplaceInObjects(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-700"
                  />
                  <span>
                    Автоматически заменить старое название на новое во всех существующих домах и заявках
                  </span>
                </label>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOG WITH UNDO */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-700" />
              <span>Журнал действий и история изменений (Audit Log)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Поддержка отката для ключевых операций
            </span>
          </div>

          <div className="divide-y divide-purple-100 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-purple-50/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-purple-700 font-bold">
                      #{log.id}
                    </span>
                    <span className="font-bold text-slate-900">
                      {log.action}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                      {log.entity}
                    </span>
                    {log.undone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Откачено
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600">{log.details}</p>

                  <div className="text-slate-400 text-[11px] flex items-center gap-3">
                    <span>Сотрудник: <strong>{log.user_name}</strong></span>
                    <span>Время: {log.created_at}</span>
                  </div>
                </div>

                {log.can_undo && !log.undone && (
                  <button
                    onClick={() => handleUndo(log.id)}
                    className="self-end md:self-auto px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Отменить действие</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ORGANIZATIONS (Multi-Tenancy Management) */}
      {activeTab === 'organizations' && (
        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-100 gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-700" />
                <span>Организации и компании (Мультиарендность / Multi-Tenancy)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Каждая организация имеет полностью изолированную базу домов, заявок и сотрудников.
              </p>
            </div>

            <button
              onClick={handleOpenCreateOrg}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить организацию</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => {
              const isCurrent = org.id === currentOrganizationId;
              const housesCount = housesCountByOrg[org.id] || 0;
              const ticketsCount = ticketsCountByOrg[org.id] || 0;

              return (
                <div
                  key={org.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                    isCurrent
                      ? 'border-purple-400 bg-purple-50/50 ring-2 ring-purple-500/30 shadow-xs'
                      : 'border-purple-200/80 bg-white hover:border-purple-300'
                  }`}
                >
                  {/* Top: Name & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-black text-sm text-slate-900 truncate">
                          {org.name}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-700 text-white shadow-2xs">
                            Активная сейчас
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            org.active !== false
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {org.active !== false ? 'Активна' : 'Приостановлена'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap mt-1">
                        <div className="flex items-center gap-1 text-[11px] text-purple-700 font-mono font-medium">
                          <Globe className="w-3 h-3 text-purple-500" />
                          <span>{org.slug}.azikun.com</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
                          <Key className="w-3 h-3 text-amber-600" />
                          <span>Код регистрации (6 цифр):</span>
                          <span className="font-mono font-black tracking-wider">
                            {org.registration_code || '101010'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditOrg(org)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                        title="Редактировать организацию"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {organizations.length > 1 && (
                        <button
                          onClick={() => onDeleteOrganization && onDeleteOrganization(org.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Удалить организацию"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="space-y-1 text-slate-600 text-[11px] pt-1 border-t border-purple-100/70">
                    {org.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>{org.address}</span>
                      </div>
                    )}
                    {org.contact_person && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Контактное лицо: <strong>{org.contact_person}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Stats & Switch action */}
                  <div className="pt-2 border-t border-purple-100/70 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                      <span>Домов: <strong className="text-purple-900 font-mono">{housesCount}</strong></span>
                      <span>Заявок: <strong className="text-purple-900 font-mono">{ticketsCount}</strong></span>
                    </div>

                    {!isCurrent && onSelectOrganization && (
                      <button
                        onClick={() => onSelectOrganization(org.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Переключиться сюда</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT ORGANIZATION MODAL */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-purple-200 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Мультиарендность (Шаг 2)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingOrg ? 'Редактировать организацию' : 'Новая организация / Компания'}
                </h3>
              </div>
              <button
                onClick={() => setIsOrgModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Название организации <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (!editingOrg && !orgSlug) {
                      setOrgSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="ООО «Комфорт» или ОСМД «Победа»"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Поддомен (адрес ссылки)
                </label>
                <div className="flex items-center rounded-xl border border-purple-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300">
                  <input
                    type="text"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="comfort"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold text-purple-900 outline-none"
                  />
                  <span className="px-3 py-2 bg-purple-50 text-purple-700 font-mono text-[11px] font-semibold border-l border-purple-200">
                    .azikun.com
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Сотрудники этой организации в будущем будут входить по этой ссылке.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  6-значный код регистрации сотрудников <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={orgRegCode}
                    onChange={(e) =>
                      setOrgRegCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="101010"
                    className="w-36 px-3 py-2 rounded-xl border border-purple-300 font-mono font-black tracking-widest text-center text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setOrgRegCode(String(Math.floor(100000 + Math.random() * 900000)))
                    }
                    className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs cursor-pointer"
                  >
                    Сгенерировать
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Этот код вы сообщаете новым сотрудникам при встрече или по телефону для регистрации.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="+38 (0__) ___-__-__"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Контактное лицо
                  </label>
                  <input
                    type="text"
                    value={orgContact}
                    onChange={(e) => setOrgContact(e.target.value)}
                    placeholder="Директор / Диспетчер"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Фактический адрес / Офис
                </label>
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="ул. Шевченко, 10"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="orgActiveCheck"
                  checked={orgActive}
                  onChange={(e) => setOrgActive(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer accent-purple-600"
                />
                <label htmlFor="orgActiveCheck" className="font-semibold text-slate-700 cursor-pointer select-none">
                  Организация активна (доступ открыт)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-purple-200 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Учётные записи сотрудников (Шаг 3)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Добавить пользователя
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ФИО сотрудника <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="Петренко Александр Викторович"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Логин <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="petrenko"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Пароль <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="12345"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Телефон
                </label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+38 (0__) ___-__-__"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Привязка к организации
                </label>
                <select
                  value={newUserOrgId}
                  onChange={(e) => setNewUserOrgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="all">Все организации (Полный доступ)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Роль и уровень доступа
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(e.target.value as 'admin' | 'editor' | 'viewer')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="editor">Редактор (Диспетчер / Мастер)</option>
                  <option value="viewer">Наблюдатель (Только чтение)</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Создать</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
