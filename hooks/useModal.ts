import { useBookCraftStore } from '../store/useStore';

/**
 * Custom hook for modal management using centralized state
 * Provides a consistent API for opening, closing, and checking modal state
 */
export const useModal = (modalType: string) => {
    // FIX: Separate selectors to prevent infinite loops
    const activeModal = useBookCraftStore(state => state.activeModal);
    const openModal = useBookCraftStore(state => state.openModal);
    const closeModal = useBookCraftStore(state => state.closeModal);

    const isOpen = activeModal.type === modalType;
    const data = isOpen ? activeModal.data : null;

    const open = (data?: any) => openModal(modalType, data);
    const close = () => closeModal();

    return { isOpen, data, open, close };
};

/**
 * Hook for accessing global modal utilities
 */
export const useModalManager = () => {
    // FIX: Separate selectors to prevent infinite loops
    const closeAllModals = useBookCraftStore(state => state.closeAllModals);
    const isModalOpen = useBookCraftStore(state => state.isModalOpen);
    const pushModalToStack = useBookCraftStore(state => state.pushModalToStack);
    const popModalFromStack = useBookCraftStore(state => state.popModalFromStack);

    return {
        closeAllModals,
        isModalOpen,
        pushModalToStack,
        popModalFromStack
    };
};