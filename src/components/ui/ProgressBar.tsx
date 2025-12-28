/**
 * Progress Bar Component
 * 
 * PURPOSE: Shows user progress through the multi-step wizard.
 * 
 * DESIGN: Clean, visual progress indicator with step numbers.
 */

"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 -z-10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center relative z-10">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg scale-110"
                    : "bg-slate-200 text-slate-500"
                } ${isCurrent ? "ring-4 ring-amber-200" : ""}`}
              >
                {stepNumber}
              </div>
              <span
                className={`mt-2 text-xs font-semibold text-center max-w-[80px] ${
                  isActive ? "text-amber-700" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

