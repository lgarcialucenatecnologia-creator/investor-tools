'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from './password-field';
import { ErrorCode } from '@/lib/api/errors';
import { validateEmail, validateNewPassword } from '@/lib/validation/auth';

type Mode = 'login' | 'check-email' | 'set-password';

const COPY = {
  login: {
    title: 'Bienvenido de nuevo',
    subtitle: 'Ingresa tus credenciales para continuar',
    submit: 'Iniciar sesión',
  },
  'check-email': {
    title: '¿Primera vez aquí?',
    subtitle: 'Escribe el correo con el que compraste y confirmamos tu cuenta',
    submit: 'Continuar',
  },
  'set-password': {
    title: 'Crea tu contraseña',
    subtitle: 'Es la última vez que haces esto. Elige una y entra',
    submit: 'Crear contraseña y entrar',
  },
} as const;

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const shape = (data ?? {}) as { message?: string; code?: string };
    throw Object.assign(
      new Error(shape.message ?? 'No pudimos completar la operación.'),
      { code: shape.code },
    );
  }
  return data;
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [greeting, setGreeting] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = () => {
    router.replace(next);
    // Sin esto, los componentes de servidor ya renderizados se quedarían con
    // la sesión anterior en caché.
    router.refresh();
  };

  const switchTo = (target: Mode) => {
    setMode(target);
    setError(null);
    setFieldError(null);
    setPassword('');
    setNewPassword('');
    setConfirmation('');
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    if (mode === 'set-password') {
      const passwordError = validateNewPassword(newPassword, confirmation);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await post('/api/session/login', { email, password });
        go();
      } else if (mode === 'check-email') {
        const found = (await post('/api/session/check-new-user', { email })) as {
          fullName: string;
        };
        setGreeting(found.fullName);
        switchTo('set-password');
      } else {
        await post('/api/session/activate', { email, password: newPassword });
        go();
      }
    } catch (caught) {
      const failure = caught as Error & { code?: string };
      // La cuenta existe pero aún no tiene contraseña: en vez de dejar a la
      // persona contra un muro, se la lleva a crearla.
      if (failure.code === ErrorCode.PASSWORD_NOT_SET) {
        switchTo('set-password');
        setGreeting(null);
      } else {
        setError(failure.message);
      }
    } finally {
      setBusy(false);
    }
  }

  const copy = COPY[mode];

  return (
    <div className="w-full max-w-[26rem]">
      <h1 className="font-display text-3xl leading-tight text-marfil">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-grafito-texto">
        {greeting && mode === 'set-password'
          ? `Qué bueno verte, ${greeting.split(' ')[0]}.`
          : copy.subtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            readOnly={mode === 'set-password' && Boolean(greeting)}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'email-error' : undefined}
          />
          {fieldError && (
            <p id="email-error" className="text-sm text-alerta">
              {fieldError}
            </p>
          )}
        </div>

        {mode === 'login' && (
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        )}

        {mode === 'set-password' && (
          <>
            <PasswordField
              label="Tu nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              hint="Mínimo 8 caracteres."
            />
            <PasswordField
              label="Repítela"
              value={confirmation}
              onChange={setConfirmation}
              autoComplete="new-password"
            />
          </>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-md border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="mt-1 h-11 w-full">
          {busy ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <>
              {copy.submit}
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        {mode === 'login' ? (
          <button
            type="button"
            onClick={() => switchTo('check-email')}
            className="text-dorado underline-offset-4 hover:underline"
          >
            Soy usuario nuevo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchTo('login')}
            className="text-dorado underline-offset-4 hover:underline"
          >
            ← Volver a iniciar sesión
          </button>
        )}
      </div>

      <p className="mt-8 border-t border-grafito/20 pt-6 text-sm text-grafito-texto">
        ¿Olvidaste tu contraseña? Escríbele a tu asesor y te habilita una nueva
        desde la administración.
      </p>
    </div>
  );
}
