'use client';

import { useState, type ChangeEvent } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { KnowledgeSummary } from '@/lib/api/types';

export function UploadPanel({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<KnowledgeSummary | null>(null);

  function pick(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setDone(null);
    setFile(event.target.files?.[0] ?? null);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: form,
      });
      const body = (await response.json()) as
        | KnowledgeSummary
        | { message: string };
      if (!response.ok) throw new Error((body as { message: string }).message);
      setDone(body as KnowledgeSummary);
      onUploaded();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 surface p-7">
      <div>
        <h2 className="font-display text-xl text-marfil">
          Cargar el documento del método
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-grafito-texto">
          El PDF se transcribe por tandas y queda como borrador. No responde
          nada hasta que lo revises y lo actives.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-1 flex-col gap-2 md:max-w-md">
          <Label htmlFor="doc">Archivo PDF</Label>
          <Input id="doc" type="file" accept="application/pdf" onChange={pick} />
        </div>
        <Button type="button" disabled={!file || busy} onClick={() => void upload()}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Transcribiendo…
            </>
          ) : (
            <>
              <FileUp size={15} />
              Subir y transcribir
            </>
          )}
        </Button>
      </div>

      {/* Un documento largo tarda varios minutos: decirlo evita que alguien
          crea que se colgó y recargue a mitad de la transcripción. */}
      {busy && (
        <p className="text-sm text-grafito-texto">
          Un documento de más de cien páginas puede tardar varios minutos. No
          cierres esta pestaña.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      {done && (
        <p
          role="status"
          className="rounded-md border border-dorado/40 bg-dorado/10 px-4 py-3 text-sm text-marfil"
        >
          Versión {done.version} lista para revisar · {done.pageCount} páginas ·{' '}
          {done.sectionCount ?? 0} secciones ·{' '}
          {done.charCount.toLocaleString('es-CO')} caracteres.
        </p>
      )}
    </section>
  );
}
