// @flow
import {
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from '../symbol';
import type {
  ServeStrategy,
  ServiceContainer,
  ServiceProvider,
  AbstractProvider,
  Interfaceable,
  NamedInterfaceable,
  InjectRequirement,
} from './types';
import { polishInjectRequirement } from './utils';

type InjectOptions = {|
  deps: (Interfaceable | InjectRequirement)[],
|};

/**
 * inject marks a function as a container and annotate the dependencies
 */
export const inject = <T>({ deps }: InjectOptions) => (
  func: (...args: any[]) => T
): ServiceContainer<T> => {
  const requirements = deps.map(polishInjectRequirement);

  return Object.defineProperties(((func: any): ServiceContainer<T>), {
    $$typeof: { value: MACHINAT_SERVICES_CONTAINER },
    $$deps: { value: requirements },
  });
};

type ProvideOptions<T> = {
  deps: (Interfaceable | InjectRequirement)[],
  factory: (...args: any[]) => Promise<T>,
  strategy: ServeStrategy,
};

/**
 * provide mark a class as a provider serving for the instance type and also an
 * interfaceable can be implemented
 */
export const provider = <T>({ deps, factory, strategy }: ProvideOptions<T>) => (
  target: Class<T>
): ServiceProvider<T> => {
  const requirements = deps.map(polishInjectRequirement);

  return Object.defineProperties(((target: any): ServiceProvider<T>), {
    $$typeof: { value: MACHINAT_SERVICES_PROVIDER },
    $$deps: { value: requirements },
    $$factory: { value: factory },
    $$strategy: { value: strategy },
  });
};

/**
 * abstract mark an abstract class as a interfaceable to be implemented
 */
export const abstract = <T>(target: Class<T>): AbstractProvider<T> => {
  return Object.defineProperties(((target: any): AbstractProvider<T>), {
    $$typeof: { value: MACHINAT_SERVICES_ABSTRACTION },
  });
};

/**
 * namedInterfaceable create an interfaceable to be implemented
 */
export const namedInterfaceable = (name: string): NamedInterfaceable => ({
  $$typeof: MACHINAT_SERVICES_INTERFACEABLE,
  name,
});

/**
 * optional marks an interfaceable as optional while annotating deps
 */
export const optional = (target: Interfaceable): InjectRequirement => ({
  require: target,
  optional: true,
});
