import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi'

// ── Context ───────────────────────────────────────────────
const ToastContext = createContext(null)

const ICONS = {
  success: <FiCheckCircle  size={18} />,
  error:   <FiAlertCircle  size={18} />,
  warning: <FiAlertTriangle size={18} />,
  info:    <FiInfo          size={18} />,
}

const STYLES = {
  success: {
    bar:  'bg-green-500',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-800',
    sub:  'text-green-600',
    ring: 'border-green-100',
  },
  error: {
    bar:  'bg-red-500',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-800',
    sub:  'text-red-500',
    ring: 'border-red-100',
  },
  warning: {
    bar:  'bg-yellow-400',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-800',
    sub:  'text-yellow-600',
    ring: 'border-yellow-100',
  },
  info: {
    bar:  'bg-blue-500',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-800',
    sub:  'text-blue-500',
    ring: 'border-blue-100',
  },
}

// ── Single Toast Item ─────────────────────────────────────
function ToastItem({ id, type = 'info', title, message, duration = 4000, onRemove }) {
  const [visible, setVisible]   = useState(false)
  const [progress, setProgress] = useState(100)
  const s = STYLES[type] || STYLES.info

  useEffect(() => {
    // mount → slide in
    const t1 = setTimeout(() => setVisible(true), 10)

    // progress bar countdown
    const interval = 50
    const steps    = duration / interval
    let   current  = 100
    const t2 = setInterval(() => {
      current -= 100 / steps
      setProgress(Math.max(0, current))
    }, interval)

    // slide out then remove
    const t3 = setTimeout(() => setVisible(false), duration)
    const t4 = setTimeout(() => onRemove(id), duration + 350)

    return () => { clearTimeout(t1); clearTimeout(t3); clearTimeout(t4); clearInterval(t2) }
  }, [id, duration, onRemove])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => onRemove(id), 350)
  }

  return (
    <div
      role="alert"
      className={`
        relative w-80 bg-white rounded-2xl shadow-xl border ${s.ring}
        overflow-hidden pointer-events-auto
        transition-all duration-300 ease-out
        ${visible
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-8 scale-95'}
      `}
    >
      {/* Colored top bar */}
      <div className={`h-1 w-full ${s.bar}`} />

      {/* Progress bar */}
      <div className="absolute top-1 left-0 h-0.5 bg-black/10 transition-all duration-50 ease-linear"
        style={{ width: `${progress}%` }} />

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.icon}`}>
          {ICONS[type]}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <p className={`text-sm font-black leading-tight ${s.text}`}>{title}</p>
          )}
          {message && (
            <p className={`text-xs mt-0.5 leading-relaxed ${title ? s.sub : s.text} ${title ? '' : 'font-bold'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 mt-0.5"
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((type, title, message, duration) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }])
  }, [])

  const api = {
    success: (title, message, duration) => toast('success', title, message, duration),
    error:   (title, message, duration) => toast('error',   title, message, duration),
    warning: (title, message, duration) => toast('warning', title, message, duration),
    info:    (title, message, duration) => toast('info',    title, message, duration),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast Container — bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
