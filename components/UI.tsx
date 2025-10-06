

import React, { PropsWithChildren } from 'react';
// FIX: Corrected import path for Icons.
import { XMarkIcon } from './Icons';

// Spinner Component
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };
    return (
        <div className={`animate-spin rounded-full border-2 border-gray-400 border-t-brand-primary ${sizeClasses[size]}`}></div>
    );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    isLoading?: boolean;
    // FIX: Add a 'size' prop to support different button sizes.
    size?: 'sm' | 'md';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    // FIX: Destructure the 'size' prop with a default value.
    ({ children, className = '', variant = 'primary', isLoading = false, size = 'md', ...props }, ref) => {
        // FIX: Removed sizing classes from baseClasses to be handled by size variants.
        const baseClasses = "inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md";
        const variantClasses = {
            primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary focus-visible:shadow-[0_0_15px_1px_rgba(79,70,229,0.5)]',
            secondary: 'bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-hover focus-visible:ring-slate-500 focus-visible:shadow-[0_0_15px_1px_rgba(100,116,139,0.4)]',
            danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 focus-visible:shadow-[0_0_15px_1px_rgba(220,38,38,0.5)]',
            success: 'bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-500 focus-visible:shadow-[0_0_15px_1px_rgba(22,163,74,0.5)]',
            ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-dark-hover focus-visible:ring-slate-500'
        };
        // FIX: Define classes for different button sizes.
        const sizeClasses = {
            sm: 'px-2.5 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
        };

        return (
            <button
                ref={ref}
                // FIX: Apply size classes along with other classes.
                className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? <Spinner size="sm" /> : children}
            </button>
        );
    }
);
Button.displayName = "Button";


// Card Component
// FIX: Updated the Card component to accept and spread all standard div HTML attributes (like onClick).
// This allows it to be used as a clickable element, which is required in the ChapterKanbanView.
export const Card: React.FC<PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>> = ({ children, className, ...props }) => (
    <div className={`bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg shadow-lg overflow-hidden ${className || ''}`} {...props}>
        {children}
    </div>
);


// Modal Component
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}
export const Modal: React.FC<PropsWithChildren<ModalProps>> = ({ isOpen, onClose, title, children }) => {
    // Handle Escape key to close modal
    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm" 
            aria-modal="true" 
            role="dialog"
            onClick={(e) => {
                // Close modal only if clicking the backdrop, not the modal content
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div 
                className="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-200 dark:border-dark-border-primary"
                onClick={(e) => {
                    // Prevent backdrop click when clicking inside modal
                    e.stopPropagation();
                }}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border-primary">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{title}</h3>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-dark-hover"
                    >
                         <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    confirmText?: string;
    cancelText?: string;
}
export const ConfirmationModal: React.FC<PropsWithChildren<ConfirmationModalProps>> = ({
    isOpen, onClose, onConfirm, title, children, confirmText = 'Confirm', cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-gray-700 dark:text-gray-300">{children}</div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
                <Button variant="danger" onClick={handleConfirm}>{confirmText}</Button>
            </div>
        </Modal>
    );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'default' | 'error';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const baseClasses = "w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800";
        const variantClasses = {
            default: 'bg-white dark:bg-dark-bg-tertiary border-gray-300 dark:border-dark-border-primary text-gray-800 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-primary focus:ring-brand-primary',
            error: 'bg-white dark:bg-dark-bg-tertiary border-red-500 dark:border-red-400 text-gray-800 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-400 focus:ring-red-400'
        };

        return (
            <input
                ref={ref}
                className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

// Tooltip Component
interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    disabled?: boolean;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 500,
    disabled = false,
    className = ''
}) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [delayTimeout, setDelayTimeout] = React.useState<NodeJS.Timeout | null>(null);
    const [actualPosition, setActualPosition] = React.useState(position);
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLElement>(null);

    const showTooltip = React.useCallback(() => {
        if (disabled) return;

        const timeout = setTimeout(() => {
            setIsVisible(true);
            // Position detection for mobile responsiveness
            if (tooltipRef.current && triggerRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let newPosition = position;

                // Check if tooltip would go off-screen and adjust position
                if (position === 'top' && triggerRect.top < 60) {
                    newPosition = 'bottom';
                } else if (position === 'bottom' && triggerRect.bottom > viewportHeight - 60) {
                    newPosition = 'top';
                } else if (position === 'left' && triggerRect.left < 200) {
                    newPosition = 'right';
                } else if (position === 'right' && triggerRect.right > viewportWidth - 200) {
                    newPosition = 'left';
                }

                setActualPosition(newPosition);
            }
        }, delay);
        setDelayTimeout(timeout);
    }, [delay, disabled, position]);

    const hideTooltip = React.useCallback(() => {
        if (delayTimeout) {
            clearTimeout(delayTimeout);
            setDelayTimeout(null);
        }
        setIsVisible(false);
    }, [delayTimeout]);

    const handleMouseEnter = React.useCallback(() => {
        showTooltip();
    }, [showTooltip]);

    const handleMouseLeave = React.useCallback(() => {
        hideTooltip();
    }, [hideTooltip]);

    const handleFocus = React.useCallback(() => {
        showTooltip();
    }, [showTooltip]);

    const handleBlur = React.useCallback(() => {
        hideTooltip();
    }, [hideTooltip]);

    // Touch event handlers for mobile
    const handleTouchStart = React.useCallback(() => {
        showTooltip();
    }, [showTooltip]);

    const handleTouchEnd = React.useCallback(() => {
        // Delay hiding on mobile to give users time to read
        setTimeout(hideTooltip, 1500);
    }, [hideTooltip]);

    React.useEffect(() => {
        return () => {
            if (delayTimeout) {
                clearTimeout(delayTimeout);
            }
        };
    }, [delayTimeout]);

    // Position classes for the tooltip
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    // Arrow classes for the tooltip
    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-900',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-900',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-slate-900'
    };

    // Generate unique ID for tooltip
    const tooltipId = React.useId();

    // Clone the children element to add event handlers
    const clonedChildren = React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        'aria-describedby': isVisible ? tooltipId : undefined,
        'aria-label': typeof content === 'string' ? content : undefined,
    });

    return (
        <div className="relative inline-block">
            {clonedChildren}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    id={tooltipId}
                    role="tooltip"
                    aria-live="polite"
                    className={`
                        absolute z-50 px-3 py-2 text-xs font-medium text-gray-900 bg-white rounded-lg shadow-lg border border-gray-300
                        max-w-xs sm:max-w-sm break-words tooltip-mobile
                        animate-in fade-in-0 zoom-in-95 duration-200
                        ${positionClasses[actualPosition]}
                        ${className}
                    `}
                    style={{
                        animation: 'fadeIn 0.2s ease-out forwards'
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className={`absolute w-0 h-0 ${arrowClasses[actualPosition]}`}
                        aria-hidden="true"
                    />
                </div>
            )}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(2px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @media (max-width: 640px) {
                    .tooltip-mobile {
                        font-size: 0.75rem;
                        padding: 0.5rem 0.75rem;
                        max-width: calc(100vw - 2rem);
                    }
                }
            `}</style>
        </div>
    );
};

// Badge Component
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = ''
}) => {
    const baseClasses = "inline-flex items-center font-medium rounded-full";
    
    const variantClasses = {
        default: 'bg-white text-gray-800 border border-gray-300',
        success: 'bg-green-700/20 text-green-300 border border-green-600/50',
        warning: 'bg-yellow-700/20 text-yellow-300 border border-yellow-600/50',
        danger: 'bg-red-700/20 text-red-300 border border-red-600/50',
        info: 'bg-blue-700/20 text-blue-300 border border-blue-600/50',
        secondary: 'bg-gray-700/20 text-gray-300 border border-gray-600/50'
    };
    
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    };
    
    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
            {children}
        </span>
    );
};

// Select Component
interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select an option...",
    className = '',
    disabled = false
}) => {
    const baseClasses = "w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white cursor-pointer";
    const variantClasses = "bg-white border-gray-300 text-gray-800 focus:border-brand-primary focus:ring-brand-primary";

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} ${variantClasses} ${className}`}
            disabled={disabled}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

// TextArea Component
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: 'default' | 'error';
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const baseClasses = "w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white resize-vertical";
        const variantClasses = {
            default: 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-brand-primary focus:ring-brand-primary',
            error: 'bg-white border-red-500 text-gray-800 placeholder-gray-400 focus:border-red-400 focus:ring-red-400'
        };

        return (
            <textarea
                ref={ref}
                className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                {...props}
            />
        );
    }
);
TextArea.displayName = "TextArea";
