import React, { useState } from 'react';
import { ThemeConfig, GradientOption, PersonalTask, PersonalPerson, UserItem } from '../../types';
import { getUserSurname } from '../../utils/userUtils';
import {
  CheckSquare,
  FileText,
  Users,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Check,
  Lock,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Plus,
  BookOpen,
  Search,
  Edit,
} from 'lucide-react';

interface PersonalTasksViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  currentUser?: UserItem;
  tasks: PersonalTask[];
  personalPeople: PersonalPerson[];
  onUpdateTask: (task: PersonalTask) => void;
  onCreateTask: (task: PersonalTask) => void;
  onDeleteTask: (id: string) => void;
  onUpdatePersonalPerson: (person: PersonalPerson) => void;
  onCreatePersonalPerson: (person: PersonalPerson) => void;
  onDeletePersonalPerson: (id: string) => void;
  onBackToHome: () => void;
}

export const PersonalTasksView: React.FC<PersonalTasksViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  currentUser,
  tasks,
  personalPeople,
  onUpdateTask,
  onCreateTask,
  onDeleteTask,
  onUpdatePersonalPerson,
  onCreatePersonalPerson,
  onDeletePersonalPerson,
  onBackToHome,
}) => {
  const isAuthorized = Boolean(currentUser && currentUser.approved);
  const userSurname = getUserSurname(currentUser);

  // View mode: 'calendar' | 'list' | 'phonebook' (defaults to calendar as requested)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'phonebook'>('calendar');
  const [activeListTab, setActiveListTab] = useState<'current' | 'completed'>('current');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Selected calendar date in calendar mode (single click changes color)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Month navigation for Personal Calendar: open on real current month and year
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());

  const monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build days matrix for the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDayOffset = (firstDayOfMonth + 6) % 7; // Monday = 0
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Filter tasks strictly by current authorized user account
  const myTasks = tasks.filter((t) => {
    if (!currentUser) return false;
    if (t.owner_user_id !== undefined) {
      return t.owner_user_id === currentUser.id;
    }
    // Backward compatibility for initial items if user id is 1
    return currentUser.id === 1;
  });

  const currentTasks = myTasks.filter((t) => t.status !== 'completed');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');

  // Filter personal people strictly by current user account
  const myPeople = personalPeople.filter((p) => {
    if (!currentUser) return false;
    return p.owner_user_id === currentUser.id;
  });

  // Modal for new/edit task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  // Modal for new/edit personal person
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonalPerson | null>(null);
  const [personFullName, setPersonFullName] = useState('');
  const [personOrg, setPersonOrg] = useState('');
  const [personPos, setPersonPos] = useState('');
  const [personAddress, setPersonAddress] = useState('');
  const [personPhones, setPersonPhones] = useState<string[]>(['']);
  const [personNotes, setPersonNotes] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Телефонная книга search
  const [phonebookSearch, setPhonebookSearch] = useState('');

  const filteredPhonebook = myPeople.filter((p) => {
    if (!phonebookSearch.trim()) return true;
    const q = phonebookSearch.toLowerCase();
    const nameMatch = p.full_name.toLowerCase().includes(q);
    const orgMatch = (p.organization || '').toLowerCase().includes(q);
    const posMatch = (p.position || '').toLowerCase().includes(q);
    const addrMatch = (p.residence_address || '').toLowerCase().includes(q);
    const phoneMatch = (p.phones || []).some((ph) => ph.toLowerCase().includes(q));
    const notesMatch = (p.notes || '').toLowerCase().includes(q);
    return nameMatch || orgMatch || posMatch || addrMatch || phoneMatch || notesMatch;
  });

  // Handlers for Tasks
  const handleOpenCreateTask = (prefilledDate?: string) => {
    if (!isAuthorized) return;
    setEditingTask(null);
    setTaskTitle('');
    setTaskDate(prefilledDate || '');
    setTaskDesc('');
    setTaskStatus('pending');
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task: PersonalTask) => {
    if (!isAuthorized || task.owner_user_id !== currentUser?.id) return;
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDate(task.task_date || '');
    setTaskDesc(task.description);
    setTaskStatus(task.status);
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !currentUser) return;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: taskTitle.trim(),
        task_date: taskDate.trim(),
        description: taskDesc.trim(),
        status: taskStatus,
        owner_user_id: currentUser.id,
        owner_surname: editingTask.owner_surname || userSurname,
      });
    } else {
      const newTask: PersonalTask = {
        id: `pt-${Date.now()}`,
        title: taskTitle.trim(),
        task_date: taskDate.trim(),
        description: taskDesc.trim(),
        status: taskStatus,
        owner_user_id: currentUser.id,
        owner_surname: userSurname,
      };
      onCreateTask(newTask);
    }
    setIsModalOpen(false);
  };

  const handleToggleComplete = (task: PersonalTask) => {
    if (!isAuthorized || (task.owner_user_id && task.owner_user_id !== currentUser?.id)) return;
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    onUpdateTask({ ...task, status: nextStatus });
  };

  // Handlers for Personal People in this account
  const handleOpenCreatePerson = () => {
    if (!isAuthorized) return;
    setEditingPerson(null);
    setPersonFullName('');
    setPersonOrg('');
    setPersonPos('');
    setPersonAddress('');
    setPersonPhones(['']);
    setPersonNotes('');
    setIsPersonModalOpen(true);
  };

  const handleOpenEditPerson = (p: PersonalPerson) => {
    if (!isAuthorized || p.owner_user_id !== currentUser?.id) return;
    setEditingPerson(p);
    setPersonFullName(p.full_name);
    setPersonOrg(p.organization);
    setPersonPos(p.position);
    setPersonAddress(p.residence_address);
    setPersonPhones(p.phones.length > 0 ? [...p.phones] : ['']);
    setPersonNotes(p.notes);
    setIsPersonModalOpen(true);
  };

  const handleSavePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personFullName.trim() || !currentUser) return;
    const cleanPhones = personPhones.map((ph) => ph.trim()).filter(Boolean);

    if (editingPerson) {
      onUpdatePersonalPerson({
        ...editingPerson,
        full_name: personFullName.trim(),
        organization: personOrg.trim(),
        position: personPos.trim(),
        residence_address: personAddress.trim(),
        phones: cleanPhones,
        notes: personNotes.trim(),
        owner_user_id: currentUser.id,
        owner_surname: editingPerson.owner_surname || userSurname,
      });
    } else {
      const newPerson: PersonalPerson = {
        id: `my-pp-${Date.now()}`,
        full_name: personFullName.trim(),
        organization: personOrg.trim(),
        position: personPos.trim(),
        residence_address: personAddress.trim(),
        phones: cleanPhones,
        notes: personNotes.trim(),
        owner_user_id: currentUser.id,
        owner_surname: userSurname,
      };
      onCreatePersonalPerson(newPerson);
    }
    setIsPersonModalOpen(false);
  };

  // If user is not authorized
  if (!isAuthorized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs pb-3 border-b border-purple-100">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Главная</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">Личный список дел</span>
        </div>

        <div className="p-8 rounded-2xl border border-purple-200 bg-white shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900">
            Доступ ограничен
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Личный список дел доступен только авторизованным пользователям под своей учётной записью.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Главная</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">
            Личный список дел ({userSurname})
          </span>
        </div>

        {/* View toggle: Календарь - Список (как в Плановые работы) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl border border-purple-200 bg-white text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Календарь</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Список заметок</span>
            </button>
          </div>

          {/* Кнопка Телефонная книга рядом с Сделать заметку */}
          <button
            onClick={() => setViewMode('phonebook')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all border cursor-pointer ${
              viewMode === 'phonebook'
                ? 'bg-purple-800 text-white border-purple-900 ring-2 ring-purple-300'
                : 'border-purple-200 bg-white hover:bg-purple-50 text-purple-900 active:scale-95'
            }`}
            title="Открыть телефонную книгу"
          >
            <BookOpen className={`w-3.5 h-3.5 ${viewMode === 'phonebook' ? 'text-white' : 'text-purple-700'}`} />
            <span>Телефонная книга</span>
            {myPeople.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black border ${
                  viewMode === 'phonebook'
                    ? 'bg-purple-950 text-purple-100 border-purple-700'
                    : 'bg-purple-100 text-purple-900 border-purple-200'
                }`}
              >
                {myPeople.length}
              </span>
            )}
          </button>

          {/* Кнопка Сделать заметку */}
          <button
            onClick={() => handleOpenCreateTask(selectedCalendarDate || undefined)}
            className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95"
            style={{
              background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Сделать заметку</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE: CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">
                Личный календарь дел ({userSurname}) — {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(now.getMonth());
                  setCurrentYear(now.getFullYear());
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-900 font-medium transition-colors"
                title="Перейти на текущий месяц"
              >
                Текущий
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
              <span
                key={d}
                className={`font-bold py-1 rounded-md ${
                  i === 6 ? 'text-rose-600 bg-rose-100/80 font-black mx-1' : 'text-purple-900'
                }`}
              >
                {d}
              </span>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-20 p-1 rounded-xl bg-slate-50/50 border border-transparent" />;
              }

              const mm = String(currentMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateStr = `${currentYear}-${mm}-${dd}`;
              const dayTasks = myTasks.filter((t) => t.task_date === dateStr);
              const hasPending = dayTasks.some((t) => t.status !== 'completed');
              const isSunday = idx % 7 === 6;

              // Today check
              const now = new Date();
              const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              const isToday = dateStr === todayIso;

              const isSelected = selectedCalendarDate === dateStr;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedCalendarDate(dateStr)}
                  onDoubleClick={() => handleOpenCreateTask(dateStr)}
                  className={`h-20 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all select-none ${
                    isSelected
                      ? 'ring-3 ring-purple-600 bg-purple-100 border-purple-500 shadow-sm z-20'
                      : isToday
                      ? 'ring-2 ring-purple-500/80 bg-purple-50/90 shadow-2xs z-10'
                      : hasPending
                      ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/70'
                      : dayTasks.length > 0
                      ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70'
                      : isSunday
                      ? 'border-rose-200/80 bg-rose-50/40 hover:bg-rose-100/60'
                      : 'border-purple-100 hover:bg-purple-50/60'
                  }`}
                  title={`Дата: ${dateStr}. Клик — выделить дату, двойной клик — новая заметка`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-bold text-xs ${
                          isSelected
                            ? 'text-white bg-purple-700 px-1.5 py-0.5 rounded-md font-black shadow-xs'
                            : isToday
                            ? 'text-purple-900 font-black'
                            : hasPending
                            ? 'text-amber-900'
                            : dayTasks.length > 0
                            ? 'text-emerald-900'
                            : isSunday
                            ? 'text-rose-700 font-black'
                            : 'text-slate-700'
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-1 py-0.2 rounded border border-purple-200">
                          Сегодня
                        </span>
                      )}
                    </div>
                    {dayTasks.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                    )}
                  </div>
                  {dayTasks.length > 0 ? (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditTask(dayTasks[0]);
                      }}
                      className="truncate text-[10px] font-bold text-slate-700 bg-white/90 px-1 py-0.5 rounded border border-purple-100 hover:border-purple-300"
                    >
                      {dayTasks[0].title}
                      {dayTasks.length > 1 && ` (+${dayTasks.length - 1})`}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400">+ заметка</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE: LIST */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Tabs Bar in List Mode */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center p-1 rounded-xl border border-purple-200 bg-white text-xs">
              <button
                onClick={() => setActiveListTab('current')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeListTab === 'current'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Текущие дела ({currentTasks.length})
              </button>
              <button
                onClick={() => setActiveListTab('completed')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeListTab === 'completed'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Свои выполненные ({completedTasks.length})
              </button>
            </div>
          </div>

          {/* TAB CONTENT: CURRENT & COMPLETED TASKS (ФОРМА НА ВСЮ СТРОКУ КАК НА ГЛАВНОЙ) */}
          {(activeListTab === 'current' || activeListTab === 'completed') && (
            <div className="space-y-2.5">
              {(activeListTab === 'current' ? currentTasks : completedTasks).map((task) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                    onDoubleClick={() => handleOpenEditTask(task)}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all text-xs flex items-center justify-between gap-4 cursor-pointer select-none ${
                      isSelected
                        ? 'ring-2 ring-purple-600 bg-purple-50/90 border-purple-400 shadow-md scale-[1.003]'
                        : 'border-purple-200/80 bg-white hover:border-purple-300 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Один клик — выделить и сменить цвет. Двойной клик — редактировать дело"
                  >
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleToggleComplete(task)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer accent-purple-600 shrink-0"
                        title="Отметить выполнение"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`font-extrabold text-sm text-slate-900 ${
                              task.status === 'completed' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </span>

                          {/* Immutable status: «фамилия учётной записи» */}
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold border border-purple-200">
                            {task.owner_surname || userSurname}
                          </span>

                          {task.task_date ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{task.task_date}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-semibold border border-purple-200 flex items-center gap-1">
                              <span>Без даты</span>
                            </span>
                          )}

                          {task.status === 'completed' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Выполнено</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                              В работе
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-slate-600 text-xs truncate">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {(activeListTab === 'current' ? currentTasks : completedTasks).length === 0 && (
                <div className="p-8 rounded-2xl border border-dashed border-purple-200 bg-white/70 text-center text-xs text-slate-500 space-y-2">
                  <p>
                    {activeListTab === 'current'
                      ? 'В вашем списке пока нет активных дел.'
                      : 'В вашем списке пока нет выполненных дел.'}
                  </p>
                  {activeListTab === 'current' && (
                    <button
                      onClick={() => handleOpenCreateTask()}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-700 text-white font-bold inline-flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Сделать заметку</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: PHONEBOOK (ТЕЛЕФОННАЯ КНИГА РЯДОМ С «СДЕЛАТЬ ЗАМЕТКУ») */}
      {viewMode === 'phonebook' && (
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-4">
          {/* Top toolbar with search and Add Contact button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-purple-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phonebookSearch}
                onChange={(e) => setPhonebookSearch(e.target.value)}
                placeholder="Поиск по ФИО, телефону, организации, должности, адресу..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Контактов: <strong>{myPeople.length}</strong>
              </span>
              <button
                onClick={handleOpenCreatePerson}
                className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить контакт</span>
              </button>
            </div>
          </div>

          {/* Subtitle banner */}
          <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Телефонная книга учётной записи <strong>{userSurname}</strong>. Контакты имеют статус <strong>«{userSurname}»</strong> и видны только вам.
            </span>
            <span className="font-bold text-purple-900 font-mono text-[11px]">
              {filteredPhonebook.length} {filteredPhonebook.length === 1 ? 'запись' : 'записей'}
            </span>
          </div>

          {/* Compact full-row contacts list */}
          <div className="space-y-2">
            {filteredPhonebook.map((p) => {
              const isSelected = selectedPersonId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersonId(isSelected ? null : p.id)}
                  onDoubleClick={() => handleOpenEditPerson(p)}
                  className={`w-full p-2.5 sm:px-4 sm:py-3 rounded-2xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none ${
                    isSelected
                      ? 'ring-2 ring-purple-600 bg-purple-50/90 border-purple-400 shadow-md scale-[1.002]'
                      : 'border-purple-200/80 bg-white hover:border-purple-300 shadow-2xs hover:shadow-xs'
                  }`}
                  title="Один клик — выделить. Двойной клик — редактировать контакт"
                >
                  {/* Left: Contact Full Name & Account Badge */}
                  <div className="flex items-center gap-2.5 sm:min-w-[240px]">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {p.full_name}
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[9px] shrink-0">
                      {p.owner_surname || userSurname}
                    </span>
                  </div>

                  {/* Middle: Organization, Position, Address & Notes (Horizontal layout) */}
                  <div className="flex items-center gap-3 text-slate-600 flex-1 min-w-0 flex-wrap">
                    {p.organization && (
                      <span className="flex items-center gap-1 font-semibold text-purple-950 shrink-0">
                        <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{p.organization}</span>
                      </span>
                    )}
                    {p.position && (
                      <span className="flex items-center gap-1 text-slate-500 shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{p.position}</span>
                      </span>
                    )}
                    {p.residence_address && (
                      <span className="hidden lg:flex items-center gap-1 text-slate-500 text-[11px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{p.residence_address}</span>
                      </span>
                    )}
                    {p.notes && (
                      <span className="hidden xl:inline text-slate-400 text-[11px] italic truncate max-w-xs">
                        ({p.notes})
                      </span>
                    )}
                  </div>

                  {/* Right: Phones & Actions */}
                  <div
                    className="flex items-center gap-2 shrink-0 flex-wrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.phones && p.phones.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.phones.map((phone, i) => (
                          <a
                            key={i}
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs transition-colors"
                            title="Позвонить"
                          >
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{phone}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 border-l border-purple-100 pl-2">
                      <button
                        onClick={() => handleOpenEditPerson(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100 transition-colors"
                        title="Редактировать контакт"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Действительно удалить запись «${p.full_name}»?`
                            )
                          ) {
                            onDeletePersonalPerson(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPhonebook.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-purple-200 bg-white text-center text-xs text-slate-500 space-y-2">
                <p>
                  {phonebookSearch
                    ? 'По вашему запросу контакты не найдены.'
                    : 'В вашей телефонной книге пока нет записей.'}
                </p>
                <button
                  onClick={handleOpenCreatePerson}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-700 text-white font-bold inline-flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить контакт</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-purple-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Статус записи: {userSurname}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingTask ? 'Редактировать заметку' : 'Новая заметка'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Название <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Что нужно сделать..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    Дата исполнения <span className="text-slate-400 font-normal text-[11px]">(необязательно)</span>
                  </label>
                  {taskDate && (
                    <button
                      type="button"
                      onClick={() => setTaskDate('')}
                      className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold"
                    >
                      Очистить дату
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium bg-white"
                />
                {!taskDate && (
                  <p className="text-[10px] text-purple-700 mt-1 font-medium bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
                    Заметка будет создана без даты и видна в разделе «Список заметок».
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Статус
                </label>
                <select
                  value={taskStatus}
                  onChange={(e) =>
                    setTaskStatus(e.target.value as 'pending' | 'in_progress' | 'completed')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium bg-white"
                >
                  <option value="pending">В ожидании</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Выполнено</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Описание / подробности
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Дополнительные детали..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PERSONAL PERSON MODAL */}
      {isPersonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-purple-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Личный контакт ({userSurname})
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPerson ? 'Редактировать контакт' : 'Новый контакт в телефонную книгу'}
                </h3>
              </div>
              <button
                onClick={() => setIsPersonModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ФИО <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={personFullName}
                  onChange={(e) => setPersonFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Организация
                  </label>
                  <input
                    type="text"
                    value={personOrg}
                    onChange={(e) => setPersonOrg(e.target.value)}
                    placeholder="Компания / Участок"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Кем работает / Должность
                  </label>
                  <input
                    type="text"
                    value={personPos}
                    onChange={(e) => setPersonPos(e.target.value)}
                    placeholder="Слесарь / Электрик"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Адрес
                </label>
                <input
                  type="text"
                  value={personAddress}
                  onChange={(e) => setPersonAddress(e.target.value)}
                  placeholder="ул. Ленина, д. 5"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Телефон
                </label>
                <input
                  type="text"
                  value={personPhones[0] || ''}
                  onChange={(e) => setPersonPhones([e.target.value])}
                  placeholder="+38 (0__) ___-__-__"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Заметки
                </label>
                <textarea
                  rows={2}
                  value={personNotes}
                  onChange={(e) => setPersonNotes(e.target.value)}
                  placeholder="Личные заметки..."
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsPersonModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить контакт</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
