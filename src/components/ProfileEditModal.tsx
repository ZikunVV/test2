import React, { useState } from 'react';
import { UserItem, ThemeConfig, GradientOption } from '../types';
import {
  X,
  User,
  Key,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Save,
  Shield,
  Building,
} from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserItem | null;
  users: UserItem[];
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  onSaveProfile: (updates: {
    username: string;
    password?: string;
    phone: string;
  }) => { success: boolean; error?: string };
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  theme,
  gradient,
  showFlatFallback,
  onSaveProfile,
}) => {
  if (!isOpen || !currentUser) return null;

  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanPhone = phone.trim();

    if (!cleanUsername) {
      setErrorMsg('Логин не может быть пустым.');
      return;
    }

    // Check username uniqueness
    const isTaken = users.some(
      (u) =>
        u.id !== currentUser.id &&
        u.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (isTaken) {
      setErrorMsg(`Логин «${cleanUsername}» уже занят другим пользователем. Выберите другой.`);
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Пароль не может быть пустым.');
      return;
    }

    const result = onSaveProfile({
      username: cleanUsername,
      password: cleanPassword,
      phone: cleanPhone,
    });

    if (result.success) {
      setSuccessMsg('Личные данные успешно сохранены!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(result.error || 'Ошибка при сохранении данных.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-purple-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between gap-3"
          style={{
            background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Редактор личных данных
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Изменение логина, пароля и номера телефона
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Info Banner */}
        <div className="bg-purple-50/70 p-4 border-b border-purple-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center shrink-0">
              {currentUser.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-purple-800">
                  {currentUser.role === 'admin'
                    ? 'Администратор'
                    : currentUser.role === 'editor'
                    ? 'Редактор'
                    : 'Наблюдатель'}
                </span>
                <span>•</span>
                <span>ID: {currentUser.id}</span>
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
            Активный аккаунт
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Логин (username) */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-700" />
              <span>Логин для входа на сайт</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите ваш логин"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-slate-500">
              Логин используется для авторизации в системе. Должен быть уникальным.
            </p>
          </div>

          {/* 2. Пароль (password) */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-700" />
              <span>Пароль</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-purple-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-700 transition-colors p-1 cursor-pointer"
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Задайте надёжный пароль для доступа к вашей учётной записи.
            </p>
          </div>

          {/* 3. Номер телефона (phone) */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-purple-700" />
              <span>Номер телефона</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+38 (0XX) XXX-XX-XX"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-slate-500">
              Если номер не был указан при регистрации, вы можете добавить его сейчас или обновить контактный номер.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                boxShadow: showFlatFallback ? 'none' : gradient.buttonShadow,
              }}
            >
              <Save className="w-4 h-4" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
