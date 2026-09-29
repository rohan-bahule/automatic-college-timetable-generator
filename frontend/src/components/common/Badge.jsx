import React from 'react';
import './common.css';

export default function Badge({
  children,
  variant = 'default',
  icon: Icon = null,
  className = '',
  ...props
}) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
