import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSettings = () => {
    try {
      // Clear display and color settings if corrupted
      for (let i = 1; i <= 20; i++) {
        localStorage.removeItem(`app_color_settings_user_${i}`);
        localStorage.removeItem(`app_sound_settings_user_${i}`);
      }
      localStorage.removeItem('app_current_gradient_id');
      localStorage.removeItem('app_background_mode');
      localStorage.removeItem('app_display_settings');
      localStorage.removeItem('app_display_filters_enabled');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                При загрузке страницы произошла ошибка
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Интерфейс не смог отобразиться из-за непредвиденного сбоя. Вы можете перезагрузить приложение или сбросить временные настройки.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-100 text-left font-mono text-[11px] text-slate-700 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Обновить страницу</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSettings}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Сбросить настройки и войти заново</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
