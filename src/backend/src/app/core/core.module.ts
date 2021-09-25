import {Module} from '@nestjs/common';
import {TopoAppConfigService} from './app.config.service';
import {TopoAgendaAlgorithmService} from './agenda.algorithm.service';
import {TopoReporterService} from './reporter.service';

@Module({
  providers: [
    TopoAppConfigService,
    TopoAgendaAlgorithmService,
    TopoReporterService,
  ],
  exports: [
    TopoAppConfigService,
    TopoAgendaAlgorithmService,
    TopoReporterService,
  ],
})
export class TopoAppBackendCoreModule {
}

