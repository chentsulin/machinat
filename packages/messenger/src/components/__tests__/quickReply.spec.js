import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { QuickReply, PhoneQuickReply, EmailQuickReply } from '../quickReply';

const render = async (node) => {
  let rendered;
  const renderer = new Renderer('messenger', (_, __, renderInner) => {
    rendered = renderInner(node);
    return null;
  });

  await renderer.render(<container />);
  return rendered;
};

it.each([QuickReply, PhoneQuickReply, EmailQuickReply])(
  '%p is valid Component',
  (Reply) => {
    expect(typeof Reply).toBe('function');
    expect(isNativeType(<Reply />)).toBe(true);
    expect(Reply.$$platform).toBe('messenger');
  }
);

test('QuickReply match snpshot', async () => {
  expect(render(<QuickReply title="i want a pie" payload="🥧" />)).resolves
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <QuickReply
          payload="🥧"
          title="i want a pie"
        />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "text",
          "image_url": undefined,
          "payload": "🥧",
          "title": "i want a pie",
        },
      },
    ]
  `);
  expect(
    render(
      <QuickReply
        title="a piece of cake"
        payload="🍰"
        imageUrl="http://cake.it"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <QuickReply
          imageUrl="http://cake.it"
          payload="🍰"
          title="a piece of cake"
        />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "text",
          "image_url": "http://cake.it",
          "payload": "🍰",
          "title": "a piece of cake",
        },
      },
    ]
  `);
});

test('PhoneQuickReply match snpshot', async () => {
  expect(render(<PhoneQuickReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <PhoneQuickReply />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "user_phone_number",
        },
      },
    ]
  `);
});

test('EmailQuickReply match snpshot', async () => {
  expect(render(<EmailQuickReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <EmailQuickReply />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "user_email",
        },
      },
    ]
  `);
});
