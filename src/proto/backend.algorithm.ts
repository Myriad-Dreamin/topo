import {AgendaPart, FullTimeBlock} from '@proto/agenda';

export type TopoDurationConfig = string | number;

export interface TopoUserConfig {
  intervals: (Omit<AgendaPart, 'estimated' | 'start' | 'end'> & {
    estimated: TopoDurationConfig;
    start: TopoDurationConfig;
    end: TopoDurationConfig;
  })[];
  blocks: (Omit<FullTimeBlock, 'estimated' | 'maxTime' | 'charger'> & {
    estimated: TopoDurationConfig;
    maxTime: TopoDurationConfig;
    charger: (Omit<FullTimeBlock['charger'][number], 'estimated' | 'maxTime'> & {
      estimated: TopoDurationConfig;
      maxTime: TopoDurationConfig;
    })[]
  })[];
  topology: {
    workTime: TopoDurationConfig;
    defaultIntervalId: number;
    bulletForbidden: {
      blockId: number;
      bulletName: string;
    }[];
    blockAffinity: {
      intervalId: number;
      blockId: number;
      bulletName?: string;
      weight?: number;
    }[];
  };
}

export interface TopoAlgorithmParams {
  intervals: AgendaPart[];
  blocks: FullTimeBlock[];
  topology: {
    workTime: number;
    defaultIntervalId: number;
    bulletForbidden: {
      blockId: number;
      bulletName: string;
    }[];
    blockAffinity: {
      intervalId: number;
      blockId: number;
      bulletName?: string;
      weight?: number;
    }[];
  },
}
