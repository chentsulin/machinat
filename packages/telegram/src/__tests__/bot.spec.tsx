/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Readable } from 'stream';
import moxy, { Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Machinat from '@machinat/core';
import Queue from '@machinat/core/queue';
import _Engine from '@machinat/core/engine';
import _Renderer from '@machinat/core/renderer';
import _Worker from '../worker';
import TelegramApiError from '../error';
import { TelegramBot } from '../bot';
import {
  Photo,
  Expression,
  ForceReply,
  EditText,
  EditMedia,
} from '../components';

const Engine = _Engine as Moxy<typeof _Engine>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Worker = _Worker as Moxy<typeof _Worker>;

nock.disableNetConnect();

jest.mock('@machinat/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/engine'))
);

jest.mock('@machinat/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/renderer'))
);

jest.mock('../worker', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../worker'), {
    mockNewInstance: false,
  })
);

const scope = moxy();
const initScope = moxy(() => scope);
const dispatchWrapper = moxy((x) => x);

const token = '12345:_BOT_TOKEN_';

const message = (
  <Expression replyMarkup={<ForceReply />}>
    Hello <b>World!</b>
    <Photo url="https://machinat.com/greeting.png" />
  </Expression>
);

let telegramApi;
const bodySpy = moxy(() => true);

beforeEach(() => {
  telegramApi = nock('https://api.telegram.org');
  bodySpy.mock.clear();
  Engine.mock.clear();
  Renderer.mock.clear();
  Worker.mock.clear();
});

afterEach(() => {
  nock.cleanAll();
});

describe('#constructor(options)', () => {
  it('throw if botToken not given', () => {
    expect(
      () => new TelegramBot({ initScope, dispatchWrapper } as never)
    ).toThrowErrorMatchingInlineSnapshot(`"options.token should not be empty"`);
  });

  it('assemble core modules', () => {
    const bot = new TelegramBot({
      initScope,
      dispatchWrapper,
      token,
      maxConnections: 999,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith(
      'telegram',
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'telegram',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );

    expect(Worker.mock).toHaveBeenCalledTimes(1);
    expect(Worker.mock).toHaveBeenCalledWith('12345:_BOT_TOKEN_', 999);
  });

  test('default maxConnections', () => {
    expect(
      new TelegramBot({
        initScope,
        dispatchWrapper,
        token,
        maxConnections: 999,
      })
    );

    expect(Worker.mock).toHaveBeenCalledTimes(1);
    expect(Worker.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "12345:_BOT_TOKEN_",
        999,
      ]
    `);
  });
});

test('#start() and #stop() start/stop engine', () => {
  const bot = new TelegramBot({ initScope, dispatchWrapper, token });

  type MockEngine = Moxy<TelegramBot['engine']>;

  bot.start();
  expect((bot.engine as MockEngine).start.mock).toHaveBeenCalledTimes(1);

  bot.stop();
  expect((bot.engine as MockEngine).stop.mock).toHaveBeenCalledTimes(1);
});

describe('#render(channel, message, options)', () => {
  const bot = new TelegramBot({ initScope, dispatchWrapper, token });

  beforeAll(() => {
    bot.start();
  });

  afterAll(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(bot.render('john', empty)).resolves.toBe(null);
    }
  });

  it('send rendered messages to telegram api', async () => {
    const apiCall1 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/sendMessage', bodySpy)
      .reply(200, { ok: true, result: { id: 1 } });
    const apiCall2 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/sendPhoto', bodySpy)
      .reply(200, { ok: true, result: { id: 2 } });

    const response = await bot.render(123456, message);
    expect(response).toMatchSnapshot();

    expect(response!.results).toEqual([
      { ok: true, result: { id: 1 } },
      { ok: true, result: { id: 2 } },
    ]);

    expect(bodySpy.mock).toHaveBeenCalledTimes(2);
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "chat_id": 123456,
        "parse_mode": "HTML",
        "text": "Hello <b>World!</b>",
      }
    `);
    expect(bodySpy.mock.calls[1].args[0]).toMatchInlineSnapshot(`
      Object {
        "chat_id": 123456,
        "parse_mode": "HTML",
        "photo": "https://machinat.com/greeting.png",
        "reply_markup": Object {
          "force_reply": true,
        },
      }
    `);

    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });
});

describe('#renderInstance(message)', () => {
  const bot = new TelegramBot({ initScope, dispatchWrapper, token });

  beforeAll(() => {
    bot.start();
  });

  afterAll(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.renderInstance(empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('call edit api', async () => {
    const apiCall1 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/editMessageText', bodySpy)
      .reply(200, { ok: true, result: { id: '1' } });
    const apiCall2 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/editMessageMedia', bodySpy)
      .reply(200, { ok: true, result: { id: '2' } });

    const response = await bot.renderInstance(
      <>
        <EditText inlineMessageId="1">
          foo <b>bar</b>
        </EditText>
        <EditMedia inlineMessageId="2">
          <Photo url="https://machinat.com/trollface.png" />
        </EditMedia>
      </>
    );
    expect(response!).toMatchSnapshot();
    expect(response!.results).toEqual([
      { ok: true, result: { id: '1' } },
      { ok: true, result: { id: '2' } },
    ]);

    expect(bodySpy.mock).toHaveBeenCalledTimes(2);
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "inline_message_id": "1",
        "parse_mode": "HTML",
        "text": "foo <b>bar</b>",
      }
    `);
    expect(bodySpy.mock.calls[1].args[0]).toMatchInlineSnapshot(`
      Object {
        "inline_message_id": "2",
        "media": Object {
          "media": "https://machinat.com/trollface.png",
          "parse_mode": "HTML",
          "type": "photo",
        },
      }
    `);

    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });
});

describe('#makeApiCall()', () => {
  test('call telegram bot api', async () => {
    const bot = new TelegramBot({ initScope, dispatchWrapper, token });
    bot.start();

    const fooCall = telegramApi
      .post('/bot12345:_BOT_TOKEN_/foo', bodySpy)
      .reply(200, {
        ok: true,
        result: { foo: 'bar' },
      });

    await expect(bot.makeApiCall('foo', { bar: 'baz' })).resolves.toEqual({
      foo: 'bar',
    });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    expect(bodySpy.mock).toHaveBeenCalledWith({ bar: 'baz' });

    expect(fooCall.isDone()).toBe(true);
  });

  it('throw TelegramAPIError when fail', async () => {
    const bot = new TelegramBot({ initScope, dispatchWrapper, token });
    bot.start();

    const failBody = {
      ok: false,
      error: 'bad',
      error_description: 'really bad',
    };

    const fooCall = telegramApi
      .post('/bot12345:_BOT_TOKEN_/foo', bodySpy)
      .reply(200, failBody);

    try {
      await bot.makeApiCall('foo', { bar: 'baz' });
      expect('should not get here').toBeFalsy();
    } catch (error) {
      expect(error).toBeInstanceOf(TelegramApiError);
      expect(error.body).toEqual(failBody);
    }

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    expect(bodySpy.mock).toHaveBeenCalledWith({ bar: 'baz' });

    expect(fooCall.isDone()).toBe(true);
  });
});

test('#fetchFile()', async () => {
  const bot = new TelegramBot({ initScope, dispatchWrapper, token });
  bot.start();

  const fileId = '_FILE_ID_';

  const getFileCall = telegramApi
    .post('/bot12345:_BOT_TOKEN_/getFile', bodySpy)
    .reply(200, {
      ok: true,
      result: {
        file_id: fileId,
        file_unique_id: '_FILE_UNIQUE_ID_',
        file_path: '_FILE_PATH_',
      },
    });

  const downloadFileCall = telegramApi
    .get('/file/bot12345:_BOT_TOKEN_/_FILE_PATH_', bodySpy)
    .reply(200, '__BINARY_DATA__', {
      'Content-Type': 'image/png',
      'Content-Length': 777,
    });

  const response = await bot.fetchFile(fileId);

  expect(bodySpy.mock).toHaveBeenCalledTimes(2);
  expect(bodySpy.mock).toHaveBeenNthCalledWith(1, { file_id: fileId });

  expect(response!.content).toBeInstanceOf(Readable);
  expect(response!.contentType).toBe('image/png');
  expect(response!.contentLength).toBe(777);

  await new Promise(setImmediate);
  expect(response!.content.read().toString()).toBe('__BINARY_DATA__');

  expect(getFileCall.isDone()).toBe(true);
  expect(downloadFileCall.isDone()).toBe(true);
});
