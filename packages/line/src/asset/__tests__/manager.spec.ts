import moxy from '@moxyjs/moxy';
import type StateControllerI from '@machinat/core/base/StateController';
import type { LineBot } from '../../bot';
import { LineAssetsManager } from '../manager';

const state = moxy({
  get: async () => null,
  set: async () => true,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const stateController = moxy<StateControllerI>({
  globalState() {
    return state;
  },
} as never);

const bot = moxy<LineBot>({
  channelId: '_LINE_CHANNEL_ID_',
  makeApiCall: () => ({}),
} as never);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getLiffApp('my_liff_app')).resolves.toBe(undefined);
  await expect(manager.getRichMenu('my_rich_menu')).resolves.toBe(undefined);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.get.mock).toHaveBeenCalledTimes(3);
  expect(state.get.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(2, 'my_liff_app');
  expect(state.get.mock).toHaveBeenNthCalledWith(3, 'my_rich_menu');

  state.get.mock.fakeReturnValue('baz');
  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_LIFF_ID_');
  await expect(manager.getLiffApp('my_liff_app')).resolves.toBe('_LIFF_ID_');

  state.get.mock.fakeReturnValue('_RICH_MENU_ID_');
  await expect(manager.getRichMenu('my_rich_menu')).resolves.toBe(
    '_RICH_MENU_ID_'
  );

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.get.mock).toHaveBeenCalledTimes(6);
});

test('set asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await manager.saveAssetId('foo', 'bar', 'baz');
  await manager.saveLiffApp('my_liff_app', '_LIFF_APP_ID_');
  await manager.saveRichMenu('my_rich_menu', '_RICH_MENU_ID_');

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.update.mock).toHaveBeenCalledTimes(3);
  state.update.mock.calls.forEach(({ args: [key, updator] }, i) => {
    if (i === 0) {
      expect(key).toBe('bar');
      expect(updator(null)).toBe('baz');
      expect(() =>
        updator('_EXISTED_BAR_RESOURCE_ID_')
      ).toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] already exist"`);
    } else if (i === 1) {
      expect(key).toBe('my_liff_app');
      expect(updator(null)).toBe('_LIFF_APP_ID_');
      expect(() =>
        updator('_EXISTED_LIFF_APP_ID_')
      ).toThrowErrorMatchingInlineSnapshot(
        `"liff [ my_liff_app ] already exist"`
      );
    } else if (i === 2) {
      expect(key).toBe('my_rich_menu');
      expect(updator(null)).toBe('_RICH_MENU_ID_');
      expect(() =>
        updator('_EXISTED_RICH_MENU_ID_')
      ).toThrowErrorMatchingInlineSnapshot(
        `"rich_menu [ my_rich_menu ] already exist"`
      );
    }
  });
});

test('get all assets', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.getAllAssets('foo')).resolves.toBe(null);
  await expect(manager.getAllLiffApps()).resolves.toBe(null);
  await expect(manager.getAllRichMenus()).resolves.toBe(null);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.getAll.mock).toHaveBeenCalledTimes(3);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(manager.getAllLiffApps()).resolves.toEqual(resources);
  await expect(manager.getAllRichMenus()).resolves.toEqual(resources);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.getAll.mock).toHaveBeenCalledTimes(6);
});

test('unsave asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await manager.unsaveAssetId('foo', 'bar');
  await manager.unsaveLiffApp('my_liff_app');
  await manager.unsaveRichMenu('my_rich_menu');

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.delete.mock).toHaveBeenCalledTimes(3);
  expect(state.delete.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(2, 'my_liff_app');
  expect(state.delete.mock).toHaveBeenNthCalledWith(3, 'my_rich_menu');

  state.delete.mock.fakeReturnValue(false);
  await expect(
    manager.unsaveAssetId('foo', 'bar')
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] not exist"`);
  await expect(
    manager.unsaveLiffApp('my_liff_app')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"liff [ my_liff_app ] not exist"`
  );
  await expect(
    manager.unsaveRichMenu('my_rich_menu')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich_menu [ my_rich_menu ] not exist"`
  );
});

test('#createRichMenu()', async () => {
  const manager = new LineAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(async () => ({
    richMenuId: '_RICH_MENU_ID_',
  }));

  const richMenuBody = {
    size: { width: 2500, height: 1686 },
    selected: false,
    name: 'Nice richmenu',
    chatBarText: 'Tap here',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 2500, height: 1686 },
        action: { type: 'postback', data: 'action=buy&itemid=123' },
      },
    ],
  };

  await expect(
    manager.createRichMenu('my_rich_menu', richMenuBody)
  ).resolves.toBe('_RICH_MENU_ID_');

  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
    'POST',
    'v2/bot/richmenu',
    richMenuBody
  );

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ID_');
  await expect(
    manager.createRichMenu('my_rich_menu', richMenuBody)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich menu [ my_rich_menu ] already exist"`
  );
});

test('#deleteRichMenu()', async () => {
  const manager = new LineAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(async () => ({}));

  await expect(
    manager.deleteRichMenu('my_rich_menu')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich menu [ my_rich_menu ] not exist"`
  );

  state.get.mock.fakeReturnValue('_RICH_MENU_ID_');
  await expect(manager.deleteRichMenu('my_rich_menu')).resolves.toBe(
    '_RICH_MENU_ID_'
  );

  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
    'DELETE',
    'v2/bot/richmenu/_RICH_MENU_ID_',
    null
  );
});
