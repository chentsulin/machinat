// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import getRawBody from 'raw-body';
import { BaseReceiver } from 'machinat-base';

import type { MachinatChannel, MachinatEvent } from 'machinat-base/types';
import type { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type { WebhookHandler, WebhookResponse, WebhookMetadata } from './types';

const RAW_BODY_OPTION = { encoding: true };
const WEBHOOK = 'webhook';

const endRes = (res, status, body) => {
  res.statusCode = status; // eslint-disable-line no-param-reassign
  res.end(body);
};

class WebhookReceiver<Channel: MachinatChannel, Event: MachinatEvent<any>>
  extends BaseReceiver<Channel, Event, WebhookMetadata, WebhookResponse>
  implements HTTPRequestReceiver {
  handleWebhook: WebhookHandler<Channel, Event>;

  constructor(handleWebhook: WebhookHandler<Channel, Event>) {
    super();
    this.handleWebhook = handleWebhook;
  }

  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    httpContext?: Object,
    rawBody?: string
  ) {
    this._handleRequestImpl(req, res, httpContext, rawBody);
  }

  async _handleRequestImpl(
    req: IncomingMessage,
    res: ServerResponse,
    httpContext?: any,
    rawBody?: string
  ) {
    try {
      if (!this.isBound) {
        endRes(res, 501);
        return;
      }

      let reqBody = rawBody;
      if (
        reqBody === undefined &&
        (req.method === 'POST' ||
          req.method === 'PUT' ||
          req.method === 'DELETE' ||
          req.method === 'PATCH')
      ) {
        reqBody = await getRawBody(req, RAW_BODY_OPTION);
      }

      const events = this.handleWebhook(req, res, reqBody);
      if (!events) {
        endRes(res, 200);
        return;
      }

      let shouldWaitRespond = false;
      const promises = new Array(events.length);

      const metadata = { source: WEBHOOK, context: httpContext };

      for (let i = 0; i < events.length; i += 1) {
        const { event, channel, shouldRespond } = events[i];
        promises[i] = this._issueEvent(channel, event, metadata);

        if (shouldRespond) {
          shouldWaitRespond = true;
        }
      }

      if (!shouldWaitRespond) {
        endRes(res, 200);
      }

      const responses = await Promise.all(promises);

      if (!res.finished) {
        for (const response of responses) {
          if (response !== undefined) {
            const { status, body } = response;
            endRes(
              res,
              status,
              body === undefined || typeof body === 'string'
                ? body
                : JSON.stringify(body)
            );
            break;
          }

          endRes(res, 501);
        }
      }
    } catch (err) {
      if (!res.finished) {
        endRes(
          res,
          err.status || 500,
          typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        );
      }

      this._issueError(err);
    }
  }
}

export default WebhookReceiver;
