import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { FilterModule } from './modules/filter/filter.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('mongodb.uri'),
      }),
    }),
    /**
     * El contador va por IP real. Con `trust proxy` configurado en main.ts,
     * `req.ips` trae la cadena de X-Forwarded-For y el primer elemento es el
     * cliente; sin proxy delante, `req.ips` viene vacío y se usa `req.ip`.
     */
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [{ ttl: 60_000, limit: 60 }],
        getTracker: (req: { ips?: string[]; ip?: string }) =>
          Promise.resolve(req.ips?.[0] ?? req.ip ?? 'desconocido'),
      }),
    }),
    UsersModule,
    AuthModule,
    FilterModule,
  ],
  providers: [
    // Todas las rutas exigen JWT salvo las marcadas con @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Va después: necesita el usuario que JwtAuthGuard adjunta a la petición.
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
