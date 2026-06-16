import { supabase } from './supabase';
import type { Usuario } from '../types';

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function toU8(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

export type EstadoPush = 'ok' | 'denegado' | 'no-soportado' | 'sin-clave' | 'error';

export async function estaSuscrito(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch { return false; }
}

/** Pide permiso, suscribe al push y guarda la suscripción en Supabase. */
export async function activarRecordatorios(usuario: Usuario): Promise<EstadoPush> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    return 'no-soportado';
  if (!VAPID) return 'sin-clave';
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denegado';
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toU8(VAPID),
    });
    const j = sub.toJSON();
    const { error } = await supabase.from('polla_push_subs').upsert(
      { usuario, endpoint: j.endpoint, p256dh: j.keys!.p256dh, auth: j.keys!.auth },
      { onConflict: 'endpoint' },
    );
    if (error) throw error;
    return 'ok';
  } catch { return 'error'; }
}
