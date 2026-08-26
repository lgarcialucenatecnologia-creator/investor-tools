'use client';

import { useState, type ChangeEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import { parseCsvUsers, type CsvParseResult } from '@/lib/csv-users';
import { defaultExpiry, fromDateInput } from '@/lib/validation/dates';

interface BulkResult {
  created: number;
  skipped: { email: string; reason: string }[];
}

export function CsvImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [expiry, setExpiry] = useState(defaultExpiry());
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    setParsed(parseCsvUsers(await file.text()));
  }

  async function handleImport() {
    if (!parsed?.rows.length) return;
    setBusy(true);
    setError(null);
    try {
      const accessExpiresAt = fromDateInput(expiry);
      const response = await api<BulkResult>('/users/bulk', {
        method: 'POST',
        body: JSON.stringify({
          users: parsed.rows.map((row) => ({ ...row, accessExpiresAt })),
        }),
      });
      setResult(response);
      onImported();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setParsed(null);
          setResult(null);
          setError(null);
          setFileName('');
        }
      }}
      title="Importar cuentas desde un archivo"
      description="Un archivo CSV con las columnas «nombre» y «correo». El teléfono es opcional."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="csv">Archivo</Label>
          <Input id="csv" type="file" accept=".csv,text/csv" onChange={(e) => void handleFile(e)} />
          {fileName && (
            <p className="text-xs text-grafito-texto">{fileName}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="csv-expiry">Vencimiento para todas</Label>
          <Input
            id="csv-expiry"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>

        {/* Se muestra qué se leyó ANTES de enviar nada: revisar 40 filas
            después de crearlas es mucho más caro que revisarlas antes. */}
        {parsed && !result && (
          <div className="rounded-md border border-grafito/25 px-4 py-3 text-sm">
            <p className="text-marfil">
              {parsed.rows.length} cuenta{parsed.rows.length === 1 ? '' : 's'}{' '}
              lista{parsed.rows.length === 1 ? '' : 's'} para crear
            </p>
            {parsed.problems.length > 0 && (
              <>
                <p className="mt-2 text-alerta">
                  {parsed.problems.length} fila
                  {parsed.problems.length === 1 ? '' : 's'} con problemas, se
                  omiten:
                </p>
                <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-grafito-texto">
                  {parsed.problems.map((problem) => (
                    <li key={`${problem.line}-${problem.reason}`}>
                      Fila {problem.line}: {problem.reason}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {result && (
          <div
            role="status"
            className="rounded-md border border-dorado/40 bg-dorado/10 px-4 py-3 text-sm"
          >
            <p className="text-marfil">
              {result.created} cuenta{result.created === 1 ? '' : 's'} creada
              {result.created === 1 ? '' : 's'}.
            </p>
            {result.skipped.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-marfil/70">
                {result.skipped.map((item) => (
                  <li key={item.email}>
                    {item.email} — {item.reason}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-marfil/80">
              Avísales que entren por «Soy usuario nuevo» con su correo.
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-md border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button
              type="button"
              disabled={busy || !parsed?.rows.length}
              onClick={() => void handleImport()}
            >
              {busy ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <Upload size={15} />
                  Crear {parsed?.rows.length ?? 0} cuentas
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
