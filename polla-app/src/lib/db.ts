import { supabase } from './supabase';
import type { Partido, Prediccion, Usuario } from '../types';

const DESDE = '2026-06-16T00:00:00Z';

export async function fetchPartidos(): Promise<Partido[]> {
  const { data, error } = await supabase
    .from('polla_partidos')
    .select('*')
    .gte('fecha_hora', DESDE)
    .order('fecha_hora', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Partido[];
}

export async function fetchPredicciones(): Promise<Prediccion[]> {
  const { data, error } = await supabase.from('polla_predicciones').select('*');
  if (error) throw error;
  return (data ?? []) as Prediccion[];
}

/** Crea o actualiza la prediccion del usuario para un partido. */
export async function guardarPrediccion(
  partido_id: string, usuario: Usuario, gol_local: number, gol_visitante: number,
): Promise<Prediccion> {
  const { data, error } = await supabase
    .from('polla_predicciones')
    .upsert({ partido_id, usuario, gol_local, gol_visitante, updated_at: new Date().toISOString() },
            { onConflict: 'partido_id,usuario' })
    .select()
    .single();
  if (error) throw error;
  return data as Prediccion;
}

/** Fallback manual: setear el marcador real desde la app. */
export async function guardarResultadoManual(
  partido_id: string, gol_local_real: number, gol_visitante_real: number,
): Promise<void> {
  const { error } = await supabase
    .from('polla_partidos')
    .update({ gol_local_real, gol_visitante_real, estado: 'finalizado' })
    .eq('id', partido_id);
  if (error) throw error;
}
