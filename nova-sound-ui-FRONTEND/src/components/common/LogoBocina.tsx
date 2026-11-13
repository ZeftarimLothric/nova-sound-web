interface LogoBocinaProps {
  size?: number;
}

/**
 * Marca gráfica de NOVA SOUND (Light Industrial):
 * Vista frontal técnica de bocina con anillos concéntricos en blanco/gris y núcleo #fffa00.
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
      <circle cx="24" cy="24" r="22" fill="none" stroke="#fffa00" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="9" fill="rgba(255,250,0,0.08)" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3.5" fill="#fffa00" />
    </svg>
  );
}

