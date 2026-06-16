// Nombre en español + bandera (emoji) por equipo. La API devuelve los nombres en
// ingles; aqui se traducen. La clave se normaliza (minusculas, solo a-z0-9) para
// tolerar acentos/encoding raros (ej. "Curaçao").

interface Equipo { es: string; flag: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const MAPA: Record<string, Equipo> = {
  algeria: { es: 'Argelia', flag: '🇩🇿' },
  argentina: { es: 'Argentina', flag: '🇦🇷' },
  australia: { es: 'Australia', flag: '🇦🇺' },
  austria: { es: 'Austria', flag: '🇦🇹' },
  belgium: { es: 'Bélgica', flag: '🇧🇪' },
  bosniaherzegovina: { es: 'Bosnia', flag: '🇧🇦' },
  brazil: { es: 'Brasil', flag: '🇧🇷' },
  canada: { es: 'Canadá', flag: '🇨🇦' },
  capeverdeislands: { es: 'Cabo Verde', flag: '🇨🇻' },
  colombia: { es: 'Colombia', flag: '🇨🇴' },
  congodr: { es: 'RD Congo', flag: '🇨🇩' },
  croatia: { es: 'Croacia', flag: '🇭🇷' },
  curaao: { es: 'Curazao', flag: '🇨🇼' },
  czechia: { es: 'Chequia', flag: '🇨🇿' },
  ecuador: { es: 'Ecuador', flag: '🇪🇨' },
  egypt: { es: 'Egipto', flag: '🇪🇬' },
  england: { es: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  france: { es: 'Francia', flag: '🇫🇷' },
  germany: { es: 'Alemania', flag: '🇩🇪' },
  ghana: { es: 'Ghana', flag: '🇬🇭' },
  haiti: { es: 'Haití', flag: '🇭🇹' },
  iran: { es: 'Irán', flag: '🇮🇷' },
  iraq: { es: 'Irak', flag: '🇮🇶' },
  ivorycoast: { es: 'Costa de Marfil', flag: '🇨🇮' },
  japan: { es: 'Japón', flag: '🇯🇵' },
  jordan: { es: 'Jordania', flag: '🇯🇴' },
  mexico: { es: 'México', flag: '🇲🇽' },
  morocco: { es: 'Marruecos', flag: '🇲🇦' },
  netherlands: { es: 'Países Bajos', flag: '🇳🇱' },
  newzealand: { es: 'Nueva Zelanda', flag: '🇳🇿' },
  norway: { es: 'Noruega', flag: '🇳🇴' },
  panama: { es: 'Panamá', flag: '🇵🇦' },
  paraguay: { es: 'Paraguay', flag: '🇵🇾' },
  portugal: { es: 'Portugal', flag: '🇵🇹' },
  qatar: { es: 'Catar', flag: '🇶🇦' },
  saudiarabia: { es: 'Arabia Saudita', flag: '🇸🇦' },
  scotland: { es: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  senegal: { es: 'Senegal', flag: '🇸🇳' },
  southafrica: { es: 'Sudáfrica', flag: '🇿🇦' },
  southkorea: { es: 'Corea del Sur', flag: '🇰🇷' },
  spain: { es: 'España', flag: '🇪🇸' },
  sweden: { es: 'Suecia', flag: '🇸🇪' },
  switzerland: { es: 'Suiza', flag: '🇨🇭' },
  tunisia: { es: 'Túnez', flag: '🇹🇳' },
  turkey: { es: 'Turquía', flag: '🇹🇷' },
  unitedstates: { es: 'Estados Unidos', flag: '🇺🇸' },
  uruguay: { es: 'Uruguay', flag: '🇺🇾' },
  uzbekistan: { es: 'Uzbekistán', flag: '🇺🇿' },
};

export function nombreEs(nombre: string): string {
  return MAPA[norm(nombre)]?.es ?? nombre;
}

export function bandera(nombre: string): string {
  return MAPA[norm(nombre)]?.flag ?? '🏳️';
}
