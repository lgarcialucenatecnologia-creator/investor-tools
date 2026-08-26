'use client';

import { StatusChip } from './status-chip';
import type { AdminUser } from '@/lib/api/types';

const fecha = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const format = (iso: string | null, empty = '—') =>
  iso ? fecha.format(new Date(iso)) : empty;

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  investor: 'Cliente',
  advisor: 'Asesor',
  admin: 'Administrador',
};

export function UserTable({
  users,
  currentUserId,
  busyId,
  onEdit,
  onReset,
  onDelete,
}: {
  users: AdminUser[];
  currentUserId: string;
  busyId: string | null;
  onEdit: (user: AdminUser) => void;
  onReset: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  if (users.length === 0) {
    return (
      <p className="rounded-lg border border-grafito/20 bg-nocturno px-6 py-10 text-center text-grafito-texto">
        No hay cuentas que coincidan.
      </p>
    );
  }

  return (
    // La tabla desborda dentro de su caja: en un teléfono se desplaza ella,
    // no la página entera.
    <div className="overflow-x-auto rounded-lg border border-grafito/20">
      <table className="w-full min-w-[54rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-grafito/20 bg-nocturno text-left">
            {['Usuario', 'Rol', 'Estado', 'Vence', 'Último ingreso'].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-grafito-texto">
                {h}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.08em] text-grafito-texto">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = busyId === user.id;

            return (
              <tr key={user.id} className="border-b border-grafito/10 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-marfil">{user.fullName}</p>
                  <p className="text-xs text-grafito-texto">{user.email}</p>
                  {user.phone && (
                    <p className="text-xs text-grafito-texto">{user.phone}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-marfil/70">
                  {ROLE_LABEL[user.role]}
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={user.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums text-marfil/70">
                  {format(user.accessExpiresAt, 'No vence')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums text-marfil/70">
                  {format(user.lastLoginAt, 'Nunca')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Action label="Editar" onClick={() => onEdit(user)} disabled={busy} />
                    {/* Sobre uno mismo no se ofrecen: el backend las rechaza,
                        y un botón que siempre falla es una trampa. */}
                    {!isSelf && (
                      <>
                        <Action
                          label="Resetear contraseña"
                          onClick={() => onReset(user)}
                          disabled={busy || user.status === 'pending_activation'}
                        />
                        <Action
                          label="Eliminar"
                          onClick={() => onDelete(user)}
                          disabled={busy}
                          danger
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Action({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? 'border-alerta/40 text-alerta hover:bg-alerta/10'
          : 'border-grafito/40 text-marfil/80 hover:border-dorado hover:text-dorado'
      }`}
    >
      {label}
    </button>
  );
}
