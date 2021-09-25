import {Module} from '@nestjs/common';
import {TopoAppConfigService} from './app.config.service';
import {TopoAgendaAlgorithmService} from './agenda.algorithm.service';

@Module({
  providers: [
    TopoAppConfigService,
    TopoAgendaAlgorithmService,
  ],
  exports: [
    TopoAppConfigService,
    TopoAgendaAlgorithmService,
  ],
})
export class TopoAppBackendCoreModule {
}

