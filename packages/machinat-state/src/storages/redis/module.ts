import redis, { RedisClient } from 'redis';
import { factory, container } from '@machinat/core/service';
import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';

import { ControllerP } from '../../controller';
import { RepositoryI } from '../../interface';
import { RedisRepositoryP } from './repository';
import { MODULE_CONFIGS_I, CLIENT_I } from './interface';
import type { RedisStateModuleConfigs } from './types';

/** @internal */
const createRedisClient = factory<RedisClient>({
  lifetime: 'singleton',
  deps: [MODULE_CONFIGS_I],
})(({ clientOptions }: RedisStateModuleConfigs) =>
  redis.createClient(clientOptions)
);

const RedisState = {
  Repository: RedisRepositoryP,
  CLIENT_I,
  CONFIGS_I: MODULE_CONFIGS_I,

  initModule: (configs: RedisStateModuleConfigs): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      RedisRepositoryP,
      { provide: RepositoryI, withProvider: RedisRepositoryP },

      { provide: CLIENT_I, withProvider: createRedisClient },
      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],

    startHook: container<Promise<void>>({ deps: [CLIENT_I] })(
      async (client: RedisClient) => {
        if (!client.connected) {
          await new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
          });
        }
      }
    ),
  }),
};

declare namespace RedisState {
  export type Repository = RedisRepositoryP;
}

export default RedisState;
