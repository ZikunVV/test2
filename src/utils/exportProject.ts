export interface ExportProjectOptions {
  currentDatabase?: Record<string, unknown>;
}

export async function downloadProjectArchive(_options?: ExportProjectOptions): Promise<void> {
  alert('Экспорт архива проекта');
}
