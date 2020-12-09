import invariant from 'invariant';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Engine, { DispatchError } from '@machinat/core/engine';
import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';
import { makeClassProvider, createEmptyScope } from '@machinat/core/service';

import { chatJobsMaker, multicastJobsMaker } from './job';
import generalElementDelegate from './components/general';
import LineWorker from './worker';
import LineChat from './channel';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { LINE } from './constant';

import type {
  LineSource,
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineAPIResult,
  LineDispatchFrame,
  LineDispatchResponse,
} from './types';

type LineBotOptions = {
  accessToken: string;
  channelId: string;
  connectionCapicity?: number;
};

/**
 * @category Provider
 */
export class LineBot implements MachinatBot<LineChat, LineJob, LineAPIResult> {
  providerId: string;
  botChannelId: string;
  engine: Engine<
    LineChat,
    LineSegmentValue,
    LineComponent<unknown>,
    LineJob,
    LineAPIResult,
    LineBot
  >;

  constructor(
    {
      accessToken,
      channelId,
      connectionCapicity = 100,
    }: LineBotOptions = {} as any,
    initScope: InitScopeFn = () => createEmptyScope(LINE),
    dispatchWrapper: DispatchWrapper<
      LineJob,
      LineDispatchFrame,
      LineAPIResult
    > = (dispatch) => dispatch
  ) {
    invariant(accessToken, 'configs.accessToken should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');

    this.botChannelId = channelId;

    const queue = new Queue<LineJob, LineAPIResult>();
    const worker = new LineWorker(accessToken, connectionCapicity);
    const renderer = new Renderer<LineSegmentValue, LineComponent<unknown>>(
      LINE,
      generalElementDelegate
    );

    this.engine = new Engine(
      LINE,
      this,
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper
    );
  }

  async start(): Promise<void> {
    this.engine.start();
  }

  async stop(): Promise<void> {
    this.engine.stop();
  }

  render(
    source: string | LineSource | LineChat,
    message: MachinatNode,
    options?: { replyToken?: string }
  ): Promise<null | LineDispatchResponse> {
    const channel =
      source instanceof LineChat
        ? source
        : typeof source === 'string'
        ? new LineChat(this.botChannelId, 'user', source)
        : LineChat.fromMessagingSource(this.botChannelId, source);

    return this.engine.render(
      channel,
      message,
      chatJobsMaker(options && options.replyToken)
    );
  }

  renderMulticast(
    targets: string[],
    message: MachinatNode
  ): Promise<null | LineDispatchResponse> {
    return this.engine.render(null, message, multicastJobsMaker(targets));
  }

  async dispatchAPICall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: null | unknown
  ): Promise<LineAPIResult> {
    try {
      const response = await this.engine.dispatchJobs(null, [
        { method, path, body, executionKey: undefined },
      ]);

      return response.results[0];
    } catch (err) {
      if (err instanceof DispatchError) {
        throw err.errors[0];
      } else {
        throw err;
      }
    }
  }
}

export const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    PLATFORM_CONFIGS_I,
    { require: PLATFORM_MOUNTER_I, optional: true },
  ] as const,
  factory: (configs, mounter) =>
    new LineBot(configs, mounter?.initScope, mounter?.dispatchWrapper),
})(LineBot);

export type BotP = LineBot;
