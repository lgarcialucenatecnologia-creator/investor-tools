import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  /**
   * Sin esto, `req.ip` es la IP del proxy y el límite de intentos queda
   * compartido por todos los usuarios: cinco fallos de cualquiera bloquean
   * el login de los demás, y un atacante con IPs rotativas nunca lo activa.
   * Se declara el número exacto de saltos en vez de `true`, porque `true`
   * confía en la cabecera completa y esa sí la puede falsificar el cliente.
   */
  app.set('trust proxy', config.getOrThrow<number>('trustProxyHops'));

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.getOrThrow<string>('frontendUrl'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.getOrThrow<number>('port'));
}

void bootstrap();
