import {
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_INTERFACE,
} from '../symbol';

export { default as ServiceScope } from './scope';

export type ServiceLifetime = 'singleton' | 'scoped' | 'transient';

export interface SingularServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: false;
  $$branched: false;
}

export interface MultiServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: true;
  $$branched: false;
}

export interface BranchedServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: false;
  $$branched: true;
}

export type ServiceInterface<T> =
  | SingularServiceInterface<T>
  | MultiServiceInterface<T>
  | BranchedServiceInterface<T>;

export interface ServiceProvider<T, Args extends ReadonlyArray<unknown>> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_PROVIDER;
  $$multi: false;
  $$branched: false;
  $$lifetime: ServiceLifetime;
  $$deps: ServiceRequirement<Interfaceable<Args[number]>>[];
  $$factory: (...args: Args) => T;
}

export type Interfaceable<T> =
  | ServiceInterface<T>
  | ServiceProvider<T, unknown[]>;

type OptionalServiceRequirement<I extends Interfaceable<any>> = {
  require: I;
  optional: true;
};

type StrictServiceRequirement<I extends Interfaceable<any>> = {
  require: I;
  optional?: false;
};

export type ServiceRequirement<T extends Interfaceable<any>> =
  | OptionalServiceRequirement<T>
  | StrictServiceRequirement<T>;

export type ServiceDependency<I extends Interfaceable<any>> =
  | I
  | ServiceRequirement<I>;

type ResolveInterfaceable<
  I extends Interfaceable<any>
> = I extends ServiceProvider<infer T, unknown[]>
  ? T
  : I extends SingularServiceInterface<infer T>
  ? T
  : I extends MultiServiceInterface<infer T>
  ? T[]
  : I extends BranchedServiceInterface<infer T>
  ? Map<string, T>
  : never;

export type ResolveDependency<
  Dep extends ServiceDependency<any>
> = Dep extends Interfaceable<any>
  ? ResolveInterfaceable<Dep>
  : Dep extends StrictServiceRequirement<infer I>
  ? ResolveInterfaceable<I>
  : Dep extends OptionalServiceRequirement<infer I>
  ? null | ResolveInterfaceable<I>
  : never;

export type ResolveDependencies<
  Deps extends readonly ServiceDependency<any>[]
> = {
  [Idx in keyof Deps]: ResolveDependency<Deps[Idx]>;
};

export type ServiceContainer<T, Args extends ReadonlyArray<any>> = {
  (...args: Args): T;
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_CONTAINER;
  $$deps: ServiceRequirement<Interfaceable<Args[number]>>[];
  // HACK: make ts compiler accept it as class component
  new (): ServiceContainer<T, Args>;
};

export type MaybeContainer<T> = ServiceContainer<T, unknown[]> | T;

export type BranchedProviderBinding<T> = {
  provide: BranchedServiceInterface<T>;
  withProvider: ServiceProvider<T, unknown[]>;
  platform: string;
};

export type ProviderBinding<T> =
  | {
      provide:
        | SingularServiceInterface<T>
        | MultiServiceInterface<T>
        | ServiceProvider<T, unknown[]>;
      withProvider: ServiceProvider<T, unknown[]>;
    }
  | BranchedProviderBinding<T>;

export type BranchedValueBinding<T> = {
  provide: BranchedServiceInterface<T>;
  withValue: T;
  platform: string;
};

export type ValueBinding<T> =
  | {
      provide:
        | SingularServiceInterface<T>
        | MultiServiceInterface<T>
        | ServiceProvider<T, unknown[]>;
      withValue: T;
    }
  | BranchedValueBinding<T>;

export type ServiceBinding<T> = ProviderBinding<T> | ValueBinding<T>;

export type ServiceProvision<T> =
  | ServiceBinding<T>
  | ServiceProvider<T, unknown[]>;

export type ServiceCache = Map<ServiceProvider<unknown, unknown[]>, unknown>;
