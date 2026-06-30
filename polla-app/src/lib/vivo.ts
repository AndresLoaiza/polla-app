import { supabase } from './supabase';

export interface MarcadorVivo {
  ext_id: string;
  gol_local: number | null;
  gol_visitante: number | null;
  estado: 'en_juego';
}

/** Marcadores en vivo via Edge Function (proxy a football-data sin exponer el
 *  token). Devuelve [] si no hay partidos en juego o si la función no responde
 *  (degradación silenciosa: la app sigue con el refresco normal). */
export async function fetchMarcadoresVivo(): Promise<MarcadorVivo[]> {
  const { data, error } = await supabase.functions.invoke('marcadores-vivo');
  if (error) throw error;
  return (data?.partidos ?? []) as MarcadorVivo[];
}
