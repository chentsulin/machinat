// @flow
import invariant from 'invariant';
import ProvisionMap from './provisionMap';
import type {
  Interfaceable,
  ServiceProvider,
  InjectRequirement,
  ServiceCache,
  ProvisionBinding,
} from './types';

const ENUM_PHASE_BOOTSTRAP: 1 = 1;
const ENUM_PHASE_INIT_SCOPE: 2 = 2;
const ENUM_PHASE_INJECTION: 3 = 3;

type PhaseEnum =
  | typeof ENUM_PHASE_BOOTSTRAP
  | typeof ENUM_PHASE_INIT_SCOPE
  | typeof ENUM_PHASE_INJECTION;

/**
 * MakeContext is the context passed down through the service dependencies
 * making tree. A MakeContext is created every time when a container is
 * executed or services being required with app.use(). The context itself
 * should not be modified within the making tree.
 */
type MakeContext = {
  platform: void | string,
  phase: PhaseEnum,
  singletonCache: ServiceCache,
  scopedCache: ServiceCache,
  transientCache: ServiceCache,
  runtimeProvisions: null | Map<Interfaceable, any>,
};

/**
 * ServiceMaker makes services according to the services mapping resolved
 */
export default class ServiceMaker {
  serviceMapping: ProvisionMap<ProvisionBinding>;
  _singletonPropviders: Set<ServiceProvider<any, any>>;
  _scopedPropvidersMapping: ProvisionMap<ServiceProvider<any, any>>;

  constructor(serviceMapping: ProvisionMap<ProvisionBinding>) {
    this.serviceMapping = serviceMapping;
    this._singletonPropviders = new Set();
    this._scopedPropvidersMapping = new ProvisionMap();
  }

  /**
   * makeSingletonServices creates singleton services and return the cache
   */
  makeSingletonServices(
    bootstrapProvisions: null | Map<Interfaceable, any>
  ): ServiceCache {
    const context = {
      platform: undefined,
      phase: ENUM_PHASE_BOOTSTRAP,
      singletonCache: new Map(),
      scopedCache: new Map(),
      transientCache: new Map(),
      runtimeProvisions: bootstrapProvisions,
    };

    for (const provider of this._singletonPropviders) {
      this._makeProvider(provider, context);
    }

    return context.singletonCache;
  }

  /**
   * makeScopedServices creates the scoped services and return the cache
   */
  makeScopedServices(
    platform: void | string,
    singletonCache: ServiceCache,
    bootstrapProvisions: null | Map<Interfaceable, any>
  ): ServiceCache {
    const context = {
      platform,
      phase: ENUM_PHASE_INIT_SCOPE,
      singletonCache,
      scopedCache: new Map(),
      transientCache: new Map(),
      runtimeProvisions: bootstrapProvisions,
    };

    for (const [
      target,
      platformBoundTo,
      provided,
    ] of this._scopedPropvidersMapping.iterBranch(platform)) {
      if (Array.isArray(provided)) {
        for (const provider of provided) {
          this._makeProvider(provider, context);
        }
      } else if (platformBoundTo) {
        this._makeProvider(provided, context);
      } else {
        const binding = this._resolveProvisionAssertedly(target, platform);
        if (binding.withProvider && binding.withProvider === provided) {
          this._makeProvider(provided, context);
        }
      }
    }

    return context.scopedCache;
  }

  /**
   * makeRequirements create a list of services according to the requirements
   */
  makeRequirements(
    requirements: InjectRequirement[],
    platform: void | string,
    singletonCache: ServiceCache,
    scopedCache: ServiceCache,
    runtimeProvisions: null | Map<Interfaceable, any>
  ): any[] {
    const services = this._makeRequirements(requirements, {
      platform,
      phase: ENUM_PHASE_INJECTION,
      singletonCache,
      scopedCache,
      transientCache: new Map(),
      runtimeProvisions,
    });

    return services;
  }

  validateProvisions(bootstrapProvisions: null | Map<Interfaceable, any>) {
    for (const [, platform, provided] of this.serviceMapping.iterAll()) {
      const bindings = Array.isArray(provided) ? provided : [provided];

      for (const binding of bindings) {
        if (binding.withProvider) {
          const {
            provide: target,
            platforms,
            withProvider: provider,
          } = binding;

          this._validateDependencies(
            binding.withProvider,
            platform,
            bootstrapProvisions,
            []
          );

          if (provider.$$lifetime === 'singleton') {
            this._singletonPropviders.add(provider);
          } else if (provider.$$lifetime === 'scoped') {
            this._scopedPropvidersMapping.set(
              target,
              platforms || null,
              provider
            );
          }
        }
      }
    }
  }

  _resolveProvisionOptionaly(
    target: Interfaceable,
    platform: void | string
  ): null | ProvisionBinding | ProvisionBinding[] {
    const binding = this.serviceMapping.get(target, platform);
    return binding;
  }

  _resolveProvisionAssertedly(
    target: Interfaceable,
    platform: void | string
  ): ProvisionBinding | ProvisionBinding[] {
    const binding = this.serviceMapping.get(target, platform);
    if (!binding) {
      if (target.$$multi) {
        return [];
      }
      invariant(false, `${target.$$name} is not bound`);
    }

    return binding;
  }

  _makeBinding(binding: ProvisionBinding, context: MakeContext) {
    if (binding.withValue) {
      return binding.withValue;
    }

    return this._makeProvider(binding.withProvider, context);
  }

  _makeProvider(provider: ServiceProvider<any, any>, context: MakeContext) {
    const { $$lifetime: lifetime } = provider;
    const { singletonCache, scopedCache, transientCache, phase } = context;

    const cache =
      lifetime === 'singleton'
        ? singletonCache
        : lifetime === 'scoped'
        ? scopedCache
        : transientCache;

    const cached = cache.get(provider);
    if (cached) {
      return cached;
    }

    // verify provider creating phase
    invariant(
      lifetime === 'transient' ||
        (lifetime === 'scoped' && phase !== ENUM_PHASE_INJECTION) ||
        (lifetime === 'singleton' && phase === ENUM_PHASE_BOOTSTRAP),
      `${lifetime} service ${provider.$$name} should not be created in ${
        phase === ENUM_PHASE_BOOTSTRAP
          ? 'bootstrap'
          : phase === ENUM_PHASE_INIT_SCOPE
          ? 'begin scope'
          : 'inject'
      } phase`
    );

    const { $$deps: deps, $$factory: factory } = provider;
    const args = this._makeRequirements(deps, context);
    const instance = factory(...args);

    cache.set(provider, instance);
    return instance;
  }

  _makeRequirements(deps: InjectRequirement[], context: MakeContext) {
    const { platform, runtimeProvisions } = context;
    const args: (any | any[])[] = [];

    for (const { require: target, optional } of deps) {
      let runtimeProvided;
      if (
        runtimeProvisions &&
        (runtimeProvided = runtimeProvisions.get(target))
      ) {
        // provided at runtime
        args.push(runtimeProvided);
      } else {
        const resolved = optional
          ? this._resolveProvisionOptionaly(target, platform)
          : this._resolveProvisionAssertedly(target, platform);

        if (!resolved) {
          // dep is optional and not bound
          args.push(null);
        } else if (Array.isArray(resolved)) {
          args.push(
            resolved.map(binding => this._makeBinding(binding, context))
          );
        } else {
          args.push(this._makeBinding(resolved, context));
        }
      }
    }

    return args;
  }

  _validateDependencies(
    provider: ServiceProvider<any, any>,
    platform: void | string,
    bootstrapProvisions: null | Map<Interfaceable, any>,
    refLock: ServiceProvider<any, any>[]
  ) {
    const subRefLock = [...refLock, provider];

    for (const { require: target, optional } of provider.$$deps) {
      const isProvidedOnBootstrap =
        !!bootstrapProvisions && bootstrapProvisions.has(target);

      const provided =
        optional || isProvidedOnBootstrap
          ? this._resolveProvisionOptionaly(target, platform)
          : this._resolveProvisionAssertedly(target, platform);

      if (provided) {
        const bindings = Array.isArray(provided) ? provided : [provided];

        for (const binding of bindings) {
          if (binding.withProvider) {
            const { withProvider: argProvider } = binding;

            invariant(
              subRefLock.indexOf(argProvider) === -1,
              `${argProvider.$$name} is circular dependent`
            );

            this._validateDependencies(
              argProvider,
              platform,
              bootstrapProvisions,
              subRefLock
            );
          }
        }
      }
    }
  }
}
