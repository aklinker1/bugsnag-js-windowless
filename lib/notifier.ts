import { Event } from '@bugsnag/core';

const notifier = {
  name: 'Bugsnag JS Windowless',
  version: __LIB_VERSION__,
  url: __LIB_REPO_URL__,
};

export function notify(event: Event) {
  const headers = {
    'Content-Type': 'application/json',
    'Bugsnag-Api-Key': event.apiKey ?? '',
    'Bugsnag-Payload-Version': '5',
    'Bugsnag-Sent-At': new Date().toISOString(),
  };
  const body = {
    payloadVersion: 5,
    notifier,
    events: [
      // @ts-expect-error not typed
      event.toJSON(),
    ],
  };

  void fetch('https://notify.bugsnag.com/', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).catch();
}
