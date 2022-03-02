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
