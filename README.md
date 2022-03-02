# Bugsnag JS Windowless

A Bugsnag client for all JS contexts without the `window` global.

This was made originally for Manifest V3 Chrome Extension background service workers, but works in all browser JS contexts.

```bash
npm i --save bugsnag-js-windowless
yarn add bugsnag-js-windowless
pnpm i bugsnag-js-windowless
```

```ts
import BugsnagJs from '@bugsnag/js';
import BugsnagSw from 'bugsnag-js-windowless';

const Bugsnag = typeof window === 'undefined' ? BugsnagSw : BugsnagJs;

Bugsnag.start({ apiKey: 'your-api-key' });
```

## Features

- Exact same API and types as `@bugsnag/js` ([docs](https://docs.bugsnag.com/platforms/javascript/configuration-options))
- No dependencies

### Todo

- [ ] Make sure all config is respected: <https://docs.bugsnag.com/platforms/javascript/configuration-options>

### Differences

These are the differences between `@bugsnag/js`'s and `bugsnag-js-windowless`'s behavior that I will not fix. I will however accept contributions to add support for them!

- Limited device details (no good libs that do this without `window`)
- Fetch/XHR request errors are not reported

## Contributing

To get started contributing:

```bash
# Install PNPM
npm i -g pnpm

# Install dependencies
pnpm i

# Create a .env file (and include your api key)
cp .env.template .env
edit .env

# Start the demo application
pnpm start

# Type check and output to `dist/` directory
pnpm build
```
