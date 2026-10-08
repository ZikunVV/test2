import React, { useState, useRef, useEffect } from 'react';
import { ThemeConfig, GradientOption, UserItem, PersonalTask } from '../types';
import { getUserSurname } from '../utils/userUtils';
import { useLanguage } from '../utils/i18n';
import { parseVoiceReminderCommand } from '../utils/voiceReminderParser';
import {
  Mic,
  MicOff,
  X,
  Compass,
  FileText,
  BellRing,
  Clock,
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

  const [mode, setMode] = useState<'smart' | 'note' | 'reminder'>('smart');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
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

    // 0. Voice Sound Reminder Command ("Напомни мне через два часа...", "Напомни в 12 00...", "Напомни через 15 минут...")
    const parsedReminder = parseVoiceReminderCommand(text);
    if (parsedReminder) {
      if (!canViewPersonalTasks || !currentUser) {
        setFeedbackMsg({
          type: 'error',
          text: 'У вас нет доступа к разделу «Личный список дел» для сохранения напоминания.',
        });
        return;
      }
      const newTask: PersonalTask = {
        id: `pt-${Date.now()}`,
        title: `🔔 ${parsedReminder.title}`,
        task_date: parsedReminder.taskDateIso,
        description: `Звуковое напоминание назначено на: ${parsedReminder.timeLabel} (из фразы: «${text}»)`,
        status: 'pending',
        owner_user_id: currentUser.id,
        owner_surname: userSurname,
        reminder_at_iso: parsedReminder.reminderAtIso,
        reminder_time_label: parsedReminder.timeLabel,
        reminder_fired: false,
      };
      onCreatePersonalTask(newTask);
      setFeedbackMsg({
        type: 'success',
        text: `Звуковое напоминание установлено на ${parsedReminder.timeLabel}: «${parsedReminder.title}»`,
      });
      setTimeout(() => {
        onNavigate('my_tasks');
        onClose();
      }, 1600);
      return;
    }

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
      lower.includes('звук') ||
      lower.includes('сигнал') ||
      lower.includes('мелод') ||
      lower.includes('настройк') ||
      lower.includes('налаштуван') ||
      lower.includes('sounds')
    ) {
      setFeedbackMsg({ type: 'success', text: 'Открываю «Настройки → Звуки»...' });
      setTimeout(() => {
        onNavigate('sounds');
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

  const startListening = (targetMode: 'smart' | 'note' | 'reminder' = mode) => {
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
        } else if (targetMode === 'reminder') {
          const parsed = parseVoiceReminderCommand(
            cleaned.toLowerCase().includes('напомн') || cleaned.toLowerCase().includes('нагад')
              ? cleaned
              : `Напомни ${cleaned}`
          );
          if (parsed && currentUser && canViewPersonalTasks) {
            const newTask: PersonalTask = {
              id: `pt-${Date.now()}`,
              title: `🔔 ${parsed.title}`,
              task_date: parsed.taskDateIso,
              description: `Звуковое напоминание назначено на: ${parsed.timeLabel}`,
              status: 'pending',
              owner_user_id: currentUser.id,
              owner_surname: userSurname,
              reminder_at_iso: parsed.reminderAtIso,
              reminder_time_label: parsed.timeLabel,
              reminder_fired: false,
            };
            onCreatePersonalTask(newTask);
            setFeedbackMsg({
              type: 'success',
              text: `Звуковое напоминание установлено на ${parsed.timeLabel}: «${parsed.title}»`,
            });
            setTimeout(() => {
              onNavigate('my_tasks');
              onClose();
            }, 1500);
          } else {
            setNoteTitle((prev) => (prev.trim() ? `${prev.trim()} ${cleaned}` : cleaned));
          }
        } else {
          // Even in 'note' mode, if the user explicitly says "Напомни мне через 2 часа...", parse the time automatically!
          const maybeReminder = parseVoiceReminderCommand(cleaned);
          if (maybeReminder) {
            setNoteTitle(maybeReminder.title);
            setNoteDate(maybeReminder.taskDateIso);
            const dt = new Date(maybeReminder.reminderAtIso);
            setReminderTime(
              `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
            );
            setFeedbackMsg({
              type: 'info',
              text: `Распознано время напоминания: ${maybeReminder.timeLabel}. Нажмите «Сохранить»!`,
            });
          } else {
            setNoteTitle((prev) => (prev.trim() ? `${prev.trim()} ${cleaned}` : cleaned));
          }
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

    let reminderAtIso: string | undefined;
    let reminderLabel: string | undefined;
    let finalDate = noteDate.trim();

    if (reminderTime.trim()) {
      const now = new Date();
      const [hhStr, mmStr] = reminderTime.trim().split(':');
      const hh = parseInt(hhStr || '0', 10);
      const mm = parseInt(mmStr || '0', 10);
      const target = finalDate ? new Date(`${finalDate}T00:00:00`) : new Date(now);
      target.setHours(hh, mm, 0, 0);
      if (!finalDate && target.getTime() <= now.getTime() - 60 * 1000) {
        target.setDate(target.getDate() + 1);
      }
      const yyyy = target.getFullYear();
      const mo = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      finalDate = `${yyyy}-${mo}-${dd}`;
      reminderAtIso = target.toISOString();
      reminderLabel = `${finalDate} в ${reminderTime.trim()}`;
    }

    const newTask: PersonalTask = {
      id: `pt-${Date.now()}`,
      title: reminderAtIso && !noteTitle.trim().startsWith('🔔') ? `🔔 ${noteTitle.trim()}` : noteTitle.trim(),
      task_date: finalDate,
      description:
        noteDesc.trim() ||
        (reminderLabel ? `Звуковое напоминание назначено на: ${reminderLabel}` : ''),
      status: 'pending',
      owner_user_id: currentUser.id,
      owner_surname: userSurname,
      reminder_at_iso: reminderAtIso,
      reminder_time_label: reminderLabel,
      reminder_fired: reminderAtIso ? false : undefined,
    };

    onCreatePersonalTask(newTask);
    setNoteTitle('');
    setNoteDesc('');
    setNoteDate('');
    setReminderTime('');
    setFeedbackMsg({
      type: 'success',
      text: reminderLabel
        ? `Звуковое напоминание на ${reminderLabel} сохранено!`
        : 'Заметка успешно сохранена в ваш «Личный список дел»!',
    });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleQuickPresetReminder = (minutesFromNow: number, labelText: string) => {
    if (!currentUser || !canViewPersonalTasks) return;
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');
    const timeLabel = `Сегодня в ${hh}:${min}`;
    const customTitle = noteTitle.trim() || `Напоминание (${labelText})`;

    const newTask: PersonalTask = {
      id: `pt-${Date.now()}`,
      title: `🔔 ${customTitle}`,
      task_date: `${yyyy}-${mm}-${dd}`,
      description: `Звуковое напоминание назначено на ${timeLabel}`,
      status: 'pending',
      owner_user_id: currentUser.id,
      owner_surname: userSurname,
      reminder_at_iso: target.toISOString(),
      reminder_time_label: timeLabel,
      reminder_fired: false,
    };
    onCreatePersonalTask(newTask);
    setFeedbackMsg({
      type: 'success',
      text: `Звуковое напоминание установлено на ${timeLabel}: «${customTitle}»`,
    });
    setTimeout(() => {
      onNavigate('my_tasks');
      onClose();
    }, 1300);
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
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start sm:items-center justify-center p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-[92vw] max-w-[330px] sm:max-w-md p-3.5 sm:p-5 border border-purple-200 shadow-2xl space-y-3 text-xs animate-in fade-in zoom-in-95 my-auto max-h-[88vh] overflow-y-auto overflow-x-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{
                background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
              }}
            >
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block truncate">
                Голосовое управление и заметки
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                Голосовой набор WORKFLOW
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {!canUseVoiceControl ? (
          <div className="space-y-3">
            {/* Promotional Banner */}
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white space-y-2.5 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Дополнительная функция</span>
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black leading-snug">
                Управляйте сайтом и создавайте заметки голосом за 1 секунду!
              </h4>
              <p className="text-[11px] text-purple-100 leading-relaxed">
                Не нужно печатать вручную на телефоне: диктуйте личные заметки, ищите заявки по адресу и мгновенно переключайтесь между разделами сайта голосом.
              </p>

              <div className="grid grid-cols-1 gap-1.5 pt-0.5 text-[10px] sm:text-[11px]">
                <div className="p-2 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2">
                  <Compass className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-extrabold text-white">Голосовая навигация</div>
                    <div className="text-purple-200 text-[10px] leading-tight">
                      Скажите «Карта», «Дома», «Плановые работы» или «Подать заявку»
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-extrabold text-white">Диктовка заметок</div>
                    <div className="text-purple-200 text-[10px] leading-tight">
                      Речь мгновенно преобразуется в текст в Личном списке дел
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Restricted Notice + CTA to Contact Admin */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-[11px] sm:text-xs text-slate-900">
                    Доступ включается Администратором
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Для вашей учётной записи функция голосового набора сейчас не активирована. Напишите Администратору для включения в разделе «Права».
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-amber-200/70">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-[11px] cursor-pointer"
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
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3 h-3 shrink-0" />
                    <span>Написать админу</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Mode Switcher: Навигация / Заметка / Звуковое напоминание */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-purple-50 border border-purple-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('smart');
              startListening('smart');
            }}
            className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0 ${
              mode === 'smart'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-950'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Навигация</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reminder');
              startListening('reminder');
            }}
            className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0 ${
              mode === 'reminder'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-950'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Напоминание</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('note');
              startListening('note');
            }}
            className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0 ${
              mode === 'note'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-950'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Заметка</span>
          </button>
        </div>

        {/* Big Microphone Button for Mobile Convenience */}
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-purple-50/90 to-white border border-purple-200/90 flex flex-col items-center text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening(mode);
              }
            }}
            className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center text-white shadow-lg transition-all cursor-pointer active:scale-95 ${
              isListening
                ? 'bg-rose-600 ring-4 ring-rose-200 animate-pulse'
                : 'bg-purple-700 hover:bg-purple-800 ring-4 ring-purple-100'
            }`}
            title={isListening ? 'Остановить микрофон' : 'Начать голосовой ввод'}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="w-full min-w-0">
            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
              {isListening
                ? 'Слушаю вас... Говорите'
                : 'Нажмите на микрофон'}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug break-words">
              {mode === 'smart'
                ? 'Скажите раздел («Карта», «Дома»), «Напомни мне через два часа...» или «Напомни в 12 00...»'
                : mode === 'reminder'
                ? 'Скажите: «Напомни мне через два часа позвонить мастеру» или «Напомни в 12 00 проверить подвал»'
                : 'Продиктуйте текст вашей заметки — он запишется в поле ниже'}
            </p>
          </div>

          {transcript && (
            <div className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-950 font-bold text-[11px] break-words">
              Распознано: «{transcript}»
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`p-2.5 rounded-xl border font-bold text-[11px] flex items-center gap-2 ${
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
            <span className="break-words min-w-0">{feedbackMsg.text}</span>
          </div>
        )}

        {/* CONTENT BY MODE */}
        {mode === 'smart' ? (
          <div className="space-y-2.5">
            <div className="font-bold text-[11px] text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Быстрый переход (голосом или нажатием):</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
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
                    className="p-2 rounded-xl border border-purple-200/80 bg-white hover:bg-purple-50 text-left flex items-center gap-1.5 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[11px] text-slate-800 truncate">{cmd.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1 text-[10px] sm:text-[11px] text-slate-600 leading-snug">
              <div className="font-extrabold text-purple-950">Примеры голосовых команд:</div>
              <div>• <strong>«Напомни мне через два часа»</strong> — звуковой сигнал</div>
              <div>• <strong>«Напомни в 12 00»</strong> — звуковое напоминание на 12:00</div>
              <div>• <strong>«Подать заявку»</strong> — окно новой заявки</div>
              <div>• <strong>«Поиск Шевченко»</strong> — поиск по адресу</div>
            </div>
          </div>
        ) : mode === 'reminder' ? (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 space-y-1.5 text-[10px] sm:text-[11px] text-amber-950">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <BellRing className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Голосовое звуковое напоминание:</span>
              </div>
              <div>• Скажите: <strong>«Напомни мне через два часа»</strong></div>
              <div>• Скажите: <strong>«Напомни в 12 00 позвонить диспетчеру»</strong></div>
              <div>• Скажите: <strong>«Напомни через 15 минут»</strong></div>
              <div className="text-[10px] text-amber-800 pt-0.5">
                В назначенное время на сайте сработает выбранный вами звуковой сигнал и голосовое оповещение!
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[11px] text-slate-700 block">
                О чём напомнить (необязательно):
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Например: Проверить заявку или позвонить..."
                className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Или нажмите быструю кнопку:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPresetReminder(15, 'через 15 минут')}
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-purple-700 shrink-0" />
                  <span>Через 15 мин</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetReminder(30, 'через 30 минут')}
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-purple-700 shrink-0" />
                  <span>Через 30 мин</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetReminder(60, 'через 1 час')}
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-purple-700 shrink-0" />
                  <span>Через 1 час</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetReminder(120, 'через 2 часа')}
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-purple-700 shrink-0" />
                  <span>Через 2 часа</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveQuickNote} className="space-y-2.5">
            <div>
              <label className="font-bold text-[11px] text-slate-700 block mb-1">
                Текст заметки ({userSurname}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Надиктуйте или введите заметку..."
                className="w-full px-2.5 py-2 rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-[11px] text-slate-700 block mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="font-bold text-[11px] text-slate-700 block mb-1">
                  Время сигнала 🔔
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[11px] text-slate-700 block mb-1">
                Подробности
              </label>
              <input
                type="text"
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
                placeholder="Описание..."
                className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Сохранить</span>
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
