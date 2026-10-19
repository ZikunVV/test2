import React from 'react';
import { Ticket } from '../types';
import { Trash2, AlertTriangle, X, MapPin, User, Calendar } from 'lucide-react';

export interface DeleteTicketConfirmModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onConfirmDelete: (ticketId: string) => void;
}

export const DeleteTicketConfirmModal: React.FC<DeleteTicketConfirmModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !ticket) return null;

  const handleConfirm = () => {
    onConfirmDelete(ticket.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 via-rose-600 to-red-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 border border-white/20 text-white shrink-0">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Удаление заявки
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                Требуется подтверждение Администратора
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
          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-rose-200/80 text-rose-950 border border-rose-300">
                № {ticket.number}
              </span>
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{ticket.date} {ticket.createdTime ? `· ${ticket.createdTime}` : ''}</span>
              </span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 leading-snug">
              {ticket.title}
            </h4>

            <div className="space-y-1 pt-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
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

          {/* Destructive Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-amber-900">
                Вы действительно хотите удалить заявку №{ticket.number}?
              </p>
              <p className="mt-1 text-[11px] text-amber-800">
                Заявка будет удалена из системы. Данное действие будет зафиксировано в журнале аудита действий.
              </p>
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

            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Да, удалить заявку</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
