import React from 'react';

interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, size, color, className = '', style = {} }) => {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      style={{
        fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : undefined,
        color: color || undefined,
        ...style,
      }}
    >
      {name}
    </span>
  );
};

export default Icon;
