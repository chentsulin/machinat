import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@machinat/core/queue';
import TelegramWorker from '../worker';

nock.disableNetConnect();

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const botToken = '__BOT_TOKEN__';

let telegramApi: nock.Scope;
let queue: Queue<any, any>;
beforeEach(() => {
  telegramApi = nock(`https://api.telegram.org`, {
    reqheaders: { 'content-type': 'application/json' },
  });
  queue = new Queue();
});

it('makes calls to api', async () => {
  const client = new TelegramWorker(botToken, 10);

  const apiAssertions = [
    telegramApi
      .post(`/bot${botToken}/foo`, { n: 1 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 1 } }),
    telegramApi
      .post(`/bot${botToken}/bar`, { n: 2 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 2 } }),
    telegramApi
      .post(`/bot${botToken}/baz`, { n: 3 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 3 } }),
    telegramApi
      .post(`/bot${botToken}/foo`, { n: 4 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 4 } }),
    telegramApi
      .post(`/bot${botToken}/bar`, { n: 5 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 5 } }),
    telegramApi
      .post(`/bot${botToken}/baz`, { n: 6 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 6 } }),
  ];

  client.start(queue);

  const jobs = [
    { method: 'foo', parameters: { n: 1 }, executionKey: undefined },
    { method: 'bar', parameters: { n: 2 }, executionKey: undefined },
    { method: 'baz', parameters: { n: 3 }, executionKey: undefined },
    { method: 'foo', parameters: { n: 4 }, executionKey: undefined },
    { method: 'bar', parameters: { n: 5 }, executionKey: undefined },
    { method: 'baz', parameters: { n: 6 }, executionKey: undefined },
  ];

  const promise = queue.executeJobs(jobs);

  await delay(100);
  for (const scope of apiAssertions) {
    expect(scope.isDone()).toBe(true);
  }

  await expect(promise).resolves.toEqual({
    success: true,
    errors: null,
    batch: jobs.map((job, i) => ({
      success: true,
      job,
      result: { ok: true, result: { n: i + 1 } },
    })),
  });
});

it('sequently excute jobs within the same identical chat', async () => {
  const client = new TelegramWorker(botToken, 10);

  const bodySpy = moxy(() => true);
  const msgScope = telegramApi
    .post(new RegExp(`^/bot${botToken}/send(Photo|Message)$`), bodySpy)
    .delay(100)
    .times(9)
    .reply(200, (_, body) => ({ ok: true, result: body }));

  client.start(queue);

  const jobs = [
    { method: 'sendMessage', executionKey: 'foo', parameters: { n: 1 } },
    { method: 'sendPhoto', executionKey: 'foo', parameters: { n: 2 } },
    { method: 'sendMessage', executionKey: 'bar', parameters: { n: 3 } },
    { method: 'sendPhoto', executionKey: 'bar', parameters: { n: 4 } },
    { method: 'sendMessage', executionKey: 'baz', parameters: { n: 5 } },
    { method: 'sendPhoto', executionKey: 'baz', parameters: { n: 6 } },
    { method: 'sendMessage', executionKey: 'foo', parameters: { n: 7 } },
    { method: 'sendMessage', executionKey: 'bar', parameters: { n: 8 } },
    { method: 'sendMessage', executionKey: 'baz', parameters: { n: 9 } },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(3);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 5 });

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 4 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 6 });

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(9);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 7 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });
  expect(bodySpy.mock.calls[8].args[0]).toEqual({ n: 9 });

  expect(msgScope.isDone()).toBe(true);

  const result = await executePromise;
  expect(result.success).toBe(true);
  expect(result.errors).toBe(null);
  expect(result.batch).toEqual(
    jobs.map((job, i) => ({
      success: true,
      result: { ok: true, result: { n: i + 1 } },
      job,
    }))
  );
});

it('open requests up to maxConnections', async () => {
  const client = new TelegramWorker(botToken, 2);

  const bodySpy = moxy(() => true);
  const msgScope = telegramApi
    .post(new RegExp(`^/bot${botToken}/send(Photo|Message)$`), bodySpy)
    .delay(100)
    .times(9)
    .reply(200, (_, body) => ({ ok: true, result: body }));

  client.start(queue);

  const jobs = [
    { method: 'sendMessage', executionKey: 'foo', parameters: { n: 1 } },
    { method: 'sendPhoto', executionKey: 'foo', parameters: { n: 2 } },
    { method: 'sendMessage', executionKey: 'bar', parameters: { n: 3 } },
    { method: 'sendPhoto', executionKey: 'bar', parameters: { n: 4 } },
    { method: 'sendMessage', executionKey: 'baz', parameters: { n: 5 } },
    { method: 'sendPhoto', executionKey: 'baz', parameters: { n: 6 } },
    { method: 'sendMessage', executionKey: 'foo', parameters: { n: 7 } },
    { method: 'sendMessage', executionKey: 'bar', parameters: { n: 8 } },
    { method: 'sendMessage', executionKey: 'baz', parameters: { n: 9 } },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(2);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(4);
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 4 });

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 5 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 7 });

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(8);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 6 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });

  await delay(100);
  expect(bodySpy.mock).toHaveBeenCalledTimes(9);
  expect(bodySpy.mock.calls[8].args[0]).toEqual({ n: 9 });

  expect(msgScope.isDone()).toBe(true);
  const result = await executePromise;

  expect(result.success).toBe(true);
  expect(result.errors).toBe(null);
  expect(result.batch).toEqual(
    jobs.map((job, i) => ({
      success: true,
      result: { ok: true, result: { n: i + 1 } },
      job,
    }))
  );
});

it('throw if connection error happen', async () => {
  const client = new TelegramWorker(botToken, 10);

  const scope1 = telegramApi
    .post(`/bot${botToken}/sendMessage`)
    .reply(200, { ok: true, result: { n: 1 } });
  const scope2 = telegramApi
    .post(`/bot${botToken}/sendPhoto`)
    .replyWithError('something wrong like connection error');

  client.start(queue);

  const jobs = [
    { method: 'sendMessage', parameters: { text: 'hi' }, executionKey: 'foo' },
    { method: 'sendPhoto', parameters: { file_id: 123 }, executionKey: 'foo' },
    { method: 'sendMessage', parameters: { text: 'bye' }, executionKey: 'foo' },
  ];

  const result = await queue.executeJobs(jobs);
  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    Array [
      [FetchError: request to https://api.telegram.org/bot__BOT_TOKEN__/sendPhoto failed, reason: something wrong like connection error],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { ok: true, result: { n: 1 } },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new TelegramWorker(botToken, 10);

  const scope1 = telegramApi
    .post(`/bot${botToken}/sendMessage`)
    .reply(200, { ok: true, result: { n: 1 } });
  const scope2 = telegramApi.post(`/bot${botToken}/sendPhoto`).reply(400, {
    ok: false,
    description: 'error from api',
    error_code: 400,
  });

  const jobs = [
    { method: 'sendMessage', parameters: { text: 'hi' }, executionKey: 'foo' },
    { method: 'sendPhoto', parameters: { file_id: 123 }, executionKey: 'foo' },
    { method: 'sendMessage', parameters: { text: 'bye' }, executionKey: 'foo' },
  ];

  client.start(queue);
  const result = await queue.executeJobs(jobs);

  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    Array [
      [TelegramAPIError: (#400) error from api],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { ok: true, result: { n: 1 } },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});
