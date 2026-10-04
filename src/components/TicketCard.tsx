import React from 'react';
import { Ticket, ThemeConfig } from '../types';
import { MessengerShareButtons } from '../utils/messengers';
import { Check, ArrowRight, MapPin, Edit } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  theme: ThemeConfig;
  isSelected?: boolean;
  canEdit?: boolean;
  canAccept?: boolean;
  canComplete?: boolean;
  canSendMessenger?: boolean;
  onSelect?: (ticketId: string) => void;
  onAccept: (ticketId: string) => void;
  onComplete: (ticketId: string) => void;
  onOpenDetails: (ticket: Ticket) => void;
  onEditTicket?: (ticket: Ticket) => void;
  onInspectWorker?: (workerName: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  theme,
  isSelected = false,
  canEdit = true,
  canAccept = canEdit,
  canComplete = canEdit,
  canSendMessenger = canEdit,
  onSelect,
  onAccept,
  onComplete,
  onOpenDetails,
  onEditTicket,
  onInspectWorker,
}) => {
  // Crisp, rich status badges with smooth light-to-dark transition
  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'in_waiting':
        return {
          label: 'В ожидании',
          // Light-to-dark coral rose transition
          gradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
          stripe: 'linear-gradient(180deg, #FDA4AF 0%, #F43F5E 50%, #BE123C 100%)',
          border: '#FECDD3',
          text: '#9F1239',
          dotColor: '#E11D48',
        };
      case 'in_progress':
        return {
          label: 'В работе',
          // Light-to-dark honey amber transition
          gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
          stripe: 'linear-gradient(180deg, #FCD34D 0%, #F59E0B 50%, #B45309 100%)',
          border: '#FDE68A',
          text: '#92400E',
          dotColor: '#D97706',
        };
      case 'completed':
        return {
          label: 'Выполнено',
          // Light-to-dark emerald mint transition
          gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
          stripe: 'linear-gradient(180deg, #6EE7B7 0%, #10B981 50%, #047857 100%)',
          border: '#A7F3D0',
          text: '#065F46',
          dotColor: '#059669',
        };
    }
  };

  const status = getStatusBadge();

  const handleClick = () => {
    // Single click changes the color of the card
    onSelect?.(ticket.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Double click opens the ticket form / details modal
    e.stopPropagation();
    onOpenDetails(ticket);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`group cursor-pointer w-full rounded-2xl p-4 md:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
        isSelected
          ? 'ring-2 ring-purple-400 shadow-md scale-[1.006]'
          : 'shadow-2xs hover:shadow-xs hover:border-purple-200'
      }`}
      style={{
        backgroundColor: isSelected ? '#FAF5FF' : theme.keyColors.cardBg,
        borderColor: isSelected ? '#C084FC' : theme.keyColors.cardBorder,
      }}
    >
      {/* Priority indicator stripe on left edge (light-to-dark transition) */}
      <div
        className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
          isSelected ? 'w-2.5 shadow-xs' : 'w-1.5'
        }`}
        style={{
          background: isSelected
            ? 'linear-gradient(180deg, #E9D5FF 0%, #A855F7 50%, #6B21A8 100%)'
            : status.stripe,
        }}
      />

      {/* Left Block: ID & Date with Tabular Monospace formatting */}
      <div className="shrink-0 md:w-48 pl-2">
        <div
          className="font-bold text-sm tracking-tight tabular-nums flex items-center gap-1.5"
          style={{
            color: isSelected ? '#4E1B85' : theme.keyColors.textPrimary,
          }}
        >
          <span>{ticket.number}</span>
          {ticket.urgency === 'critical' && (
            <span
              className="w-2 h-2 rounded-full bg-rose-400"
              title="Срочная заявка"
            />
          )}
        </div>
        <div
          className="text-xs font-mono tabular-nums mt-0.5"
          style={{ color: isSelected ? '#6B4699' : theme.keyColors.textSecondary }}
        >
          {ticket.date}
          {ticket.createdTime && ` · ${ticket.createdTime}`}
        </div>
      </div>

      {/* Middle Block: Title, Soft Pastel Status Badge, Address & Assignee */}
      <div className="flex-1 space-y-1.5 pl-2 md:pl-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h4
            className="font-bold text-sm leading-snug transition-colors"
            style={{
              color: isSelected ? '#3B126D' : theme.keyColors.textPrimary,
            }}
          >
            {ticket.title}
          </h4>

          {/* SOFT PASTEL STATUS PILL (CALM, EYE-FRIENDLY GRADIENT) */}
          <span
            className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1.5 shrink-0 border transition-all"
            style={{
              background: status.gradient,
              borderColor: status.border,
              color: status.text,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.dotColor }}
            />
            <span className="tracking-tight">{status.label}</span>
          </span>

          {ticket.planned && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
              Плановые
            </span>
          )}
        </div>

        {/* Unboxed Metadata with subtle bullet separators */}
        <div
          className="text-xs flex flex-wrap items-center gap-2"
          style={{
            color: isSelected ? '#604A7B' : theme.keyColors.textSecondary,
          }}
        >
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 opacity-60 text-purple-600" />
            <span>{ticket.address}</span>
          </span>
          <span className="opacity-40">·</span>
          <span>
            № квартиры:{' '}
            <strong style={{ color: theme.keyColors.textPrimary }}>
              {ticket.apartment || '—'}
            </strong>
          </span>
          <span className="opacity-40">·</span>
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="opacity-80">исполнитель:</span>
            {ticket.assignee === 'Не назначен' && (!ticket.assignees || ticket.assignees.length === 0) ? (
              <strong style={{ color: theme.keyColors.textSecondary }}>Не назначен</strong>
            ) : (
              (ticket.assignees && ticket.assignees.length > 0 ? ticket.assignees : [ticket.assignee]).map((name, i) => (
                <span
                  key={i}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onInspectWorker?.(name);
                  }}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 font-semibold cursor-pointer transition-colors shadow-2xs select-none"
                  title="Двойной клик — карточка сотрудника"
                >
                  {name}
                </span>
              ))
            )}
          </span>
        </div>
      </div>

      {/* Right Action Button & Detail Icon */}
      <div
        className="shrink-0 flex items-center gap-2 pl-2 md:pl-0"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {canSendMessenger && <MessengerShareButtons ticket={ticket} compact />}
        {canAccept && ticket.status === 'in_waiting' ? (
          <button
            onClick={() => onAccept(ticket.id)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-slate-700 transition-all duration-150 flex items-center gap-1.5 shadow-2xs"
          >
            <span>Принять заявку</span>
            <ArrowRight className="w-3 h-3 text-purple-600" />
          </button>
        ) : canComplete && ticket.status === 'in_progress' ? (
          <button
            onClick={() => onComplete(ticket.id)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 border text-white shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
              borderColor: '#059669',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
            }}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Завершить</span>
          </button>
        ) : (
          <span
            className="px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border"
            style={{
              background:
                ticket.status === 'completed'
                  ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)'
                  : ticket.status === 'in_progress'
                  ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)'
                  : 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
              borderColor:
                ticket.status === 'completed'
                  ? '#A7F3D0'
                  : ticket.status === 'in_progress'
                  ? '#FDE68A'
                  : '#FECDD3',
              color:
                ticket.status === 'completed'
                  ? '#065F46'
                  : ticket.status === 'in_progress'
                  ? '#92400E'
                  : '#9F1239',
            }}
          >
            <Check className="w-3.5 h-3.5" />
            {ticket.status === 'completed'
              ? 'Выполнена'
              : ticket.status === 'in_progress'
              ? 'В работе'
              : 'В ожидании'}
          </span>
        )}
      </div>
    </div>
  );
};
