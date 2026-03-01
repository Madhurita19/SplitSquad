import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'CONFIRM',
        cancelText: 'CANCEL',
        variant: 'danger', // 'danger' | 'warning'
        onConfirm: null,
    });

    const confirm = useCallback(({ title, message, confirmText, cancelText, variant }) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: title || 'ARE YOU SURE?',
                message: message || '',
                confirmText: confirmText || 'CONFIRM',
                cancelText: cancelText || 'CANCEL',
                variant: variant || 'danger',
                onConfirm: resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        confirmState.onConfirm?.(true);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        confirmState.onConfirm?.(false);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            {confirmState.isOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white brutalist-border shadow-neo-8 w-full max-w-sm overflow-hidden">
                        {/* Header */}
                        <div className={`${confirmState.variant === 'danger' ? 'bg-neo-pink' : 'bg-neon-yellow'} p-4 border-b-4 border-black flex items-center gap-3`}>
                            <div className="bg-white brutalist-border p-2">
                                <span className="material-symbols-outlined text-black font-black">
                                    {confirmState.variant === 'danger' ? 'warning' : 'help'}
                                </span>
                            </div>
                            <h2 className={`font-display text-xl uppercase tracking-tighter ${confirmState.variant === 'danger' ? 'text-white' : 'text-black'}`}>
                                {confirmState.title}
                            </h2>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            <p className="font-mono text-sm font-bold text-black uppercase leading-relaxed">
                                {confirmState.message}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-4 border-t-4 border-black bg-background-light">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 bg-white brutalist-border font-display text-sm text-black uppercase shadow-neo-4 hover:translate-y-0.5 hover:shadow-none active:translate-y-1 transition-all"
                            >
                                {confirmState.cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 py-3 ${confirmState.variant === 'danger' ? 'bg-neo-pink text-white' : 'bg-neon-yellow text-black'} brutalist-border font-display text-sm uppercase shadow-neo-4 hover:translate-y-0.5 hover:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2`}
                            >
                                <span className="material-symbols-outlined text-sm font-black">
                                    {confirmState.variant === 'danger' ? 'delete_forever' : 'check'}
                                </span>
                                {confirmState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
