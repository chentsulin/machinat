import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../../constant';
import LineChannel from '../../channel';
import { Leave } from '../leave';

const render = element => element.type(element, () => null, '$');

it('is valid native unit component with entry getter', () => {
  expect(typeof Leave).toBe('function');

  expect(isNativeElement(<Leave />)).toBe(true);
  expect(Leave.$$platform).toBe('line');
});

it('render ok with entry getter', async () => {
  await expect(render(<Leave />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Leave />,
      value: {
        [CHANNEL_API_CALL_GETTER]: expect.any(Function),
        [BULK_API_CALL_GETTER]: expect.any(Function),
      },
      path: '$',
    },
  ]);
});

test('channel api call getter', async () => {
  const [{ value }] = await render(<Leave />);
  expect(
    value[CHANNEL_API_CALL_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      })
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/group/_GROUP_ID_/leave',
    body: null,
  });

  expect(
    value[CHANNEL_API_CALL_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: '_USER_ID_',
      })
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/room/_ROOM_ID_/leave',
    body: null,
  });
});

test('channel api call getter throw if type of channel is user', async () => {
  const [{ value }] = await render(<Leave />);

  expect(() =>
    value[CHANNEL_API_CALL_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'user',
        userId: '_USER_ID_',
      })
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"<Leave /> should cannot be used within an user channel"`
  );
});

test('bulk api call getter throw', async () => {
  const [{ value }] = await render(<Leave />);

  expect(() =>
    value[BULK_API_CALL_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'user',
        userId: '_USER_ID_',
      })
    )
  ).toThrowErrorMatchingInlineSnapshot(`"cannot <Leave/> using multicast api"`);
});
