import redis, { RedisClient } from 'redis';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';

import { ControllerP } from './controller';
import { MODULE_CONFIGS_I, CLIENT_I } from './interface';
import type { RedisStateModuleConfigs } from './types';

/** @internal */
const createRedisClient = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [MODULE_CONFIGS_I] as const,
})(({ clientOptions }) => redis.createClient(clientOptions));

const RedisState = {
  Controller: ControllerP,
  CLIENT_I,
  CONFIGS_I: MODULE_CONFIGS_I,

  initModule: (configs: RedisStateModuleConfigs): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      { provide: CLIENT_I, withProvider: createRedisClient },
      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],

    startHook: makeContainer({ deps: [CLIENT_I] })(
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
  export type Controller = ControllerP;
}

export default RedisState;
