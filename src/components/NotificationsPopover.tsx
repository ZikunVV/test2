import React from 'react';
import { ThemeConfig, NotificationItem } from '../types';
import { Bell, Check, X, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  theme: ThemeConfig;
  onMarkAllAsRead: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  theme,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full shadow-2xl p-5 border-l flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm">Уведомления диспетчера</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  item.unread
                    ? 'border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20'
                    : 'border-slate-100 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{item.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          <button
            onClick={onMarkAllAsRead}
            className="w-full py-2 rounded-xl text-xs font-semibold text-center border hover:bg-black/5 transition-colors flex items-center justify-center gap-1.5"
            style={{ borderColor: theme.keyColors.cardBorder }}
          >
            <Check className="w-3.5 h-3.5 text-purple-600" />
            <span>Отметить все как прочитанные</span>
          </button>
        </div>
      </div>
    </div>
  );
};
