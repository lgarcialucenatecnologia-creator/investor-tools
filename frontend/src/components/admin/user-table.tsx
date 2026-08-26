'use client';

import { KeyRound, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { StatusChip } from './status-chip';
import type { AdminUser } from '@/lib/api/types';

const fecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const format = (iso: string | null) =>
  iso ? fecha.format(new Date(iso)) : '—';

export function UserTable({
  users,
  currentUserId,
  busyId,
  onReset,
  onToggle,
  onDelete,
}: {
  users: AdminUser[];
  currentUserId: string;
  busyId: string | null;
  onReset: (user: AdminUser) => void;
  onToggle: (user: AdminUser) => void;
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
    // La tabla desborda antes que la página: en un teléfono se desplaza
    // dentro de su caja y el resto del panel no se mueve.
    <div className="overflow-x-auto rounded-lg border border-grafito/20">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-grafito/20 bg-nocturno text-left">
            <th className="px-4 py-3 font-medium text-grafito-texto">Cliente</th>
            <th className="px-4 py-3 font-medium text-grafito-texto">Estado</th>
            <th className="px-4 py-3 font-medium text-grafito-texto">Rol</th>
            <th className="px-4 py-3 font-medium text-grafito-texto">
              Último ingreso
            </th>
            <th className="px-4 py-3 text-right font-medium text-grafito-texto">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = busyId === user.id;

            return (
              <tr
                key={user.id}
                className="border-b border-grafito/10 last:border-0"
              >
                <td className="px-4 py-3">
                  <p className="text-marfil">{user.fullName}</p>
                  <p className="text-xs text-grafito-texto">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={user.status} />
                </td>
                <td className="px-4 py-3 text-marfil/70">
                  {user.role === 'admin'
                    ? 'Administrador'
                    : user.role === 'advisor'
                      ? 'Asesor'
                      : 'Cliente'}
                </td>
                <td className="px-4 py-3 tabular-nums text-marfil/70">
                  {format(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {/* Sobre uno mismo no se ofrecen: el backend las rechaza
                        y un botón que siempre falla es una trampa. */}
                    {!isSelf && (
                      <>
                        <IconButton
                          label="Volver a pedirle la contraseña"
                          disabled={busy}
                          onClick={() => onReset(user)}
                        >
                          <KeyRound size={16} />
                        </IconButton>
                        <IconButton
                          label={
                            user.status === 'suspended'
                              ? 'Reanudar el acceso'
                              : 'Pausar el acceso'
                          }
                          disabled={busy || user.status === 'pending_activation'}
                          onClick={() => onToggle(user)}
                        >
                          {user.status === 'suspended' ? (
                            <PlayCircle size={16} />
                          ) : (
                            <PauseCircle size={16} />
                          )}
                        </IconButton>
                        <IconButton
                          label="Borrar la cuenta"
                          disabled={busy}
                          danger
                          onClick={() => onDelete(user)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
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

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-md border border-transparent text-grafito-texto transition-colors hover:border-grafito/40 disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? 'hover:text-alerta' : 'hover:text-dorado'
      }`}
    >
      {children}
    </button>
  );
}
