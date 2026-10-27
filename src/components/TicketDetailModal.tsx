import React, { useState, useEffect } from 'react';
import { ThemeConfig, Ticket, UserItem, StreetItem } from '../types';
import { MessengerShareButtons } from '../utils/messengers';
import { PhoneBadgeDisplay } from './PhoneBadgeDisplay';
import {
  X,
  MapPin,
  Calendar,
  CalendarPlus,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Wrench,
  Check,
  Building,
  Layers,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ShieldAlert,
  ArrowRight,
  Edit,
  History,
  Trash2,
} from 'lucide-react';
import {
  findTicketsForFullAddress,
  findTicketsForAddress,
  extractAddressParts,
  getTicketLocationKey,
} from '../utils/streets';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  theme: ThemeConfig;
  currentUser?: UserItem | null;
  isAdmin?: boolean;
  canAccept?: boolean;
  canSetInProgress?: boolean;
  canComplete?: boolean;
  canEdit?: boolean;
  canSendMessenger?: boolean;
  canDelete?: boolean;
  onDeleteTicket?: (ticketId: string) => void;
  onAccept?: (ticketId: string) => void;
  tickets?: Ticket[];
  streets?: StreetItem[];
  onSelectTicket?: (t: Ticket) => void;
  onOpenEdit?: (t: Ticket) => void;
  onUpdatePhoneStatus?: (
    ticketId: string,
    newStatus: number,
    isAdditional?: boolean,
    additionalIndex?: number
  ) => void;
  onUpdateStatus: (
    ticketId: string,
    status: Ticket['status'],
    assignee?: string
  ) => void;
  onSubmitReport?: (
    ticketId: string,
    reportText: string,
    reportType: string,
    recipient: string
  ) => void;
  onWithdrawTicket?: (
    ticketId: string,
    adminName: string,
    reason: string
  ) => void;
  onAddWork?: (
    ticketId: string,
    work: {
      work_date: string;
      description: string;
      materials: string;
      worker: string;
      result: string;
    }
  ) => void;
  onInspectWorker?: (workerName: string) => void;
  onCreatePlannedTicket?: (ticket: Omit<Ticket, 'id' | 'number'>) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  theme,
  currentUser,
  isAdmin = true,
  canAccept = isAdmin,
  canSetInProgress = isAdmin,
  canComplete = isAdmin,
  canEdit = isAdmin,
  canSendMessenger = isAdmin,
  canDelete = isAdmin,
  onDeleteTicket,
  onAccept,
  tickets = [],
  streets = [],
  onSelectTicket,
  onOpenEdit,
  onUpdateStatus,
  onSubmitReport,
  onWithdrawTicket,
  onAddWork,
  onInspectWorker,
  onUpdatePhoneStatus,
  onCreatePlannedTicket,
}) => {
  if (!ticket) return null;

  // Tabs: Details, Worker Report, Works/Acts, Address History (Ознакомиться), Add Planned Work, Admin Withdraw
  const [activeTab, setActiveTab] = useState<'info' | 'report' | 'works' | 'address_history' | 'add_planned' | 'withdraw'>('info');
  const [addressFilter, setAddressFilter] = useState<'all' | 'apartment'>('all');

  // Location specification key (3rd mandatory indicator)
  const ticketLocationKey = React.useMemo(() => {
    if (!ticket) return null;
    return getTicketLocationKey(ticket);
  }, [ticket]);

  // Match other tickets for the EXACT same address AND location specification (all 3 indicators)
  // "полное совпадение это когда ещё и номер квартиры или место уточнения то есть введено минимум обязательно три показателя ( улица, номер дома, место уточнения )"
  const otherAddressTickets = React.useMemo(() => {
    if (!ticket || !tickets || tickets.length === 0 || !ticketLocationKey) return [];
    const parts = extractAddressParts(ticket);
    if (!parts.street || !parts.houseNumber) return [];

    return findTicketsForFullAddress(
      tickets,
      {
        street: parts.street,
        houseNumber: parts.houseNumber,
        building: parts.building,
        locationKey: ticketLocationKey,
        excludeTicketId: ticket.id,
      },
      streets
    );
  }, [ticket, tickets, ticketLocationKey, streets]);

  // If active tab was address_history and there are no matching tickets, reset to info
  useEffect(() => {
    if (activeTab === 'address_history' && otherAddressTickets.length === 0) {
      setActiveTab('info');
    }
  }, [activeTab, otherAddressTickets.length]);

  const sameApartmentTickets = React.useMemo(() => {
    if (!ticket.apartment) return [];
    return otherAddressTickets.filter(
      (t) => t.apartment && t.apartment.trim().toLowerCase() === ticket.apartment!.trim().toLowerCase()
    );
  }, [otherAddressTickets, ticket.apartment]);

  // Worker Report state
  const [reportText, setReportText] = useState(ticket.worker_report || '');
  const [reportType, setReportType] = useState(ticket.worker_report_type || 'keep_current');
  const [reportRecipient, setReportRecipient] = useState(
    ticket.worker_report_recipient || 'Диспетчерская'
  );
  const [reportSuccessMsg, setReportSuccessMsg] = useState(false);

  // Admin Withdraw state
  const [withdrawReason, setWithdrawReason] = useState(ticket.withdrawn_reason || '');
  const [withdrawAdminName, setWithdrawAdminName] = useState('');

  // Add Work Act state
  const [workDesc, setWorkDesc] = useState('');
  const [workMats, setWorkMats] = useState('');
  const initialExecutors = (ticket.assignees && ticket.assignees.length > 0)
    ? ticket.assignees.join(', ')
    : (ticket.assignee || '');
  const [workWorker, setWorkWorker] = useState(initialExecutors);
  const [workResult, setWorkResult] = useState('Успешно');

  // Synchronize when ticket prop updates
  useEffect(() => {
    const currentExecutors = (ticket.assignees && ticket.assignees.length > 0)
      ? ticket.assignees.join(', ')
      : (ticket.assignee || '');
    setWorkWorker(currentExecutors);
    setReportText(ticket.worker_report || '');
    if (ticket.worker_report_type) {
      setReportType(ticket.worker_report_type);
    }
    if (ticket.worker_report_recipient) {
      setReportRecipient(ticket.worker_report_recipient);
    }
  }, [ticket]);

  // Photo modal zoom
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  const getStatusConfig = () => {
    switch (ticket.status) {
      case 'in_waiting':
        return {
          text: 'В ожидании',
          gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 50%, #BE123C 100%)',
          shadow: '0 2px 10px rgba(225, 29, 72, 0.3)',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
          dot: '#FFE4E6',
        };
      case 'in_progress':
        return {
          text: 'В работе',
          gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
          shadow: '0 2px 10px rgba(217, 119, 6, 0.3)',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
          dot: '#FEF3C7',
        };
      case 'completed':
        return {
          text: 'Выполнена',
          gradient: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
          shadow: '0 2px 10px rgba(5, 150, 105, 0.3)',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          dot: '#D1FAE5',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    if (onSubmitReport) {
      onSubmitReport(ticket.id, reportText.trim(), reportType, reportRecipient);
    }
    setReportSuccessMsg(true);
    setTimeout(() => setReportSuccessMsg(false), 3000);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawReason.trim()) return;

    if (onWithdrawTicket) {
      onWithdrawTicket(ticket.id, withdrawAdminName, withdrawReason.trim());
    }
    onClose();
  };

  const handleAddWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDesc.trim()) return;

    if (onAddWork) {
      onAddWork(ticket.id, {
        work_date: new Date().toISOString().slice(0, 10),
        description: workDesc.trim(),
        materials: workMats.trim() || '—',
        worker: workWorker,
        result: workResult,
      });
    }
    setWorkDesc('');
    setWorkMats('');
    setActiveTab('info');
  };

  // Planned Work State
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [plannedTitle, setPlannedTitle] = useState('');
  const [plannedExecutionDate, setPlannedExecutionDate] = useState(tomorrowStr);
  const [plannedCategory, setPlannedCategory] = useState<Ticket['category']>('general');
  const [plannedUrgency, setPlannedUrgency] = useState<Ticket['urgency']>('normal');
  const [plannedWorker, setPlannedWorker] = useState('');
  const [plannedDescription, setPlannedDescription] = useState('');
  const [plannedWorkMaterials, setPlannedWorkMaterials] = useState('');
  const [plannedSuccessMessage, setPlannedSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setPlannedTitle(
        ticket.future_plan
          ? ticket.future_plan
          : `Плановые работы: ${ticket.title}`
      );
      setPlannedCategory(ticket.category || 'general');
      setPlannedUrgency('normal');
      setPlannedWorker(
        ticket.assignees && ticket.assignees.length > 0
          ? ticket.assignees.join(', ')
          : ticket.assignee || ''
      );
      setPlannedDescription(ticket.description || ticket.work_description || '');
      setPlannedWorkMaterials(ticket.work_materials || '');
      setPlannedExecutionDate(tomorrowStr);
      setPlannedSuccessMessage(null);
    }
  }, [ticket, tomorrowStr]);

  const handleCreatePlannedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannedTitle.trim()) return;

    if (onCreatePlannedTicket) {
      const workers = plannedWorker.trim()
        ? plannedWorker
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
        : ['Не назначен'];

      onCreatePlannedTicket({
        date: plannedExecutionDate || tomorrowStr,
        execution_date: plannedExecutionDate || undefined,
        title: plannedTitle.trim(),
        description: plannedDescription.trim() || undefined,
        status: 'in_waiting',
        planned: true,
        address: ticket.address,
        street: ticket.street,
        house_number: ticket.house_number,
        building: ticket.building,
        apartment: ticket.apartment,
        location_type: ticket.location_type,
        location_value: ticket.location_value,
        category: plannedCategory,
        urgency: plannedUrgency,
        assignee: workers.join(', '),
        assignees: workers,
        given_by: ticket.given_by || ticket.residentName || undefined,
        residentName: ticket.residentName,
        residentPhone: ticket.residentPhone || ticket.phone,
        phone: ticket.phone,
        phone_status: ticket.phone_status,
        additional_phones: ticket.additional_phones,
        additional_phone_statuses: ticket.additional_phone_statuses,
        work_description: plannedDescription.trim() || undefined,
        work_materials: plannedWorkMaterials.trim() || undefined,
        photos: [],
        works: [],
      });

      setPlannedSuccessMessage(
        'Новая заявка успешно создана со статусом «Плановые» и добавлена в график!'
      );
      setTimeout(() => {
        setPlannedSuccessMessage(null);
        setActiveTab('info');
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4">
      <div
        className="rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-3xl p-3.5 sm:p-6 shadow-2xl border transition-all text-xs my-auto max-h-[92vh] overflow-y-auto overflow-x-hidden box-border"
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-purple-100">
          <div>
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">
              <span>Заявка #{ticket.number}</span>
            </div>

            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-base font-black text-slate-900">
                {ticket.number}
              </span>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-xs relative overflow-hidden`}
                style={{
                  background: statusConfig.gradient,
                  boxShadow: statusConfig.shadow,
                }}
              >
                <div className="absolute inset-0 opacity-25 pointer-events-none bg-gradient-to-b from-white to-transparent" />
                <span
                  className="w-1.5 h-1.5 rounded-full z-10"
                  style={{ backgroundColor: statusConfig.dot }}
                />
                <span className="z-10 tracking-wide font-extrabold">
                  {statusConfig.text}
                </span>
              </span>

              {ticket.planned && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                  Плановая работа
                </span>
              )}

              {ticket.accepted && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1"
                  title={ticket.accepted_at ? `Принята: ${ticket.accepted_at}` : 'Принята'}
                >
                  <Check className="w-3 h-3 text-purple-600 stroke-[2.5]" />
                  <span>Принята{ticket.accepted_by ? `: ${ticket.accepted_by}` : ''}</span>
                </span>
              )}

              {ticket.withdrawn_by && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                  Заявка снята: {ticket.withdrawn_by}
                </span>
              )}
            </div>

            <h2 className="text-base font-extrabold text-slate-900">
              {ticket.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canSendMessenger && <MessengerShareButtons ticket={ticket} />}
            {canEdit && onOpenEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit(ticket)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-purple-900 font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Редактировать заявку"
              >
                <Edit className="w-3.5 h-3.5 text-purple-700" />
                <span>Редактировать</span>
              </button>
            )}
            {canDelete && onDeleteTicket && (
              <button
                type="button"
                onClick={() => onDeleteTicket(ticket.id)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Удалить заявку (требуется подтверждение)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Удалить</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-purple-100 pt-3 pb-2 flex-wrap">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            Сведения о заявке
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeTab === 'report'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Отчёт сотрудника</span>
              {ticket.worker_report && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('works')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeTab === 'works'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Акты и работы ({ticket.works?.length || 0})</span>
          </button>

          {/* "только при полном совпадении адреса (улица, номер дома, корпус) показывать в самой заявке Ознакомится" */}
          {otherAddressTickets.length > 0 && (
            <button
              onClick={() => setActiveTab('address_history')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'address_history'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Ознакомиться ({otherAddressTickets.length})</span>
            </button>
          )}

          {/* TAB: ДОБАВИТЬ В ПЛАНОВЫЕ РАБОТЫ */}
          <button
            onClick={() => setActiveTab('add_planned')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'add_planned'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5 text-purple-700" />
            <span>Добавить в плановые работы</span>
          </button>

          {canDelete && (
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ml-auto text-rose-700 hover:bg-rose-50 border ${
                activeTab === 'withdraw'
                  ? 'bg-rose-100 border-rose-300'
                  : 'border-transparent'
              }`}
            >
              Снять заявку (Админ)
            </button>
          )}
        </div>

        {/* TAB 1: Svedeniya o zayavke */}
        {activeTab === 'info' && (
          <div className="mt-4 space-y-4">
            {/* Metadata Grid */}
            <div className="p-4 rounded-xl border border-purple-100 bg-[#F9F8FD] grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Адрес объекта в управлении
                </span>
                <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>{ticket.address}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Место уточнения / № квартиры
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {ticket.apartment || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Дата регистрации
                </span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{ticket.date}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Дата исполнения
                </span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{ticket.execution_date || 'Не указана'}</span>
                </span>
              </div>
            </div>

            {/* Описание проблемы */}
            <div className="p-4 rounded-xl border border-purple-200 bg-white space-y-1.5 shadow-2xs">
              <span className="text-[10px] text-purple-700 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Описание проблемы</span>
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                {ticket.description || ticket.title || 'Описание проблемы не указано'}
              </p>
            </div>

            {/* Resident & Contacts */}
            <div className="p-4 rounded-xl border border-purple-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Кем дана (Заявитель)
                </span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-purple-700" />
                  <span>{ticket.given_by || ticket.residentName || 'Житель дома'}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Телефоны для связи
                </span>
                <div className="mt-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <PhoneBadgeDisplay
                      phone={ticket.phone || ticket.residentPhone || ''}
                      status={ticket.phone_status || 1}
                      currentUser={currentUser}
                      onUpdateStatus={(newStatus) => {
                        if (onUpdatePhoneStatus) {
                          onUpdatePhoneStatus(ticket.id, newStatus, false);
                        }
                      }}
                      size="sm"
                    />
                  </div>
                  {ticket.additional_phones &&
                    ticket.additional_phones.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 flex-wrap"
                      >
                        <PhoneBadgeDisplay
                          phone={p}
                          status={
                            (ticket.additional_phone_statuses &&
                              ticket.additional_phone_statuses[idx]) ||
                            1
                          }
                          currentUser={currentUser}
                          onUpdateStatus={(newStatus) => {
                            if (onUpdatePhoneStatus) {
                              onUpdatePhoneStatus(ticket.id, newStatus, true, idx);
                            }
                          }}
                          size="xs"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Executors */}
            <div className="p-4 rounded-xl border border-purple-100 bg-white space-y-2">
              <span className="text-[10px] text-slate-400 block font-medium">
                Исполнители
              </span>
              <div className="flex flex-wrap gap-2">
                {(ticket.assignees || [ticket.assignee]).map((exec, idx) => (
                  <span
                    key={idx}
                    onDoubleClick={() => onInspectWorker && onInspectWorker(exec)}
                    title={onInspectWorker ? 'Двойной клик — полная информация о сотруднике' : undefined}
                    className={`px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
                      onInspectWorker ? 'cursor-pointer hover:bg-purple-100 hover:border-purple-300' : 'cursor-default'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>{exec}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Works, Materials & Future Plan */}
            {(ticket.work_description || ticket.work_materials || ticket.future_plan) && (
              <div className="p-4 rounded-xl border border-purple-100 bg-white space-y-3">
                <span className="font-bold text-slate-900 block">
                  Технические отметки
                </span>

                {ticket.work_description && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Работы по заявке:
                    </span>
                    <p className="text-slate-800 mt-0.5">{ticket.work_description}</p>
                  </div>
                )}

                {ticket.work_materials && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Материалы:
                    </span>
                    <p className="text-slate-800 mt-0.5">{ticket.work_materials}</p>
                  </div>
                )}

                {ticket.future_plan && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      План на будущее:
                    </span>
                    <p className="text-slate-800 mt-0.5">{ticket.future_plan}</p>
                  </div>
                )}
              </div>
            )}

            {/* Worker Report Preview if already submitted */}
            {ticket.worker_report && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Отчёт сотрудника сохранён</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {ticket.worker_report_at}
                  </span>
                </div>
                <p className="text-emerald-950 font-medium">{ticket.worker_report}</p>
                <div className="text-[11px] text-emerald-800">
                  Тип: <strong>{ticket.worker_report_type}</strong> · Передано:{' '}
                  <strong>{ticket.worker_report_recipient}</strong>
                </div>
              </div>
            )}

            {/* Withdrawn Notice if withdrawn */}
            {ticket.withdrawn_by && (
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-100 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-600" />
                  <span>Заявка снята с исполнения</span>
                </span>
                <p className="text-slate-700">
                  Снял: <strong>{ticket.withdrawn_by}</strong> · Дата: {ticket.withdrawn_at}
                </p>
                {ticket.withdrawn_reason && (
                  <p className="text-slate-600 text-xs italic">
                    Причина: {ticket.withdrawn_reason}
                  </p>
                )}
              </div>
            )}

            {/* Quick Status Action Buttons */}
            <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between gap-3">
              {canAccept || canSetInProgress || canComplete || canEdit ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-semibold">Действия:</span>
                  {canAccept && !ticket.accepted && (
                    <button
                      type="button"
                      onClick={() => onAccept?.(ticket.id)}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold border border-purple-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Принять заявку"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Принять заявку</span>
                    </button>
                  )}
                  {canSetInProgress && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(ticket.id, 'in_progress')}
                      disabled={ticket.status === 'in_progress'}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1 shadow-2xs ${
                        ticket.status === 'in_progress'
                          ? 'bg-amber-500 text-white border-amber-600 cursor-default ring-2 ring-amber-300'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 cursor-pointer'
                      }`}
                      title={ticket.status === 'in_progress' ? 'Заявка уже находится в работе' : 'Перевести статус заявки «В работу»'}
                    >
                      <ArrowRight className={`w-3.5 h-3.5 ${ticket.status === 'in_progress' ? 'text-white' : 'text-amber-700'}`} />
                      <span>{ticket.status === 'in_progress' ? 'В работе ✓' : 'В работу'}</span>
                    </button>
                  )}
                  {canComplete && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(ticket.id, 'completed')}
                      disabled={ticket.status === 'completed'}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1 ${
                        ticket.status === 'completed'
                          ? 'bg-emerald-700 text-white border border-emerald-800 cursor-default ring-2 ring-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      }`}
                      title={ticket.status === 'completed' ? 'Заявка уже выполнена' : 'Завершить заявку'}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{ticket.status === 'completed' ? 'Выполнена ✓' : 'Завершить заявку'}</span>
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(ticket.id, 'in_waiting')}
                      disabled={ticket.status === 'in_waiting'}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                        ticket.status === 'in_waiting'
                          ? 'bg-rose-500 text-white border-rose-600 cursor-default ring-2 ring-rose-300'
                          : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300 cursor-pointer'
                      }`}
                      title={ticket.status === 'in_waiting' ? 'Заявка находится в статусе «В ожидании»' : 'Вернуть в статус «В ожидании»'}
                    >
                      {ticket.status === 'in_waiting' ? 'В ожидании ✓' : 'В ожидание'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium">
                  Режим просмотра (изменение статуса доступно при наличии соответствующих прав)
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                Закрыть карточку
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: WORKER REPORT FORM */}
        {activeTab === 'report' && (
          <form onSubmit={handleSendReport} className="mt-4 space-y-4">
            <div className="p-4 rounded-xl border border-purple-100 bg-[#F9F8FD] space-y-3">
              <div className="font-bold text-slate-900">
                Заполнение отчёта сотрудника
              </div>
              <p className="text-slate-500 text-xs">
                Отчёт сохраняется в историю заявки и уведомляет диспетчерскую службу.
              </p>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Текст отчёта о проделанной работе <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Опишите фактически выполненные операции..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Тип отчёта / Статус
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs"
                  >
                    <option value="keep_current">Оставить текущий статус («{statusConfig.text}»)</option>
                    <option value="in_progress">В работе (сохранить или перевести «В работу»)</option>
                    <option value="completed">Работа полностью завершена (перевести в «Выполнена»)</option>
                    <option value="partially">Выполнено частично (текущий статус сохраняется)</option>
                    <option value="forwarded">Передано другой службе (текущий статус сохраняется)</option>
                    <option value="need_materials">Требуется закупка материалов (текущий статус сохраняется)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Кому передано / Адресат
                  </label>
                  <input
                    type="text"
                    value={reportRecipient}
                    onChange={(e) => setReportRecipient(e.target.value)}
                    placeholder="Диспетчерская / Главный инженер"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {reportSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Отчёт успешно зафиксирован!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
              >
                Назад
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 shadow-xs"
              >
                Сохранить отчёт
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: WORKS AND ACTS */}
        {activeTab === 'works' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900">
                Акты фактически выполненных работ
              </div>
            </div>

            {/* List of existing works */}
            {ticket.works && ticket.works.length > 0 ? (
              <div className="divide-y divide-purple-100 border border-purple-200 rounded-xl overflow-hidden">
                {ticket.works.map((w, idx) => (
                  <div key={idx} className="p-3.5 bg-white space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold flex-wrap gap-1">
                      <span className="text-purple-700">Акт от {w.work_date}</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-slate-500 font-medium">Исполнитель:</span>
                        {w.worker
                          .split(/[,;]+/)
                          .map((name) => name.trim())
                          .filter(Boolean)
                          .map((name, nIdx) => (
                            <span
                              key={nIdx}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (onInspectWorker) onInspectWorker(name);
                              }}
                              title="Двойной клик — полная информация о сотруднике"
                              className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-bold hover:bg-purple-100 cursor-pointer transition-colors"
                            >
                              {name}
                            </span>
                          ))}
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">{w.description}</p>
                    <p className="text-slate-600 text-[11px]">
                      Материалы: {w.materials}
                    </p>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      Результат: {w.result}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-purple-200 rounded-xl bg-purple-50/20">
                По данной заявке пока нет прикреплённых актов. Вы можете добавить акт ниже.
              </div>
            )}

            {/* Add new work act form */}
            {canEdit && (
              <form
                onSubmit={handleAddWorkSubmit}
                className="p-4 rounded-xl border border-purple-200 bg-[#F9F8FD] space-y-3"
              >
                <div className="font-bold text-slate-900">
                  Добавить акт выполненных работ
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Описание выполненных работ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={workDesc}
                    onChange={(e) => setWorkDesc(e.target.value)}
                    placeholder="Заменен участок трубы ХВС 1/2 дюйма..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">
                      Материалы
                    </label>
                    <input
                      type="text"
                      value={workMats}
                      onChange={(e) => setWorkMats(e.target.value)}
                      placeholder="Муфта, труба 1.5м..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">
                      Исполнители
                    </label>
                    <input
                      type="text"
                      value={workWorker}
                      onChange={(e) => setWorkWorker(e.target.value)}
                      placeholder="ФИО исполнителей..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs"
                    />
                    {ticket.assignees && ticket.assignees.length > 1 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Назначены:</span>
                        {ticket.assignees.map((workerName) => (
                          <button
                            key={workerName}
                            type="button"
                            onClick={() => setWorkWorker(workerName)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-semibold hover:bg-purple-200 transition-colors"
                          >
                            {workerName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800"
                >
                  Сохранить акт
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB: TICKETS FOR THIS ADDRESS */}
        {activeTab === 'address_history' && (
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
                  Адрес текущей заявки
                </span>
                <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{ticket.address}</span>
                  {ticket.apartment && (
                    <span className="text-purple-700 font-bold ml-1">
                      (кв. {ticket.apartment})
                    </span>
                  )}
                </div>
              </div>

            </div>

            {otherAddressTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-purple-200 rounded-xl bg-purple-50/20 space-y-2">
                <Building className="w-8 h-8 mx-auto text-purple-300" />
                <p className="font-bold text-slate-700 text-xs">
                  Других заявок по этому адресу и месту уточнения не найдено
                </p>
                <p className="text-[11px] text-slate-500">
                  Эта заявка — единственное зарегистрированное обращение по данному объекту в журнале.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {otherAddressTickets.map((t) => {
                  const isSameApt =
                    ticket.apartment &&
                    t.apartment &&
                    t.apartment.trim().toLowerCase() === ticket.apartment.trim().toLowerCase();

                  const statusConfigItem = (() => {
                    switch (t.status) {
                      case 'in_waiting':
                        return { text: 'В ожидании', cls: 'bg-rose-100 text-rose-800 border-rose-200' };
                      case 'in_progress':
                        return { text: 'В работе', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
                      case 'completed':
                        return { text: 'Выполнена', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                    }
                  })();

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all text-xs ${
                        isSameApt
                          ? 'border-purple-300 bg-purple-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-slate-900 text-xs">
                            № {t.number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfigItem.cls}`}
                          >
                            {statusConfigItem.text}
                          </span>
                          {t.planned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              Плановая
                            </span>
                          )}
                          {isSameApt && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Та же квартира №{t.apartment}!
                            </span>
                          )}
                          {t.withdrawn_by && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                              Снята
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {t.date} {t.createdTime || ''}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 mb-1 text-xs">
                        {t.title}
                      </h4>

                      {t.description && t.description !== t.title && (
                        <p className="text-slate-600 text-[11px] mb-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100 mb-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Место / Квартира</span>
                          <span className="font-semibold text-slate-800">
                            {t.apartment ? `кв. ${t.apartment}` : t.location_value || 'Общедомовая'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Заявитель</span>
                          <span className="font-semibold text-slate-800">
                            {t.residentName || t.given_by || '—'}
                            {t.phone ? ` (${t.phone})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Исполнитель</span>
                          <span className="font-semibold text-slate-800">
                            {t.assignee || 'Не назначен'}
                          </span>
                        </div>
                      </div>

                      {t.worker_report && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] mb-2">
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-800">
                            Отчёт сотрудника:
                          </span>
                          <span>{t.worker_report}</span>
                        </div>
                      )}

                      {t.works && t.works.length > 0 && (
                        <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 text-purple-950 text-[11px] mb-2">
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-purple-800">
                            Акты работ ({t.works.length}):
                          </span>
                          <div className="space-y-1 mt-0.5">
                            {t.works.map((w, wIdx) => (
                              <div key={wIdx} className="text-[11px]">
                                • <span className="font-semibold">{w.description}</span>
                                {w.materials && w.materials !== '—' && (
                                  <span className="text-slate-500"> (мат: {w.materials})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {onSelectTicket && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTicket(t);
                              setActiveTab('info');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <span>Открыть эту заявку</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: ДОБАВИТЬ В ПЛАНОВЫЕ РАБОТЫ */}
        {activeTab === 'add_planned' && (
          <form onSubmit={handleCreatePlannedSubmit} className="mt-4 space-y-4">
            <div className="p-4 rounded-xl border border-purple-200 bg-[#F9F8FD] space-y-3.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <CalendarPlus className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      Создание плановой работы
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      На основе текущей заявки №{ticket.number} будет автоматически создана новая плановая заявка в системе
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
                  Статус: Плановые
                </span>
              </div>

              {/* Linked Object Address (Auto-filled) */}
              <div className="p-3 rounded-xl bg-white border border-purple-100 flex items-start gap-2.5">
                <Building className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Адрес объекта (связан с заявкой №{ticket.number})
                  </span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {ticket.address}
                    {ticket.apartment ? ` (кв./пом. ${ticket.apartment})` : ''}
                  </div>
                </div>
              </div>

              {/* Date & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 text-xs">
                    Дата проведения плановых работ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={plannedExecutionDate}
                    onChange={(e) => setPlannedExecutionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 text-xs">
                    Категория плановых работ
                  </label>
                  <select
                    value={plannedCategory}
                    onChange={(e) => setPlannedCategory(e.target.value as Ticket['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="general">Общедомовые работы</option>
                    <option value="water">Водоснабжение (ХВС / ГВС)</option>
                    <option value="drain">Водоотведение / Канализация</option>
                    <option value="roof">Кровельные работы</option>
                    <option value="entrance">Подъезды и фасады</option>
                    <option value="electric">Электрооборудование</option>
                  </select>
                </div>
              </div>

              {/* Title of Planned Work */}
              <div>
                <label className="font-bold block mb-1 text-slate-700 text-xs">
                  Наименование / Суть плановой работы <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Плановая замена вводного вентиля ХВС, герметизация швов..."
                  value={plannedTitle}
                  onChange={(e) => setPlannedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Detailed Work Description */}
              <div>
                <label className="font-bold block mb-1 text-slate-700 text-xs">
                  Подробное описание плановой работы
                </label>
                <textarea
                  rows={3}
                  placeholder="Опишите перечень необходимых действий, объем работ, условия допуска..."
                  value={plannedDescription}
                  onChange={(e) => setPlannedDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>

              {/* Workers & Materials Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 text-xs">
                    Назначенные исполнители
                  </label>
                  <input
                    type="text"
                    placeholder="ФИО исполнителей через запятую..."
                    value={plannedWorker}
                    onChange={(e) => setPlannedWorker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 text-xs">
                    Необходимые материалы / инвентарь
                  </label>
                  <input
                    type="text"
                    placeholder="Трубы, фитинги, муфты, сварочный аппарат..."
                    value={plannedWorkMaterials}
                    onChange={(e) => setPlannedWorkMaterials(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Success alert */}
            {plannedSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{plannedSuccessMessage}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Создать плановую работу</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: ADMIN WITHDRAW REQUEST */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
              <div className="font-bold text-rose-950 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Снятие заявки (Функция Администратора)</span>
              </div>
              <p className="text-rose-800 text-xs">
                Заявка будет переведена в статус «Выполнена/Снята» с фиксацией в журнале аудита ФИО администратора и причины снятия.
              </p>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  ФИО снявшего администратора
                </label>
                <input
                  type="text"
                  required
                  placeholder="Введите ФИО администратора..."
                  value={withdrawAdminName}
                  onChange={(e) => setWithdrawAdminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Причина снятия заявки <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Например: Повторное обращение / Ложный вызов / Устранено силами жильцов..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs"
              >
                Подтвердить снятие заявки
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
