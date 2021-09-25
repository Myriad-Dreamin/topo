import {Controller, Get} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {homedir} from 'os';
import {TopoAppBackendError, TopoAppGenericData} from '@proto/backend';

const loader = require('js-yaml');

interface TodoAppPingResponse {
  version: string;
}

interface TodoConfig {

}

@Controller()
export class TopoAppController {

  @Get('ping')
  ping(): TopoAppGenericData<TodoAppPingResponse> {
    return {
      code: 0,
      data: {
        version: '1.0.0',
      }
    }
  }

  @Get('v1/app/full')
  getConfig(): TopoAppGenericData<TodoConfig> {
    const configPath = path.resolve(homedir(), '.config/topo/config.yaml');
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
      throw new TopoAppBackendError(1, 'config not exists');
    }

    return {
      code: 0,
      data: loader.load(fs.readFileSync(configPath, {encoding: 'utf-8'})),
    }
  }
}
