// @flow
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type {
  WebhookHandler,
  WebhookEventReport,
} from 'machinat-webhook-receiver/types';

import createEvent from './event';
import LineChannel from './channel';

import type {
  LineBotOptions,
  LineWebhookRequestBody,
  LineEvent,
} from './types';

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
};

const handleWebhook = (
  options: LineBotOptions
): WebhookHandler<LineChannel, LineEvent> => (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody: void | string
) => {
  if (req.method !== 'POST') {
    return endRes(res, 405);
  }

  if (rawBody === undefined) {
    return endRes(res, 400);
  }

  const { shouldValidateRequest, channelSecret } = options;

  // NOTE: channelSecret is validated at bot 👇
  if (shouldValidateRequest /* :: && channelSecret */) {
    const signature = crypto
      .createHmac('SHA256', channelSecret)
      .update(rawBody)
      .digest('base64');

    if (req.headers['x-line-signature'] !== signature) {
      return endRes(res, 401);
    }
  }

  try {
    const { events: payloads } = (JSON.parse(rawBody): LineWebhookRequestBody);

    const events: WebhookEventReport<LineChannel, LineEvent>[] = new Array(
      payloads.length
    );

    for (let i = 0; i < events.length; i += 1) {
      const payload = payloads[i];

      const event = createEvent(payload);
      const channel = new LineChannel(payload.source);

      events[i] = { event, channel, shouldRespond: false };
    }

    return events;
  } catch (e) {
    return endRes(res, 400);
  }
};

export default handleWebhook;
