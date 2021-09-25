import {NestFactory} from '@nestjs/core';
import {Logger as NestPinoLogger} from 'nestjs-pino';
import {TopoAppBackendModule} from './app/app.module';
import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';
import {TopoAppBackendError, TopoBackendErrno} from '@proto/backend';

const errnoMap = new Map<number, string>(Object.keys(TopoBackendErrno).map(k => [TopoBackendErrno[k as unknown as number] as unknown as number, k]));

@Catch()
export class GenericErrorFilter implements ExceptionFilter {
  catch(exception: TopoAppBackendError, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    if (!errnoMap.has(exception.code)) {
      // if (exception.stack.indexOf('ValidationPipe') !== -1) {
      // exception = new ServiceInvalidParamsError(exception.message, (exception as any).response);
      // fallthrough
      // } else {
      response.status(500).json({message: `internal server error: ${exception.message}`});
      console.error(exception);
      return;
      // }
    }

    response.status(200).json({
      code: exception.code,
      name: errnoMap.get(exception.code),
      message: exception.message,
      params: exception.params,
    });
  }
}

async function main() {
  const application = await NestFactory.create(TopoAppBackendModule.forModuleConfig(), {
    cors: true,
    logger: false,
    abortOnError: false,
  });
  application.useLogger(application.get(NestPinoLogger));
  application.useGlobalFilters(new GenericErrorFilter());

  await application.listen(13308);
}

main().catch(console.error);
