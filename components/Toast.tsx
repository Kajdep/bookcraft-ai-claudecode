import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './Icons';
import { setToastCallback } from '../services/toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onRemove(toast.id), 300);
            }, toast.duration || 5000);

            return () => clearTimeout(timer);
        }
    }, [toast.duration, toast.id, onRemove]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'error':
                return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
            case 'info':
                return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success':
                return 'border-green-500';
            case 'error':
                return 'border-red-500';
            case 'warning':
                return 'border-yellow-500';
            case 'info':
                return 'border-blue-500';
        }
    };

    return (
        <div
            className={`transform transition-all duration-300 ${
                isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
            }`}
        >
            <div className={`bg-slate-800 border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 mb-3 max-w-sm`}>
                <div className="flex items-start space-x-3">
                    {getIcon()}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100">{toast.title}</p>
                        {toast.message && (
                            <p className="text-sm text-slate-300 mt-1">{toast.message}</p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const success = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'success', title, message, duration });
    }, [addToast]);

    const error = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'error', title, message, duration });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'warning', title, message, duration });
    }, [addToast]);

    const info = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'info', title, message, duration });
    }, [addToast]);

    const contextValue: ToastContextType = {
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };

    // Set up global toast callback for use in stores
    useEffect(() => {
        setToastCallback((type, title, message, duration) => {
            addToast({ type, title, message, duration });
        });
    }, [addToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {toasts.map(toast => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onRemove={removeToast}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};