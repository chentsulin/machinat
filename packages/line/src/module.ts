import type { PlatformModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseProfiler, BaseMarshaler } from '@machinat/core/base';
import Http from '@machinat/http';
import { RequestRoute } from '@machinat/http/types';

import { ConfigsI as LineConfigsI, PlatformMounterI } from './interface';
import { LINE } from './constant';
import { ReceiverP } from './receiver';
import { BotP } from './bot';
import { ProfilerP, LineUserProfile, LineGroupProfile } from './profiler';
import LineChat from './channel';
import LineUser from './user';
import type {
  LineEventContext,
  LineJob,
  LineDispatchFrame,
  LineResult,
} from './types';

/** @internal */
const webhookRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [LineConfigsI, ReceiverP] as const,
})(
  (configs, receiver): RequestRoute => ({
    name: LINE,
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Line = {
  Bot: BotP,
  Receiver: ReceiverP,
  Profiler: ProfilerP,
  ConfigsI: LineConfigsI,

  initModule: (
    configs: LineConfigsI
  ): PlatformModule<
    LineEventContext,
    null,
    LineJob,
    LineDispatchFrame,
    LineResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: LINE,
      },

      ProfilerP,
      {
        provide: BaseProfiler.PlatformMap,
        withProvider: ProfilerP,
        platform: LINE,
      },

      { provide: LineConfigsI, withValue: configs },
      { provide: BaseMarshaler.TypeI, withValue: LineChat },
      { provide: BaseMarshaler.TypeI, withValue: LineUser },
      { provide: BaseMarshaler.TypeI, withValue: LineUserProfile },
      { provide: BaseMarshaler.TypeI, withValue: LineGroupProfile },
    ];

    if (configs.noServer !== true) {
      provisions.push(ReceiverP, {
        provide: Http.RequestRouteList,
        withProvider: webhookRouteFactory,
      });
    }

    return {
      name: LINE,
      mounterInterface: PlatformMounterI,
      provisions,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,

      startHook: makeContainer({
        deps: [BotP] as const,
      })((bot: BotP) => bot.start()),
    };
  },
};

declare namespace Line {
  export type Bot = BotP;
  export type Receiver = ReceiverP;
  export type Profiler = ProfilerP;
  export type ConfigsI = LineConfigsI;
}

export default Line;
