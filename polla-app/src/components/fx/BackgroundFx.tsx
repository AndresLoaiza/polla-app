/** Fondo atmosférico de estadio (Ideogram) detrás del contenido. Atenuado para
 *  no romper la legibilidad del liquid glass. */
export default function BackgroundFx() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(7,18,11,0.55), rgba(7,18,11,0.82)), url(${import.meta.env.BASE_URL}bg-stadium.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }} />
  );
}
