// Toast service for use outside of React components (like in Zustand stores)
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastCallback {
    (type: ToastType, title: string, message?: string, duration?: number): void;
}

let toastCallback: ToastCallback | null = null;

export const setToastCallback = (callback: ToastCallback) => {
    toastCallback = callback;
};

export const toast = {
    success: (title: string, message?: string, duration?: number) => {
        if (toastCallback) {
            toastCallback('success', title, message, duration);
        } else {
            console.log(`[SUCCESS] ${title}${message ? `: ${message}` : ''}`);
        }
    },
    error: (title: string, message?: string, duration?: number) => {
        if (toastCallback) {
            toastCallback('error', title, message, duration);
        } else {
            console.error(`[ERROR] ${title}${message ? `: ${message}` : ''}`);
        }
    },
    warning: (title: string, message?: string, duration?: number) => {
        if (toastCallback) {
            toastCallback('warning', title, message, duration);
        } else {
            console.warn(`[WARNING] ${title}${message ? `: ${message}` : ''}`);
        }
    },
    info: (title: string, message?: string, duration?: number) => {
        if (toastCallback) {
            toastCallback('info', title, message, duration);
        } else {
            console.info(`[INFO] ${title}${message ? `: ${message}` : ''}`);
        }
    }
};