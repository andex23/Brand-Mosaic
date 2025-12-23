import React from 'react';

interface BrandHeaderProps {
  onTitleClick?: () => void;
  subtitle?: string;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ onTitleClick, subtitle }) => {
  return (
    <div className="brand-header">
      <div 
        className="brand-title" 
        onClick={onTitleClick}
        style={{ cursor: onTitleClick ? 'pointer' : 'default' }}
      >
        BRAND MOSAIC
      </div>
      {subtitle && (
        <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.6, fontStyle: 'italic' }}>
          {subtitle}
        </div>
      )}
      <div className="brand-header-line"></div>
    </div>
  );
};

export default BrandHeader;