
import React from 'react';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroChart({ protein, carbs, fat }: MacroChartProps) {
  const total = protein + carbs + fat || 1; // Avoid division by zero
  const proteinPercentage = (protein / total) * 100;
  const carbsPercentage = (carbs / total) * 100;
  const fatPercentage = (fat / total) * 100;

  // Calculate the strokeDasharray values for the SVG circle
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  const proteinDash = (proteinPercentage / 100) * circumference;
  const carbsDash = (carbsPercentage / 100) * circumference;
  const fatDash = (fatPercentage / 100) * circumference;
  
  // Calculate the stroke-dashoffset for positioning each segment
  const proteinOffset = 0;
  const carbsOffset = circumference - proteinDash;
  const fatOffset = circumference - proteinDash - carbsDash;

  return (
    <div className="relative flex justify-center items-center w-36 h-36 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        <circle 
          cx="72" 
          cy="72" 
          r={radius} 
          fill="transparent"
          stroke="#4ade80" 
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={proteinOffset}
        />
        <circle 
          cx="72" 
          cy="72" 
          r={radius} 
          fill="transparent"
          stroke="#facc15" 
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={carbsOffset}
        />
        <circle 
          cx="72" 
          cy="72" 
          r={radius} 
          fill="transparent"
          stroke="#60a5fa" 
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={fatOffset}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className="font-semibold text-sm text-gray-900">
          {protein}g
        </div>
        <div className="text-primary text-base font-bold">
          {carbs}g
        </div>
      </div>
    </div>
  );
}
