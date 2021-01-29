import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Auth from '../module';
import { ControllerP } from '../controller';

const secret = '_SECRET_';
const redirectUrl = '/webview';
const entryPath = '/auth';

it('export interfaces', () => {
  expect(Auth.Controller).toBe(ControllerP);
  expect(Auth.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "AuthModuleConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Auth.AUTHORIZERS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": true,
      "$$name": "AuthAuthorizersListI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  test('provisions', async () => {
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, entryPath, redirectUrl })],
      bindings: [{ provide: Auth.AUTHORIZERS_I, withValue: moxy() }],
    });
    await app.start();

    const [controller, configs, routings] = app.useServices([
      Auth.Controller,
      Auth.CONFIGS_I,
      Http.REQUEST_ROUTES_I,
    ]);

    expect(controller).toBeInstanceOf(ControllerP);
    expect(configs).toEqual({ secret, entryPath, redirectUrl });
    expect(routings).toMatchInlineSnapshot(`
      Array [
        Object {
          "handler": [Function],
          "name": "auth",
          "path": "/auth",
        },
      ]
    `);
  });

  test('provide authorizers to controller', async () => {
    const fooAuthorizer = moxy();
    const barAuthorizer = moxy();
    const ControllerSpy = moxy(ControllerP);
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, entryPath, redirectUrl })],
      bindings: [
        { provide: Auth.AUTHORIZERS_I, withValue: fooAuthorizer },
        { provide: Auth.AUTHORIZERS_I, withValue: barAuthorizer },
        {
          provide: Auth.Controller,
          withProvider: ControllerSpy,
        },
      ],
    });
    await app.start();

    expect(ControllerSpy.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(
      ControllerSpy.$$factory.mock
    ).toHaveBeenCalledWith(
      expect.arrayContaining([fooAuthorizer, barAuthorizer]),
      { secret, entryPath, redirectUrl }
    );
  });

  test('provide request handler calls to ServerController#delegateAuthRequest()', async () => {
    const fakeController = moxy({ delegateAuthRequest: async () => {} });
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, redirectUrl, entryPath })],
      bindings: [
        {
          provide: Auth.Controller,
          withValue: fakeController,
        },
      ],
    });
    await app.start();

    const [[{ handler }]] = app.useServices([Http.REQUEST_ROUTES_I]);

    const req = moxy();
    const res = moxy();
    handler(req, res, {
      originalPath: '/auth/foo',
      matchedPath: '/auth',
      trailingPath: 'foo',
    });

    expect(fakeController.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
    expect(fakeController.delegateAuthRequest.mock).toHaveBeenCalledWith(
      req,
      res,
      { originalPath: '/auth/foo', matchedPath: '/auth', trailingPath: 'foo' }
    );
  });
});
