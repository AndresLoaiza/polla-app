export const LOCK_MS = 10 * 60 * 1000;

const cierre = (inicioISO: string) => new Date(inicioISO).getTime() - LOCK_MS;

export function estaBloqueado(inicioISO: string, ahora: Date = new Date()): boolean {
  return ahora.getTime() >= cierre(inicioISO);
}

/** El rival se revela en el mismo instante del bloqueo. */
export function rivalRevelado(inicioISO: string, ahora: Date = new Date()): boolean {
  return estaBloqueado(inicioISO, ahora);
}

/** Milisegundos restantes hasta el cierre (0 si ya cerro). */
export function msAlCierre(inicioISO: string, ahora: Date = new Date()): number {
  return Math.max(0, cierre(inicioISO) - ahora.getTime());
}
