'use client';

import { Dialog as Primitive } from 'radix-ui';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Diálogo sobre el primitivo de Radix: trae la trampa de foco, el cierre con
 * Escape y los atributos de accesibilidad, que escritos a mano casi siempre
 * quedan a medias.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-50 bg-obsidiana/80 backdrop-blur-sm" />
        <Primitive.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-grafito/30 bg-nocturno p-7 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <Primitive.Title className="font-display text-xl text-marfil">
                {title}
              </Primitive.Title>
              {description && (
                <Primitive.Description className="mt-2 text-sm text-grafito-texto">
                  {description}
                </Primitive.Description>
              )}
            </div>
            <Primitive.Close
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-md text-grafito-texto transition-colors hover:text-marfil"
            >
              <X size={17} />
            </Primitive.Close>
          </div>

          <div className="mt-6">{children}</div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
