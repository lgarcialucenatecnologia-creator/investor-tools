'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { api } from '@/lib/api/client';
import type { AdminUser, UserRole } from '@/lib/api/types';
import { defaultExpiry, fromDateInput, toDateInput } from '@/lib/validation/dates';
import { validateEmail } from '@/lib/validation/auth';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'investor', label: 'Cliente' },
  { value: 'advisor', label: 'Asesor' },
  { value: 'admin', label: 'Administrador' },
];

/**
 * Sirve para crear y para editar. La diferencia real es corta —al editar no
 * se toca el correo, porque es la llave con la que entra— y tener dos
 * formularios casi iguales es la forma segura de que se desincronicen.
 */
/**
 * El padre lo monta y lo desmonta con una `key`, así que el estado inicial se
 * toma de las propiedades una sola vez. Sincronizarlo con un efecto, que es
 * la salida obvia, provoca un render de más y deja el formulario con datos
 * viejos durante ese fotograma.
 */
export function UserDialog({
  onClose,
  editing,
  onSaved,
}: {
  onClose: () => void;
  editing: AdminUser | null;
  onSaved: (user: AdminUser, created: boolean) => void;
}) {
  const [fullName, setFullName] = useState(editing?.fullName ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [role, setRole] = useState<UserRole>(editing?.role ?? 'investor');
  const [neverExpires, setNeverExpires] = useState(
    editing ? editing.accessExpiresAt === null : false,
  );
  const [expiry, setExpiry] = useState(
    editing?.accessExpiresAt
      ? toDateInput(new Date(editing.accessExpiresAt))
      : defaultExpiry(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 3) {
      setError('Escribe el nombre completo.');
      return;
    }
    if (!editing) {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    const accessExpiresAt = neverExpires ? null : fromDateInput(expiry);
    if (!neverExpires && !accessExpiresAt) {
      setError('Elige una fecha de vencimiento o marca que no venza.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        role,
        accessExpiresAt,
      };

      const saved = editing
        ? await api<AdminUser>(`/users/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await api<AdminUser>('/users', {
            method: 'POST',
            body: JSON.stringify({
              ...payload,
              email: email.trim().toLowerCase(),
            }),
          });

      onSaved(saved, !editing);
      onClose();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editing ? 'Editar cuenta' : 'Crear nueva cuenta'}
      description={
        editing
          ? 'El correo no se puede cambiar: es la llave con la que entra.'
          : 'Usa el mismo correo con el que compró.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dlg-name">Nombre completo</Label>
          <Input
            id="dlg-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ana Restrepo"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dlg-email">Correo electrónico</Label>
          <Input
            id="dlg-email"
            type="email"
            value={email}
            disabled={Boolean(editing)}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@correo.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dlg-phone">Teléfono (opcional)</Label>
          <Input
            id="dlg-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+573001234567"
          />
        </div>

        {!editing && (
          <p className="rounded-md border border-azul/50 bg-azul/15 px-4 py-3 text-sm text-marfil/85">
            <span className="text-marfil">No asignas contraseña.</span> La crea
            esa persona la primera vez que entre, con «Soy usuario nuevo» y su
            correo.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Rol"
            value={role}
            onChange={setRole}
            options={ROLES}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="dlg-expiry">Vence el</Label>
            <Input
              id="dlg-expiry"
              type="date"
              value={expiry}
              disabled={neverExpires}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-grafito-texto">
          <input
            type="checkbox"
            checked={neverExpires}
            onChange={(e) => setNeverExpires(e.target.checked)}
            className="size-4 accent-[var(--color-dorado)]"
          />
          El acceso no vence
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta"
          >
            {error}
          </p>
        )}

        <div className="mt-1 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? (
              <Loader2 className="animate-spin" size={16} />
            ) : editing ? (
              'Guardar cambios'
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
