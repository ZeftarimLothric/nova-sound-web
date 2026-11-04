interface LogoBocinaProps {
  size?: number;
}

/**
 * Marca gráfica de NOVA SOUND: vista frontal de una bocina (anillos
 * concéntricos del cono) pensada para fondo azul marino.
 * SVG inline: no depende de fuentes ni de archivos externos.
 */
export default function LogoBocina({ size = 28 }: LogoBocinaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="NOVA SOUND"
      style={{ flexShrink: 0 }}
    >
      <circle cx="24" cy="24" r="22" fill="none" stroke="#7fb2ea" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="9" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3.5" fill="#7fb2ea" />
    </svg>
  );
}