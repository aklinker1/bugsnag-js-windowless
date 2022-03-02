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
} from '@bugsnag/core';
import { BreadcrumbTrail } from './BreadcrumbTrail';
import { getOsName } from './utils';

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
      // @ts-ignore - this is fine, it gets defaulted
      undefined,
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
    throw Error('Not implemented');
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
      return this.#metadata[section]?.[key];
    }
    return this.#metadata[section];
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
    throw Error('Not implemented');
  }

  public setUser(id?: string, email?: string, name?: string): void {
    throw Error('Not implemented');
  }

  // sessions

  startSession(): ClientJs {
    this.#pausedSession = undefined;
    this.#session = this.#createSession();
    return this;
  }

  pauseSession(): ClientJs {
    this.#pausedSession = this.#session;
    this.#session = undefined;
    return this;
  }

  resumeSession(): ClientJs {
    // Don't do anything if it wasn't paused
    if (this.#pausedSession == null) return this;

    this.#session = this.#pausedSession;
    this.#pausedSession = undefined;
    return this;
  }

  // Listeners

  public addOnError(fn: OnErrorCallback): void {
    throw Error('Not implemented');
  }

  public removeOnError(fn: OnErrorCallback): void {
    throw Error('Not implemented');
  }

  public addOnSession(fn: OnSessionCallback): void {
    throw Error('Not implemented');
  }

  public removeOnSession(fn: OnSessionCallback): void {
    throw Error('Not implemented');
  }

  public addOnBreadcrumb(fn: OnBreadcrumbCallback): void {
    throw Error('Not implemented');
  }

  public removeOnBreadcrumb(fn: OnBreadcrumbCallback): void {
    throw Error('Not implemented');
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
      this.#config = apiKeyOrOpts;
    }
    this.#trail.setMaxLength(this.#config.maxBreadcrumbs ?? 25);
  }

  #init() {
    // self.onerror = event => {
    //   this._notify(event);
    // };
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
