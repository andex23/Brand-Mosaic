import React, { useEffect, useRef } from 'react';

interface BrandQuestionRowProps {
  label: string;
  subLabel?: string;
  name: string;
  type: 'input' | 'select' | 'radio' | 'checkbox-group';
  options?: string[];
  value: string | string[];
  onChange: (name: string, value: string | string[]) => void;
  placeholder?: string;
  enableCustomInput?: boolean;
  customValue?: string;
  onCustomChange?: (val: string) => void;
  customPlaceholder?: string;
  colorPickerValues?: string[];
  onColorPickerChange?: (index: number, val: string) => void;
  maxSelections?: number;
}

const StarIcon = () => (
  <svg className="brand-star-icon" viewBox="0 0 24 24">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const BrandQuestionRow: React.FC<BrandQuestionRowProps> = ({
  label,
  subLabel,
  name,
  type,
  options,
  value,
  onChange,
  placeholder,
  enableCustomInput,
  customValue,
  onCustomChange,
  customPlaceholder,
  colorPickerValues,
  onColorPickerChange,
  maxSelections
}) => {
  const customInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange(name, e.target.value);
  };

  const handleCheckboxChange = (option: string) => {
    const currentValues = Array.isArray(value) ? [...value] : [];
    const index = currentValues.indexOf(option);
    
    if (index > -1) {
      // Remove
      currentValues.splice(index, 1);
      onChange(name, currentValues);
    } else {
      // Add (if not exceeding limit)
      if (!maxSelections || currentValues.length < maxSelections) {
        currentValues.push(option);
        onChange(name, currentValues);
      }
    }
  };

  // Logic for showing custom field:
  // 1. If select/radio/input: value === 'Custom'
  // 2. If checkbox-group: 'Custom' is in the selected array
  const isCustomSelected = Array.isArray(value) 
    ? value.includes('Custom') 
    : value === 'Custom';

  const showCustomField = enableCustomInput && isCustomSelected;

  useEffect(() => {
    if (showCustomField && customInputRef.current) {
      // Small timeout ensures the element is painted and transition doesn't interfere with focus
      const timer = setTimeout(() => {
        customInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showCustomField]);

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          className="brand-question-input"
          value={value as string}
          onChange={handleChange}
          name={name}
        >
          <option value="" disabled>
            Select...
          </option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    
    if (type === 'radio') {
      return (
        <div className="brand-radio-group">
          {options?.map((opt) => (
            <label key={opt} className="brand-radio-label">
              <input
                type="radio"
                name={name}
                value={opt}
                checked={value === opt}
                onChange={handleChange}
              />
              <span className="brand-radio-text">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (type === 'checkbox-group') {
      const currentValues = Array.isArray(value) ? value : [];
      return (
        <div className="brand-checkbox-group">
          {options?.map((opt) => {
            const isChecked = currentValues.includes(opt);
            const isDisabled = maxSelections 
              ? currentValues.length >= maxSelections && !isChecked 
              : false;
            
            return (
              <label 
                key={opt} 
                className={`brand-checkbox-label ${isDisabled ? 'disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={opt}
                  checked={isChecked}
                  onChange={() => !isDisabled && handleCheckboxChange(opt)}
                  disabled={isDisabled}
                />
                <span className="brand-checkbox-text">{opt}</span>
              </label>
            );
          })}
        </div>
      );
    }

    // Default input type="text"
    return (
      <input
        type="text"
        className="brand-question-input"
        value={value as string}
        onChange={handleChange}
        name={name}
        autoComplete="off"
        placeholder={placeholder || "Type answer..."}
      />
    );
  };

  return (
    <div className="brand-question-row">
      <div className="brand-label-container">
        <StarIcon />
        <div className="brand-label">
          {label}
          {subLabel && (
            <span style={{ fontWeight: 400, fontSize: '14px', marginLeft: '8px', opacity: 0.7 }}>
              {subLabel}
            </span>
          )}
        </div>
      </div>
      
      <div className="brand-question-line"></div>
      
      <div className="brand-answer-container">
        {renderInput()}

        {/* Custom Input Field Logic */}
        {showCustomField && onCustomChange && (
          <div className="brand-custom-row">
            <input
              ref={customInputRef}
              type="text"
              className="brand-question-input brand-custom-input"
              value={customValue || ''}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder={customPlaceholder || "Please specify..."}
            />
            
            {colorPickerValues && onColorPickerChange && (
              <div className="brand-colors-container">
                {colorPickerValues.map((colorVal, idx) => (
                  <div key={idx} className="brand-color-wrapper">
                    <input 
                      type="color" 
                      className="brand-color-picker"
                      value={colorVal}
                      onChange={(e) => onColorPickerChange(idx, e.target.value)}
                      title={`Color ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandQuestionRow;