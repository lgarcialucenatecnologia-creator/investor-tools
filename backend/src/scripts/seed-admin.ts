/**
 * Da de alta al administrador, o eleva y actualiza una cuenta que ya existe.
 *
 *   npm run seed:admin                     # toma ADMIN_* del .env
 *   npm run seed:admin -- otro@correo.com "Nombre"   # o por argumento
 *
 * Es un comando de un disparo y NO una siembra al arrancar. Sembrar en cada
 * arranque resucita la cuenta en el siguiente despliegue si se borró durante
 * un incidente: una puerta que sobrevive a su propia reparación. Y con varias
 * instancias todas competirían por crearla.
 *
 * Si hay ADMIN_PASSWORD, la cuenta queda activa con esa contraseña. Si no, se
 * crea pendiente y su dueño la crea por «Soy usuario nuevo», que es lo más
 * seguro porque entonces la contraseña no existe escrita en ningún sitio.
 *
 * Volver a ejecutarlo con otra contraseña en el .env la actualiza: eso es lo
 * que hace que el administrador sea «editable por variable de entorno».
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../modules/users/schemas/user.schema';

const MIN_PASSWORD = 8;

async function main(): Promise<void> {
  const [argEmail, argName] = process.argv.slice(2);
  const email = (argEmail ?? process.env.ADMIN_EMAIL ?? '')
    .toLowerCase()
    .trim();
  const fullName = argName ?? process.env.ADMIN_FULL_NAME ?? 'Administrador';
  const password = process.env.ADMIN_PASSWORD?.trim() || null;

  if (!email) {
    console.error(
      'Falta el correo. Define ADMIN_EMAIL en el .env o pásalo como argumento:\n' +
        '  npm run seed:admin -- correo@dominio.com "Nombre Apellido"',
    );
    process.exitCode = 1;
    return;
  }

  if (password && password.length < MIN_PASSWORD) {
    console.error(
      `ADMIN_PASSWORD necesita al menos ${MIN_PASSWORD} caracteres.`,
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
  const existing = await users.findOne({ email });

  // Con contraseña: cuenta lista para entrar. Sin ella: pendiente, y la
  // contraseña guardada es un secreto aleatorio que nadie puede usar.
  const passwordHash = await bcrypt.hash(
    password ?? randomBytes(32).toString('hex'),
    12,
  );
  const status = password ? UserStatus.ACTIVE : UserStatus.PENDING_ACTIVATION;

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: UserRole.ADMIN,
          updatedAt: new Date(),
          ...(password
            ? {
                passwordHash,
                status: UserStatus.ACTIVE,
                activationExpiresAt: null,
                // Cambiar la contraseña por entorno expulsa a quien
                // estuviera dentro: se borran las sesiones y se adelanta la
                // frontera de validez, que es lo que mata los tokens de
                // acceso que aún no habían expirado.
                sessions: [],
                tokensValidAfter: new Date(),
              }
            : {}),
        },
      },
    );
    console.log(
      password
        ? `${email}: administrador, contraseña actualizada desde el entorno.`
        : `${email}: ahora es administrador. Su contraseña no se tocó.`,
    );
  } else {
    const now = new Date();
    await users.insertOne({
      fullName,
      email,
      passwordHash,
      sessions: [],
      role: UserRole.ADMIN,
      status,
      accessExpiresAt: null,
      lastLoginAt: null,
      activationExpiresAt: password
        ? null
        : new Date(Date.now() + ttlHours * 3_600_000),
      tokensValidAfter: null,
      activatedAt: null,
      activatedFromIp: null,
      createdAt: now,
      updatedAt: now,
    });
    console.log(
      password
        ? `Administrador creado: ${email}\nYa puedes entrar con la contraseña del .env.`
        : `Administrador creado: ${email}\nEntra a /login, pulsa «Soy usuario nuevo» y crea tu contraseña.\nTienes ${ttlHours} horas.`,
    );
  }

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
