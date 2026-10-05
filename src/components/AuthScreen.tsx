import React, { useState, useEffect } from 'react';
import { ThemeConfig, GradientOption, UserItem, Organization } from '../types';
import { useLanguage, AppLanguage } from '../utils/i18n';
import {
  Shield,
  Lock,
  User,
  Phone,
  Building2,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Send,
  X,
  Globe,
  MapPin,
  Wrench,
  Headphones,
  ClipboardList,
  Home,
  Sparkles,
  Check,
  Navigation,
  Calendar,
} from 'lucide-react';

interface AuthScreenProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  users: UserItem[];
  organizations: Organization[];
  onLoginSuccess: (user: UserItem) => void;
  onRegisterUser: (newUser: Omit<UserItem, 'id' | 'created_at' | 'approved' | 'permissions'>) => UserItem;
  onSendMessageToAdmin?: (senderName: string, subject: string, text: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  theme,
  gradient,
  showFlatFallback,
  users,
  organizations,
  onLoginSuccess,
  onRegisterUser,
  onSendMessageToAdmin,
}) => {
  const { lang, setLang } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regMethod, setRegMethod] = useState<'phone' | 'login'>('phone');
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Auto-cycle through the 5 showcase sections every 6 seconds; resets timer when user clicks any card
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrgId, setRegOrgId] = useState<string>(organizations[0]?.id || 'org-1');

  // Phone / Login 6-digit Admin registration code state
  const [enteredOtpCode, setEnteredOtpCode] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Write to administrator modal state on AuthScreen
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [msgSenderName, setMsgSenderName] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  const normalizeDigits = (val: string) => val.replace(/\D/g, '');

  const isPhoneAlreadyAuthorized = (rawPhone: string) => {
    const phoneDigits = normalizeDigits(rawPhone);
    if (phoneDigits.length < 9) return false;
    const tail9 = phoneDigits.slice(-9);
    return users.some((u) => {
      const uPhoneDigits = normalizeDigits(u.phone || '');
      const uLoginDigits = normalizeDigits(u.username || '');
      if (uPhoneDigits.length >= 9 && uPhoneDigits.slice(-9) === tail9) return true;
      if (uLoginDigits.length >= 9 && uLoginDigits.slice(-9) === tail9) return true;
      return false;
    });
  };

  // Get the 6-digit registration code configured by the Administrator for the selected organization
  const selectedOrg =
    organizations.find((o) => o.id === regOrgId) || organizations[0];
  const expectedAdminRegCode = selectedOrg?.registration_code || '101010';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedLogin = username.trim().toLowerCase();
    const trimmedPass = password.trim();
    const loginDigits = normalizeDigits(trimmedLogin);

    if (!trimmedLogin || !trimmedPass) {
      setErrorMsg('Пожалуйста, введите логин и пароль.');
      return;
    }

    const foundUser = users.find((u) => {
      if (u.username.toLowerCase() === trimmedLogin) return true;
      const userPhoneDigits = normalizeDigits(u.phone || '');
      if (loginDigits.length >= 9 && userPhoneDigits.length >= 9) {
        return userPhoneDigits.endsWith(loginDigits.slice(-9));
      }
      return false;
    });

    if (!foundUser) {
      setErrorMsg('Пользователь с таким логином не найден.');
      return;
    }

    const expectedPass =
      foundUser.password ||
      (foundUser.username === 'admin' ? 'Vjqgfhjkm0639444986Admin' : '123');
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

    if (enteredOtpCode.trim() !== expectedAdminRegCode) {
      setErrorMsg(
        'Неверный 6-значный код регистрации. Получите актуальный код у Администратора (лично или по телефону).'
      );
      return;
    }

    if (regMethod === 'phone') {
      const phoneDigits = normalizeDigits(regPhone);
      if (!regFullName.trim() || phoneDigits.length < 9) {
        setErrorMsg('Укажите корректный номер телефона.');
        return;
      }
      if (isPhoneAlreadyAuthorized(regPhone)) {
        setErrorMsg(
          'этот номер телефона уже авторизован, за более детальной информацией обращаться к Администратору'
        );
        return;
      }
      if (!regPassword.trim()) {
        setErrorMsg('Пожалуйста, придумайте пароль для дальнейших входов в систему.');
        return;
      }

      const autoUsername = regUsername.trim() || `+${phoneDigits}`;
      const finalPassword = regPassword.trim();

      const created = onRegisterUser({
        full_name: regFullName.trim(),
        username: autoUsername,
        password: finalPassword,
        phone: regPhone.trim(),
        organization_id: regOrgId,
        role: 'viewer',
      });

      onLoginSuccess(created);
      return;
    }

    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setErrorMsg('Заполните ФИО, логин и пароль.');
      return;
    }

    if (regPhone.trim() && isPhoneAlreadyAuthorized(regPhone)) {
      setErrorMsg(
        'этот номер телефона уже авторизован, за более детальной информацией обращаться к Администратору'
      );
      return;
    }

    const exists = users.some(
      (u) => u.username.toLowerCase() === regUsername.trim().toLowerCase()
    );
    if (exists) {
      setErrorMsg('Этот логин уже занят. Выберите другой.');
      return;
    }

    // All newly registered users automatically receive "viewer" (Только чтение) status
    const created = onRegisterUser({
      full_name: regFullName.trim(),
      username: regUsername.trim(),
      password: regPassword.trim(),
      phone: regPhone.trim() || '—',
      organization_id: regOrgId,
      role: 'viewer',
    });

    onLoginSuccess(created);
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    const sender = msgSenderName.trim() || regFullName.trim() || username.trim() || 'Гость (Экран входа)';
    const subj = msgSubject.trim() || 'Обращение с экрана входа';
    if (onSendMessageToAdmin) {
      onSendMessageToAdmin(sender, subj, msgText.trim());
    }
    setMsgSentSuccess(true);
    setMsgSubject('');
    setMsgText('');
    setTimeout(() => {
      setMsgSentSuccess(false);
      setIsMessageModalOpen(false);
    }, 1800);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans relative overflow-hidden"
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

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-purple-200/90 shadow-2xl overflow-hidden relative z-10">
        {/* Left Visual Showcase & Branding Column (7 cols on lg) */}
        <div
          className="lg:col-span-7 p-5 sm:p-7 md:p-8 text-white flex flex-col justify-between relative overflow-hidden"
          style={{
            background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
          }}
        >
          {/* Subtle grid texture overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="space-y-4 relative z-10">
            {/* Top Bar: Logo + Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold text-purple-50">
                <Headphones className="w-3.5 h-3.5 text-emerald-300" />
                <span>Колл-центр и координация мастеров 24/7</span>
              </div>
            </div>

            {/* Interactive Visual Collage from the 4 site screenshots (111, 222, 333, 444) + Field Crew */}
            <div className="bg-slate-950/35 backdrop-blur-md rounded-2xl border border-white/25 p-3.5 sm:p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200">
                    Обзор возможностей системы
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Диспетчерский центр и учёт жилого фонда
                  </h3>
                </div>
                <span className="text-[10px] text-purple-200 hidden sm:inline">
                  Нажмите на миниатюру, чтобы переключить слайд
                </span>
              </div>

              {/* Main Featured Preview Window (Recreating Screenshots 111, 222, 333, 444 with cropped UI focus) */}
              <div className="rounded-xl bg-[#F6F3FF] text-slate-800 border border-purple-200/80 shadow-inner overflow-hidden">
                {/* Browser Top Bar */}
                <div className="bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800 px-3 py-1.5 flex items-center justify-between text-white text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="ml-1.5 font-bold tracking-wide opacity-90">
                      WORKFLOW — Система управления ЖКХ
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/20 font-semibold">
                      RU / UA / EN
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 font-bold">
                      Online
                    </span>
                  </div>
                </div>

                {/* Slide 0: Photo 111 — Главная / Диспетчерская и заявки */}
                {activeSlide === 0 && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-purple-950">
                          Добрый день!
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Список работ и оперативный контроль заявок
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-700 text-white text-[10px] font-bold shadow-xs">
                        + Подать заявку
                      </span>
                    </div>

                    {/* 3 Stat Cards from Screenshot 111 */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-white border border-purple-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">
                            В работе
                          </div>
                          <div className="text-base font-black text-purple-900 leading-tight">
                            14
                          </div>
                          <div className="text-[9px] text-purple-600 font-semibold">
                            в работе
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                          ⚡
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-amber-200/90 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">
                            В ожидании
                          </div>
                          <div className="text-base font-black text-amber-700 leading-tight">
                            5
                          </div>
                          <div className="text-[9px] text-amber-600 font-semibold">
                            ожидают решения
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                          ⏳
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-emerald-200/90 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">
                            Выполнено
                          </div>
                          <div className="text-base font-black text-emerald-700 leading-tight">
                            128
                          </div>
                          <div className="text-[9px] text-emerald-600 font-semibold">
                            завершено успешно
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Sample Ticket Card from Screenshot 111 */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/90 flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[9px]">
                            Срочная заявка
                          </span>
                          <span className="text-[10px] font-bold text-slate-900">
                            ул. Доценка, 15Б · кв. 42
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Замена вводного вентиля ХВС в подвале, проверка стояка
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[9px]">
                          Telegram / Viber
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[9px]">
                          Завершить
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 1: Photo 222 — Карта объектов GPS */}
                {activeSlide === 1 && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-black text-purple-950">
                          Интерактивная карта жилого фонда и заявок
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[9px] font-bold">
                        GPS Геолокация
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-stretch">
                      <div className="col-span-7 rounded-xl bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-100 border border-purple-200 p-2.5 relative min-h-[110px] flex flex-col justify-between overflow-hidden">
                        {/* Stylized road lines */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none">
                          <div className="w-full h-1 bg-white rotate-12 translate-y-8" />
                          <div className="w-full h-1.5 bg-amber-200 -rotate-6 translate-y-16" />
                          <div className="h-full w-1 bg-white translate-x-20" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-white/90 text-purple-950 font-bold text-[9px] shadow-2xs">
                            🔍 ул. Доценка, 15Б
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-700 text-white font-bold text-[9px]">
                            51.5184, 31.2986
                          </span>
                        </div>
                        <div className="relative z-10 flex items-center justify-around py-1">
                          <div className="flex flex-col items-center">
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black shadow">
                              №15Б (2 заявки)
                            </span>
                            <div className="w-2 h-2 rotate-45 bg-rose-600 -mt-1" />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="px-1.5 py-0.5 rounded-full bg-purple-700 text-white text-[9px] font-black shadow">
                              №21А
                            </span>
                            <div className="w-2 h-2 rotate-45 bg-purple-700 -mt-1" />
                          </div>
                        </div>
                        <div className="relative z-10 text-[9px] font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded">
                          Кликните на маркер дома для информации
                        </div>
                      </div>

                      <div className="col-span-5 rounded-xl bg-white border border-purple-200 p-2.5 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] font-bold uppercase text-purple-700">
                            Карточка объекта
                          </div>
                          <div className="text-xs font-black text-slate-900 mt-0.5">
                            ул. Доценка, 15Б
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                            <div>Этажей: 9 · Подъездов: 4</div>
                            <div>Квартир: 144 · Лифтов: 4</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-purple-100 flex items-center justify-between text-[9px] font-bold text-purple-700">
                          <span>Открыть карточку дома</span>
                          <Navigation className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 2: Photo 333 — Дома в управлении и Паспорт дома */}
                {activeSlide === 2 && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-black text-purple-950">
                          Паспорт дома и технический реестр подъездов
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        Все дома в базе
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="p-2 rounded-lg bg-white border border-purple-200 text-center">
                        <div className="text-[9px] text-slate-500 font-bold">Площадь</div>
                        <div className="text-xs font-black text-purple-950">7 420 м²</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-purple-200 text-center">
                        <div className="text-[9px] text-slate-500 font-bold">Этажей</div>
                        <div className="text-xs font-black text-purple-950">9 эт.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-purple-200 text-center">
                        <div className="text-[9px] text-slate-500 font-bold">Подъезды</div>
                        <div className="text-xs font-black text-purple-950">4 под.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-purple-200 text-center">
                        <div className="text-[9px] text-slate-500 font-bold">Квартир</div>
                        <div className="text-xs font-black text-purple-950">144 кв.</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-purple-200 text-[10px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-purple-900">
                        <span>Технические характеристики и инженерные узлы</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100">
                          Подъезд №1–4
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Кровля: мягкая рулонная · Узлы учёта тепла и ХВС · Схема разводки подвала и электрощитовой.
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 3: Photo 444 + Field Technicians & Call Center Collage */}
                {activeSlide === 3 && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-black text-purple-950">
                          Аварийно-ремонтные бригады, электрики и сантехники
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[9px] font-bold">
                        Telegram / Viber
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                          <Headphones className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold text-amber-300 uppercase">
                            Диспетчерский центр
                          </div>
                          <div className="text-[11px] font-bold leading-snug">
                            Приём обращений жильцов и мгновенная передача в работу
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-purple-200 flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold text-purple-800 uppercase">
                            Выездные мастера
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 leading-snug">
                            Карточка сотрудника, телефоны +38 (067/050/063) и отчёты
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 4: Section 5 — Календарь и плановые работы */}
                {activeSlide === 4 && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-black text-purple-950">
                          Плановые работы и Календарь выездов
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[9px] font-bold">
                        Октябрь 2026
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-stretch">
                      {/* Mini Calendar Grid */}
                      <div className="col-span-7 rounded-xl bg-white border border-purple-200 p-2">
                        <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-slate-400 mb-1">
                          <span>Пн</span>
                          <span>Вт</span>
                          <span>Ср</span>
                          <span>Чт</span>
                          <span>Пт</span>
                          <span>Сб</span>
                          <span>Вс</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-700">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => {
                            const hasPlanned = day === 5 || day === 9 || day === 12;
                            return (
                              <div
                                key={day}
                                className={`py-1 rounded-md flex flex-col items-center justify-center ${
                                  hasPlanned
                                    ? 'bg-purple-700 text-white font-black shadow-2xs'
                                    : 'bg-purple-50/60 text-slate-700'
                                }`}
                              >
                                <span>{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scheduled items for selected dates */}
                      <div className="col-span-5 rounded-xl bg-white border border-purple-200 p-2 flex flex-col justify-between space-y-1.5">
                        <div>
                          <div className="text-[9px] font-extrabold uppercase text-purple-700">
                            Плановые заявки
                          </div>
                          <div className="mt-1 p-1.5 rounded-lg bg-purple-50 border border-purple-100 text-[9px] font-bold text-purple-950 leading-tight">
                            05.10 — Обход и ревизия элеваторных узлов отопления
                          </div>
                          <div className="mt-1 p-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[9px] font-bold text-amber-950 leading-tight">
                            09.10 — Плановая проверка щитовых: ул. Доценка, 15Б, 21А
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5 Interactive Thumbnail Cards (111, 222, 333, 444 + 5. Календарь) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSlide(0)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    activeSlide === 0
                      ? 'bg-white text-purple-950 border-white shadow-md scale-[1.01]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[10px]">
                    <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">1. Диспетчерская и заявки</span>
                  </div>
                  <div
                    className={`text-[9px] mt-0.5 truncate ${
                      activeSlide === 0 ? 'text-purple-700 font-semibold' : 'text-purple-200'
                    }`}
                  >
                    Статусы, срочность и быстрый поиск
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlide(1)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    activeSlide === 1
                      ? 'bg-white text-purple-950 border-white shadow-md scale-[1.01]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[10px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">2. Карта объектов GPS</span>
                  </div>
                  <div
                    className={`text-[9px] mt-0.5 truncate ${
                      activeSlide === 1 ? 'text-purple-700 font-semibold' : 'text-purple-200'
                    }`}
                  >
                    Геолокация домов и активных вызовов
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlide(2)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    activeSlide === 2
                      ? 'bg-white text-purple-950 border-white shadow-md scale-[1.01]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[10px]">
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">3. Паспорта домов и подъездов</span>
                  </div>
                  <div
                    className={`text-[9px] mt-0.5 truncate ${
                      activeSlide === 2 ? 'text-purple-700 font-semibold' : 'text-purple-200'
                    }`}
                  >
                    Этажность, инженерные сети, история
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlide(3)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    activeSlide === 3
                      ? 'bg-white text-purple-950 border-white shadow-md scale-[1.01]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[10px]">
                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">4. Аварийно-ремонтная служба</span>
                  </div>
                  <div
                    className={`text-[9px] mt-0.5 truncate ${
                      activeSlide === 3 ? 'text-purple-700 font-semibold' : 'text-purple-200'
                    }`}
                  >
                    Бригады, мессенджеры и контроль работ
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlide(4)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border col-span-2 sm:col-span-1 ${
                    activeSlide === 4
                      ? 'bg-white text-purple-950 border-white shadow-md scale-[1.01]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[10px]">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">5. Календарь</span>
                  </div>
                  <div
                    className={`text-[9px] mt-0.5 truncate ${
                      activeSlide === 4 ? 'text-purple-700 font-semibold' : 'text-purple-200'
                    }`}
                  >
                    График плановых работ и выездов
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Callout: "хочешь больше функций напиши Администратору." + Active Button */}
          <div className="pt-4 mt-4 border-t border-white/20 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>хочешь больше функций напиши Администратору.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMessageModalOpen(true)}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white text-purple-950 hover:bg-purple-50 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-purple-700" />
              <span>Написать администратору</span>
            </button>
          </div>
        </div>

        {/* Right Form Column (5 cols on lg) */}
        <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Language Switcher on the First Page (Login & Registration) */}
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-purple-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>Язык:</span>
              </div>
              <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200/80">
                {(
                  [
                    { code: 'ru', label: 'Русский (RU)' },
                    { code: 'ua', label: 'Українська (UA)' },
                    { code: 'en', label: 'English (EN)' },
                  ] as { code: AppLanguage; label: string }[]
                ).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      lang === item.code
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900'
                    }`}
                  >
                    {item.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-purple-50 border border-purple-200/80 mb-5">
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
                      Логин или номер телефона
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Введите логин или телефон"
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
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Регистрация нового сотрудника
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Выберите вашу организацию и заполните данные для получения доступа.
                  </p>
                </div>

                {/* Sub-tabs: By Phone vs By Login */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setRegMethod('phone');
                      setErrorMsg(null);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      regMethod === 'phone'
                        ? 'bg-white text-purple-900 shadow-2xs border border-purple-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">По номеру телефона</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegMethod('login');
                      setErrorMsg(null);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      regMethod === 'login'
                        ? 'bg-white text-purple-900 shadow-2xs border border-purple-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">По логину</span>
                  </button>
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

                {regMethod === 'phone' ? (
                  <div className="space-y-2.5 p-3 rounded-2xl bg-purple-50/60 border border-purple-200/90">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Мобильный телефон <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+38 (067) 123-45-67"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Код от Администратора (6 цифр) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={enteredOtpCode}
                          onChange={(e) =>
                            setEnteredOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          placeholder="6 цифр от Админа"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-300 text-xs font-mono font-black tracking-widest text-center text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Пароль для дальнейших входов <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Придумайте пароль"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-purple-900 font-medium leading-snug">
                      Введите 6-значный код доступа, который вам сообщил Администратор лично или по телефону.
                    </p>
                  </div>
                ) : (
                  <>
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
                            placeholder="+38 (067) 123-45-67"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Код от Администратора (6 цифр) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={enteredOtpCode}
                          onChange={(e) =>
                            setEnteredOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          placeholder="6 цифр от Админа"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-300 text-xs font-mono font-black tracking-widest text-center text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </>
                )}

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
                  <span>
                    {regMethod === 'phone'
                      ? 'Подтвердить код и войти'
                      : 'Зарегистрироваться и войти'}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* Bottom helper banner inside right form column */}
          <div className="mt-6 pt-4 border-t border-purple-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-purple-900">
              хочешь больше функций напиши Администратору.
            </span>
            <button
              type="button"
              onClick={() => setIsMessageModalOpen(true)}
              className="text-[11px] font-extrabold text-purple-700 hover:text-purple-950 underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Написать администратору
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Write to Administrator from AuthScreen */}
      {isMessageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setIsMessageModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-purple-200 text-xs space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Связь с администратором
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Написать администратору
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {msgSentSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Ваше сообщение успешно отправлено Главному администратору!</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessageSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ваше имя / ФИО или телефон
                  </label>
                  <input
                    type="text"
                    required
                    value={msgSenderName}
                    onChange={(e) => setMsgSenderName(e.target.value)}
                    placeholder="Иваненко С.П., +380..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Тема обращения
                  </label>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)}
                    placeholder="Запрос прав доступа / Вопрос по входу"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Текст сообщения <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Напишите ваше сообщение Главному администратору..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
