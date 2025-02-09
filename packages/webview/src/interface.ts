import type Ws from 'ws';
import {
  makeInterface,
  makeClassProvider,
  ServiceProvider,
} from '@machinat/core/service';
import Marshaler from '@machinat/core/base/Marshaler';
import { AuthController } from '@machinat/auth';
import type {
  AnyServerAuthorizer,
  UserOfAuthorizer,
  ContextOfAuthorizer,
} from '@machinat/auth';
import { NextReceiver } from '@machinat/next';
import type { NextServer } from '@machinat/next';
import WebSocket, { WebSocketServer } from '@machinat/websocket';
import { useAuthLogin, verifyOrigin } from './utils';
import { DEFAULT_AUTH_PATH, DEFAULT_NEXT_PATH } from './constant';
import type { WebviewConfigs, WebviewPlatformUtilities } from './types';

export const ConfigsI = makeInterface<WebviewConfigs<AnyServerAuthorizer>>({
  name: 'WebviewConfigs',
});

export type ConfigsI = WebviewConfigs<AnyServerAuthorizer>;

// auth interfaces

export const AuthorizerListI = makeInterface<AnyServerAuthorizer>({
  name: 'WebviewAuthorizersList',
  multi: true,
});

export type AuthorizerListI = AnyServerAuthorizer[];

export class WebviewAuthController<
  Authorizer extends AnyServerAuthorizer
> extends AuthController<Authorizer> {}

export const AuthControllerP: ServiceProvider<
  AuthController<AnyServerAuthorizer>,
  [AuthorizerListI, ConfigsI]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [AuthorizerListI, ConfigsI] as const,
  factory: (
    authorizers,
    {
      authSecret,
      authApiPath = DEFAULT_AUTH_PATH,
      authRedirectUrl,
      webviewHost,
      webviewPath = DEFAULT_NEXT_PATH,
      ...otherOptions
    }
  ) => {
    if (authorizers.length === 0) {
      throw new Error('Webview.AuthorizersList is empty');
    }

    return new WebviewAuthController(authorizers, {
      ...otherOptions,
      secret: authSecret,
      apiPath: authApiPath,
      redirectUrl:
        authRedirectUrl || new URL(webviewPath, `https://${webviewHost}/`).href,
    });
  },
})(WebviewAuthController);

export type AuthControllerP<Authorizer extends AnyServerAuthorizer> =
  WebviewAuthController<Authorizer>;

// next interfaces

export const NextServerI = makeInterface<NextServer>({
  name: 'WebviewNextServer',
});

export type NextServerI = NextServer;

export class WebviewNextReceiver extends NextReceiver {}

export const NextReceiverP: ServiceProvider<
  NextReceiver,
  [NextServerI, ConfigsI]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [NextServerI, ConfigsI] as const,
  factory: (server, { noPrepareNext, webviewPath = DEFAULT_NEXT_PATH }) =>
    new WebviewNextReceiver(server, {
      entryPath: webviewPath,
      noPrepare: noPrepareNext,
    }),
})(WebviewNextReceiver);

export type NextReceiverP = WebviewNextReceiver;

// websocket interfaces

export const SocketServerIdI = makeInterface<string>({
  name: 'WebviewSocketServerId',
});

export const WsServerI = makeInterface<Ws.Server>({
  name: 'WebviewWsServer',
});

export type WsServerI = Ws.Server;

export const SocketBrokerI = makeInterface<WebSocket.Broker>({
  name: 'WebviewSocketBroker',
});

export type SocketBrokerI = WebSocket.Broker;

export class WebviewSocketServer<
  Authorizer extends AnyServerAuthorizer
> extends WebSocketServer<
  UserOfAuthorizer<Authorizer>,
  ContextOfAuthorizer<Authorizer>
> {}

export const SocketServerP: ServiceProvider<
  WebSocketServer<
    UserOfAuthorizer<AnyServerAuthorizer>,
    ContextOfAuthorizer<AnyServerAuthorizer>
  >,
  [
    null | string,
    WsServerI,
    SocketBrokerI,
    AuthController<AnyServerAuthorizer>,
    Marshaler,
    ConfigsI
  ]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    { require: SocketServerIdI, optional: true },
    WsServerI,
    SocketBrokerI,
    AuthControllerP,
    Marshaler,
    ConfigsI,
  ] as const,
  factory: (
    serverId,
    wsServer,
    broker,
    authController,
    marshaler,
    { webviewHost, heartbeatInterval }
  ) =>
    new WebviewSocketServer({
      id: serverId || undefined,
      wsServer,
      broker,
      marshaler,
      verifyUpgrade: ({ headers }) =>
        !!headers.origin && verifyOrigin(headers.origin, webviewHost),
      verifyLogin: useAuthLogin(authController),
      heartbeatInterval,
    }),
})(WebviewSocketServer);

export type SocketServerP<Authorizer extends AnyServerAuthorizer> =
  WebviewSocketServer<Authorizer>;

export const PlatformUtilitiesI = makeInterface<
  WebviewPlatformUtilities<AnyServerAuthorizer>
>({
  name: 'WebviewPlatformUtilities',
});
