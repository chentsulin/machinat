import { MachinatUser } from '@machinat/core';
import Auth from '@machinat/auth';
import type { AnyServerAuthorizer, ContextOfAuthorizer } from '@machinat/auth';
import type {
  EventInput,
  VerifyLoginFn,
  HttpRequestInfo,
  EventValue,
} from '@machinat/websocket';
import { WEBVIEW } from './constant';
import { WebviewConnection } from './channel';
import type { WebviewEvent } from './types';

const WebEventProto = { platform: WEBVIEW };

export const createEvent = <
  User extends null | MachinatUser,
  Value extends EventValue
>(
  value: EventInput,
  channel: WebviewConnection,
  user: User
): WebviewEvent<Value, User> => {
  const event: WebviewEvent<Value, User> = Object.create(WebEventProto);

  const { category, type, payload } = value;
  event.category = category || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export const useAuthLogin =
  <Authorizer extends AnyServerAuthorizer>(
    controller: Auth.Controller<Authorizer>
  ): VerifyLoginFn<MachinatUser, ContextOfAuthorizer<Authorizer>, string> =>
  async (request: HttpRequestInfo, credential: string) => {
    const result = await controller.verifyAuth(request, credential);

    if (!result.success) {
      const { code, reason } = result;
      return { success: false as const, code, reason };
    }

    const { context } = result;
    return {
      success: true as const,
      authContext: context,
      user: context.user,
      expireAt: context.expireAt,
    };
  };

export const verifyOrigin = (origin: string, expectedHost: string): boolean => {
  const [protocol, host] = origin.split('//', 2);
  return protocol === 'https:' && host === expectedHost;
};
