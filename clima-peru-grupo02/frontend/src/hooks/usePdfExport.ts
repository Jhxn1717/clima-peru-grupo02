/**
 * usePdfExport.ts
 * Hook que encapsula el estado de generación de PDF y expone
 * un trigger tipado que acepta las opciones del generador.
 */
import { useState, useCallback } from 'react';
import { PdfGenerator, PdfReportOptions } from '../services/pdfGenerator';

interface UsePdfExportReturn {
  isGenerating: boolean;
  error: string | null;
  generate: (opts: PdfReportOptions) => Promise<void>;
  clearError: () => void;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (opts: PdfReportOptions) => {
    setIsGenerating(true);
    setError(null);
    try {
      const gen = new PdfGenerator();
      await gen.generate(opts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF.';
      setError(msg);
      console.error('[usePdfExport] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { isGenerating, error, generate, clearError };
}
