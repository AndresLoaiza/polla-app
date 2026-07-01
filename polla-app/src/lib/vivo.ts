import { supabase } from './supabase';
import type { Estado } from '../types';

export interface MarcadorVivo {
  ext_id: string;
  gol_local: number | null;
  gol_visitante: number | null;
  estado: Estado;
}

/** Estado + marcador ACTUAL de los partidos, directo de football-data via Edge
 *  Function (sin exponer el token). Sirve para que "actualizar" traiga lo de la
 *  fuente y no la copia vieja del cron. Devuelve [] si la función no responde
 *  (degradación silenciosa: la app sigue con el refresco normal). */
export async function fetchMarcadoresVivo(): Promise<MarcadorVivo[]> {
  const { data, error } = await supabase.functions.invoke('marcadores-vivo');
  if (error) throw error;
  return (data?.partidos ?? []) as MarcadorVivo[];
}
