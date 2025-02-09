import createNextServer from 'next';
import type { MachinatPlatform } from '@machinat/core';
import {
  makeContainer,
  makeFactoryProvider,
  ServiceProvision,
} from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import { AnyServerAuthorizer } from '@machinat/auth';
import Http from '@machinat/http';
import type {
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
} from '@machinat/http';
import LocalOnlyBroker from '@machinat/websocket/broker/LocalOnlyBroker';
import { createWsServer } from '@machinat/websocket/utils';
import type {
  WebSocketJob,
  WebSocketResult,
  EventValue,
} from '@machinat/websocket';

import {
  WEBVIEW,
  DEFAULT_AUTH_PATH,
  DEFAULT_WEBSOCKET_PATH,
  DEFAULT_NEXT_PATH,
} from './constant';
import {
  SocketServerP,
  AuthControllerP,
  NextReceiverP,
  PlatformUtilitiesI,
  SocketServerIdI,
  ConfigsI,
  SocketBrokerI,
  WsServerI,
  AuthorizerListI,
  NextServerI,
} from './interface';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import {
  WebviewConnection,
  WebviewUserChannel,
  WebviewTopicChannel,
} from './channel';
import { NoneUser, NoneChannel } from './noneAuthorizer';
import type {
  WebviewEventContext,
  WebviewDispatchFrame,
  WebviewConfigs,
} from './types';

const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ nextServerOptions }) =>
  createNextServer((nextServerOptions || {}) as {})
);

const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

const webSocketRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [SocketServerP, ConfigsI] as const,
})(
  (server, { webSocketPath = DEFAULT_WEBSOCKET_PATH }): UpgradeRoute => ({
    name: 'websocket',
    path: webSocketPath,
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

const authRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [AuthControllerP, ConfigsI] as const,
})(
  (controller, { authApiPath = DEFAULT_AUTH_PATH }): RequestRoute => ({
    name: 'auth',
    path: authApiPath,
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

const nextRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [NextReceiverP, ConfigsI] as const,
})(
  (
    receiver,
    { webviewPath = DEFAULT_NEXT_PATH }
  ): RequestRoute | DefaultRequestRoute =>
    webviewPath === '/'
      ? {
          name: 'next',
          default: true,
          handler: receiver.handleRequestCallback(),
        }
      : {
          name: 'next',
          path: webviewPath,
          handler: receiver.handleRequestCallback(),
        }
);

/**
 * @category Root
 */
namespace Webview {
  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const Bot = BotP;
  export type Bot<Authorizer extends AnyServerAuthorizer> = BotP<Authorizer>;

  export const SocketServer = SocketServerP;
  export type SocketServer<Authorizer extends AnyServerAuthorizer> =
    SocketServerP<Authorizer>;

  export const Receiver = ReceiverP;
  export type Receiver<Authorizer extends AnyServerAuthorizer> =
    ReceiverP<Authorizer>;
  export const SocketBroker = SocketBrokerI;
  export type SocketBroker = SocketBrokerI;

  export const SocketServerId = SocketServerIdI;
  export type SocketServerId = string;

  export const WsServer = WsServerI;
  export type WsServer = WsServerI;

  export const AuthController = AuthControllerP;
  export type AuthController<Authorizer extends AnyServerAuthorizer> =
    AuthControllerP<Authorizer>;

  export const AuthorizerList = AuthorizerListI;
  export type AuthorizerList = AuthorizerListI;

  export const NextServer = NextServerI;
  export type NextServer = NextServerI;

  export const NextReceiver = NextReceiverP;
  export type NextReceiver = NextReceiverP;

  export const initModule = <
    Authorizer extends AnyServerAuthorizer,
    Value extends EventValue = EventValue
  >(
    configs: WebviewConfigs<Authorizer, Value>
  ): MachinatPlatform<
    WebviewEventContext<Authorizer, Value>,
    null,
    WebSocketJob,
    WebviewDispatchFrame,
    WebSocketResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: ConfigsI, withValue: configs },

      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: WEBVIEW,
      },

      SocketServerP,
      { provide: WsServerI, withProvider: wsServerFactory },
      { provide: SocketBrokerI, withProvider: LocalOnlyBroker },

      ReceiverP,
      {
        provide: Http.UpgradeRouteList,
        withProvider: webSocketRouteFactory,
      },

      { provide: BaseMarshaler.TypeList, withValue: WebviewConnection },
      { provide: BaseMarshaler.TypeList, withValue: WebviewUserChannel },
      { provide: BaseMarshaler.TypeList, withValue: WebviewTopicChannel },
      { provide: BaseMarshaler.TypeList, withValue: NoneUser },
      { provide: BaseMarshaler.TypeList, withValue: NoneChannel },

      AuthControllerP,
      { provide: Http.RequestRouteList, withProvider: authRouteFactory },
    ];

    if (!configs.noNextServer) {
      provisions.push(
        NextReceiverP,
        { provide: NextServerI, withProvider: nextServerFactory },
        {
          provide: Http.RequestRouteList,
          withProvider: nextRouteFactory,
        }
      );
    }

    return {
      name: WEBVIEW,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({ deps: [BotP, NextReceiverP] as const })(
        async (bot, nextReceiver) => {
          await Promise.all([bot.start(), nextReceiver.prepare()]);
        }
      ),
      stopHook: makeContainer({ deps: [BotP] as const })(async (bot) =>
        bot.stop()
      ),
    };
  };
}

export default Webview;
