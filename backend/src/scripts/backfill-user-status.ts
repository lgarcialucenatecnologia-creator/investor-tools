/**
 * Rellena `status`, `accessExpiresAt` y `lastLoginAt` en los usuarios creados
 * antes de que existieran esos campos.
 *
 * Hace falta porque Mongoose aplica los valores por defecto al CREAR un
 * documento, no al leerlo: los usuarios ya guardados llegan con `status`
 * indefinido y `assertAccountUsable` los trataría como no activos, dejando
 * fuera a gente que hoy entra sin problema.
 *
 *   npm run backfill:status          # muestra qué haría
 *   npm run backfill:status -- --apply
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserStatus } from '../modules/users/schemas/user.schema';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta MONGODB_URI');

  await mongoose.connect(uri);
  const users = mongoose.connection.db!.collection('users');

  const filter = { status: { $exists: false } };
  const pending = await users.countDocuments(filter);
  const total = await users.countDocuments();

  console.log(`Base: ${mongoose.connection.name}`);
  console.log(`Usuarios totales: ${total} · sin estado: ${pending}`);

  if (pending === 0) {
    console.log('Nada que hacer.');
  } else if (!apply) {
    console.log(
      `\nEn seco. Con --apply se marcarían ${pending} como "${UserStatus.ACTIVE}",\n` +
        'con acceso sin vencimiento y sin fecha de último ingreso.',
    );
  } else {
    const result = await users.updateMany(filter, {
      $set: {
        status: UserStatus.ACTIVE,
        accessExpiresAt: null,
        lastLoginAt: null,
        tokensValidAfter: null,
      },
    });
    console.log(`Actualizados: ${result.modifiedCount}`);
  }

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
