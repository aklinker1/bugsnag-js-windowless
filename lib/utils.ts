export function getOsName(): string | undefined {
  const p = navigator.platform;
  if (p.toLowerCase().startsWith('linux')) {
    return 'Linux';
  }
  if (p.toLocaleLowerCase().startsWith('win')) {
    return 'Windows';
  }
  if (p.toLocaleLowerCase().startsWith('mac')) {
    return 'Mac';
  }
  return p || undefined;
}

export function getMessageFromArgs(args: any[]): string {
  return args
    .map(arg => {
      if (arg instanceof Error) {
        return { name: arg.name, message: arg.message, stack: arg.stack };
      } else if (typeof arg === 'function') {
        return 'function() {}';
      } else if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      } else {
        return String(arg);
      }
    })
    .join(' ');
}

const USER_ID_POOL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
const USER_ID_LENGTH = 10;

export function generateAnonymousUserId(): string {
  let id = '';
  while (id.length < USER_ID_LENGTH) {
    id += USER_ID_POOL.charAt(Math.round(Math.random() * (USER_ID_POOL.length - 1)));
  }
  return id;
}

export function redactMetadata(redactedKeys: Array<string | RegExp>, metadata: any): any {
  if (Array.isArray(metadata)) {
    return metadata.map(item => redactMetadata(redactedKeys, item));
  } else if (typeof metadata === 'object') {
    return Object.entries(metadata)
      .map(([key, value]) => {
        const isRedacted = redactedKeys.find(redactedKey => key.match(redactedKey));
        return [key, isRedacted ? '[REDACTED]' : redactMetadata(redactedKeys, value)];
      })
      .reduce<Record<string, any>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }
  return metadata;
}
