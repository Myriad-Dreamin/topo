import {Injectable} from '@angular/core';
import {TimeUnit} from '@proto/timeUnit';
import {TopoAlgorithmParams, TopoUserConfig} from '@proto/backend.algorithm';
import * as path from 'path';
import {homedir} from 'os';
import * as fs from 'fs';
import {TopoAppBackendError} from '@proto/backend';

const units = new Map<string, number>();
units.set('h', TimeUnit.Hour);
units.set('mi', TimeUnit.Minute);
units.set('s', TimeUnit.Second);
units.set('ms', TimeUnit.Millisecond);
units.set('d', TimeUnit.Day);

function convertDurationString(str: string | number): number {
  if (typeof str !== 'string') {
    return str;
  }

  const xxx = /([\d.]+)(\w+)/g;
  let ea: RegExpExecArray | null;
  let sumDuration = 0;
  while ((ea = xxx.exec(str))) {
    const b = Number.parseInt(ea[1]);
    const u = units.get(ea[2]) || 1;
    sumDuration += b * u;
  }
  return sumDuration;
}

function convertConfig(conf: TopoUserConfig): TopoAlgorithmParams {
  for (const block of conf.blocks) {
    if (typeof block.estimated === 'string') {
      block.estimated = convertDurationString(block.estimated);
    }
    for (const bullet of block.charger) {
      if (typeof bullet.estimated === 'string') {
        bullet.estimated = convertDurationString(bullet.estimated);
      }
      if (typeof bullet.maxTime === 'string') {
        bullet.maxTime = convertDurationString(bullet.maxTime);
      }
    }
  }
  for (const interval of conf.intervals) {
    if (typeof interval.estimated === 'string') {
      interval.estimated = convertDurationString(interval.estimated);
    }
    if (typeof interval.start === 'string') {
      interval.start = convertDurationString(interval.start);
    }
    if (typeof interval.end === 'string') {
      interval.end = convertDurationString(interval.end);
    }
  }

  if (conf.topology.workTime) {
    let wt = conf.topology.workTime;
    if (typeof wt === 'string') {
      wt = convertDurationString(conf.topology.workTime);
    }
    conf.topology.workTime = wt;
  } else {
    conf.topology.workTime = 18 * TimeUnit.Hour;
  }

  return conf as TopoAlgorithmParams;
}

const loader = require('js-yaml');

@Injectable()
export class TopoAppConfigService {
  config2Params!: typeof convertConfig;
  configPath: string;

  constructor() {
    this.configPath = path.resolve(homedir(), '.config/topo/config.yaml');
  }

  getUserConfig(): TopoUserConfig {
    const configPath = this.configPath;
    const hd = homedir();
    if (!configPath.startsWith(hd)) {
      throw new TopoAppBackendError(2, 'configPath is not under user home path');
    }

    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
      throw new TopoAppBackendError(1, 'config not exists');
    }

    return loader.load(fs.readFileSync(configPath, {encoding: 'utf-8'}));
  }
}

TopoAppConfigService.prototype.config2Params = convertConfig;
