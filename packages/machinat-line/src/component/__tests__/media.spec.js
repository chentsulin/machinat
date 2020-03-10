import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import { Audio, Video } from '../media';

const render = element => element.type(element, () => null, '$');

it.each([Audio, Video].map(C => [C.name, C]))(
  '%s is valid native unit component',
  (_, Media) => {
    expect(typeof Media).toBe('function');

    expect(isNativeElement(<Media />)).toBe(true);
    expect(Media.$$platform).toBe('line');
  }
);

it.each(
  [
    <Audio url="https://..." duration={6666} />,
    <Video url="https://..." previewURL="https://..." />,
  ].map(e => [e.type.name, e])
)('%s render match snapshot', async (_, mediaElement) => {
  const promise = render(mediaElement);
  await expect(promise).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = await promise;
  expect(value).toMatchSnapshot();
});
