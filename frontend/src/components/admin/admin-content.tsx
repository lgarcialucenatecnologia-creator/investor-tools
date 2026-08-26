'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api/client';
import type { AdminUser, Paginated, UserStatus } from '@/lib/api/types';
import { CreateUserForm } from './create-user-form';
import { UserTable } from './user-table';

interface Stats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

const FILTERS: { value: UserStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending_activation', label: 'Sin activar' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Pausados' },
];

export function AdminContent() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      const [list, counts] = await Promise.all([
        api<Paginated<AdminUser>>(`/users?${params}`),
        api<Stats>('/users/stats'),
      ]);
      setData(list);
      setStats(counts);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [search, status]);

  // Se espera antes de consultar: sin esto, cada tecla dispara una petición.
  useEffect(() => {
    const id = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(id);
  }, [load]);

  async function act(
    target: AdminUser,
    run: () => Promise<unknown>,
  ): Promise<void> {
    setBusyId(target.id);
    setError(null);
    try {
      await run();
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          Administración
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil">
          Clientes
        </h1>
      </div>

      {stats && (
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Sin activar', value: stats.pending },
            { label: 'Activos', value: stats.active },
            { label: 'Pausados', value: stats.suspended },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-grafito/20 bg-nocturno px-5 py-4"
            >
              <dt className="text-xs uppercase tracking-[0.14em] text-grafito-texto">
                {item.label}
              </dt>
              <dd className="mt-2 font-display text-2xl tabular-nums text-marfil">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <CreateUserForm onCreated={() => void load()} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grafito-texto"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo"
              aria-label="Buscar clientes"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                aria-pressed={status === filter.value}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  status === filter.value
                    ? 'border-dorado text-dorado'
                    : 'border-grafito/30 text-grafito-texto hover:border-grafito/60'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta"
          >
            {error}
          </p>
        )}

        {data ? (
          <UserTable
            users={data.items}
            currentUserId={user.userId}
            busyId={busyId}
            onReset={(target) =>
              void act(target, () =>
                api(`/users/${target.id}/reset-password`, { method: 'POST' }),
              )
            }
            onToggle={(target) =>
              void act(target, () =>
                api(`/users/${target.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    status:
                      target.status === 'suspended' ? 'active' : 'suspended',
                  }),
                }),
              )
            }
            onDelete={(target) => {
              if (
                !window.confirm(
                  `¿Borrar la cuenta de ${target.fullName}? No se puede deshacer.`,
                )
              ) {
                return;
              }
              void act(target, () =>
                api(`/users/${target.id}`, { method: 'DELETE' }),
              );
            }}
          />
        ) : (
          <p className="text-sm text-grafito-texto">Cargando clientes…</p>
        )}
      </div>
    </div>
  );
}
