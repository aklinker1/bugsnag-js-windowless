<h1 align="center">Bugsnag JS Service Worker</h1>

<p align="center">A Bugsnag client for all JS contexts without the `window` global, like service workers</p>

```bash
npm i --save bugsnag-js-service-worker
yarn add bugsnag-js-service-worker
pnpm i bugsnag-js-service-worker
```

```ts
import BugsnagJs from '@bugsnag/js';
import BugsnagSw from 'bugsnag-js-service-worker';

const Bugsnag = typeof window === 'undefined' ? BugsnagSw : BugsnagJs;

Bugsnag.start({ apiKey: 'your-api-key' });
```

## Features

- Exact same API as `@bugsnag/js` ([docs](https://docs.bugsnag.com/platforms/javascript/configuration-options))
- No dependencies

### Not Implemented

Support for some of bugnsag's features have not been implemented:

- Plugins

## Contributing
