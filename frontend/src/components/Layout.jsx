import { Fragment, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiHome,
  FiDroplet,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiSettings,
  FiChevronDown,
  FiMap,
  FiClock,
  FiActivity
} from 'react-icons/fi'
import { Transition } from '@headlessui/react'
import AIAssistant from './AIAssistant'
import NotificationBell from './NotificationBell'

const ProfileDropdown = ({ userName, userRole, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const menuItems = [
    { label: 'My Profile', icon: <FiUser />, action: () => navigate('/profile') },
    { label: 'Settings', icon: <FiSettings />, action: () => navigate('/profile') },
  ]

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <FiChevronDown
            className={`absolute -right-1 bottom-0 w-4 h-4 bg-white rounded-full border-2 border-white text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''
              }`}
          />
        </div>
      </button>

      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <p className="font-semibold text-gray-800">{userName}</p>
            <p className="text-sm text-gray-500 capitalize">{userRole}</p>
          </div>
          <div className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setIsOpen(false)
                  item.action()
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  )
}

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const userRole = localStorage.getItem('userRole') || currentUser?.role || 'donor'
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User'

  const handleLogout = () => {
    logout()
    localStorage.removeItem('userRole')
    navigate('/')
  }

  const getDashboardPath = () => {
    switch (userRole) {
      case 'donor':
        return '/donor/dashboard'
      case 'hospital':
        return '/hospital/dashboard'
      case 'patient':
        return '/patient/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  const getNavItems = () => {
    const items = [
      { path: getDashboardPath(), icon: <FiHome />, label: 'Dashboard' },
      { path: '/map', icon: <FiMap />, label: 'Blood Map' }
    ]

    if (userRole === 'donor') {
      items.push({ path: '/history', icon: <FiClock />, label: 'Donation History' })
    }

    if (userRole === 'patient') {
      items.push({ path: '/requests', icon: <FiActivity />, label: 'My Requests' })
    }

    return items
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50">
      <Transition show={sidebarOpen} as={Fragment}>
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      </Transition>

      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <FiDroplet className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-800">BloodConnect</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-red-50 text-red-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg border bg-gray-100 hover:bg-gray-200 lg:hidden"
                >
                  {sidebarOpen ? (
                    <FiX className="text-gray-700 text-xl" />
                  ) : (
                    <FiMenu className="text-gray-700 text-xl" />
                  )}
                </button>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-800">
                    {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <NotificationBell />
                <ProfileDropdown userName={userName} userRole={userRole} handleLogout={handleLogout} />
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* AI Assistant Floating Widget */}
        <AIAssistant />
      </div>
    </div>
  )
}

export default Layout
