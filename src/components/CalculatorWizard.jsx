import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import CyberCard from './ui/CyberCard';
import FuturisticButton from './ui/FuturisticButton';
import HolographicText, { NeonHeading } from './ui/HolographicText';

const CalculatorWizard = ({ inputs, setInputs, onCalculate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [errors, setErrors] = useState({});

  const steps = [
    {
      id: 'basics',
      title: '📊 Basic Information',
      description: 'Let\'s start with your current pricing and customer base',
      fields: [
        { 
          name: 'currentPrice', 
          label: 'Current Monthly Price', 
          type: 'number', 
          placeholder: 'e.g., 29',
          prefix: '$',
          required: true,
          helpText: 'Your current monthly subscription price',
          validation: { min: 1, message: 'Price must be at least $1' }
        },
        { 
          name: 'customers', 
          label: 'Number of Customers', 
          type: 'number', 
          placeholder: 'e.g., 100',
          required: true,
          helpText: 'Your current active customer count',
          validation: { min: 1, message: 'Must have at least 1 customer' }
        },
        { 
          name: 'churnRate', 
          label: 'Monthly Churn Rate', 
          type: 'number', 
          placeholder: 'e.g., 5',
          suffix: '%',
          required: true,
          helpText: 'Percentage of customers who cancel each month',
          validation: { min: 0, max: 100, message: 'Churn rate must be between 0-100%' }
        }
      ]
    },
    {
      id: 'market',
      title: '🎯 Market Context',
      description: 'Help us understand your competitive landscape',
      fields: [
        { 
          name: 'competitorPrice', 
          label: 'Average Competitor Price', 
          type: 'number', 
          placeholder: 'e.g., 39',
          prefix: '$',
          helpText: 'What your main competitors charge monthly'
        },
        { 
          name: 'marketSize', 
          label: 'Total Addressable Market', 
          type: 'number', 
          placeholder: 'e.g., 1000000',
          prefix: '$',
          helpText: 'Estimated market size in dollars'
        }
      ]
    },
    {
      id: 'advanced',
      title: '🚀 Growth Metrics',
      description: 'Advanced metrics for detailed projections',
      fields: [
        { 
          name: 'cac', 
          label: 'Customer Acquisition Cost', 
          type: 'number', 
          placeholder: 'e.g., 100',
          prefix: '$',
          helpText: 'Average cost to acquire one customer'
        },
        { 
          name: 'averageContractLength', 
          label: 'Average Contract Length', 
          type: 'number', 
          placeholder: 'e.g., 12',
          suffix: 'months',
          helpText: 'Typical customer contract duration'
        },
        { 
          name: 'expansionRevenue', 
          label: 'Monthly Expansion Revenue', 
          type: 'number', 
          placeholder: 'e.g., 10',
          suffix: '%',
          helpText: 'Revenue growth from existing customers'
        }
      ]
    }
  ];

  const validateField = (field, value) => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }
    if (field.validation) {
      const numValue = parseFloat(value);
      if (field.validation.min !== undefined && numValue < field.validation.min) {
        return field.validation.message || `Must be at least ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && numValue > field.validation.max) {
        return field.validation.message || `Must be at most ${field.validation.max}`;
      }
    }
    return null;
  };

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const newErrors = {};
    let isValid = true;

    step.fields.forEach(field => {
      if (field.required) {
        const error = validateField(field, inputs[field.name]);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onCalculate();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index) => {
    if (index <= currentStep || completedSteps.includes(index)) {
      setCurrentStep(index);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                index === currentStep && 'bg-blue-600 text-white scale-110',
                index < currentStep && 'bg-green-600 text-white',
                index > currentStep && !completedSteps.includes(index) && 'bg-gray-700 text-gray-400',
                (index <= currentStep || completedSteps.includes(index)) && 'cursor-pointer hover:scale-105',
                index > currentStep && !completedSteps.includes(index) && 'cursor-not-allowed'
              )}
              aria-label={`Step ${index + 1}: ${step.title}`}
              disabled={index > currentStep && !completedSteps.includes(index)}
            >
              {index < currentStep ? '✓' : index + 1}
            </button>
          ))}
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CyberCard glowColor="cyan" showCorners={true} dataStream={true}>
            <div className="mb-6">
              <NeonHeading level={3} color="cyan">{currentStepData.title}</NeonHeading>
              <p className="text-gray-400 mt-2">{currentStepData.description}</p>
            </div>

            <div className="space-y-4">
              {currentStepData.fields.map(field => (
                <div key={field.name}>
                  <label 
                    htmlFor={field.name}
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    {field.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {field.prefix}
                      </span>
                    )}
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={inputs[field.name] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      className={clsx(
                        'w-full px-3 py-3 bg-gray-800 border rounded-lg',
                        'text-white placeholder-gray-500',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'min-h-[48px] text-[16px]', // Mobile optimization
                        field.prefix && 'pl-8',
                        field.suffix && 'pr-16',
                        errors[field.name] ? 'border-red-400' : 'border-gray-700'
                      )}
                      aria-label={field.label}
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={`${field.name}-help ${field.name}-error`}
                    />
                    {field.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                  {field.helpText && !errors[field.name] && (
                    <p id={`${field.name}-help`} className="mt-1 text-sm text-gray-500">
                      {field.helpText}
                    </p>
                  )}
                  {errors[field.name] && (
                    <p id={`${field.name}-error`} className="mt-1 text-sm text-red-400" role="alert">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <FuturisticButton
                variant="glass"
                glowColor="purple"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                ariaLabel="Previous step"
              >
                ← Previous
              </FuturisticButton>
              
              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <>
                    <FuturisticButton
                      variant="glass"
                      glowColor="orange"
                      onClick={() => setCurrentStep(steps.length - 1)}
                      ariaLabel="Skip to last step"
                    >
                      Skip to Advanced
                    </FuturisticButton>
                    <FuturisticButton
                      variant="neon"
                      glowColor="cyan"
                      onClick={handleNext}
                      ariaLabel="Next step"
                    >
                      Next →
                    </FuturisticButton>
                  </>
                ) : (
                  <FuturisticButton
                    variant="neon"
                    glowColor="green"
                    onClick={handleNext}
                    size="lg"
                    ariaLabel="Calculate results"
                    icon="🚀"
                  >
                    Calculate Results
                  </FuturisticButton>
                )}
              </div>
            </div>
          </CyberCard>
        </motion.div>
      </AnimatePresence>

      {/* Keyboard Shortcuts Help */}
      <div className="text-center text-sm text-gray-500">
        <span className="inline-flex items-center gap-4">
          <span>Tab: Navigate fields</span>
          <span>Enter: Next step</span>
          <span>Esc: Reset form</span>
        </span>
      </div>
    </div>
  );
};

export default CalculatorWizard;