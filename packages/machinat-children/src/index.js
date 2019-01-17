// @flow
import type { MachinatNode } from 'types/element';

import { isFragment, isEmpty } from 'machinat-utility';
import type {
  TraverseElementCallback,
  ElementReducer,
  ElementMapper,
} from './types';

const ITER_SEPARATOR = ':';

export type ReduceTraverseContext<Reduced> = {
  reduced: Reduced,
  reducer: ElementReducer,
  payload: any,
};

export type MapTraverseContext<Mapped> = {
  mappedArray: Array<Mapped>,
  mapper: ElementMapper,
  payload: any,
};

export const traverse = (
  children: MachinatNode,
  prefix: string = '',
  context: any,
  callback: TraverseElementCallback
): number => {
  let count = 0;
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      count += traverse(child, prefix + ITER_SEPARATOR + i, context, callback);
    }
  } else if (isFragment(children)) {
    if (children.props) {
      count += traverse(
        children.props.children,
        prefix + ITER_SEPARATOR,
        context,
        callback
      );
    }
  } else if (!isEmpty(children)) {
    callback(
      children,
      prefix.charAt(prefix.length - 1) === ':'
        ? `${prefix + ITER_SEPARATOR}0`
        : prefix,
      context
    );
    return 1;
  }

  return count;
};

const reduceCallback: TraverseElementCallback = (
  child,
  path,
  context: ReduceTraverseContext<any>
) => {
  const { reduced, reducer, payload } = context;
  context.reduced = reducer(reduced, child, path, payload);
};

export const reduce = <Reduced>(
  children: MachinatNode,
  reducer: ElementReducer,
  initial: Reduced,
  prefix: string,
  payload: any
): ?Reduced => {
  if (children === undefined || children === null) {
    return children;
  }
  const context: ReduceTraverseContext<Reduced> = {
    reduced: initial,
    reducer,
    payload,
  };
  traverse(children, prefix, context, reduceCallback);
  return context.reduced;
};

const mapCallback: TraverseElementCallback = <Mapped>(child, path, context) => {
  const { mapper, payload, mappedArray }: MapTraverseContext<Mapped> = context;
  const mapped = mapper(child, path, payload);
  mappedArray.push(mapped);
};

export const map = <Mapped>(
  children: MachinatNode,
  mapper: ElementMapper,
  prefix: string,
  payload: any
): ?Array<Mapped> => {
  if (children === undefined || children === null) {
    return children;
  }

  const context: MapTraverseContext<Mapped> = {
    mapper,
    payload,
    mappedArray: [],
  };

  traverse(children, prefix, context, mapCallback);
  return context.mappedArray;
};

const identity: any = ele => ele;
export const toArray = (children: MachinatNode) =>
  map<MachinatNode>(children, identity, '');
