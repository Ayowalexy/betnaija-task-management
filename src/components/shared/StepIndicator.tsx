import type { ReactElement } from 'react';
import { Check } from 'lucide-react';
import styles from './StepIndicator.module.css';

export interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  maxStepReached: number;
  onStepClick?: (index: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  maxStepReached,
  onStepClick,
}: StepIndicatorProps): ReactElement {
  return (
    <div className={styles.wrapper}>
      <ol className={styles.list} role="list">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isReachable = index <= maxStepReached;

          const circleCls = [
            styles.circle,
            isCompleted ? styles.completed : '',
            isCurrent ? styles.current : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={step.id} className={styles.item}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => isReachable && onStepClick?.(index)}
                disabled={!isReachable}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className={circleCls} aria-hidden="true">
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                </span>
                <span className={`${styles.label}${isCurrent ? ` ${styles.labelCurrent}` : ''}`}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className={`${styles.connector}${isCompleted ? ` ${styles.connectorDone}` : ''}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
