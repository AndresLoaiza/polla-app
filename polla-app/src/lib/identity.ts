import type { Usuario } from '../types';

const KEY = 'polla-mundial:usuario';

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAccessCode(code: string): Promise<boolean> {
  return (await sha256Hex(code.trim().toLowerCase())) === import.meta.env.VITE_ACCESS_CODE_HASH;
}

export function getStoredUsuario(): Usuario | null {
  const v = localStorage.getItem(KEY);
  return v === 'andres' || v === 'melisa' ? v : null;
}

export function storeUsuario(u: Usuario): void {
  localStorage.setItem(KEY, u);
}

export const USER_COLOR: Record<Usuario, string> = {
  andres: 'var(--color-user-andres)',
  melisa: 'var(--color-user-melisa)',
};
export const USER_NOMBRE: Record<Usuario, string> = { andres: 'Andrés', melisa: 'Melisa' };
