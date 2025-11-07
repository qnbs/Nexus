import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
    return (
        <svg 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w.org/2000/svg" 
            className={`${className} text-accent`}
            aria-label="Nexus Logo"
        >
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'var(--accent-color-hover)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--accent-color)', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                    <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                    <feFlood floodColor="var(--accent-color)" floodOpacity="0.5" result="offsetColor"/>
                    <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"/>
                    <feMerge>
                        <feMergeNode in="offsetBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter="url(#logoGlow)">
                {/* Central pulsing node */}
                <circle cx="16" cy="16" r="3" stroke="url(#logoGradient)" strokeWidth="1.5" className="logo-pulser" />
                
                {/* Rotating outer nodes and connections */}
                <g className="logo-rotator">
                    {/* Top Node */}
                    <circle cx="16" cy="6" r="2.5" stroke="url(#logoGradient)" strokeWidth="1.5" />
                    <path d="M16 13V8.5" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Bottom-right Node */}
                    <circle cx="26.2" cy="21.5" r="2.5" stroke="url(#logoGradient)" strokeWidth="1.5" />
                    <path d="M17.8 17.8L24.4 20.5" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Bottom-left Node */}
                    <circle cx="5.8" cy="21.5" r="2.5" stroke="url(#logoGradient)" strokeWidth="1.5" />
                    <path d="M14.2 17.8L7.6 20.5" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </g>
        </svg>
    );
};

export default Logo;