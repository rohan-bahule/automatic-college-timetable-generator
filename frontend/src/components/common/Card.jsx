import React from 'react';
import './common.css';

export default function Card({
  children,
  header = null,
  footer = null,
  hoverable = false,
  variant = 'default',
  className = '',
  ...props
}) {
  const variantClass = variant === 'dark' ? 'card-dark' : '';
  const hoverClass = hoverable ? 'card-hover' : '';

  return (
    <div className={`card ${variantClass} ${hoverClass} ${className}`} {...props}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
