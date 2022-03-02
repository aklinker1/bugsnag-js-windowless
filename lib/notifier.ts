import { App, BreadcrumbType, Device, Event, FeatureFlag, Logger, User } from '@bugsnag/core';
import { detect } from 'detect-browser';

// Types

interface Body {
  apiKey: string;
  payloadVersion: 5;
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  events: ApiEvent[];
}

interface ApiEvent {
  exceptions: ApiException[];
  breadcrumbs?: ApiBreadcrumb[];
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

interface ApiException {
  errorClass: string;
  message?: string;
  stacktrace: ApiStacktrace[];
  type?: 'browserjs';
}

interface ApiStacktrace {
  file: string;
  lineNumber: number;
  columnNumber: number;
  method: string;
}

interface ApiBreadcrumb {
  timestamp: string;
  name: string;
  type: BreadcrumbType;
  metaData?: Record<string, any>;
}

interface ApiDevice extends Device {
  browserName?: string;
  browserVersion?: string;
}

interface ApiApp extends App {
  id?: string;
}

interface ApiFeatureFlag {
  featureFlag: string;
  variant?: string;
}

// Network Request

const notifier: Body['notifier'] = {
  name: 'Bugsnag JS Windowless',
  version: __LIB_VERSION__,
  url: __LIB_REPO_URL__,
};

// Ex: notify@http://localhost:3000/demo/index.ts:27:20, EventHandlerNonNull*@http://localhost:3000/demo/index.ts:32:3
// 1: method
// 2: file
// 3: line
// 4: column
const STACKTRACE_REGEX = /^(.*?)@(.*):(.*?):(.*?)$/;

export async function notify(event: Event, logger: Logger | undefined) {
  try {
    // @ts-expect-error _metadata is not typed
    const eventMetadata: ApiEvent['metaData'] = event._metadata;
    // @ts-expect-error _featureFlags is not typed
    const featureFlags: FeatureFlag[] | undefined = event._featureFlags;
    // @ts-expect-error _handledState is not typed
    const handledState: any = event._handledState;
    const browser = detect(navigator.userAgent);

    const headers = {
      'Content-Type': 'application/json',
      'Bugsnag-Api-Key': event.apiKey ?? '',
      'Bugsnag-Payload-Version': '5',
      'Bugsnag-Sent-At': new Date().toISOString(),
    };
    const body: Body = {
      apiKey: event.apiKey ?? '',
      payloadVersion: 5,
      notifier,
      events: [
        {
          exceptions: [
            {
              errorClass:
                event.originalError instanceof Error
                  ? event.originalError.constructor.name
                  : 'Error',
              type: 'browserjs',
              message: event.originalError.message as string,
              stacktrace: (event.originalError.stack as string)
                .split('\n')
                .filter(line => !!line.trim())
                .map<ApiStacktrace>(line => {
                  const matches = STACKTRACE_REGEX.exec(line)!;
                  return {
                    method: matches[1] || 'inline',
                    columnNumber: Number(matches[4]),
                    file: matches[2],
                    lineNumber: Number(matches[3]),
                  };
                }),
            },
          ],
          metaData: eventMetadata,
          app: event.app,
          breadcrumbs: event.breadcrumbs?.map<ApiBreadcrumb>(b => ({
            name: b.message,
            timestamp: b.timestamp.toISOString(),
            type: b.type,
            metaData: b.metadata,
          })),
          context: event.context,
          device: {
            locale: navigator.language,
            time: new Date(),
            userAgent: navigator.userAgent,
            osName: browser?.os ?? undefined,
            browserName: browser?.name,
            browserVersion: browser?.version ?? undefined,
          },
          featureFlags: featureFlags?.map<ApiFeatureFlag>(({ name, variant }) => ({
            featureFlag: name,
            variant: variant ?? undefined,
          })),
          severity: event.severity,
          severityReason: handledState.severityReason,
          unhandled: event.unhandled,
          user: event.getUser(),
        },
      ],
    };

    await fetch('https://notify.bugsnag.com/', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger?.error(err);
  }
}
