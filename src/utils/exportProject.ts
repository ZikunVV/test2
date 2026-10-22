import JSZip from 'jszip';

export interface ExportProjectOptions {
  currentDatabase?: {
    tickets?: any[];
    houses?: any[];
    users?: any[];
    personalPeople?: any[];
    personalTasks?: any[];
    streets?: any[];
    auditLogs?: any[];
  };
}

export async function downloadProjectArchive(options?: ExportProjectOptions): Promise<void> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `gkh_portal_project_latest_${dateStr}.zip`;

  // 1. Primary method: Fetch the pre-built complete project archive directly from server
  try {
    const res = await fetch(`/latest_project.zip?t=${Date.now()}`);
    if (res.ok) {
      const blob = await res.blob();
      const zip = await JSZip.loadAsync(blob);

      // Inject current database state snapshot if available
      if (options?.currentDatabase) {
        zip.file(
          'current_database_export.json',
          JSON.stringify(options.currentDatabase, null, 2)
        );
      }

      const finalBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const downloadUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      return;
    }
  } catch (e) {
    console.warn('Could not fetch pre-built zip, falling back to dynamic packaging:', e);
  }

  // 2. Fallback method: Dynamic in-browser packaging
  const zip = new JSZip();

  try {
    const rawLoaders = import.meta.glob(
      [
        '/src/**/*',
        '/index.html',
        '/package.json',
        '/.npmrc',
        '/.gitignore',
        '/vercel.json',
        '/tsconfig.json',
        '/vite.config.ts',
        '/metadata.json',
        '/firebase-applet-config.json',
        '/firestore.rules',
        '/firebase-blueprint.json',
        '/public/icon.svg',
        '/.env.example'
      ],
      { query: '?raw', import: 'default' }
    );

    for (const [rawPath, loader] of Object.entries(rawLoaders)) {
      try {
        const content = await (loader as () => Promise<string>)();
        const cleanPath = rawPath.replace(/^\//, '');
        if (typeof content === 'string') {
          zip.file(cleanPath, content);
        }
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Could not load all project files for zip archive:', e);
  }

  // Include current database state snapshot as data/current_database_export.json
  if (options?.currentDatabase) {
    zip.file(
      'current_database_export.json',
      JSON.stringify(options.currentDatabase, null, 2)
    );
  }

  // Include README with migration & run instructions
  const readmeContent = `# Портал Управляющей Компании ЖКХ (WORKFLOW)

Этот архив содержит полную рабочую версию проекта для переноса на:
- Vercel (vercel.com)
- GitHub (github.com)
- Другой аккаунт Google AI Studio (aistudio.google.com)
- Любой локальный компьютер или сервер

## Инструкция по запуску:
1. Распакуйте архив в любую папку.
2. Откройте терминал в папке проекта.
3. Выполните установку зависимостей:
   \`\`\`bash
   npm install
   \`\`\`
4. Запустите сервер разработки:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Откройте в браузере: http://localhost:3000

## Сборка для публикации на Vercel:
\`\`\`bash
npm run build
\`\`\`
`;
  zip.file('README.md', readmeContent);

  // Generate zip blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
