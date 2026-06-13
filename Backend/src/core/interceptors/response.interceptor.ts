import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { firstValueFrom, Observable, of } from 'rxjs';
import { LoggerService } from '../../common/services';
import { STATUS_MESSAGES } from '../../common/constants';
import { IResponse } from '../interfaces/response.interface';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<IResponse<unknown>>> {
    const body = await firstValueFrom(next.handle());
    const i18n = I18nContext.current(context);
    const status = body?.statusCode ?? HttpStatus.OK;
    const response = context.switchToHttp().getResponse();
    response.status(status);

    return of({
      message: this.translateMessage(body?.message ?? STATUS_MESSAGES[status], i18n),
      data: body?.data ?? null,
      error: null,
    });
  }

  private translateMessage(message: string, i18n: I18nContext): string {
    const [translationKey, argsString] = message.split('|');
    let args;

    try {
      args = argsString ? JSON.parse(argsString) : undefined;
    } catch (error) {
      this.logger.error(error);
      args = undefined;
    }

    return i18n.translate(translationKey, args);
  }
}
