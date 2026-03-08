import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiHome, FiDroplet, FiLogOut, FiMenu, FiX, FiUser,
  FiSettings, FiChevronDown, FiMap, FiClock, FiActivity, FiShield
} from 'react-icons/fi'
import AIAssistant from './AIAssistant'
import NotificationBell from './NotificationBell'

// ── Profile Dropdown ─────────────────────────────────────────────
const ProfileDropdown = ({ userName, userRole, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const close = () => setIsOpen(false)

  const menuItems = [
    { label: 'My Profile', icon: <FiUser size={15} />,    action: () => { close(); navigate('/profile') } },
    { label: 'Settings',   icon: <FiSettings size={15} />, action: () => { close(); navigate('/profile') } },
  ]

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(v => !v)} className="flex items-center gap-3 focus:outline-none">
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-gray-800 truncate max-w-35">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <FiChevronDown
            size={13}
            className={`absolute -right-0.5 -bottom-0.5 bg-white rounded-full border border-gray-200 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Overlay to close on outside click */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={close} />
      )}

      {/* Dropdown */}
      <div className={`absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden transition-all duration-200 origin-top-right ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="font-semibold text-gray-800 text-sm">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole} account</p>
        </div>
        <div className="py-1">
          {menuItems.map(item => (
            <button key={item.label} onClick={item.action}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100">
          <button onClick={() => { close(); handleLogout() }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
            <FiLogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ───────────────────────────────────────────────────────
const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const userRole = currentUser?.role?.toLowerCase() || 'donor'
  const userName  = currentUser?.name || currentUser?.email?.split('@')[0] || 'User'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardPath = () => {
    const map = {
      donor:    '/donor/dashboard',
      hospital: '/hospital/dashboard',
      patient:  '/patient/dashboard',
      admin:    '/admin/dashboard',
    }
    return map[userRole] || '/'
  }

  const getNavItems = () => {
    const items = [
      { path: getDashboardPath(), icon: <FiHome size={18} />,    label: 'Dashboard' },
      { path: '/map',             icon: <FiMap size={18} />,     label: 'Blood Map'  },
    ]
    if (userRole === 'donor')    items.push({ path: '/history',  icon: <FiClock size={18} />,    label: 'Donation History' })
    if (userRole === 'patient')  items.push({ path: '/requests', icon: <FiActivity size={18} />, label: 'My Requests'      })
    if (userRole === 'hospital') items.push({ path: '/history',  icon: <FiActivity size={18} />, label: 'Request History'  })
    if (userRole === 'admin')    items.push({ path: '/admin/dashboard', icon: <FiShield size={18} />, label: 'Admin Panel' })
    return items
  }

  const navItems = getNavItems()
  const currentPageLabel = navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center h-20 px-6 border-b border-gray-200 shrink-0">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-linear-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
              <FiDroplet className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-gray-900">BloodConnect</span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="px-3 py-2 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-semibold text-red-600 capitalize">{userRole}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                {item.icon}
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-red-500 rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
            <FiLogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200 shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(v => !v)}
                  className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 lg:hidden transition-colors">
                  {sidebarOpen ? <FiX className="text-gray-700" /> : <FiMenu className="text-gray-700" />}
                </button>
                <div className="hidden sm:block">
                  <h1 className="text-base font-semibold text-gray-900">{currentPageLabel}</h1>
                  <p className="text-xs text-gray-500 capitalize">{userRole} Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <ProfileDropdown userName={userName} userRole={userRole} handleLogout={handleLogout} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* Floating AI chat */}
      <AIAssistant />
    </div>
  )
}

export default Layout