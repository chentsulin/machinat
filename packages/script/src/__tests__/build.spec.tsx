import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import build from '../build';
import { MACHINAT_SCRIPT_TYPE } from '../constant';
import {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  EFFECT,
  LABEL,
  CALL,
  RETURN,
} from '../keyword';

const initVars = moxy(() => ({}));

test('built script object', () => {
  const ChildScript = build(
    {
      name: 'ChildScript',
      meta: { foo: 'baz' },
      initVars,
    },
    <>
      {() => <dolore />}
      <PROMPT set={(_, ctx) => ({ x: ctx.x })} key="childPrompt" />
    </>
  );

  const MyScript = build(
    {
      name: 'MyScript',
      meta: { foo: 'bar' },
      initVars,
    },
    <>
      <LABEL key="start" />
      {() => <b>Lorem</b>}

      <IF condition={() => false}>
        <THEN>
          <WHILE condition={() => true}>
            <LABEL key="first" />
            {() => <i>ipsum</i>}
            <PROMPT key="ask_1" set={(_, ctx) => ({ a: ctx.a })} />
          </WHILE>
        </THEN>
        <ELSE_IF condition={() => true}>
          <LABEL key="second" />
          {() => <dolor />}
          <PROMPT key="ask_2" set={(_, ctx) => ({ b: ctx.b })} />
          <RETURN value={() => 'fooo'} />
        </ELSE_IF>
        <ELSE>
          <LABEL key="third" />
          {() => 'sit amet,'}
          <CALL
            script={ChildScript}
            params={() => ({ foo: 'bar' })}
            goto="childPrompt"
            key="call_1"
          />
        </ELSE>
      </IF>

      <LABEL key="end" />
      <EFFECT set={() => ({ foo: 'bar' })} />
      {() => 'ad minim veniam'}
    </>
  );

  expect(MyScript.name).toBe('MyScript');
  expect(MyScript.$$typeof).toBe(MACHINAT_SCRIPT_TYPE);

  expect(MyScript.commands).toMatchSnapshot();
  expect(MyScript.initVars).toBe(initVars);
  expect(MyScript.stopPointIndex).toMatchInlineSnapshot(`
    Map {
      "start" => 0,
      "third" => 3,
      "call_1" => 4,
      "first" => 7,
      "ask_1" => 8,
      "second" => 11,
      "ask_2" => 12,
      "end" => 15,
    }
  `);
  expect(MyScript.meta).toEqual({ foo: 'bar' });

  expect(ChildScript.name).toBe('ChildScript');
  expect(ChildScript.$$typeof).toBe(MACHINAT_SCRIPT_TYPE);

  expect(ChildScript.commands).toMatchSnapshot();
  expect(ChildScript.initVars).toBe(initVars);
  expect(ChildScript.stopPointIndex).toMatchInlineSnapshot(`
    Map {
      "childPrompt" => 1,
    }
    `);
  expect(ChildScript.meta).toEqual({ foo: 'baz' });
});
