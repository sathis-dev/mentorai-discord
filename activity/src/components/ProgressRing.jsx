import React, { useEffect, useState } from 'react';
import './ProgressRing.css';

const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const [offset, setOffset] = useState(0);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progressOffset = circumference - (progress / 100) * circumference;
    setOffset(progressOffset);
  }, [progress, circumference]);

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg className="progress-ring-svg" width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Circle */}
        <circle
          className="progress-ring-bg"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
        />
        
        {/* Progress Circle */}
        <circle
          className="progress-ring-circle"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="url(#progressGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#glow)"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      
      <div className="progress-ring-text">
        <div className="progress-percentage">{Math.round(progress)}%</div>
      </div>
    </div>
  );
};

export default ProgressRing;
