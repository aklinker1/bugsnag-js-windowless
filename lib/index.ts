import {
  Config,
  BugsnagStatic,
  Breadcrumb,
  Event,
  Session,
  Client as ClientJs,
  NotifiableError,
  OnErrorCallback,
  BreadcrumbType,
  FeatureFlag,
  User,
  OnSessionCallback,
  OnBreadcrumbCallback,
  Device,
  Logger,
} from '@bugsnag/core';
import { BreadcrumbTrail } from './BreadcrumbTrail';
import { notify } from './notifier';
import { getMessageFromArgs, getOsName } from './utils';

class Client implements BugsnagStatic, ClientJs {
  Breadcrumb = Breadcrumb;
  Event = Event;
  Session = Session;
  // @ts-expect-error - this variable is late init
  #config: Config = {};
  #pausedSession: Session | undefined;
  #session: Session | undefined;
  #metadata: { [section: string]: any } = {};
  #trail = new BreadcrumbTrail();
  #featureFlags: FeatureFlag[] = [];
  #onErrorCallbacks = new Set<OnErrorCallback>();
  #onSessionCallbacks = new Set<OnSessionCallback>();
  #onBreadcrumbCallbacks = new Set<OnBreadcrumbCallback>();
  #ogConsole = { ...console };
  #internalLogger: Logger | undefined;

  // BugsnagStatic methods

  start(apiKeyOrOpts: string | Config): ClientJs {
    this.#setConfig(apiKeyOrOpts);
    this.startSession();
    return this;
  }
  createClient(apiKeyOrOpts: string | Config): ClientJs {
    this.#setConfig(apiKeyOrOpts);
    return this.start(apiKeyOrOpts);
  }

  // reporting errors

  public notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    cb?: (err: any, event: Event) => void,
  ): void {
    const event = Event.create(
      error,
      true,
      {
        unhandled: false,
        severity: 'warning',
        severityReason: { type: 'handledException' },
      },
      'notify()',
      1,
      this.#config.logger ?? undefined,
    );
    this._notify(event, onError, cb);
  }

  public _notify(
    event: Event,
    onError?: OnErrorCallback,
    cb?: (err: any, event: Event) => void,
  ): void {
    if (this.#session == null) {
      this.#internalLogger?.debug('notify called before Bugsnag.start()');
      return;
    }

    Object.entries(this.#metadata).forEach(([section, metadata]) => {
      event.addMetadata(section, metadata);
    });
    event.addFeatureFlags(this.#featureFlags);
    if (this.#config.user)
      event.setUser(this.#config.user?.id, this.#config.user?.email, this.#config.user?.name);
    event.apiKey = this.#config.apiKey;
    event.app = {
      releaseStage: this.#config.releaseStage,
      type: this.#config.appType,
      version: this.#config.appVersion,
      ...(this.#session?.startedAt && { duration: Date.now() - this.#session.startedAt.getTime() }),
    };
    event.breadcrumbs = this.#trail.getBreadcrumbs();
    event.device = this.#getDevice();

    // Perform some work in separate async function so getBreadcrumbs is executed synchronously
    // (adding the async keyword delays execution)
    const asyncWork = async () => {
      const callbacks = Array.from(this.#onErrorCallbacks ?? []);
      if (onError) callbacks.push(onError);

      let shouldSend: boolean | void = true;
      const shouldSendCb = (_: unknown, innerShouldSend?: boolean) => {
        shouldSend = shouldSend && (innerShouldSend ?? false);
      };
      const resultsPromise = Promise.all(callbacks.map(cb => cb(event, shouldSendCb), true));
      if (!shouldSend) return;
      shouldSend =
        (await resultsPromise).reduce(
          (flag, result) =>
            // Run all the callbacks by putting the call before "&& flag"
            (result ?? true) && flag,
          true,
        ) ?? true;

      if (onError != null) {
        this.#internalLogger?.warn('onError arg not implemented for notify');
        throw Error('onError arg not implemented');
      }
      await notify(event, this.#internalLogger ?? undefined);
    };
    asyncWork().catch(err => cb?.(event, err));
  }

  // breadcrumbs

  public leaveBreadcrumb(
    message: string,
    metadata?: { [key: string]: any },
    type?: BreadcrumbType,
  ): void {
    const breadcrumb = new Breadcrumb();
    breadcrumb.message = message;
    breadcrumb.metadata = metadata ?? {};
    breadcrumb.type = type ?? 'log';

    const callbacks = Array.from(this.#onBreadcrumbCallbacks ?? []);
    const shouldLeaveBreadcrumb = callbacks.reduce(
      (flag, cb) =>
        // Run all the callbacks by putting the call before "&& flag"
        (cb(breadcrumb) ?? true) && flag,
      true,
    );
    if (!shouldLeaveBreadcrumb) return;

    this.#trail.add(breadcrumb);
  }

  // metadata

  public addMetadata(section: string, values: { [key: string]: any }): void;
  public addMetadata(section: string, key: string, value: any): void;
  public addMetadata(
    section: string,
    ...args: [values: { [key: string]: any }] | [key: string, value: any]
  ) {
    this.#metadata[section] ||= {};
    if (typeof args[0] === 'string') {
      const [key, value] = args;
      this.#metadata[section][key] = value;
    } else {
      const [values] = args;
      Object.entries(values).forEach(([key, value]) => {
        this.#metadata[section][key] = value;
      });
    }
  }

  public getMetadata(section: string, key?: string): any {
    if (key != null) {
      return Object.freeze(this.#metadata[section]?.[key]);
    }
    return Object.freeze(this.#metadata[section]);
  }

  public clearMetadata(section: string, key?: string): void {
    // Can't clear something that's already clear
    if (this.#metadata[section] == null) return;

    if (key != null) {
      delete this.#metadata[section]?.[key];
    } else {
      delete this.#metadata[section];
    }
  }

  // feature flags

  public addFeatureFlag(name: string, variant?: string | null): void {
    this.#featureFlags.push({ name, variant });
  }

  public addFeatureFlags(featureFlags: FeatureFlag[]): void {
    this.#featureFlags.push(...featureFlags);
  }

  public clearFeatureFlag(name: string): void {
    const index = this.#featureFlags.findIndex(ff => ff.name == name);
    if (index >= 0) {
      this.#featureFlags.splice(index, 1);
    }
  }

  public clearFeatureFlags(): void {
    this.#featureFlags = [];
  }

  // context

  public getContext(): string | undefined {
    return this.#config.context;
  }

  public setContext(c: string): void {
    this.#config.context = c;
  }

  // user

  public getUser(): User {
    return Object.freeze(this.#config.user ?? {});
  }

  public setUser(id?: string, email?: string, name?: string): void {
    this.#config.user ||= {};
    this.#config.user.id = id;
    this.#config.user.email = email;
    this.#config.user.name = name;
  }

  // sessions

  startSession(): ClientJs {
    const session = this.#createSession();

    const callbacks = Array.from(this.#onSessionCallbacks ?? []);
    const shouldStart = callbacks.reduce(
      (flag, cb) =>
        // Run all the callbacks by putting the call before "&& flag"
        (cb(session) ?? true) && flag,
      true,
    );
    if (!shouldStart) return this;

    this.#session = session;
    this.#pausedSession = undefined;
    this.#init();
    return this;
  }

  pauseSession(): ClientJs {
    this.#pausedSession = this.#session;
    this.#session = undefined;
    this.#unload();
    return this;
  }

  resumeSession(): ClientJs {
    // Don't do anything if it wasn't paused
    if (this.#pausedSession == null) return this;

    this.#session = this.#pausedSession;
    this.#pausedSession = undefined;
    this.#init();
    return this;
  }

  // Listeners

  public addOnError(fn: OnErrorCallback): void {
    this.#onErrorCallbacks.add(fn);
  }

  public removeOnError(fn: OnErrorCallback): void {
    this.#onErrorCallbacks.delete(fn);
  }

  public addOnSession(fn: OnSessionCallback): void {
    this.#onSessionCallbacks.add(fn);
  }

  public removeOnSession(fn: OnSessionCallback): void {
    this.#onSessionCallbacks.delete(fn);
  }

  public addOnBreadcrumb(fn: OnBreadcrumbCallback): void {
    this.#onBreadcrumbCallbacks.add(fn);
  }

  public removeOnBreadcrumb(fn: OnBreadcrumbCallback): void {
    this.#onBreadcrumbCallbacks.delete(fn);
  }

  // Plugins

  public getPlugin(name: string): any {
    return this.#config.plugins?.find(p => p.name === name);
  }

  public resetEventCount?(): void {
    const session = this.#session || this.#pausedSession;
    // @ts-expect-error - untyped member variable
    session._handled = 0;
    // @ts-expect-error - untyped member variable
    session._unhandled = 0;
  }

  // Helpers

  #setConfig(apiKeyOrOpts: string | Config) {
    if (typeof apiKeyOrOpts === 'string') {
      this.#config = { apiKey: apiKeyOrOpts };
    } else {
      this.#config = { ...apiKeyOrOpts };
    }
    this.#config.logger = this.#config.logger === undefined ? console : this.#config.logger;
    this.#internalLogger = this.#config.logger ? this.#ogConsole : undefined;
    this.#trail.setMaxLength(this.#config.maxBreadcrumbs ?? 25);
  }

  #init() {
    // Load plugins
    this.#config.plugins?.forEach(plugin => plugin.load(this));

    // Listen for unhandled errors
    self.addEventListener('error', this.#onError);
    self.addEventListener('unhandledrejection', this.#onUnhandledRejection);

    // Override console methods
    console.debug = (...args: any[]) => {
      this.leaveBreadcrumb(getMessageFromArgs(args), undefined, 'log');
      this.#ogConsole.debug(...args);
    };
    console.log = (...args: any[]) => {
      this.leaveBreadcrumb(getMessageFromArgs(args), undefined, 'log');
      this.#ogConsole.log(...args);
    };
    console.info = (...args: any[]) => {
      this.leaveBreadcrumb(getMessageFromArgs(args), undefined, 'log');
      this.#ogConsole.info(...args);
    };
    console.warn = (...args: any[]) => {
      this.leaveBreadcrumb(getMessageFromArgs(args), undefined, 'log');
      this.#ogConsole.warn(...args);
    };
    console.error = (...args: any[]) => {
      this.leaveBreadcrumb(getMessageFromArgs(args), undefined, 'log');
      this.#ogConsole.error(...args);
    };
  }

  #unload() {
    // Destroy plugins
    this.#config.plugins?.forEach(plugin => plugin.destroy?.());

    // Remove listeners for unhandled errors
    self.removeEventListener('error', this.#onError);
    self.removeEventListener('unhandledrejection', this.#onUnhandledRejection);

    // Reset console
    console.debug = this.#ogConsole.debug;
    console.log = this.#ogConsole.log;
    console.info = this.#ogConsole.info;
    console.warn = this.#ogConsole.warn;
    console.error = this.#ogConsole.error;
  }

  #notifyUnhandled(maybeError: any, component: string, severityType: string): void {
    const event = Event.create(
      maybeError,
      true,
      {
        unhandled: true,
        severity: 'error',
        severityReason: { type: severityType },
      },
      component,
      0,
      this.#config.logger ?? undefined,
    );
    this._notify(event);
  }

  #onError(e: ErrorEvent) {
    this.#notifyUnhandled(e, 'self.onerror()', 'unhandledException');
  }

  #onUnhandledRejection(e: PromiseRejectionEvent) {
    this.#notifyUnhandled(e.reason, 'self.onunhandledrejection()', 'unhandledPromiseRejection');
  }

  #createSession(): Session {
    const s = new Session();
    if (this.#config.user) this.#updateSessionUser(s, this.#config.user);
    s.device = this.#getDevice();
    return s;
  }

  #updateSessionUser(session: Session, user: User): void {
    session.setUser(user.id, user.email, user.name);
  }

  #getDevice(): Device {
    return {
      locale: navigator.language,
      time: new Date(),
      userAgent: navigator.userAgent,
      osName: getOsName(),
    };
  }
}

const BugsnagSw: BugsnagStatic = new Client();

export default BugsnagSw;