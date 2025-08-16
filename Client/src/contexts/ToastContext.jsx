// src/contexts/ToastContext.jsx
import React from 'react'

export const ToastContext = React.createContext({
  toasts: [], push: () => {}, remove: () => {}
})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, ...t }])
    setTimeout(() => setToasts((prev) => prev.filter(x => x.id !== id)), 3000)
  }, [])

  const remove = React.useCallback((id) => {
    setToasts((prev) => prev.filter(x => x.id !== id))
  }, [])

  const value = React.useMemo(() => ({ toasts, push, remove }), [toasts, push, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded-lg border shadow bg-white ${t.type === 'error' ? 'border-rose-300' : 'border-gray-200'}`}>
            <span className={t.type === 'error' ? 'text-rose-700' : 'text-gray-700'}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
