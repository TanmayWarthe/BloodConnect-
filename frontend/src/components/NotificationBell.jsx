import { useState, useEffect, useRef } from 'react'
import { FiBell, FiCheck, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { notificationService } from '../services/notification.service'

const NotificationBell = () => {
  const { currentUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // ── Fetch unread count on mount and every 30 s ────────────────
  useEffect(() => {
    if (!currentUser?.uid) return
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount(currentUser.uid)
        setUnreadCount(typeof res?.data === 'number' ? res.data : 0)
      } catch {
        // silent
      }
    }
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [currentUser?.uid])

  // ── Close on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setIsOpen(v => !v)
    if (!isOpen && currentUser?.uid) {
      setLoading(true)
      try {
        const res = await notificationService.getUnread(currentUser.uid)
        setNotifications(Array.isArray(res?.data) ? res.data : [])
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMarkAllRead = async () => {
    if (!currentUser?.uid) return
    try {
      await notificationService.markAllAsRead(currentUser.uid)
      setNotifications([])
      setUnreadCount(0)
    } catch {
      // silent
    }
  }

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="text-gray-600 text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <FiCheckCircle size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No unread notifications
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">{n.type?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-700 mt-0.5 leading-snug">{n.message}</p>
                    {n.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors shrink-0"
                    aria-label="Mark as read"
                  >
                    <FiCheck size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
