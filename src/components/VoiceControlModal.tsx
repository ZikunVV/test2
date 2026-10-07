import React, { useState, useRef, useEffect } from 'react';
import { ThemeConfig, GradientOption, UserItem, PersonalTask } from '../types';
import { getUserSurname } from '../utils/userUtils';
import { useLanguage } from '../utils/i18n';
import {
  Mic,
  MicOff,
  X,
  Compass,
  FileText,
  Check,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Home,
  MapPin,
  Building2,
  Calendar,
  CheckSquare,
  Users2,
  History,
  Settings,
  Plus,
  Lock,
  Send,
} from 'lucide-react';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  currentUser?: UserItem;
  canUseVoiceControl: boolean;
  canCreateTicket: boolean;
  canViewPersonalTasks: boolean;
  onNavigate: (navId: string) => void;
  onOpenNewTicket: () => void;
  onCreatePersonalTask: (newTask: PersonalTask) => void;
  onSetHomeSearch: (query: string) => void;
  onOpenWriteToAdmin?: () => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  theme,
  gradient,
  showFlatFallback,
  currentUser,
  canUseVoiceControl,
  canCreateTicket,
  canViewPersonalTasks,
  onNavigate,
  onOpenNewTicket,
  onCreatePersonalTask,
  onSetHomeSearch,
  onOpenWriteToAdmin,
}) => {
  const { lang } = useLanguage();
  const userSurname = getUserSurname(currentUser);

  const [mode, setMode] = useState<'smart' | 'note'>('smart');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setFeedbackMsg(null);
      setTranscript('');
    } else if (canUseVoiceControl) {
      // Automatically start listening when opened only if user has permission
      const timer = setTimeout(() => {
        startListening(mode);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, canUseVoiceControl]);

  useEffect(() => {
    return () => stopListening();
  }, []);

  const executeVoiceCommand = (rawSpoken: string) => {
    const text = rawSpoken.trim();
    const lower = text.toLowerCase();

    if (!lower) return;

    // 1. Direct Note Creation Command ("заметка ...", "запиши ...", "нотатка ...", "note ...")
    const noteMatch = text.match(/^(?:заметка|сделать заметку|запиши|записать|нотатка|note)\s+(.+)/i);
    if (noteMatch && noteMatch[1]) {
      const noteContent = noteMatch[1].trim();
      if (!canViewPersonalTasks || !currentUser) {
        setFeedbackMsg({
          type: 'error',
          text: 'У вас нет доступа к разделу «Личный список дел».',
        });
        return;
      }
      const newTask: PersonalTask = {
        id: `pt-${Date.now()}`,
        title: noteContent,
        task_date: '',
        description: 'Создано голосовым набором с Главной страницы',
        status: 'pending',
        owner_user_id: currentUser.id,
        owner_surname: userSurname,
      };
      onCreatePersonalTask(newTask);
      setFeedbackMsg({
        type: 'success',
        text: `Заметка сохранена в ваш Личный список дел: «${noteContent}»`,
      });
      setTimeout(() => {
        onNavigate('my_tasks');
        onClose();
      }, 1200);
      return;
    }

    // 2. Search Command ("поиск ...", "найди ...", "найти ...", "знайди ...", "search ...")
    const searchMatch = text.match(/^(?:поиск|найди|найти|знайди|пошук|search)\s+(.+)/i);
    if (searchMatch && searchMatch[1]) {
      const query = searchMatch[1].trim();
      onNavigate('home');
      onSetHomeSearch(query);
      setFeedbackMsg({
        type: 'success',
        text: `Выполнен поиск по заявкам: «${query}»`,
      });
      setTimeout(() => onClose(), 900);
      return;
    }

    // 3. New Request / Ticket ("подать заявку", "новая заявка", "создать заявку")
    if (
      lower.includes('подать заявку') ||
      lower.includes('новая заявка') ||
      lower.includes('создать заявку') ||
      lower.includes('нова заявка') ||
      lower.includes('new request')
    ) {
      if (!canCreateTicket) {
        setFeedbackMsg({
          type: 'error',
          text: 'У вас нет прав для подачи новой заявки.',
        });
        return;
      }
      setFeedbackMsg({
        type: 'success',
        text: 'Открываю форму «Подать заявку»...',
      });
      setTimeout(() => {
        onClose();
        onOpenNewTicket();
      }, 600);
      return;
    }

    // 4. Site Navigation Commands
    if (
      lower.includes('карта') ||
      lower.includes('карту') ||
      lower.includes('gps') ||
      lower.includes('map')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Карта объектов»...' });
      setTimeout(() => {
        onNavigate('map');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('дом') ||
      lower.includes('дома') ||
      lower.includes('будинк') ||
      lower.includes('здани') ||
      lower.includes('подъезд') ||
      lower.includes('buildings')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Дома в управлении»...' });
      setTimeout(() => {
        onNavigate('buildings');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('планов') ||
      lower.includes('календар') ||
      lower.includes('график') ||
      lower.includes('scheduled') ||
      lower.includes('calendar')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Плановые работы и календарь»...' });
      setTimeout(() => {
        onNavigate('scheduled');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('личн') ||
      lower.includes('список дел') ||
      lower.includes('мои дела') ||
      lower.includes('заметк') ||
      lower.includes('телефонная книга') ||
      lower.includes('особист') ||
      lower.includes('нотатк') ||
      lower.includes('tasks') ||
      lower.includes('notes')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Личный список дел»...' });
      setTimeout(() => {
        onNavigate('my_tasks');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('сотрудник') ||
      lower.includes('люди') ||
      lower.includes('мастер') ||
      lower.includes('бригад') ||
      lower.includes('співробітник') ||
      lower.includes('employees') ||
      lower.includes('people')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Сотрудники»...' });
      setTimeout(() => {
        onNavigate('people');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('выполнен') ||
      lower.includes('архив') ||
      lower.includes('завершен') ||
      lower.includes('виконан') ||
      lower.includes('completed')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Выполненные работы»...' });
      setTimeout(() => {
        onNavigate('completed');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('истори') ||
      lower.includes('аудит') ||
      lower.includes('журнал') ||
      lower.includes('історі') ||
      lower.includes('audit')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «История действий»...' });
      setTimeout(() => {
        onNavigate('history');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('уведомлен') ||
      lower.includes('сповіщен') ||
      lower.includes('notifications')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Открываю «Уведомления»...' });
      setTimeout(() => {
        onNavigate('notifications');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('сообщен') ||
      lower.includes('написать админ') ||
      lower.includes('повідомлен') ||
      lower.includes('messages')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Открываю «Сообщения»...' });
      setTimeout(() => {
        onNavigate('messages');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('админ') ||
      lower.includes('права') ||
      lower.includes('пользовател') ||
      lower.includes('улиц') ||
      lower.includes('организац') ||
      lower.includes('настройк')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход в раздел «Администрирование»...' });
      setTimeout(() => {
        onNavigate('admin');
        onClose();
      }, 600);
      return;
    }

    if (
      lower.includes('главн') ||
      lower.includes('список работ') ||
      lower.includes('домой') ||
      lower.includes('головн') ||
      lower.includes('home')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Переход на «Главную»...' });
      setTimeout(() => {
        onNavigate('home');
        onClose();
      }, 600);
      return;
    }

    // 5. Fallback: pre-fill Quick Note with the dictated text so nothing is lost!
    setMode('note');
    setNoteTitle((prev) => (prev ? `${prev} ${text}` : text));
    setFeedbackMsg({
      type: 'info',
      text: `Текст записан в заметку: «${text}». Нажмите «Сохранить заметку» или выберите раздел ниже.`,
    });
  };

  const startListening = (targetMode: 'smart' | 'note' = mode) => {
    setFeedbackMsg(null);
    stopListening();

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setFeedbackMsg({
        type: 'error',
        text: 'Ваш браузер не поддерживает голосовой набор (используйте Chrome, Safari или Edge).',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = lang === 'ua' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU';
      recognition.continuous = targetMode === 'note';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          }
        }
        const cleaned = finalChunk.trim();
        if (!cleaned) return;

        setTranscript(cleaned);

        if (targetMode === 'smart') {
          executeVoiceCommand(cleaned);
        } else {
          setNoteTitle((prev) => (prev.trim() ? `${prev.trim()} ${cleaned}` : cleaned));
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setFeedbackMsg({
            type: 'error',
            text: 'Доступ к микрофону запрещён. Разрешите микрофон в настройках браузера.',
          });
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setFeedbackMsg({
            type: 'error',
            text: 'Не удалось распознать речь. Нажмите на микрофон и попробуйте ещё раз.',
          });
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch (e) {
      setFeedbackMsg({
        type: 'error',
        text: 'Ошибка запуска микрофона.',
      });
      setIsListening(false);
    }
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !currentUser) return;

    const newTask: PersonalTask = {
      id: `pt-${Date.now()}`,
      title: noteTitle.trim(),
      task_date: noteDate.trim(),
      description: noteDesc.trim(),
      status: 'pending',
      owner_user_id: currentUser.id,
      owner_surname: userSurname,
    };

    onCreatePersonalTask(newTask);
    setNoteTitle('');
    setNoteDesc('');
    setNoteDate('');
    setFeedbackMsg({
      type: 'success',
      text: 'Заметка успешно сохранена в ваш «Личный список дел»!',
    });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  const quickVoiceCommands = [
    { label: '«Карта»', nav: 'map', icon: MapPin },
    { label: '«Дома»', nav: 'buildings', icon: Building2 },
    { label: '«Плановые работы»', nav: 'scheduled', icon: Calendar },
    { label: '«Личный список дел»', nav: 'my_tasks', icon: CheckSquare },
    { label: '«Сотрудники»', nav: 'people', icon: Users2 },
    { label: '«Выполненные»', nav: 'completed', icon: CheckCircle2 },
    { label: '«История»', nav: 'history', icon: History },
    { label: '«Администрирование»', nav: 'admin', icon: Settings },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-purple-200 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{
                background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
              }}
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">
                Голосовое управление и заметки
              </span>
              <h3 className="text-base font-black text-slate-900">
                Голосовой набор WORKFLOW
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canUseVoiceControl ? (
          <div className="space-y-4">
            {/* Promotional Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Дополнительная функция</span>
                </span>
              </div>
              <h4 className="text-base font-black leading-snug">
                Управляйте сайтом и создавайте заметки голосом за 1 секунду!
              </h4>
              <p className="text-xs text-purple-100 leading-relaxed">
                Не нужно печатать вручную на телефоне: диктуйте личные заметки, ищите заявки по адресу и мгновенно переключайтесь между разделами сайта голосом.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2">
                  <Compass className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-white">Голосовая навигация</div>
                    <div className="text-purple-200 text-[10px]">
                      Скажите «Карта», «Дома», «Плановые работы» или «Подать заявку»
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-white">Диктовка заметок</div>
                    <div className="text-purple-200 text-[10px]">
                      Речь мгновенно преобразуется в текст в Личном списке дел
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Restricted Notice + CTA to Contact Admin */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">
                    Доступ включается Администратором
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Для вашей учётной записи функция голосового набора сейчас не активирована. Хотите подключить эту функцию? Напишите Администратору для включения в разделе «Права».
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-amber-200/70">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Закрыть
                </button>
                {onOpenWriteToAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWriteToAdmin();
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Написать администратору</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Mode Switcher: Навигация / Умная команда vs Быстрая голосовая заметка */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-purple-50 border border-purple-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('smart');
              startListening('smart');
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'smart'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-950'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Навигация по сайту</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('note');
              startListening('note');
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'note'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-950'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Голосовая заметка</span>
          </button>
        </div>

        {/* Big Microphone Button for Mobile Convenience */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-50/90 to-white border border-purple-200/90 flex flex-col items-center text-center space-y-2.5">
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening(mode);
              }
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all cursor-pointer active:scale-95 ${
              isListening
                ? 'bg-rose-600 ring-4 ring-rose-200 animate-pulse'
                : 'bg-purple-700 hover:bg-purple-800 ring-4 ring-purple-100'
            }`}
            title={isListening ? 'Остановить микрофон' : 'Начать голосовой ввод'}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          <div>
            <div className="font-extrabold text-sm text-slate-900">
              {isListening
                ? 'Слушаю вас... Говорите в микрофон'
                : 'Нажмите на микрофон и произнесите команду'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {mode === 'smart'
                ? 'Скажите название раздела (например: «Карта», «Дома», «Плановые работы», «Сотрудники»), «Подать заявку», «Поиск Доценка» или «Заметка купить кабель»'
                : 'Продиктуйте текст вашей заметки — он сразу запишется в поле ниже'}
            </p>
          </div>

          {transcript && (
            <div className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-purple-950 font-bold text-xs">
              Распознано: «{transcript}»
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl border font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : feedbackMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-purple-50 border-purple-200 text-purple-950'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-purple-700 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* CONTENT BY MODE */}
        {mode === 'smart' ? (
          <div className="space-y-3">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Голосовые команды для переходов по сайту (или нажмите вручную):</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {quickVoiceCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.nav}
                    type="button"
                    onClick={() => {
                      onNavigate(cmd.nav);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-purple-200/80 bg-white hover:bg-purple-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800 truncate">{cmd.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1 text-[11px] text-slate-600">
              <div className="font-extrabold text-purple-950">Примеры умных голосовых команд:</div>
              <div>• <strong>«Подать заявку»</strong> — сразу откроет окно новой заявки</div>
              <div>• <strong>«Поиск Шевченко»</strong> — найдёт заявки по адресу или мастеру</div>
              <div>• <strong>«Заметка проверить элеваторный узел»</strong> — мгновенно создаст личную заметку</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveQuickNote} className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Текст заметки (в Личный список дел — {userSurname}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Надиктуйте или введите название заметки..."
                className="w-full px-3 py-2.5 rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Дата (необязательно)
                </label>
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Подробности
                </label>
                <input
                  type="text"
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  placeholder="Дополнительное описание..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить заметку</span>
              </button>
            </div>
          </form>
        )}
          </>
        )}
      </div>
    </div>
  );
};
