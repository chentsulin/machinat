/* eslint-disable import/prefer-default-export */
import { annotateNativeComponent, unitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { NativeComponent } from '@machinat/core/types';
import { WEBSOCKET } from './constant';
import type { EventInput } from './types';

type EventProps = {
  category?: string;
  type: Exclude<string, 'connect' | 'disconnect'>;
  payload?: any;
};

/** @internal */
const __Event = function Event(node, path) {
  const { type, category, payload } = node.props;
  return [
    unitSegment(node, path, {
      category,
      type,
      payload,
    }),
  ];
};

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventProps,
  UnitSegment<EventInput>
> = annotateNativeComponent(WEBSOCKET)(__Event);
