// @flow
import isValidElementType from './isValidElementType';
import * as IsXXX from './isXXX';
import * as Children from './children';

const Utils = {
  isValidElementType,
  ...IsXXX,
};

export { Children, Utils };
export {
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ASYNC_TYPE,
} from './symbol';
