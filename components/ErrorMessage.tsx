import React from 'react';

interface ErrorMessageProps {
  message: string;
  style?: React.CSSProperties;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, style }) => {
  if (!message) return null;

  return (
    <div className="error-message" style={style}>
      {message}
    </div>
  );
};

export default ErrorMessage;

