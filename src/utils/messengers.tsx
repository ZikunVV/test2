import React, { useState } from 'react';
import { Ticket, PersonalPerson } from '../types';
import { Send, Share2, Copy, Check, X, MessageCircle, Phone } from 'lucide-react';

export function formatTicketMessengerText(ticket: Ticket): string {
  const statusText =
    ticket.status === 'in_waiting'
      ? '🔴 В ожидании'
      : ticket.status === 'in_progress'
      ? '🟡 В работе'
      : '🟢 Выполнена';

  const executors =
    ticket.assignees && ticket.assignees.length > 0
      ? ticket.assignees.join(', ')
      : ticket.assignee || 'Не назначен';

  const lines = [
    `📋 ЗАЯВКА ${ticket.number} (${statusText})`,
    `📍 Адрес: ${ticket.address}${ticket.apartment ? `, кв. ${ticket.apartment}` : ''}`,
    `🔧 Работа: ${ticket.title}`,
  ];

  if (ticket.description) {
    lines.push(`📝 Описание: ${ticket.description}`);
  }
  if (ticket.phone || ticket.residentPhone) {
    lines.push(`📞 Телефон жильца: ${ticket.phone || ticket.residentPhone}`);
  }
  lines.push(`👷 Исполнитель: ${executors}`);
  lines.push(`📅 Дата: ${ticket.date}${ticket.createdTime ? ' ' + ticket.createdTime : ''}`);

  return lines.join('\n');
}

interface MessengerShareButtonsProps {
  ticket: Ticket;
  people?: PersonalPerson[];
  compact?: boolean;
}

export const MessengerShareButtons: React.FC<MessengerShareButtonsProps> = ({
  ticket,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedText = formatTicketMessengerText(ticket);
  const encodedText = encodeURIComponent(formattedText);

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    window.location.origin
  )}&text=${encodedText}`;

  const viberShareUrl = `viber://forward?text=${encodedText}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = formattedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="p-1.5 rounded-xl border border-sky-200 hover:border-sky-300 bg-sky-50/70 hover:bg-sky-100 text-sky-800 transition-all shadow-2xs cursor-pointer"
          title="Отправить заявку мастеру в Telegram или Viber"
        >
          <Send className="w-3.5 h-3.5 text-sky-600" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl border border-sky-200 hover:border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Отправить наряд-заявку мастеру в Telegram или Viber"
        >
          <Send className="w-3.5 h-3.5 text-sky-600" />
          <span>В Telegram / Viber</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-purple-200 text-xs space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                    Оповещение исполнителя (Шаг 8)
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Отправить заявку #{ticket.number} мастеру
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview of formatted ticket card */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-700">
                Текст карточки наряда для мессенджера:
              </div>
              <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {formattedText}
              </pre>
            </div>

            {/* Action buttons for Telegram, Viber, Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCopyText}
                className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Отправить в Telegram</span>
              </a>

              <a
                href={viberShareUrl}
                onClick={handleCopyText}
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Отправить в Viber</span>
              </a>
            </div>

            <button
              type="button"
              onClick={handleCopyText}
              className={`w-full py-2.5 px-4 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Текст заявки скопирован! Вставьте в любой чат</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-purple-700" />
                  <span>Скопировать карточку заявки в буфер обмена</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
