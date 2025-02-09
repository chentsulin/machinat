import moxy, { Moxy } from '@moxyjs/moxy';
import redis, { RedisClient } from 'redis';
import { EventEmitter } from 'events';
import Machinat from '@machinat/core';
import StateControllerI from '@machinat/core/base/StateController';
import RedisState from '../module';
import { ControllerP as RedisStateController } from '../controller';

jest.mock('redis', () =>
  jest.requireActual('@moxyjs/moxy').default({
    createClient: () => ({ connected: true }),
  })
);

test('export interfaces', () => {
  expect(RedisState.Controller).toBe(RedisStateController);
  expect(RedisState.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "RedisStateConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(RedisState.Client).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "RedisClient",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

test('provisions', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });
  await app.start();

  const [controller, client, configs] = app.useServices([
    RedisStateController,
    RedisState.Client,
    RedisState.Configs,
  ]);

  expect(controller).toBeInstanceOf(RedisStateController);
  expect(client).toBe((redis as any).createClient.mock.calls[0].result);
  expect(configs).toEqual({
    clientOptions: { host: 'my.redis.com', port: 23456 },
  });

  expect((redis as any).createClient.mock).toHaveBeenCalledWith({
    host: 'my.redis.com',
    port: 23456,
  });
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });
  await app.start();

  const [controller] = app.useServices([StateControllerI]);
  expect(controller).toBeInstanceOf(RedisStateController);
});

test('startHook wait for client connected', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });

  const client = moxy<RedisClient>(new EventEmitter() as never);
  client.connected = false;

  (redis as Moxy<typeof redis>).createClient.mock.fakeReturnValue(client);
  const startPromise = app.start();

  expect(client.once.mock).toHaveBeenCalledTimes(2);
  expect(app.isStarted).toBe(false);

  client.emit('connect');
  client.emit('ready');

  await startPromise;
  expect(app.isStarted).toBe(true);
});

test('startHook throw if error happen when connect', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });

  const client = moxy<RedisClient>(new EventEmitter() as never);
  client.connected = false;

  (redis as Moxy<typeof redis>).createClient.mock.fakeReturnValue(client);
  const startPromise = app.start();
  expect(app.isStarted).toBe(false);

  client.emit('error', new Error('connect fail'));

  await expect(startPromise).rejects.toThrow('connect fail');
});

test('stopHook quit client', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });

  const client = moxy({ connected: true, quit: () => {} });
  (redis as Moxy<typeof redis>).createClient.mock.fakeReturnValue(client);

  await app.start();
  expect(client.quit.mock).not.toHaveBeenCalled();

  await app.stop();
  expect(client.quit.mock).toHaveBeenCalledTimes(1);
});
