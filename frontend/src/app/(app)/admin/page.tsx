import type { Metadata } from 'next';
import { AdminContent } from '@/components/admin/admin-content';

export const metadata: Metadata = { title: 'Administración' };

/** La guarda de rol vive en el layout; aquí solo va el contenido. */
export default function AdminPage() {
  return <AdminContent />;
}
