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

These are the differences between `@bugsnag/js`'s and `bugsnag-js-windowless`'s behavior that I don't care about for my use case. I will however accept PRs to add support for them!

- Fetch/XHR request errors are not reported
- Full session tracking (including `config.autoTrackSessions`) is not implemented
- [`config.collectUserIp`](https://docs.bugsnag.com/platforms/javascript/configuration-options/#collectuserip) is not implemented and thus disabled by default
- [`config.maxEvents`](https://docs.bugsnag.com/platforms/javascript/configuration-options/#maxevents) is not implemented - all events are collected
- [`config.trackInlineScripts`](https://docs.bugsnag.com/platforms/javascript/configuration-options/#trackinlinescripts) is not implemented - this isn't really relevant to the JS contexts I built this for (chrome extension service workers)

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

# Run unit tests
pnpm test

# Type check and output to `dist/` directory
pnpm build
```
