/**
 * Convierte a inversionista a quien tuviera el rol «asesor».
 *
 * Ese rol existía en el esquema pero no abría ninguna puerta: no había una
 * sola comprobación que lo distinguiera de un inversionista. Era una
 * etiqueta que aparentaba ser un permiso, así que se elimina.
 *
 * Hace falta migrar porque Mongo guarda lo que se escribió: los documentos
 * con 'advisor' seguirían ahí, fuera del enum, y la interfaz no sabría cómo
 * llamarlos.
 *
 *   npm run migrate:roles              # muestra qué haría
 *   npm run migrate:roles -- --apply
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserRole } from '../modules/users/schemas/user.schema';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta MONGODB_URI');

  await mongoose.connect(uri);
  const users = mongoose.connection.db!.collection('users');
  const filter = { role: 'advisor' };
  const affected = await users.countDocuments(filter);

  console.log(`Base: ${mongoose.connection.name}`);
  console.log(`Cuentas con rol «asesor»: ${affected}`);

  if (affected === 0) {
    console.log('Nada que hacer.');
  } else if (!apply) {
    const sample = await users
      .find(filter)
      .project({ email: 1 })
      .limit(10)
      .toArray();
    sample.forEach((row) => console.log(`  ${String(row.email)}`));
    console.log(`\nEn seco. Con --apply pasan a «${UserRole.INVESTOR}».`);
  } else {
    const result = await users.updateMany(filter, {
      $set: { role: UserRole.INVESTOR },
    });
    console.log(`Convertidas: ${result.modifiedCount}`);
  }

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
