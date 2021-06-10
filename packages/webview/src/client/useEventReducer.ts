import React from 'react';
import type WebviewClient from './client';
import type { EventValue, AnyClientAuthorizer } from '../types';
import type { ClientEventContext, EventContextOfClient } from './types';

function useEventReducer<
  T,
  Client extends WebviewClient<AnyClientAuthorizer, EventValue>
>(
  client: Client,
  reducer: (value: T, context: EventContextOfClient<Client>) => T,
  initialValue: T
): T;

function useEventReducer<T>(
  client: WebviewClient<AnyClientAuthorizer, EventValue>,
  reducer: (
    value: T,
    context: ClientEventContext<AnyClientAuthorizer, EventValue>
  ) => T,
  initialValue: T
): T {
  const [data, dispatchEvent] = React.useReducer(reducer, initialValue);

  React.useEffect(() => {
    client.onEvent((context) => {
      dispatchEvent(context);
    });
  }, [client]);

  return data;
}

export default useEventReducer;
