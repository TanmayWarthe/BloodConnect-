import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiDroplet, FiActivity, FiMapPin, FiShield, FiTrendingUp, FiClock, FiHeart, FiUsers, FiBarChart2, FiChevronRight, FiCheckCircle, FiZap, FiTarget, FiGlobe, FiStar } from 'react-icons/fi'
import AuthModal from '../components/AuthModal'

function LandingPage() {
  const { currentUser } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [activeFeature, setActiveFeature] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [stats, setStats] = useState({
    livesImpacted: 0,
    donorsOnline: 0,
    hospitalsActive: 0,
    responseTime: 0
  })

  useEffect(() => {
    // Animate stats counter
    const interval = setInterval(() => {
      setStats(prev => ({
        livesImpacted: prev.livesImpacted < 12000 ? prev.livesImpacted + 200 : prev.livesImpacted,
        donorsOnline: prev.donorsOnline < 2400 ? prev.donorsOnline + 40 : prev.donorsOnline,
        hospitalsActive: prev.hospitalsActive < 85 ? prev.hospitalsActive + 2 : prev.hospitalsActive,
        responseTime: prev.responseTime < 45 ? prev.responseTime + 1 : prev.responseTime
      }))
    }, 30)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getDashboardPath = () => {
    if (!currentUser) return '/login'
    const role = currentUser.role?.toLowerCase()
    const validRoles = ['donor', 'hospital', 'patient', 'admin']
    if (role && validRoles.includes(role)) return `/${role}/dashboard`
    return '/donor/dashboard'
  }

  const openAuthModal = (mode) => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const features = [
    {
      icon: <FiTrendingUp />,
      title: "Predictive Analytics",
      description: "AI forecasts blood shortages 3-7 days in advance.",
      color: "from-blue-500 to-blue-600",
      details: "Machine learning algorithms analyze historical data, seasonal patterns, and hospital demand to predict shortages before they happen."
    },
    {
      icon: <FiShield />,
      title: "Donor Safety",
      description: "Smart health monitoring prevents over-donation risks.",
      color: "from-green-500 to-green-600",
      details: "Track donation frequency, health vitals, and eligibility status to ensure donor well-being is always prioritized."
    },
    {
      icon: <FiMapPin />,
      title: "Smart Matching",
      description: "Intelligent donor-recipient matching in real-time.",
      color: "from-purple-500 to-purple-600",
      details: "Geolocation, blood type compatibility, and urgency levels are analyzed to find the optimal match instantly."
    },
    {
      icon: <FiActivity />,
      title: "Live Tracking",
      description: "Real-time status updates for all blood requests.",
      color: "from-orange-500 to-orange-600",
      details: "Monitor the entire journey from request to delivery with live updates and notifications."
    }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Head of Transfusion, St. Mary's Hospital",
      text: "BloodConnect reduced our emergency response time by 68%. A game-changer for critical care.",
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Regular Donor, 42 donations",
      text: "The app makes donation effortless. I get notified when my specific blood type is needed nearby.",
      avatar: "MR"
    },
    {
      name: "Lisa Thompson",
      role: "Patient Coordinator",
      text: "We've eliminated 90% of last-minute emergency calls. The predictive system is incredibly accurate.",
      avatar: "LT"
    }
  ]

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 font-sans overflow-x-hidden">
      {/* Header */}
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrollY > 50
            ? 'bg-white/95 backdrop-blur-sm shadow-lg py-3'
            : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`relative transition-all duration-300 ${scrollY > 50 ? 'w-10 h-10' : 'w-12 h-12'
                }`}>
                <div className="absolute inset-0 bg-linear-to-br from-primary to-primary-dark rounded-xl transform rotate-45"></div>
                <FiDroplet className="absolute inset-0 flex items-center justify-center text-white transform -rotate-45" />
              </div>
              <span className={`font-display font-bold transition-all duration-300 ${scrollY > 50 ? 'text-2xl' : 'text-3xl'
                } text-gray-900`}>
                BloodConnect
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <Link
                  to={getDashboardPath()}
                  className="relative px-5 py-2.5 bg-linear-to-r from-primary to-primary-dark text-white font-medium rounded-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Dashboard
                    <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-2.5 text-gray-700 hover:text-primary font-medium transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="relative px-5 py-2.5 bg-linear-to-r from-primary to-primary-dark text-white font-medium rounded-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-linear-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-blue-50 to-primary/10 border border-primary/20 mb-6 animate-fade-in">
                <FiZap className="text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">AI-Powered Life Saving Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight text-gray-900">
                When Every
                <span className="relative">
                  <span className="relative z-10 bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                    {" "}Second{" "}
                  </span>
                  <span className="absolute inset-0 bg-linear-to-r from-primary/20 to-primary-dark/20 blur-xl"></span>
                </span>
                Counts
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                BloodConnect intelligently bridges donors with recipients in need.
                Real-time matching, predictive analytics, and seamless coordination
                for hospitals and donors alike.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!currentUser && (
                  <>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="group relative px-6 py-3.5 bg-linear-to-r from-primary to-primary-dark text-white font-semibold rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Start Saving Lives
                        <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-linear-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button
                      onClick={scrollToFeatures}
                      className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-primary hover:text-primary transition-all duration-300"
                    >
                      See How It Works
                    </button>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.livesImpacted.toLocaleString()}+</div>
                  <div className="text-sm text-gray-500">Lives Impacted</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.donorsOnline}+</div>
                  <div className="text-sm text-gray-500">Active Donors</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.hospitalsActive}+</div>
                  <div className="text-sm text-gray-500">Hospitals</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.responseTime}s</div>
                  <div className="text-sm text-gray-500">Avg. Response</div>
                </div>
              </div>
            </div>

            {/* Interactive Hero Visualization */}
            <div className="lg:w-1/2 relative">
              <div className="relative bg-linear-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-2xl">
                {/* Animated Network Visualization */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute w-full h-full">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-4 h-4 bg-primary/20 rounded-full animate-ping"
                        style={{
                          left: `${Math.random() * 90}%`,
                          top: `${Math.random() * 90}%`,
                          animationDelay: `${i * 300}ms`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-4">
                  {/* Donor Node */}
                  <div className="col-span-1">
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        <FiUsers className="text-white text-xl" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">Donors</div>
                        <div className="text-sm text-gray-600">Ready to help</div>
                      </div>
                    </div>
                  </div>

                  {/* Central Matching Node */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        <FiDroplet className="text-white text-2xl" />
                      </div>
                      <div className="absolute -inset-4 border-2 border-primary/30 rounded-full animate-ping"></div>
                    </div>
                  </div>

                  {/* Hospital Node */}
                  <div className="col-span-1">
                    <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        <FiActivity className="text-white text-xl" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">Hospitals</div>
                        <div className="text-sm text-gray-600">Patients in need</div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Lines */}
                  <div className="col-span-3 mt-6">
                    <div className="relative h-2 bg-linear-to-r from-blue-500 via-primary to-green-500 rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                    </div>
                    <div className="text-center mt-3 text-sm text-gray-600">
                      Real-time intelligent matching
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-linear-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              How BloodConnect Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Intelligent technology meets human compassion in our life-saving platform
            </p>
          </div>

          {/* Interactive Feature Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveFeature(idx)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${activeFeature === idx
                      ? 'border-primary bg-linear-to-r from-primary/5 to-primary/10 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                      <div className="text-white text-xl">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {feature.description}
                      </p>
                      {activeFeature === idx && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">
                            {feature.details}
                          </p>
                        </div>
                      )}
                    </div>
                    <FiChevronRight className={`text-gray-400 transition-transform duration-300 ${activeFeature === idx ? 'rotate-90 text-primary' : ''
                      }`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Visualization */}
            <div className="relative">
              <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-xl">
                <div className="relative h-64 rounded-xl overflow-hidden bg-linear-to-br from-primary/5 to-primary/10">
                  {/* Animated visualization based on active feature */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                        {features[activeFeature].icon}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {features[activeFeature].title}
                      </h4>
                      <p className="text-gray-600">
                        Active visualization
                      </p>
                    </div>
                  </div>

                  {/* Animated elements */}
                  <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{
                          left: `${Math.random() * 90}%`,
                          top: `${Math.random() * 90}%`,
                          animationDelay: `${i * 100}ms`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-linear-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Trusted by Medical Professionals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from hospitals and donors who use BloodConnect daily
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-600 italic mb-6">
                  "{testimonial.text}"
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-primary-dark/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary/20 mb-6">
            <FiTarget className="text-primary" />
            <span className="text-sm font-medium text-primary">Ready to Make a Difference?</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
            Join the Life-Saving Network
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Whether you're a donor, hospital, or patient - together we can save more lives, faster.
          </p>

          {!currentUser && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => openAuthModal('register')}
                className="group relative px-8 py-4 bg-linear-to-r from-primary to-primary-dark text-white font-bold rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <FiHeart className="group-hover:animate-pulse" />
                  Start Saving Lives Today
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-primary hover:text-primary transition-all duration-300"
              >
                Sign In to Your Account
              </button>
            </div>
          )}

          {currentUser && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={getDashboardPath()}
                className="group relative px-8 py-4 bg-linear-to-r from-primary to-primary-dark text-white font-bold rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Go to Dashboard
                  <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                to="/explore"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-primary hover:text-primary transition-all duration-300"
              >
                Explore Features
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary-dark flex items-center justify-center">
                <FiDroplet className="text-white text-lg" />
              </div>
              <div>
                <div className="text-xl font-display font-bold">BloodConnect</div>
                <div className="text-sm text-gray-400">Saving lives through technology</div>
              </div>
            </div>

            <div className="text-gray-400 text-sm text-center md:text-right">
              <div className="mb-2">© {new Date().getFullYear()} BloodConnect. All rights reserved.</div>
              <div className="flex flex-wrap justify-center md:justify-end gap-4 text-gray-500">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
                <a href="#" className="hover:text-white transition-colors">Careers</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default LandingPage