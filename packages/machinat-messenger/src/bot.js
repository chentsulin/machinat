// @flow
import invariant from 'invariant';

import { BaseBot } from 'machinat-base';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook-receiver';

import type { MachinatNode } from 'machinat/types';
import type {
  WebhookResponse,
  WebhookMetadata,
} from 'machinat-webhook-receiver/types';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';

import MessengerWorker from './worker';
import handleWebhook from './handleWebhook';
import * as generalComponents from './component/general';

import { MESSENGER_NAITVE_TYPE } from './constant';
import MessengerChannel from './channel';
import { createChatJobs, createCreativeJobs } from './job';

import type {
  MessengerSource,
  MessengerBotOptions,
  MessengerEvent,
  MessengerComponent,
  MessengerJob,
  MessengerAPIResult,
  MessengerSegmentValue,
  SendOptions,
  BroadcastOptions,
} from './types';

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

const MESSENGER = 'messenger';
const POST = 'POST';

export default class MessengerBot
  extends BaseBot<
    MessengerChannel,
    MessengerEvent,
    WebhookMetadata,
    WebhookResponse,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult
  >
  implements HTTPRequestReceivable {
  options: MessengerBotOptions;
  // $FlowFixMe https://github.com/facebook/flow/issues/7539
  receiver: WebhookReceiver<MessengerChannel, MessengerEvent>;
  worker: MessengerWorker;

  constructor(optionsInput: MessengerBotOptionsInput = {}) {
    const defaultOpions: MessengerBotOptionsInput = {
      appSecret: undefined,
      accessToken: undefined,
      shouldValidateRequest: true,
      shouldVerifyWebhook: true,
      verifyToken: undefined,
      respondTimeout: 5000,
      consumeInterval: undefined,
    };

    const options = Object.assign(defaultOpions, optionsInput);

    invariant(
      options.accessToken,
      'should provide accessToken to send messenge'
    );

    invariant(
      !options.shouldValidateRequest || options.appSecret,
      'should provide appSecret if shouldValidateRequest set to true'
    );

    invariant(
      !options.shouldVerifyWebhook || options.verifyToken,
      'should provide verifyToken if shouldVerifyWebhook set to true'
    );

    const renderer = new Renderer(
      MESSENGER,
      MESSENGER_NAITVE_TYPE,
      (node, render, path) => {
        const { type } = node;

        invariant(
          type in generalComponents,
          `"${type}" is not valid general component tag on messenger`
        );

        return generalComponents[type](node, render, path);
      }
    );

    const worker = new MessengerWorker({
      accessToken: options.accessToken,
      appSecret: options.appSecret,
      consumeInterval: options.consumeInterval,
    });

    const receiver = new WebhookReceiver(handleWebhook(options));

    super(MESSENGER, receiver, renderer, worker, options.plugins);

    this.options = options;
    this.receiver = receiver;
    this.worker = worker;
  }

  async send(
    target: string | MessengerSource | MessengerChannel,
    messages: MachinatNode,
    options?: SendOptions
  ): Promise<null | MessengerAPIResult[]> {
    const channel =
      target instanceof MessengerChannel
        ? target
        : new MessengerChannel(
            typeof target === 'string' ? { id: target } : target
          );

    const tasks = this.engine.renderTasks(
      createChatJobs,
      channel,
      messages,
      options,
      true
    );

    if (tasks === null) return null;

    const response = await this.engine.dispatch(null, tasks, messages);
    return response === null ? null : response.results;
  }

  async createMessageCreative(
    messages: MachinatNode
  ): Promise<null | MessengerAPIResult> {
    const tasks = this.engine.renderTasks(
      createCreativeJobs,
      null,
      messages,
      undefined,
      false
    );
    if (tasks === null) return null;

    const response = await this.engine.dispatch(null, tasks, messages);
    return response === null ? null : response.results[0];
  }

  async broadcastMessage(creativeId: number, options?: BroadcastOptions) {
    const job = {
      request: {
        relative_url: 'me/broadcast_messages',
        method: POST,
        body: {
          messaging_type: 'MESSAGE_TAG',
          tag: 'NON_PROMOTIONAL_SUBSCRIPTION',
          message_creative_id: creativeId,
          notification_type: options && options.notificationType,
          persona_id: options && options.personaId,
          custom_label_id: options && options.customLabelId,
        },
      },
    };

    const response = await this.engine.dispatch(null, [
      { type: 'transmit', payload: [job] },
    ]);

    return response === null ? null : response.results[0];
  }

  async createCustomLabel(name: string): Promise<null | MessengerAPIResult> {
    const job = {
      request: {
        relative_url: 'me/custom_labels',
        method: POST,
        body: { name },
      },
    };

    const response = await this.engine.dispatch(null, [
      { type: 'transmit', payload: [job] },
    ]);

    return response === null ? null : response.results[0];
  }
}
