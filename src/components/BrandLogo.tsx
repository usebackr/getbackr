import React from 'react';

interface BrandLogoProps {
  fontSize?: string;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  fontSize = '1.5rem', 
  className = '', 
  style = {},
  href = '/' 
}) => {
  const content = (
    <h2
      style={{
        fontSize,
        fontWeight: 900,
        fontFamily: 'Outfit, sans-serif',
        letterSpacing: '-0.02em',
        margin: 0,
        color: 'var(--accent-primary)',
        ...style,
      }}
      className={className}
    >
      Backr
    </h2>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none' }}>
        {content}
      </a>
    );
  }

  return content;
};

export default BrandLogo;
