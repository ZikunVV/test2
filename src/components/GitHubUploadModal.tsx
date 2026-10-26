import React, { useState } from 'react';
import { ThemeConfig, GradientOption } from '../types';
import {
  X,
  Github,
  Check,
  Copy,
  FolderDown,
  ExternalLink,
  Terminal,
  MousePointerClick,
  FileCode2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

interface GitHubUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  onDownloadProjectAgain?: () => void;
  isDownloading?: boolean;
}

export const GitHubUploadModal: React.FC<GitHubUploadModalProps> = ({
  isOpen,
  onClose,
  theme,
  gradient,
  showFlatFallback,
  onDownloadProjectAgain,
  isDownloading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'script' | 'terminal'>('desktop');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = [
    { label: '1. Инициализировать репозиторий', cmd: 'git init' },
    { label: '2. Добавить все файлы проекта', cmd: 'git add .' },
    { label: '3. Создать первый коммит', cmd: 'git commit -m "Initial commit"' },
    { label: '4. Задать главную ветку main', cmd: 'git branch -M main' },
    {
      label: '5. Привязать ваш репозиторий GitHub',
      cmd: 'git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git',
    },
    { label: '6. Загрузить все файлы на GitHub', cmd: 'git push -u origin main' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-purple-200/80 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ borderColor: theme.keyColors.cardBorder }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-xs"
          style={{
            background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                Загрузка проекта на GitHub
              </h2>
              <p className="text-xs text-purple-100 opacity-90">
                Решение ошибки: «Yowza, that’s a lot of files. Try uploading fewer than 100»
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Explanation Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-amber-900">
                Почему браузер выдает ошибку на GitHub?
              </div>
              <div className="text-amber-800 leading-relaxed">
                На сайте GitHub при перетаскивании файлов через браузер (кнопка <i>Upload files</i>) действует строгое ограничение: <b>не более 100 файлов за раз</b>. Наш проект содержит гораздо больше файлов компонентов, стилей и настроек. Чтобы загрузить проект целиком, выберите один из трёх простых способов ниже:
              </div>
            </div>
          </div>

          {/* Method Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-purple-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5 text-purple-700" />
              <span className="truncate">GitHub Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-white text-purple-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-purple-700" />
              <span className="truncate">Скрипт в 1 клик</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-white text-purple-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-700" />
              <span className="truncate">Команды Git</span>
            </button>
          </div>

          {/* TAB 1: GitHub Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs">
              <div className="font-extrabold text-sm text-purple-950 flex items-center justify-between">
                <span>Способ 1: Без консоли через программу GitHub Desktop</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Самый лёгкий
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>
                  Скачайте и установите бесплатную программу{' '}
                  <a
                    href="https://desktop.github.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    GitHub Desktop <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  и войдите в свой аккаунт GitHub.
                </li>
                <li>
                  Распакуйте скачанный ZIP-архив проекта в любую папку на компьютере.
                </li>
                <li>
                  В программе GitHub Desktop нажмите <b>File → Add Local Repository...</b> (или нажмите <code>Ctrl + O</code>) и укажите эту папку.
                </li>
                <li>
                  Если программа напишет <i>«This directory does not appear to be a Git repository»</i>, нажмите синюю ссылку <b>«create a repository»</b> и нажмите <b>Create</b>.
                </li>
                <li>
                  Вверху появится кнопка <b>Publish repository</b> — нажмите её, укажите имя репозитория и нажмите <b>Publish</b>.
                </li>
              </ol>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Все файлы проекта сразу и без ошибок загрузятся в ваш GitHub!</span>
              </div>
            </div>
          )}

          {/* TAB 2: One-click script */}
          {activeTab === 'script' && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs">
              <div className="font-extrabold text-sm text-purple-950">
                Способ 2: Готовый скрипт (уже включён в архив проекта)
              </div>
              <p className="text-slate-700">
                Мы уже добавили в архив проекта готовые скрипты автоматической загрузки:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>
                  Создайте пустой репозиторий на{' '}
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    github.com/new <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  (галочку <i>Add a README file</i> ставить не нужно).
                </li>
                <li>Скопируйте ссылку на созданный репозиторий.</li>
                <li>
                  В распакованной папке проекта запустите:
                  <ul className="list-disc list-inside ml-4 mt-1 font-mono font-bold text-slate-900 space-y-0.5">
                    <li>Для Windows: <code>push_to_github.bat</code> (двойным кликом)</li>
                    <li>Для Mac/Linux: <code>./push_to_github.sh</code></li>
                  </ul>
                </li>
                <li>Вставьте скопированную ссылку на репозиторий и нажмите <b>Enter</b>.</li>
              </ol>
            </div>
          )}

          {/* TAB 3: Terminal Git Commands */}
          {activeTab === 'terminal' && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs">
              <div className="font-extrabold text-sm text-purple-950">
                Способ 3: Через терминал / командную строку
              </div>
              <p className="text-slate-700">
                Откройте терминал в распакованной папке проекта и выполните команды:
              </p>
              <div className="space-y-1.5 font-mono">
                {gitCommands.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900 text-slate-100 rounded-lg flex items-center justify-between gap-2 overflow-x-auto text-[11px]"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-400 font-sans font-bold">
                        {item.label}
                      </span>
                      <span className="text-emerald-400 select-all">{item.cmd}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.cmd, idx)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 flex items-center gap-1 transition-colors cursor-pointer text-[10px]"
                      title="Скопировать"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with download button */}
        <div className="p-4 bg-slate-50 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            Файлы <b>push_to_github.bat</b> и <b>GITHUB_UPLOAD_GUIDE.md</b> включены в скачиваемый архив.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onDownloadProjectAgain && (
              <button
                type="button"
                onClick={onDownloadProjectAgain}
                disabled={isDownloading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer active:scale-95 hover:opacity-95"
                style={{
                  background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                }}
              >
                <FolderDown className="w-4 h-4" />
                <span>{isDownloading ? 'Сборка архива...' : 'Скачать ZIP архив снова'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
