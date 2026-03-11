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
        <div className="brand-subtitle brand-header-subtitle">
          {subtitle}
        </div>
      )}
      <div className="brand-header-line"></div>
    </div>
  );
};

export default BrandHeader;
