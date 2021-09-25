import {Controller, Get} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {homedir} from 'os';
import {TopoAppBackendError, TopoAppGenericData} from '@proto/backend';
import {TopoAlgorithmParams, TopoUserConfig} from '@proto/backend.algorithm';
import {TopoAppConfigService} from './core/app.config.service';

interface TodoAppPingResponse {
  version: string;
}

@Controller()
export class TopoAppController {
  constructor(protected configService: TopoAppConfigService) {
  }

  @Get('ping')
  ping(): TopoAppGenericData<TodoAppPingResponse> {
    return {
      code: 0,
      data: {
        version: '1.0.0',
      }
    }
  }

  @Get('v1/app/config')
  getConfig(): TopoAppGenericData<TopoUserConfig> {
    const configPath = path.resolve(homedir(), '.config/topo/config.yaml');
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
      throw new TopoAppBackendError(1, 'config not exists');
    }

    return {
      code: 0,
      data: this.configService.getUserConfig(),
    }
  }

  @Get('v1/app/params')
  getParams(): TopoAppGenericData<TopoAlgorithmParams> {
    const config = this.configService.getUserConfig();

    return {
      code: 0,
      data: this.configService.config2Params(config),
    }
  }

  @Get('v1/app/agenda')
  getAgenda(): TopoAppGenericData<TopoAlgorithmParams> {
    const config = this.configService.getUserConfig();

    return {
      code: 0,
      data: this.configService.config2Params(config),
    }
  }
}
