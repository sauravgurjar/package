import type { ComponentPropsWithoutRef } from 'react';
import './Button.css';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`asknow-button asknow-button--${variant} ${className}`.trim()}
      {...props}
    />
  );
}
