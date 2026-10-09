import React, { useState } from 'react';
import { ThemeConfig, UserItem } from '../types';
import { useLanguage } from '../utils/i18n';
import { X, Send, MessageSquare, CheckCircle2, Clock, Shield, Trash2, Reply } from 'lucide-react';

export interface AdminMessageItem {
  id: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  organizationId?: string;
  subject: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  adminReply?: string;
  repliedAt?: string;
}

interface AdminMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  currentUser?: UserItem;
  isAdmin: boolean;
  messages: AdminMessageItem[];
  onSendMessage: (subject: string, text: string) => void;
  onReplyMessage?: (id: string, replyText: string) => void;
  onToggleResolved?: (id: string) => void;
  onDeleteMessage?: (id: string) => void;
}

export const AdminMessagesModal: React.FC<AdminMessagesModalProps> = ({
  isOpen,
  onClose,
  theme,
  currentUser,
  isAdmin,
  messages,
  onSendMessage,
  onReplyMessage,
  onToggleResolved,
  onDeleteMessage,
}) => {
  const { t } = useLanguage();
  const [subject, setSubject] = useState('Вопрос по работе');
  const [text, setText] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const visibleMessages = isAdmin
    ? messages
    : messages.filter((m) => m.senderId === currentUser?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(subject, text.trim());
    setText('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3500);
  };

  const handleReplySubmit = (id: string) => {
    if (!replyText.trim() || !onReplyMessage) return;
    onReplyMessage(id, replyText.trim());
    setReplyingId(null);
    setReplyText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4 overflow-y-auto overflow-x-hidden"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-2xl p-3.5 sm:p-6 border border-purple-200 shadow-2xl space-y-3.5 sm:space-y-5 text-xs my-auto max-h-[90vh] overflow-y-auto overflow-x-hidden box-border"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                {t('Связь с администратором')}
              </span>
              <h3 className="text-base font-black text-slate-900">
                {t('Написать сообщение администратору')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Send Message Form */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-slate-600">
              <span>{t('От кого:')}</span>{' '}
              <strong className="text-slate-900">{currentUser?.full_name || t('Главный администратор')}</strong>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('Тема обращения')}
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="Вопрос по работе">{t('Вопрос по работе')}</option>
              <option value="Доступ и права">{t('Доступ и права')}</option>
              <option value="Ошибка в адресе / доме">{t('Ошибка в адресе / доме')}</option>
              <option value="Предложение по улучшению">{t('Предложение по улучшению')}</option>
              <option value="Срочное сообщение">{t('Срочное сообщение')}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('Текст сообщения')}
            </label>
            <textarea
              rows={3}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('Опишите ваш вопрос, проблему или предложение для главного администратора...')}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs"
            />
          </div>

          {sentSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('Сообщение успешно отправлено администратору!')}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('Отправить сообщение')}</span>
            </button>
          </div>
        </form>

        {/* Message History */}
        <div className="space-y-3 pt-2 border-t border-purple-100">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">
              {isAdmin ? t('Входящие обращения сотрудников') : t('История сообщений')} ({visibleMessages.length})
            </h4>
          </div>

          {visibleMessages.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-purple-200 text-slate-400">
              {t('Пока нет отправленных сообщений.')}
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border space-y-2 transition-colors ${
                    msg.resolved
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-purple-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{msg.senderName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[10px] border border-purple-200">
                        {t(msg.subject)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                          msg.resolved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {msg.resolved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('Решено')}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{t('Новое')}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{msg.createdAt}</span>
                      {isAdmin && onDeleteMessage && (
                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title={t('Удалить')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                  {msg.adminReply && (
                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900 text-[11px]">
                        <Shield className="w-3.5 h-3.5 text-purple-700" />
                        <span>{t('Ответ администратора:')}</span>
                        {msg.repliedAt && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal ml-auto">
                            {msg.repliedAt}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800">{msg.adminReply}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(replyingId === msg.id ? null : msg.id);
                          setReplyText(msg.adminReply || '');
                        }}
                        className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Reply className="w-3 h-3" />
                        <span>{t('Ответить')}</span>
                      </button>

                      {onToggleResolved && (
                        <button
                          type="button"
                          onClick={() => onToggleResolved(msg.id)}
                          className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{msg.resolved ? t('Новое') : t('Отметить решённым')}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {isAdmin && replyingId === msg.id && (
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('Ответ администратора:')}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplySubmit(msg.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 text-white font-bold text-xs cursor-pointer"
                      >
                        {t('Сохранить')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
