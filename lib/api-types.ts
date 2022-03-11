import { App, BreadcrumbType, Device, User } from '@bugsnag/core';

export interface Body {
  apiKey: string;
  payloadVersion: 5;
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  events: ApiEvent[];
}

export interface ApiEvent {
  exceptions: ApiException[];
  breadcrumbs?: ApiBreadcrumb[];
  request?: ApiRequest;
  context?: string;
  unhandled?: boolean;
  severity?: string;
  severityReason?: {
    type?: string;
  };
  user?: User;
  app?: ApiApp;
  device?: ApiDevice;
  featureFlags?: ApiFeatureFlag[];
  metaData: Record<string, Record<string, any>>;
}

export interface ApiException {
  errorClass: string;
  message?: string;
  stacktrace: ApiStacktrace[];
  type?: 'browserjs';
}

export interface ApiStacktrace {
  file?: string;
  lineNumber?: number;
  columnNumber?: number;
  method?: string;
}

export interface ApiBreadcrumb {
  timestamp: string;
  name: string;
  type: BreadcrumbType;
  metaData?: Record<string, any>;
}

export interface ApiDevice extends Device {
  browserName?: string;
  browserVersion?: string;
}

export interface ApiRequest {
  clientIp?: string;
}

export interface ApiApp extends App {
  id?: string;
}

export interface ApiFeatureFlag {
  featureFlag: string;
  variant?: string;
}
