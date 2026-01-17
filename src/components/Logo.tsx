import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="TechProjectHub logo"
    >
      <rect x="2" y="2" width="44" height="44" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="2.25" fill="currentColor" />
        <circle cx="32" cy="16" r="2.25" fill="currentColor" />
        <circle cx="24" cy="32" r="2.25" fill="currentColor" />
        <path d="M16 17.5 L24 30 L32 17.5" />
        <path d="M16 19 L32 19" />
      </g>
    </svg>
  );
}

export default Logo;
