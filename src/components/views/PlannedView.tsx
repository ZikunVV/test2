import React, { useState } from 'react';
import { ThemeConfig, GradientOption, Ticket } from '../../types';
import { TicketCard } from '../TicketCard';
import {
  Calendar as CalendarIcon,
  List,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface PlannedViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  tickets: Ticket[];
  onOpenTicket: (ticket: Ticket) => void;
  onEditTicket?: (ticket: Ticket) => void;
  onAccept?: (ticketId: string) => void;
  onComplete?: (ticketId: string) => void;
  canEdit?: boolean;
  onInspectWorker?: (workerName: string) => void;
  onNewPlannedTicket: (prefilledDate?: string) => void;
  onBackToHome: () => void;
}

export const PlannedView: React.FC<PlannedViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  tickets,
  onOpenTicket,
  onEditTicket,
  onAccept,
  onComplete,
  canEdit = true,
  onInspectWorker,
  onNewPlannedTicket,
  onBackToHome,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Month navigation: open on current real month and year
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());

  // Selected date inside calendar
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);

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

  // Planned tickets (strictly planned tickets or general category)
  const plannedTickets = tickets.filter(
    (t) => t.planned || t.category === 'general'
  );

  const inWaitingCount = plannedTickets.filter(
    (t) => t.status === 'in_waiting'
  ).length;
  const inProgressCount = plannedTickets.filter(
    (t) => t.status === 'in_progress'
  ).length;
  const completedCount = plannedTickets.filter(
    (t) => t.status === 'completed'
  ).length;

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
  // Adjust Monday = 0
  const startDayOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getISODateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const handleDayClick = (dayStr: string) => {
    setSelectedDateStr(dayStr);
  };

  const handleDayDoubleClick = (dayStr: string) => {
    setDayModalDate(dayStr);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
          <span className="font-bold text-slate-800">Плановые работы</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
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
              <span>Список</span>
            </button>
          </div>

          <button
            onClick={() => onNewPlannedTicket()}
            className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95"
            style={{
              background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Подать заявку</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-amber-200/80 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800">В работе</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {inProgressCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200/80 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800">В ожидании</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {inWaitingCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200/80 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800">Выполнено</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {completedCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' ? (
        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-900">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-xs text-slate-400">
                Двойной щелчок по дате открывает заявки дня
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-900 transition-colors"
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
                className="px-2.5 py-1 text-xs rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-900 font-medium"
              >
                Текущий
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-900 transition-colors"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid matching PersonalTasksView */}
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
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-20 p-1 rounded-xl bg-slate-50/50 border border-transparent"
                  />
                );
              }

              const dayStr = getISODateString(day);
              const dayTickets = plannedTickets.filter((t) => t.date === dayStr);
              const hasActivePlanned = dayTickets.some(
                (t) => t.status !== 'completed'
              );
              const isSelected = selectedDateStr === dayStr;
              const isSunday = idx % 7 === 6;

              // Today check (current local date)
              const now = new Date();
              const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              const isToday = dayStr === todayIso;

              return (
                <div
                  key={dayStr}
                  onClick={() => handleDayClick(dayStr)}
                  onDoubleClick={() => handleDayDoubleClick(dayStr)}
                  className={`h-20 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all select-none ${
                    isSelected
                      ? 'ring-3 ring-purple-600 bg-purple-100 border-purple-500 shadow-sm z-20'
                      : isToday
                      ? 'ring-2 ring-purple-500/80 bg-purple-50/90 shadow-2xs z-10'
                      : hasActivePlanned
                      ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/70'
                      : dayTickets.length > 0
                      ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70'
                      : isSunday
                      ? 'border-rose-200/80 bg-rose-50/40 hover:bg-rose-100/60'
                      : 'border-purple-100 hover:bg-purple-50/60'
                  }`}
                  title={`Дата: ${dayStr}. Клик — выделить дату, двойной щелчок — заявки дня`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-bold text-xs ${
                          isSelected
                            ? 'text-white bg-purple-700 px-1.5 py-0.5 rounded-md font-black shadow-xs'
                            : isToday
                            ? 'text-purple-900 font-black'
                            : hasActivePlanned
                            ? 'text-amber-900 font-bold'
                            : dayTickets.length > 0
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

                    {hasActivePlanned && (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-200 uppercase">
                        {dayTickets.length} план
                      </span>
                    )}
                  </div>

                  {/* Mini indicators */}
                  {dayTickets.length > 0 ? (
                    <div className="truncate text-[10px] font-bold text-slate-700 bg-white/90 px-1 py-0.5 rounded border border-purple-100 hover:border-purple-300">
                      {dayTickets[0].title}
                      {dayTickets.length > 1 && ` (+${dayTickets.length - 1})`}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-normal">двойной клик — заявки</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {plannedTickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              theme={theme}
              isSelected={selectedTicketId === t.id}
              canEdit={canEdit}
              onSelect={() => {
                setSelectedTicketId(selectedTicketId === t.id ? null : t.id);
              }}
              onAccept={(id) => onAccept?.(id)}
              onComplete={(id) => onComplete?.(id)}
              onOpenDetails={(ticket) => onOpenTicket(ticket)}
              onEditTicket={onEditTicket}
              onInspectWorker={onInspectWorker}
            />
          ))}
          {plannedTickets.length === 0 && (
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-purple-200 bg-white/50 text-xs text-slate-500">
              Плановых заявок пока нет.
            </div>
          )}
        </div>
      )}

      {/* DAY DETAIL MODAL (v48.8: opens on double click on calendar day) */}
      {dayModalDate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-purple-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-600">
                  Плановые работы на день
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Дата исполнения: {dayModalDate}
                </h3>
              </div>
              <button
                onClick={() => setDayModalDate(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* List of day tickets */}
            {(() => {
              const dayTickets = plannedTickets.filter(
                (t) => t.date === dayModalDate
              );
              if (dayTickets.length === 0) {
                return (
                  <div className="p-6 rounded-xl bg-slate-50 text-center text-slate-500">
                    На этот день плановых заявок пока нет.
                  </div>
                );
              }
              return (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dayTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setDayModalDate(null);
                        onOpenTicket(t);
                      }}
                      className="p-3 rounded-xl border border-purple-200 hover:border-purple-400 bg-purple-50/30 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-purple-900">{t.number}</span>
                        <span className="text-[10px]">{t.status}</span>
                      </div>
                      <div className="text-slate-900 font-semibold">{t.title}</div>
                      <div className="text-slate-500 text-[11px]">{t.address}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Action: + Заявка с автопередачей выбранной даты */}
            <div className="pt-2 flex items-center justify-between border-t border-purple-100">
              <button
                onClick={() => setDayModalDate(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
              >
                Закрыть
              </button>

              <button
                onClick={() => {
                  const targetDate = dayModalDate;
                  setDayModalDate(null);
                  onNewPlannedTicket(targetDate);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-1 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Добавить заявку на эту дату</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
