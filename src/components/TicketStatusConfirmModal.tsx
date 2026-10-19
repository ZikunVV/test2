import React from 'react';
import { Ticket, TicketStatus, ThemeConfig } from '../types';
import { Check, ArrowRight, AlertCircle, X, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';

export interface TicketStatusConfirmModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  targetStatus: TicketStatus | null;
  onClose: () => void;
  onConfirm: (ticketId: string, status: TicketStatus) => void;
  theme?: ThemeConfig;
}

export const TicketStatusConfirmModal: React.FC<TicketStatusConfirmModalProps> = ({
  isOpen,
  ticket,
  targetStatus,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !ticket || !targetStatus) return null;

  const isAccepting = targetStatus === 'in_progress';
  const isCompleting = targetStatus === 'completed';

  const handleConfirm = () => {
    onConfirm(ticket.id, targetStatus);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full border border-purple-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between gap-3 text-white ${
            isAccepting
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-purple-800'
              : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-purple-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 border border-white/20 text-white shrink-0">
              {isAccepting ? (
                <ArrowRight className="w-5 h-5 text-white" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {isAccepting ? 'Принять заявку в работу' : 'Завершить заявку'}
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                Требуется подтверждение действия
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Отмена"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Ticket Information Card */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-purple-200/80 text-purple-950 border border-purple-300">
                № {ticket.number}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {ticket.date} {ticket.createdTime ? `· ${ticket.createdTime}` : ''}
              </span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 leading-snug">
              {ticket.title}
            </h4>

            <div className="space-y-1 pt-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">{ticket.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Исполнитель:{' '}
                  <strong className="text-slate-800">
                    {ticket.assignee || 'Не назначен'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              {isAccepting ? (
                <>
                  Вы уверены, что хотите перевести эту заявку в статус{' '}
                  <strong className="text-amber-900 underline">«В работе»</strong>?
                  Заявка перейдёт в текущую обработку бригады.
                </>
              ) : (
                <>
                  Вы уверены, что все работы по этой заявке завершены? Статус будет изменён на{' '}
                  <strong className="text-emerald-900 underline">«Выполнено»</strong>{' '}
                  и заявка переместится в архив выполненных работ.
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Отмена
            </button>

            {isAccepting ? (
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Да, принять в работу</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Да, завершить заявку</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
