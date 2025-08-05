export default function ProgressBar({ currentStep, totalSteps, steps }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      
      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all duration-300 ${
                  isCompleted || isActive ? 'text-white' : 'text-gray-500'
                } ${isActive ? 'scale-110' : 'scale-100'}`}
                style={{ backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#374151' }}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className={`text-xs ${isActive ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Completion Message */}
      {currentStep === totalSteps && (
        <div className="text-center mt-4">
          <p className="text-green-400 font-semibold">
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All steps completed! Ready to see your results.
          </p>
        </div>
      )}
    </div>
  );
}