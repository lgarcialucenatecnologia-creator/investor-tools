'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import type { AdminUser } from '@/lib/api/types';
import { validateEmail } from '@/lib/validation/auth';

export function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreated(null);

    if (fullName.trim().length < 3) {
      setError('Escribe el nombre completo.');
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setBusy(true);
    try {
      const user = await api<AdminUser>('/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      setCreated(user);
      setFullName('');
      setEmail('');
      setPhone('');
      onCreated();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-grafito/20 bg-nocturno p-7">
      <h2 className="font-display text-xl text-marfil">Dar de alta un cliente</h2>
      <p className="mt-2 text-sm text-grafito-texto">
        Usa el mismo correo con el que compró: es la llave con la que va a
        entrar.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Nombre y apellido</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ana Restrepo"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newEmail">Correo de la compra</Label>
          <Input
            id="newEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@correo.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+573001234567"
          />
        </div>

        <div className="md:col-span-3">
          <Button type="submit" disabled={busy} className="h-11">
            {busy ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <>
                <UserPlus size={16} />
                Crear cuenta
              </>
            )}
          </Button>
        </div>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      {/* Sin envío de correo automático, avisarle es parte del trabajo del
          asesor: por eso el mensaje dice exactamente qué tiene que decirle. */}
      {created && (
        <div
          role="status"
          className="mt-4 rounded-md border border-dorado/40 bg-dorado/10 px-4 py-3 text-sm"
        >
          <p className="text-marfil">
            Cuenta creada para <strong>{created.fullName}</strong>.
          </p>
          <p className="mt-1 text-marfil/80">
            Avísale que ya puede entrar: va a{' '}
            <span className="text-dorado">Soy usuario nuevo</span>, escribe{' '}
            <span className="text-dorado">{created.email}</span> y crea su
            contraseña. Tiene 72 horas.
          </p>
        </div>
      )}
    </section>
  );
}
