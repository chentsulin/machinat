import redis from 'redis';
import type { ServiceModule } from '@machinat/core';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import StateControllerI from '@machinat/core/base/StateController';

import { ControllerP } from './controller';
import { ConfigsI, ClientI } from './interface';

const createRedisClient = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [ConfigsI] as const,
})(({ clientOptions }) => redis.createClient(clientOptions));

/**
 * @category Root
 */
namespace RedisState {
  export const Controller = ControllerP;
  export type Controller = ControllerP;

  export const Client = ClientI;
  export type Client = ClientI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },

      { provide: ClientI, withProvider: createRedisClient },
      { provide: ConfigsI, withValue: configs },
    ],

    startHook: makeContainer({ deps: [ClientI] })(async (client: ClientI) => {
      if (!client.connected) {
        await new Promise((resolve, reject) => {
          client.once('ready', resolve);
          client.once('error', reject);
        });
      }
    }),
    stopHook: makeContainer({ deps: [ClientI] })(async (client: ClientI) => {
      client.quit();
    }),
  });
}

export default RedisState;
