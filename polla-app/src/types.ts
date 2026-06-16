export type Usuario = 'andres' | 'melisa';
export type Fase = 'grupos' | 'eliminacion';
export type Estado = 'programado' | 'en_juego' | 'finalizado';

export interface Partido {
  id: string;
  ext_id: string;
  fase: Fase;
  grupo: string | null;
  fecha_hora: string;            // ISO UTC
  equipo_local: string;
  equipo_visitante: string;
  bandera_local: string | null;
  bandera_visitante: string | null;
  gol_local_real: number | null;
  gol_visitante_real: number | null;
  estado: Estado;
}

export interface Prediccion {
  id: string;
  partido_id: string;
  usuario: Usuario;
  gol_local: number;
  gol_visitante: number;
  updated_at: string;
}

export type TipoEspecial = 'campeon';

export interface Especial {
  id: string;
  usuario: Usuario;
  tipo: TipoEspecial;
  valor: string;            // nombre del equipo (como en la API)
  updated_at: string;
}

export const PUNTOS_CAMPEON = 20;

export interface Desglose {
  resultado: number;
  golLocal: number;
  golVisitante: number;
  diferencia: number;
  total: number;
}
