import Bugsnag from 'bugsnag-js-windowless';

window.onerror = console.error;

Bugsnag.start({
  apiKey: import.meta.env.VITE_API_KEY,
  appType: 'demo',
  appVersion: __LIB_VERSION__,
  context: 'Demo Page',
  user: {
    name: 'aklinker1',
  },
});

const buttonFns = [
  function debug() {
    console.debug('[debug] Hello world!');
  },
  function log() {
    console.log('[log] Hello world!');
  },
  function info() {
    console.info('[info] Hello world!');
  },
  function warn() {
    console.warn('[warn] Hello world!');
  },
  function error() {
    console.error('[error] Hello world!');
  },
  function notifyInfo() {
    Bugsnag.notify('Some info', event => {
      event.severity = 'info';
    });
  },
  function notify() {
    Bugsnag.notify(Error('Some error'));
  },
];

buttonFns.forEach(fn => {
  const button = document.createElement('button');
  button.onclick = fn;
  const lines = fn.toString().split('\n');
  button.innerText = lines
    .slice(1, lines.length - 1)
    // .map(line => line.substring(2))
    .join('\n');
  document.body.appendChild(button);
});
