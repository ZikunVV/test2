import React, { useState } from 'react';
import { ThemeConfig, GradientOption, UserItem, Organization } from '../types';
import {
  Shield,
  Lock,
  User,
  Phone,
  Building2,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface AuthScreenProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  users: UserItem[];
  organizations: Organization[];
  onLoginSuccess: (user: UserItem) => void;
  onRegisterUser: (newUser: Omit<UserItem, 'id' | 'created_at' | 'approved' | 'permissions'>) => UserItem;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  theme,
  gradient,
  showFlatFallback,
  users,
  organizations,
  onLoginSuccess,
  onRegisterUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrgId, setRegOrgId] = useState<string>(organizations[0]?.id || 'org-1');
  const [regRole, setRegRole] = useState<'editor' | 'viewer'>('editor');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedLogin = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedLogin || !trimmedPass) {
      setErrorMsg('Пожалуйста, введите логин и пароль.');
      return;
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === trimmedLogin
    );

    if (!foundUser) {
      setErrorMsg('Пользователь с таким логином не найден.');
      return;
    }

    const expectedPass = foundUser.password || (foundUser.username === 'admin' ? 'admin' : '123');
    if (trimmedPass !== expectedPass) {
      setErrorMsg('Неверный пароль. Попробуйте ещё раз.');
      return;
    }

    if (!foundUser.approved && foundUser.username !== 'admin') {
      setErrorMsg(
        'Ваша учётная запись ожидает подтверждения Главным администратором.'
      );
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setErrorMsg('Заполните ФИО, логин и пароль.');
      return;
    }

    const exists = users.some(
      (u) => u.username.toLowerCase() === regUsername.trim().toLowerCase()
    );
    if (exists) {
      setErrorMsg('Этот логин уже занят. Выберите другой.');
      return;
    }

    const created = onRegisterUser({
      full_name: regFullName.trim(),
      username: regUsername.trim(),
      password: regPassword.trim(),
      phone: regPhone.trim() || '—',
      organization_id: regOrgId,
      role: regRole,
    });

    if (created.approved) {
      onLoginSuccess(created);
    } else {
      setSuccessMsg(
        'Заявка на регистрацию отправлена! После одобрения администратором вы сможете войти в систему.'
      );
      setMode('login');
      setUsername(created.username);
      setPassword('');
    }
  };

  const handleQuickDemoLogin = (demoUser: UserItem) => {
    setErrorMsg(null);
    onLoginSuccess(demoUser);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden"
      style={{
        backgroundColor: theme.keyColors.canvasBg,
        color: theme.keyColors.textPrimary,
      }}
    >
      {/* Decorative soft background spheres */}
      <div
        className="fixed -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: gradient.cssGradient }}
      />
      <div
        className="fixed -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: gradient.cssGradient }}
      />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-purple-200/90 shadow-2xl overflow-hidden relative z-10">
        {/* Left Branding & Quick Access Column */}
        <div
          className="lg:col-span-5 p-6 md:p-8 text-white flex flex-col justify-between relative overflow-hidden"
          style={{
            background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
          }}
        >
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/30 shadow-inner">
                W
              </div>
              <div>
                <div className="font-black tracking-wider text-lg uppercase leading-none">
                  WORKFLOW
                </div>
                <div className="text-[11px] text-purple-100 font-semibold mt-1 flex items-center gap-1.5">
                  <span>Система управления ЖКХ</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Мультиарендная платформа (Шаг 3)</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black leading-snug">
                Единый диспетчерский центр и паспортный учёт домов
              </h1>
              <p className="text-xs text-purple-100/90 leading-relaxed">
                Каждый сотрудник автоматически подключается к рабочей базе своей управляющей компании или ЖЭКа с персональными правами доступа.
              </p>
            </div>
          </div>

          {/* Security & Access Features */}
          <div className="pt-6 mt-6 border-t border-white/20 space-y-2.5 relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-100">
              Защищённый корпоративный доступ:
            </div>
            <div className="space-y-2 text-xs text-purple-100/90">
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                <div className="font-bold text-white">Авторизация по логину и паролю</div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  Вход в базу данных доступен только зарегистрированным и одобренным администратором сотрудникам.
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                <div className="font-bold text-white">Изоляция организаций</div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  Сотрудник видит только дома, заявки и задачи своей управляющей компании.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center bg-white">
          {/* Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-purple-50 border border-purple-200/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Вход в систему</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Регистрация сотрудника</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Добро пожаловать в WORKFLOW
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Введите свой логин и пароль для входа в рабочее пространство вашей организации.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Логин пользователя
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите ваш логин"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите ваш пароль"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-purple-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                }}
              >
                <LogIn className="w-4 h-4" />
                <span>Войти в рабочую базу</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Регистрация нового сотрудника
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Выберите вашу организацию и заполните данные для получения доступа.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ФИО полностью <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Иваненко Сергей Петрович"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-purple-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Логин для входа <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ivanenko"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Пароль <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Придумайте пароль"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Контактный телефон
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+38 (0__) ___-__-__"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Должность / Роль
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) =>
                      setRegRole(e.target.value as 'editor' | 'viewer')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="editor">Диспетчер / Мастер</option>
                    <option value="viewer">Сотрудник (Только чтение)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ваша организация (ЖЭК / ОСМД / Компания)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={regOrgId}
                    onChange={(e) => setRegOrgId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.slug}.azikun.com)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                }}
              >
                <Shield className="w-4 h-4" />
                <span>Зарегистрироваться и войти</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
