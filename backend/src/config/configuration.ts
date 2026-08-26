function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

export const configuration = () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  mongodb: {
    uri: required('MONGODB_URI'),
  },
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
});
