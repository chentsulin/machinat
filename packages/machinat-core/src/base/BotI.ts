import type { MachinatBot, MachinatChannel, MachinatNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { abstractInterface } from '../service';

export abstract class BaseBot<Channel extends MachinatChannel, Job, Result>
  implements MachinatBot<Channel, Job, Result> {
  abstract render(
    channel: Channel,
    node: MachinatNode
  ): Promise<null | DispatchResponse<Job, Result>>;

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}

export default abstractInterface<BaseBot<any, any, any>>({
  name: 'BaseBotI',
})(BaseBot);
