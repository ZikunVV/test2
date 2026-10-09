import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldAlert,
} from 'lucide-react';
import {
  House,
  Ticket,
  PersonalTask,
  PersonalPerson,
  AuditLogItem,
  UserItem,
  StreetItem,
  Organization,
} from '../types';

export interface DatabaseBackupPayload {
  version: string;
  exportedAt: string;
  houses: House[];
  tickets: Ticket[];
  streets?: StreetItem[];
  personalTasks?: PersonalTask[];
  personalPeople?: PersonalPerson[];
  auditLogs?: AuditLogItem[];
  users?: UserItem[];
  organizations?: Organization[];
}

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  houses: House[];
  tickets: Ticket[];
  streets?: StreetItem[];
  personalTasks: PersonalTask[];
  personalPeople: PersonalPerson[];
  auditLogs: AuditLogItem[];
  users: UserItem[];
  organizations?: Organization[];
  onRestoreDatabase: (backup: DatabaseBackupPayload) => void;
  onClearDatabase: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  houses,
  tickets,
  streets = [],
  personalTasks,
  personalPeople,
  auditLogs,
  users,
  organizations = [],
  onRestoreDatabase,
  onClearDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'clear'>('export');
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<DatabaseBackupPayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export (Download JSON backup)
  const handleExport = () => {
    const payload: DatabaseBackupPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      houses,
      tickets,
      streets,
      personalTasks,
      personalPeople,
      auditLogs,
      users,
      organizations,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const fileName = `ujk_backup_${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage(`Резервная копия сохранена в файл: ${fileName}`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle File Selection for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setPreviewData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('Файл не является корректным объектом JSON.');
        }

        // Validate basic required arrays
        const validHouses = Array.isArray(parsed.houses) ? parsed.houses : [];
        const validTickets = Array.isArray(parsed.tickets) ? parsed.tickets : [];

        setPreviewData({
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          houses: validHouses,
          tickets: validTickets,
          streets: Array.isArray(parsed.streets) ? parsed.streets : [],
          personalTasks: Array.isArray(parsed.personalTasks) ? parsed.personalTasks : [],
          personalPeople: Array.isArray(parsed.personalPeople) ? parsed.personalPeople : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
          users: Array.isArray(parsed.users) ? parsed.users : [],
          organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
        });
      } catch (err: any) {
        setImportError(
          `Ошибка чтения файла: ${err.message || 'Неверный формат резервной копии.'}`
        );
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!previewData) return;

    if (
      window.confirm(
        `Внимание! Вы восстанавливаете базу данных из файла.\n\nБудет загружено:\n• Домов: ${previewData.houses.length}\n• Заявок: ${previewData.tickets.length}\n• Контактов: ${previewData.personalPeople?.length || 0}\n• Задач: ${previewData.personalTasks?.length || 0}\n\nТекущие данные будут заменены данными из файла. Продолжить?`
      )
    ) {
      onRestoreDatabase(previewData);
      setSuccessMessage('База данных успешно восстановлена из файла!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    }
  };

  // Confirm Clear Database
  const handleConfirmClear = () => {
    if (
      window.confirm(
        'ВНИМАНИЕ! Вы собираетесь ПОЛНОСТЬЮ ОЧИСТИТЬ базу данных (все дома, все заявки, все контакты и задачи будут удалены).\n\nПеред очисткой рекомендуется скачать резервную копию.\n\nВы уверены, что хотите продолжить?'
      )
    ) {
      onClearDatabase();
      setSuccessMessage('База данных полностью очищена для ввода реальных данных.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-xl p-3.5 sm:p-6 border border-purple-200 shadow-2xl space-y-4 sm:space-y-5 text-xs animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto overflow-x-hidden box-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Резервная копия и управление базой
              </h3>
              <p className="text-[11px] text-purple-700 font-medium">
                Доступно только главному администратору
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Database Summary Chips */}
        <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2">
          <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
            Текущее состояние базы данных:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Дома</span>
              <strong className="text-sm text-purple-950 font-black">{houses.length}</strong>
            </div>
            <div className="bg-white p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Заявки</span>
              <strong className="text-sm text-purple-950 font-black">{tickets.length}</strong>
            </div>
            <div className="bg-white p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Контакты</span>
              <strong className="text-sm text-purple-950 font-black">
                {personalPeople.length}
              </strong>
            </div>
            <div className="bg-white p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Задачи</span>
              <strong className="text-sm text-purple-950 font-black">
                {personalTasks.length}
              </strong>
            </div>
          </div>
        </div>

        {/* Success / Error alerts */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-bold text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {importError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Tabs: Export vs Import vs Clear */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт базы</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Импорт из файла</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clear')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'clear'
                ? 'bg-rose-50 text-rose-700 shadow-xs'
                : 'text-slate-500 hover:text-rose-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистка</span>
          </button>
        </div>

        {/* Tab 1: Export */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <FileJson className="w-4 h-4 text-purple-700" />
                <span>Сохранение резервной копии базы данных на ваш компьютер</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Файл будет содержать все добавленные дома (с описанием подъездов и этажей),
                все заявки, выполненные акты, базу жильцов, личные задачи и журнал аудита в
                стандартном формате <code>.json</code>.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Скачать резервную копию базы (.json)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs">
                Восстановление данных из ранее сохранённого файла (.json)
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Выберите файл резервной копии, созданный этой системой. При импорте текущая база
                будет заменена записями из файла.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl border border-purple-300 bg-white hover:bg-purple-50 text-purple-900 font-bold flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {importedFile ? `Выбран: ${importedFile.name}` : 'Выбрать файл .json с компьютера'}
                  </span>
                </button>
              </div>
            </div>

            {/* Preview of file to import */}
            {previewData && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Файл успешно проверен. Готово к восстановлению:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">Домов</span>
                    <strong className="text-slate-800">{previewData.houses.length}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">Заявок</span>
                    <strong className="text-slate-800">{previewData.tickets.length}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">Контактов</span>
                    <strong className="text-slate-800">
                      {previewData.personalPeople?.length || 0}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">Задач</span>
                    <strong className="text-slate-800">
                      {previewData.personalTasks?.length || 0}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Восстановить базу данных из этого файла</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Clear */}
        {activeTab === 'clear' && (
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Полная очистка базы данных</span>
            </div>
            <p className="text-rose-700 text-[11px] leading-relaxed">
              Это действие удалит все дома, заявки, задачи и контакты, оставив базу полностью пустой
              для внесения реальных данных с нуля.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold flex items-center gap-2 transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить базу данных</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-purple-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
