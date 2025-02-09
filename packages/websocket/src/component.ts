/* eslint-disable import/prefer-default-export */
import type { NativeComponent } from '@machinat/core';
import {
  annotateNativeComponent,
  makeUnitSegment,
  UnitSegment,
} from '@machinat/core/renderer';
import { WEBSOCKET } from './constant';
import type { EventInput } from './types';

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = annotateNativeComponent(WEBSOCKET)(function Event(node, path) {
  const { type, category, payload } = node.props;
  return [
    makeUnitSegment(node, path, {
      category,
      type,
      payload,
    }),
  ];
});
