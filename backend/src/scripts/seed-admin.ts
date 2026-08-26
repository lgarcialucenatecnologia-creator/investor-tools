/**
 * Da de alta al primer administrador, o eleva a una cuenta que ya existe.
 *
 *   npm run seed:admin -- correo@dominio.com "Nombre Apellido"
 *
 * Es un comando de un disparo y no una siembra al arrancar. Sembrar en cada
 * arranque tiene tres problemas: deja la contraseña del administrador en el
 * entorno del servidor y en los registros del despliegue; resucita la cuenta
 * en el siguiente despliegue si se borró durante un incidente, o sea que es
 * una puerta que sobrevive a la reparación; y con varias instancias todas
 * compiten por crearla.
 *
 * Nunca se fija aquí una contraseña: si la cuenta es nueva queda pendiente de
 * activación y su dueño la crea por «Soy usuario nuevo», igual que cualquier
 * otro. Así no hay credenciales de administrador en ningún archivo.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../modules/users/schemas/user.schema';

async function main(): Promise<void> {
  const [email, fullName] = process.argv.slice(2);
  if (!email) {
    console.error(
      'Uso: npm run seed:admin -- correo@dominio.com "Nombre Apellido"',
    );
    process.exitCode = 1;
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta MONGODB_URI');

  const ttlHours = Number.parseInt(
    process.env.ACTIVATION_TTL_HOURS ?? '72',
    10,
  );

  await mongoose.connect(uri);
  const users = mongoose.connection.db!.collection('users');
  const normalized = email.toLowerCase().trim();
  const existing = await users.findOne({ email: normalized });

  if (existing) {
    if (existing.role === UserRole.ADMIN) {
      console.log(`${normalized} ya es administrador. No se cambió nada.`);
    } else {
      await users.updateOne(
        { _id: existing._id },
        { $set: { role: UserRole.ADMIN, updatedAt: new Date() } },
      );
      console.log(`${normalized} ahora es administrador.`);
    }
  } else {
    if (!fullName) {
      console.error('Falta el nombre para crear la cuenta.');
      process.exitCode = 1;
      await mongoose.disconnect();
      return;
    }
    const now = new Date();
    await users.insertOne({
      fullName,
      email: normalized,
      // Contraseña imposible: la real la crea su dueño al activar.
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
      sessions: [],
      role: UserRole.ADMIN,
      status: UserStatus.PENDING_ACTIVATION,
      accessExpiresAt: null,
      lastLoginAt: null,
      activationExpiresAt: new Date(Date.now() + ttlHours * 3_600_000),
      activatedAt: null,
      activatedFromIp: null,
      createdAt: now,
      updatedAt: now,
    });
    console.log(
      `Administrador creado: ${normalized}\n` +
        `Entra a /login, pulsa «Soy usuario nuevo» y crea tu contraseña.\n` +
        `Tienes ${ttlHours} horas.`,
    );
  }

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
