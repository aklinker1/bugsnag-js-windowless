import { Event, FeatureFlag, Logger } from '@bugsnag/core';
import { detect } from 'detect-browser';
import { ApiBreadcrumb, ApiFeatureFlag, Body } from './api-types';
import { Config } from './config';

// Types

// Network Request

const notifier: Body['notifier'] = {
  name: 'Bugsnag JS Windowless',
  version: __LIB_VERSION__,
  url: __LIB_REPO_URL__,
};

export async function postEvent(event: Event, logger: Logger | undefined, config: Config) {
  try {
    // @ts-expect-error _metadata is not typed
    const eventMetadata: ApiEvent['metaData'] = event._metadata;
    // @ts-expect-error _featureFlags is not typed
    const featureFlags: FeatureFlag[] | undefined = event._featureFlags;
    // @ts-expect-error _handledState is not typed
    const handledState: any = event._handledState;
    const browser = detect(navigator.userAgent);

    const endpoint = config.endpoints?.notify || 'https://notify.bugsnag.com/';
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
          exceptions: event.errors.map(err => ({
            message: err.errorMessage,
            errorClass: err.errorClass,
            stacktrace: err.stacktrace,
            type: 'browserjs',
          })),
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

    await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger?.error(err);
  }
}
