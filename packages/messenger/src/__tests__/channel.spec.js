import MessengerUser from '../user';
import MessengerChat from '../channel';

test('from id', () => {
  const chat = new MessengerChat('_PAGE_ID_', { id: '_PSID_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('MessengerChat');
  expect(chat.uid).toMatchInlineSnapshot(`"messenger._PAGE_ID_.psid._PSID_"`);

  expect(chat.identifier).toBe('_PSID_');
  expect(chat.type).toBe('USER_TO_PAGE');
  expect(chat.targetType).toBe('psid');
  expect(chat.target).toEqual({ id: '_PSID_' });

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('group chat', () => {
  const chat = new MessengerChat('_PAGE_ID_', { id: '_PSID_' }, 'GROUP');

  expect(chat.uid).toMatchInlineSnapshot(`"messenger._PAGE_ID_.psid._PSID_"`);

  expect(chat.identifier).toBe('_PSID_');
  expect(chat.type).toBe('GROUP');
  expect(chat.targetType).toBe('psid');
  expect(chat.target).toEqual(null);

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('user to user chat', () => {
  const chat = new MessengerChat('_PAGE_ID_', { id: '_PSID_' }, 'USER_TO_USER');

  expect(chat.uid).toMatchInlineSnapshot(`"messenger._PAGE_ID_.psid._PSID_"`);

  expect(chat.identifier).toBe('_PSID_');
  expect(chat.type).toBe('USER_TO_USER');
  expect(chat.targetType).toBe('psid');
  expect(chat.target).toEqual(null);

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user_ref', () => {
  const chat = new MessengerChat('_PAGE_ID_', { user_ref: '_USER_REF_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('MessengerChat');
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.user_ref._USER_REF_"`
  );

  expect(chat.identifier).toBe('_USER_REF_');
  expect(chat.type).toBe('USER_TO_PAGE');
  expect(chat.targetType).toBe('user_ref');
  expect(chat.target).toEqual({ user_ref: '_USER_REF_' });

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from phone_number', () => {
  const chat = new MessengerChat('_PAGE_ID_', {
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('MessengerChat');
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.phone_number.nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );

  expect(chat.identifier).toBe('nRn5C+EX4/vdk02aEWYs2zV5sHM=');
  expect(chat.type).toBe('USER_TO_PAGE');
  expect(chat.targetType).toBe('phone_number');
  expect(chat.target).toEqual({
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from post_id', () => {
  const chat = new MessengerChat('_PAGE_ID_', { post_id: '_POST_ID_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('MessengerChat');
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.post_id._POST_ID_"`
  );

  expect(chat.identifier).toBe('_POST_ID_');
  expect(chat.type).toBe('USER_TO_PAGE');
  expect(chat.targetType).toBe('post_id');
  expect(chat.target).toEqual({ post_id: '_POST_ID_' });

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from comment_id', () => {
  const chat = new MessengerChat('_PAGE_ID_', {
    comment_id: '_COMMENT_ID_',
  });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('MessengerChat');
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.comment_id._COMMENT_ID_"`
  );

  expect(chat.identifier).toBe('_COMMENT_ID_');
  expect(chat.type).toBe('USER_TO_PAGE');
  expect(chat.targetType).toBe('comment_id');
  expect(chat.target).toEqual({ comment_id: '_COMMENT_ID_' });

  expect(chat.toJSONValue()).toMatchSnapshot();
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('MessengerChat.fromUser()', () => {
  const user = new MessengerUser('_PAGE_ID_', '_USER_ID_');

  expect(MessengerChat.fromUser(user)).toEqual(
    new MessengerChat('_PAGE_ID_', { id: '_USER_ID_' }, 'USER_TO_PAGE')
  );
});
