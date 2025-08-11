import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HttpExceptionsFilter, ResponseInterceptor } from '../core/interceptors';
import { AuthModule } from '../modules/auth/auth.module';
import { AuthGuard, CustomThrottlerGuard } from '../core/guards';
import { UserModule } from '../modules/user/user.module';
import appConfig from '../config/app.config';
import databaseConfig from '../config/database.config';
import jwtConfig from '../config/jwt.config';
import { HealthService, LoggerService } from '../common/services';
import { validateEnvVariables } from '../common/utils';
import { TraceMiddleware } from '../core/middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validate: validateEnvVariables,
    }),
    I18nModule.forRootAsync({
      resolvers: [AcceptLanguageResolver],
      useFactory: () => ({
        fallbackLanguage: 'en',
        loaderOptions: { path: join(__dirname, '../i18n/'), watch: true },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1000,
          limit: 10,
        },
      ],
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    HealthService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    LoggerService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).exclude('/v1/health-check').forRoutes('*');
  }
}
