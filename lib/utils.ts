export function getOsName(): string | undefined {
  const p = navigator.platform;
  if (p.toLowerCase().startsWith('Linux')) {
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
