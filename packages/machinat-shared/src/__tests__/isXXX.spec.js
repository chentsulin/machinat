import Machinat from '../../../machinat';
import {
  isElement,
  isFragment,
  isEmpty,
  isImmediately,
  isNative,
  isValidRenderable,
} from '../isXXX';

describe('isElement', () => {
  it('return true if valid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const elements = [
      <a />,
      <b>BBB</b>,
      <>123</>,
      <MyComponent />,
      <Machinat.Immediately />,
    ];
    elements.forEach(ele => {
      expect(isElement(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonElements = [
      'a',
      { type: 'b' },
      MyComponent,
      null,
      undefined,
      false,
      true,
      123,
    ];
    nonElements.forEach(ele => {
      expect(isElement(ele)).toBe(false);
    });
  });
});

describe('isFragment', () => {
  it('return true if Fragment element passed', () => {
    const fragments = [<>123</>, <Machinat.Fragment />];
    fragments.forEach(ele => {
      expect(isFragment(ele)).toBe(true);
    });
  });

  it('return false if non Fragment element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonFragments = [
      null,
      undefined,
      false,
      true,
      'a',
      123,
      <a />,
      <b>BBB</b>,
      <MyComponent />,
      <Machinat.Immediately />,
    ];
    nonFragments.forEach(ele => {
      expect(isFragment(ele)).toBe(false);
    });
  });
});

describe('isImmediately', () => {
  it('return true if Immediately element passed', () => {
    const immediatelies = [
      <Machinat.Immediately />,
      <Machinat.Immediately await={() => Promise.reoslve()} />,
    ];
    immediatelies.forEach(ele => {
      expect(isImmediately(ele)).toBe(true);
    });
  });

  it('return false if non Immediately element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonImmediatelies = [
      null,
      undefined,
      false,
      true,
      'a',
      123,
      <a />,
      <b>BBB</b>,
      <MyComponent />,
      <Machinat.Fragment />,
    ];
    nonImmediatelies.forEach(ele => {
      expect(isImmediately(ele)).toBe(false);
    });
  });
});

describe('isEmpty', () => {
  it('return true if empty node passed', () => {
    const empties = [null, undefined, true, false];
    empties.forEach(ele => {
      expect(isEmpty(ele)).toBe(true);
    });
  });

  it('return false if non empty element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      'abc',
      123,
      <a />,
      <b>BBB</b>,
      <>123</>,
      <Machinat.Immediately />,
      <MyComponent />,
    ];
    nonEmpties.forEach(ele => {
      expect(isEmpty(ele)).toBe(false);
    });
  });
});

describe('isNative', () => {
  it('return true if element is labeled native', () => {
    const Native = () => {};
    Native.$$native = Symbol('test1');
    const myEle = <a />;
    myEle.$$native = Symbol('test2');

    const natives = [<Native />, { $$native: Symbol('test3') }, myEle];
    natives.forEach(ele => {
      expect(isNative(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      null,
      undefined,
      false,
      true,
      'a',
      123,
      <a />,
      <b>BBB</b>,
      <>abc</>,
      <MyComponent />,
      <Machinat.Immediately />,
    ];
    nonEmpties.forEach(ele => {
      expect(isNative(ele)).toBe(false);
    });
  });
});

describe('isValidRenderable', () => {
  it('return true if element is labeled native', () => {
    const Native = () => {};
    Native.$$native = Symbol('test1');
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars

    const natives = [123, 'abc', <a />, <MyComponent />, <Native />];
    natives.forEach(ele => {
      expect(isValidRenderable(ele)).toBe(true);
    });
  });

  it('return false if invalid element passed', () => {
    const MyComponent = () => 'abc'; // eslint-disable-line no-unused-vars
    const nonEmpties = [
      null,
      undefined,
      false,
      true,
      <>abc</>,
      <Machinat.Fragment />,
      <Machinat.Immediately />,
    ];
    nonEmpties.forEach(ele => {
      expect(isValidRenderable(ele)).toBe(false);
    });
  });
});
