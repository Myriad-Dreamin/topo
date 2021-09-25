import {Injectable} from '@angular/core';
import {TopoAlgorithmParams} from '@proto/backend.algorithm';
import {AgendaPart} from '@proto/agenda';
import {generateTopoAgendaGreedyImpl} from './agenda-algorithm/greedy';
import {TopoAppBackendError} from '@proto/backend';

const algorithms = new Map<string, (topo: TopoAlgorithmParams) => (AgendaPart[])>();
algorithms.set('default', generateTopoAgendaGreedyImpl);
algorithms.set('greedy', generateTopoAgendaGreedyImpl);

@Injectable()
export class TopoAgendaAlgorithmService {
  constructor() {
  }

  applyAlgorithm(params: TopoAlgorithmParams, algorithmName?: string): AgendaPart[] {
    const impl = algorithms.get((algorithmName || 'default').toString());
    if (!impl) {
      throw new TopoAppBackendError(3, `algorithm ${algorithmName} not found`);
    }
    return impl(params);
  }
}
