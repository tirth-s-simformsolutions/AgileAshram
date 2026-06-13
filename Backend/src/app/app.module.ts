import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import { HealthService, LoggerService } from '../common/services';
import { validateEnvVariables } from '../common/utils';
import aiConfig from '../config/ai.config';
import appConfig from '../config/app.config';
import cloudflareConfig from '../config/cloudflare.config';
import databaseConfig from '../config/database.config';
import jwtConfig from '../config/jwt.config';
import setuConfig from '../config/setu.config';
import { AuthGuard, CustomThrottlerGuard, RolesGuard } from '../core/guards';
import { HttpExceptionsFilter, ResponseInterceptor } from '../core/interceptors';
import { TraceMiddleware } from '../core/middleware';
import { AiModule } from '../modules/ai/ai.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ComplaintModule } from '../modules/complaint/complaint.module';
import { CounterModule } from '../modules/counter/counter.module';
import { DepartmentModule } from '../modules/department/department.module';
import { UploadModule } from '../modules/upload/upload.module';
import { UserModule } from '../modules/user/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, aiConfig, cloudflareConfig, setuConfig],
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: configService => ({
        uri: configService.get('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    AiModule,
    AuthModule,
    ComplaintModule,
    CounterModule,
    DepartmentModule,
    UserModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    HealthService,
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    LoggerService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).exclude('/v1/health-check').forRoutes('*');
  }
}
