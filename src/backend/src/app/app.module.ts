import {TopoAppService} from './app.service';
import {DynamicModule, Module} from '@nestjs/common';
import {TopoAppController} from './app.controller';
import * as pino from 'pino';
import {Logger} from 'pino';
import {LoggerModule} from 'nestjs-pino';

@Module({})
export class TopoAppBackendModule {
  static forModuleConfig(): DynamicModule {
    return {
      module: TopoAppBackendModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            logger: pino().child({'context': 'HttpRequest'}) as Logger,
            customLogLevel: () => 'trace',
          }
        }),
      ],
      controllers: [
        TopoAppController,
      ],
      providers: [
        TopoAppService,
      ],
      exports: [
        TopoAppService,
      ],
    };
  }
}

