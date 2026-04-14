'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
}

function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <AlertCircle className="w-5 h-5 text-blue-500" />
    }

    const bgColors = {
        success: 'bg-green-50 dark:bg-green-950 border-green-200',
        error: 'bg-red-50 dark:bg-red-950 border-red-200',
        info: 'bg-blue-50 dark:bg-blue-950 border-blue-200'
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[type]}`}>
            {icons[type]}
            <span className="text-sm">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

// Hook para usar o toast
let toastContainer: HTMLDivElement | null = null

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div')
        document.body.appendChild(toastContainer)
    }
    return toastContainer
}

export function useSimpleToast() {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }

    const ToastContainer = () => {
        if (toasts.length === 0) return null

        return createPortal(
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>,
            getToastContainer()
        )
    }

    return { showToast, ToastContainer }
}