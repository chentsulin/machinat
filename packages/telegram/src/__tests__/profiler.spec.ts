import { Readable } from 'stream';
import moxy from '@moxyjs/moxy';
import type { TelegramBot } from '../bot';
import {
  TelegramProfiler,
  TelegramUserProfile,
  TelegramChatProfile,
} from '../profiler';
import { TelegramChat, TelegramChatTarget } from '../channel';
import TelegramUser from '../user';

const bot = moxy<TelegramBot>({
  async makeApiCall() {
    throw new Error();
  },
  async fetchFile() {
    return {
      content: Readable.from('__BINARY_DATA__'),
      contentType: 'image/jpeg',
      contentLength: 6666,
    };
  },
} as never);

beforeEach(() => {
  bot.mock.reset();
});

describe('#getUserProfile(user)', () => {
  it('get profile with data attached on user', async () => {
    const profiler = new TelegramProfiler(bot);

    const profile = await profiler.getUserProfile(
      new TelegramUser(12345, {
        id: 12345,
        is_bot: false,
        first_name: 'Jane',
        last_name: 'Doe',
        username: 'janedoe',
      })
    );
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jane Doe');
    expect(profile.firstName).toBe('Jane');
    expect(profile.lastName).toBe('Doe');
    expect(profile.avatarUrl).toBe(undefined);
  });

  it('get profile with avatar', async () => {
    const profiler = new TelegramProfiler(bot);

    const user = new TelegramUser(12345, {
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    const profile = await profiler.getUserProfile(user, {
      avatarUrl: 'http://john.doe/avatar',
    });

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('John');
    expect(profile.firstName).toBe('John');
    expect(profile.lastName).toBe(undefined);
    expect(profile.avatarUrl).toBe('http://john.doe/avatar');
  });

  it('get profile from getChatMember API if no data attached with user', async () => {
    bot.makeApiCall.mock.fake(() => ({
      status: 'creator',
      user: { id: 12345, is_bot: false, first_name: 'Jojo' },
    }));

    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getUserProfile(new TelegramUser(12345));

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jojo');
    expect(profile.firstName).toBe('Jojo');
    expect(profile.lastName).toBe(undefined);
    expect(profile.avatarUrl).toBe(undefined);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChatMember', {
      chat_id: 12345,
      user_id: 12345,
    });
  });

  test('specify chat to call getChatMember', async () => {
    bot.makeApiCall.mock.fake(() => ({
      status: 'creator',
      user: { id: 12345, is_bot: false, first_name: 'Jojo' },
    }));

    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getUserProfile(new TelegramUser(12345), {
      inChat: new TelegramChat(54321, { type: 'group', id: 67890 }),
    });

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jojo');
    expect(profile.firstName).toBe('Jojo');
    expect(profile.lastName).toBe(undefined);
    expect(profile.avatarUrl).toBe(undefined);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChatMember', {
      user_id: 12345,
      chat_id: 67890,
    });
  });

  test('force to get data from API even available on user', async () => {
    bot.makeApiCall.mock.fake(() => ({
      status: 'creator',
      user: {
        id: 12345,
        is_bot: false,
        first_name: 'Jojo',
        username: 'jojodoe',
        last_name: 'Doe',
      },
    }));

    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getUserProfile(
      new TelegramUser(12345, { id: 12345, is_bot: false, first_name: 'Jojo' }),
      { fromApi: true }
    );

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jojo Doe');
    expect(profile.firstName).toBe('Jojo');
    expect(profile.lastName).toBe('Doe');
    expect(profile.username).toBe('jojodoe');
    expect(profile.avatarUrl).toBe(undefined);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChatMember', {
      chat_id: 12345,
      user_id: 12345,
    });
  });

  test('profile object is marshallable', async () => {
    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getUserProfile(
      new TelegramUser(12345, {
        id: 12345,
        is_bot: false,
        first_name: 'Jane',
        last_name: 'Doe',
        username: 'janedoe',
      }),
      { avatarUrl: 'http://jane.doe/avatar' }
    );

    expect(profile.typeName()).toBe('TelegramUserProfile');
    expect(profile.toJSONValue()).toMatchInlineSnapshot(`
      Object {
        "avatar": "http://jane.doe/avatar",
        "data": Object {
          "first_name": "Jane",
          "id": 12345,
          "is_bot": false,
          "last_name": "Doe",
          "username": "janedoe",
        },
      }
    `);
    expect(
      TelegramUserProfile.fromJSONValue(profile.toJSONValue())
    ).toStrictEqual(profile);
  });
});

describe('#getChatProfile(user)', () => {
  it('get profile with data attached on chat', async () => {
    const profiler = new TelegramProfiler(bot);

    const profile = await profiler.getChatProfile(
      new TelegramChat(12345, {
        id: 12345,
        type: 'private',
        first_name: 'Jane',
        last_name: 'Doe',
        username: 'janedoe',
      })
    );
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jane Doe');
    expect(profile.type).toBe('private');
    expect(profile.firstName).toBe('Jane');
    expect(profile.lastName).toBe('Doe');
    expect(profile.title).toBe(undefined);
    expect(profile.avatarUrl).toBe(undefined);
  });

  it('get profile with avatar', async () => {
    const profiler = new TelegramProfiler(bot);

    const chat = new TelegramChat(12345, {
      id: 12345,
      type: 'group',
      title: 'J Family',
    });

    const profile = await profiler.getChatProfile(chat, {
      avatarUrl: 'http://j.doe/avatar',
    });

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.type).toBe('group');
    expect(profile.name).toBe('J Family');
    expect(profile.title).toBe('J Family');
    expect(profile.firstName).toBe(undefined);
    expect(profile.lastName).toBe(undefined);
    expect(profile.avatarUrl).toBe('http://j.doe/avatar');
  });

  it('get profile from getChat API if no data attached with chat', async () => {
    bot.makeApiCall.mock.fake(() => ({
      id: 67890,
      type: 'private',
      first_name: 'Jojo',
    }));

    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getChatProfile(
      new TelegramChat(12345, { type: 'private', id: 67890 })
    );

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(67890);
    expect(profile.name).toBe('Jojo');
    expect(profile.firstName).toBe('Jojo');
    expect(profile.lastName).toBe(undefined);
    expect(profile.title).toBe(undefined);
    expect(profile.avatarUrl).toBe(undefined);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 67890,
    });

    await expect(profiler.getChatProfile(67890)).resolves.toStrictEqual(
      profile
    );
    await expect(
      profiler.getChatProfile(new TelegramChatTarget(12345, 67890))
    ).resolves.toStrictEqual(profile);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(3);

    bot.makeApiCall.mock.fake(() => ({
      id: 99999,
      type: 'channel',
      title: 'FOO',
    }));

    const profile2 = await profiler.getChatProfile('@foo_channel', {
      avatarUrl: 'http://foo.bar/baz.jpg',
    });
    expect(profile2.platform).toBe('telegram');
    expect(profile2.id).toBe(99999);
    expect(profile2.name).toBe('FOO');
    expect(profile2.title).toBe('FOO');
    expect(profile2.firstName).toBe(undefined);
    expect(profile2.lastName).toBe(undefined);
    expect(profile2.avatarUrl).toBe('http://foo.bar/baz.jpg');
  });

  test('force to get data from API even available on user', async () => {
    bot.makeApiCall.mock.fake(() => ({
      id: 67890,
      is_bot: false,
      first_name: 'Jojo',
      username: 'jojodoe',
      last_name: 'Doe',
    }));

    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getChatProfile(
      new TelegramChat(12345, {
        id: 67890,
        type: 'private',
        first_name: 'Jojo',
      }),
      { fromApi: true }
    );

    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(67890);
    expect(profile.name).toBe('Jojo Doe');
    expect(profile.firstName).toBe('Jojo');
    expect(profile.lastName).toBe('Doe');
    expect(profile.username).toBe('jojodoe');
    expect(profile.avatarUrl).toBe(undefined);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 67890,
    });
  });

  test('profile object is marshallable', async () => {
    const profiler = new TelegramProfiler(bot);
    const profile = await profiler.getChatProfile(
      new TelegramChat(12345, {
        id: 12345,
        type: 'private',
        first_name: 'Jane',
        last_name: 'Doe',
        username: 'janedoe',
      }),
      { avatarUrl: 'http://jane.doe/avatar' }
    );

    expect(profile.typeName()).toBe('TelegramChatProfile');
    expect(profile.toJSONValue()).toMatchInlineSnapshot(`
      Object {
        "avatar": "http://jane.doe/avatar",
        "data": Object {
          "first_name": "Jane",
          "id": 12345,
          "last_name": "Doe",
          "type": "private",
          "username": "janedoe",
        },
      }
    `);
    expect(
      TelegramChatProfile.fromJSONValue(profile.toJSONValue())
    ).toStrictEqual(profile);
  });
});

describe('#fetchUserPhoto(user)', () => {
  const getUserProfilePhotosResult = {
    total_count: 1,
    photos: [
      [
        {
          file_id: '_FILE_S_',
          file_unique_id: '_UNIQUE_ID_S_',
          file_size: 200000,
          width: 200,
          height: 200,
        },
        {
          file_id: '_FILE_M_',
          file_unique_id: '_UNIQUE_ID_M_',
          file_size: 400000,
          width: 400,
          height: 400,
        },
        {
          file_id: '_FILE_L_',
          file_unique_id: '_UNIQUE_ID_L_',
          file_size: 600000,
          width: 600,
          height: 600,
        },
      ],
    ],
  };

  it('fetch the smallest file of the forst photo by default', async () => {
    bot.makeApiCall.mock.fake(async () => getUserProfilePhotosResult);
    const profiler = new TelegramProfiler(bot);
    const user = new TelegramUser(12345, {
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    const { content, contentType, contentLength, width, height }: any =
      await profiler.fetchUserPhoto(user);

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getUserProfilePhotos', {
      user_id: 12345,
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(1);
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_FILE_S_');

    expect(content).toBeInstanceOf(Readable);
    expect(content.read(100)).toBe('__BINARY_DATA__');
    expect(contentType).toBe('image/jpeg');
    expect(contentLength).toBe(6666);
    expect(width).toBe(200);
    expect(height).toBe(200);
  });

  it('fetch with minWidth option', async () => {
    bot.makeApiCall.mock.fake(async () => getUserProfilePhotosResult);
    const profiler = new TelegramProfiler(bot);
    const user = new TelegramUser(12345, {
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    await expect(
      profiler.fetchUserPhoto(user, { minWidth: 180 })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 200,
      height: 200,
    });
    await expect(
      profiler.fetchUserPhoto(user, { minWidth: 380 })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 400,
      height: 400,
    });
    await expect(
      profiler.fetchUserPhoto(user, { minWidth: 580 })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 600,
      height: 600,
    });

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(3);
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(3);
    expect(bot.fetchFile.mock).toHaveBeenNthCalledWith(1, '_FILE_S_');
    expect(bot.fetchFile.mock).toHaveBeenNthCalledWith(2, '_FILE_M_');
    expect(bot.fetchFile.mock).toHaveBeenNthCalledWith(3, '_FILE_L_');
  });

  it('return null if user has no profile photo', async () => {
    const profiler = new TelegramProfiler(bot);
    const user = new TelegramUser(12345, {
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    bot.makeApiCall.mock.fakeReturnValue({
      total_count: 0,
      photos: [],
    });

    await expect(profiler.fetchUserPhoto(user)).resolves.toBe(null);
  });
});

describe('#fetchChatPhoto(user)', () => {
  const getChatResult = {
    id: 12345,
    type: 'group',
    title: 'FOO',
    photo: {
      small_file_id: '_SMALL_FILE_ID_',
      small_file_unique_id: '_SMALL_UNIQUE_FILE_ID_',
      big_file_id: '_BIG_FILE_ID_',
      big_file_unique_id: '_BIG_UNIQUE_FILE_ID_',
    },
  };

  it('fetch the file and return the stream and info', async () => {
    bot.makeApiCall.mock.fake(async () => getChatResult);

    const profiler = new TelegramProfiler(bot);

    const { content, contentType, contentLength, width, height }: any =
      await profiler.fetchChatPhoto(12345);

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 12345,
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(1);
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_BIG_FILE_ID_');

    expect(content).toBeInstanceOf(Readable);
    expect(content.read(100)).toBe('__BINARY_DATA__');
    expect(contentType).toBe('image/jpeg');
    expect(contentLength).toBe(6666);
    expect(width).toBe(640);
    expect(height).toBe(640);
  });

  test('fetch small size', async () => {
    bot.makeApiCall.mock.fake(async () => getChatResult);

    const profiler = new TelegramProfiler(bot);

    await expect(
      profiler.fetchChatPhoto(12345, { size: 'small' })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 160,
      height: 160,
    });

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 12345,
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(1);
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_SMALL_FILE_ID_');
  });

  it('fetch with chat object', async () => {
    bot.makeApiCall.mock.fake(async () => getChatResult);
    const profiler = new TelegramProfiler(bot);
    const expectedResponse = {
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 640,
      height: 640,
    };

    await expect(
      profiler.fetchChatPhoto(
        new TelegramChat(12345, { id: 67890, type: 'group' })
      )
    ).resolves.toEqual(expectedResponse);

    await expect(
      profiler.fetchChatPhoto(new TelegramChatTarget(12345, '@foo_channel'))
    ).resolves.toEqual(expectedResponse);

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(2);
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 67890,
    });
    expect(bot.makeApiCall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: '@foo_channel',
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(2);
  });

  it('return null if chat has no photo', async () => {
    const profiler = new TelegramProfiler(bot);

    bot.makeApiCall.mock.fakeReturnValue({
      ok: true,
      result: { id: 12345, type: 'group', title: 'FOO' },
    });

    await expect(profiler.fetchChatPhoto(12345)).resolves.toBe(null);
  });
});
