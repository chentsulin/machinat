import { EventEmitter } from 'events';
import moxy, { Mock } from '@moxyjs/moxy';
import type { WebSocketServer } from '../server';
import { WebSocketReceiver } from '../receiver';
import { WebSocketConnection } from '../channel';
import type { WebSocketBot } from '../bot';

const bot = moxy<WebSocketBot>({
  render: async () => ({ jobs: [], results: [], tasks: [] }),
} as never);

const server = moxy<WebSocketServer<any, unknown>>(new EventEmitter() as never);
server.id = '_SERVER_ID_';
server.handleUpgrade = (async () => {}) as never;

const popEventMock = new Mock();
const popEventWrapper = moxy((finalHandler) =>
  popEventMock.proxify(finalHandler)
);
const popError = moxy();

const user = { platform: 'test', uid: 'john_doe' };
const request = {
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
};

beforeEach(() => {
  server.removeAllListeners();
  popEventMock.reset();
  popEventWrapper.mock.reset();
  popError.mock.reset();
});

it('pop events', () => {
  (() => new WebSocketReceiver(bot, server, popEventWrapper, popError))();

  expect(popEventWrapper.mock).toHaveBeenCalledTimes(1);
  expect(popEventWrapper.mock).toHaveBeenCalledWith(expect.any(Function));

  const connectionInfo = {
    connId: '_CONN_ID_',
    user,
    request,
    authContext: { foo: 'bar' },
    expireAt: null,
  };

  server.emit('connect', connectionInfo);

  const connection = new WebSocketConnection(server.id, '_CONN_ID_');
  const expectedMetadata = {
    source: 'websocket',
    auth: { foo: 'bar' },
    request,
    connection,
  };

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(popEventMock).toHaveBeenCalledWith({
    platform: 'websocket',
    bot,
    event: {
      category: 'connection',
      type: 'connect',
      payload: null,
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  server.emit(
    'events',
    [{ category: 'greet', type: 'hello', payload: 'world' }, { type: 'hug' }],
    connectionInfo
  );

  expect(popEventMock).toHaveBeenCalledTimes(3);
  expect(popEventMock).toHaveBeenNthCalledWith(2, {
    platform: 'websocket',
    bot,
    event: {
      category: 'greet',
      type: 'hello',
      payload: 'world',
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });
  expect(popEventMock).toHaveBeenNthCalledWith(3, {
    platform: 'websocket',
    bot,
    event: {
      category: 'default',
      type: 'hug',
      payload: undefined,
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  server.emit('disconnect', { reason: 'bye' }, connectionInfo);
  expect(popEventMock).toHaveBeenCalledTimes(4);
  expect(popEventMock).toHaveBeenNthCalledWith(4, {
    platform: 'websocket',
    bot,
    event: {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'bye' },
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  expect(popError.mock).not.toHaveBeenCalled();
});

test('reply(message) sugar', async () => {
  (() => new WebSocketReceiver(bot, server, popEventWrapper, popError))();

  server.emit('connect', {
    connId: '_CONN_ID_',
    user,
    request,
    authContext: { foo: 'bar' },
    expireAt: null,
  });

  expect(popEventMock).toHaveBeenCalledTimes(1);
  const { reply, event } = popEventMock.calls[0].args[0];
  await expect(reply('hello world')).resolves.toMatchInlineSnapshot(`
          Object {
            "jobs": Array [],
            "results": Array [],
            "tasks": Array [],
          }
        `);

  expect(bot.render.mock).toHaveBeenCalledTimes(1);
  expect(bot.render.mock).toHaveBeenCalledWith(event.channel, 'hello world');
});

it('pop error', () => {
  (() => new WebSocketReceiver(bot, server, popEventWrapper, popError))();

  server.emit('error', new Error('BOO!'));

  expect(popError.mock).toHaveBeenCalledTimes(1);
  expect(popError.mock).toHaveBeenCalledWith(new Error('BOO!'));
});
