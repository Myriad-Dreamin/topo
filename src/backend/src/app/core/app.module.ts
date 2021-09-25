import {Module} from '@nestjs/common';
import {TopoAppConfigService} from './app.config.service';

@Module({
  providers: [
    TopoAppConfigService,
  ],
  exports: [
    TopoAppConfigService,
  ],
})
export class TopoAppBackendCoreModule {
}

