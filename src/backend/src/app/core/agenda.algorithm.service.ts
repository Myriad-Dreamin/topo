import {TopoAlgorithmParams} from '@proto/backend.algorithm';
import {TopoNode} from '@proto/agenda';
import {generateTopoAgendaGreedyImpl} from './agenda-algorithm/greedy';
import {TopoAppBackendError} from '@proto/backend';
import {TopoAppConfigService} from './app.config.service';
import {Inject, Injectable} from '@nestjs/common';

const algorithms = new Map<string, (topo: TopoAlgorithmParams) => (TopoNode[])>();
algorithms.set('default', generateTopoAgendaGreedyImpl);
algorithms.set('greedy', generateTopoAgendaGreedyImpl);

@Injectable()
export class TopoAgendaAlgorithmService {
  constructor(@Inject(TopoAppConfigService) protected configService: TopoAppConfigService) {
  }

  applyAlgorithm(params: TopoAlgorithmParams, algorithmName?: string): TopoNode[] {
    const impl = algorithms.get((algorithmName || 'default').toString());
    if (!impl) {
      throw new TopoAppBackendError(3, `algorithm ${algorithmName} not found`);
    }
    return impl(params);
  }

  getUserRes(algorithmName?: string): TopoNode[] {
    return this.applyAlgorithm(
      this.configService.config2Params(
        this.configService.getUserTopoConfig()), algorithmName);
  }
}
