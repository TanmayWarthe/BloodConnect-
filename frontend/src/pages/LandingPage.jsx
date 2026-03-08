import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiDroplet, FiActivity, FiMapPin, FiShield, FiTrendingUp,
  FiClock, FiHeart, FiUsers, FiChevronRight, FiZap,
  FiTarget, FiStar, FiArrowRight, FiCheck, FiMenu, FiX
} from 'react-icons/fi'
import AuthModal from '../components/AuthModal'

function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

const FeatureCard = ({ icon, title, desc }) => (
  <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-red-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -translate-y-16 translate-x-16 group-hover:bg-red-100 transition-colors duration-300" />
    <div className="relative">
      <div className="w-12 h-12 bg-red-50 group-hover:bg-red-500 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
        <span className="text-red-500 group-hover:text-white text-xl transition-colors duration-300">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
)

export default function LandingPage() {
  const { currentUser } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const lives     = useCounter(12847)
  const donors    = useCounter(2431)
  const hospitals = useCounter(87)
  const seconds   = useCounter(42)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const openAuth = (mode) => { setAuthMode(mode); setAuthModalOpen(true); setMobileMenu(false) }

  const getDashboardPath = () => {
    if (!currentUser) return '/'
    const map = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', patient: '/patient/dashboard', admin: '/admin/dashboard' }
    return map[currentUser.role?.toLowerCase()] || '/donor/dashboard'
  }

  const features = [
    { icon: <FiTrendingUp />, title: 'Predictive Analytics',  desc: 'AI forecasts blood shortages 3–7 days in advance using historical patterns and demand signals.' },
    { icon: <FiMapPin />,     title: 'Smart Geo Matching',    desc: 'Instantly match donors to recipients by location, blood type, and urgency level.' },
    { icon: <FiShield />,     title: 'Donor Safety First',    desc: 'Smart health monitoring prevents over-donation and tracks eligibility automatically.' },
    { icon: <FiActivity />,   title: 'Live Request Tracking', desc: 'Real-time status updates from request creation to delivery — zero guesswork.' },
    { icon: <FiZap />,        title: 'Instant Alerts',        desc: 'Push notifications reach the right donors within seconds of a critical request.' },
    { icon: <FiClock />,      title: '45s Response Time',     desc: 'Our average donor-to-hospital connection time. Speed is everything.' },
  ]

  const steps = [
    { title: 'Create your profile', desc: 'Register as a donor, patient, or hospital in under 2 minutes.' },
    { title: 'Get matched instantly', desc: 'Our AI engine finds the closest compatible donor or recipient.' },
    { title: 'Save a life',          desc: 'Coordinate, donate, and track — all in one place.' },
  ]

  // const testimonials = [
  //   { name: 'Dr. Sarah Chen',    role: "Head of Transfusion, St. Mary's", text: 'BloodConnect reduced our emergency response time by 68%. A genuine game-changer for critical care.', initials: 'SC' },
  //   { name: 'Michael Rodriguez', role: 'Regular Donor — 42 donations',    text: 'I get notified the moment my blood type is needed nearby. It feels incredible to help.', initials: 'MR' },
  //   { name: 'Lisa Thompson',     role: 'Patient Coordinator',              text: "We've eliminated 90% of last-minute emergency calls. The predictive system is uncanny.", initials: 'LT' },
  // ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <FiDroplet className="text-white text-lg" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">BloodConnect</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['features', 'how'].map(id => (
              <a key={id} href={`#${id}`} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors capitalize">
                {id === 'how' ? 'How it works' : id}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <Link to={getDashboardPath()}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                Dashboard <FiArrowRight size={14} />
              </Link>
            ) : (
              <>
                <button onClick={() => openAuth('login')}
                  className="text-gray-600 hover:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                  Sign In
                </button>
                <button onClick={() => openAuth('register')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                  Get Started <FiArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenu(v => !v)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            {mobileMenu ? <FiX size={22} className="text-gray-700" /> : <FiMenu size={22} className="text-gray-700" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl px-4 py-4 space-y-2">
            {[['features','Features'],['how','How it works']].map(([id,label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMobileMenu(false)}
                className="block px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors">
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <button onClick={() => openAuth('login')} className="w-full py-2.5 text-center text-gray-700 font-semibold text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Sign In</button>
              <button onClick={() => openAuth('register')} className="w-full py-2.5 text-center text-white font-bold text-sm bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-150 h-150 bg-red-50 rounded-full translate-x-1/2 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-100 h-100 bg-red-50 rounded-full -translate-x-1/2 translate-y-1/4" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full mb-8">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">AI-Powered Blood Management</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] mb-6 tracking-tight">
                When Every<br />
                <span className="text-red-500">Second</span><br />
                Counts.
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                BloodConnect bridges donors and hospitals in real time. Intelligent matching, predictive analytics, and life-saving speed — all in one platform.
              </p>

              {!currentUser ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => openAuth('register')}
                    className="group flex items-center justify-center gap-2 px-7 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-red-200 hover:shadow-2xl hover:-translate-y-0.5">
                    Start Saving Lives <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a href="#how"
                    className="flex items-center justify-center gap-2 px-7 py-4 bg-white border-2 border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-500 font-bold rounded-2xl transition-all duration-200 hover:-translate-y-0.5">
                    See How It Works
                  </a>
                </div>
              ) : (
                <Link to={getDashboardPath()}
                  className="inline-flex items-center gap-2 px-7 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-200 hover:-translate-y-0.5">
                  Go to Dashboard <FiArrowRight />
                </Link>
              )}

              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-100">
                <div className="flex -space-x-3">
                  {[['SC','#ef4444'],['MR','#dc2626'],['LT','#b91c1c'],['AK','#991b1b'],['PD','#7f1d1d']].map(([init,color], idx) => (
                    <div key={idx} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: color }}>
                      {init}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => <FiStar key={i} size={13} className="text-yellow-400" />)}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Trusted by <span className="text-gray-900 font-bold">2,400+</span> donors</p>
                </div>
              </div>
            </div>

            {/* Dashboard preview card */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-red-500 px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                        <FiDroplet className="text-white text-sm" />
                      </div>
                      <span className="text-white font-bold text-sm">BloodConnect Live</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white text-xs font-medium">Live</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[['2,431','Active Donors'],['147','Requests Today'],['143','Matched']].map(([val,lbl]) => (
                      <div key={lbl} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                        <div className="text-white font-black text-lg">{val}</div>
                        <div className="text-red-100 text-xs mt-0.5">{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Matches</p>
                  <div className="space-y-3">
                    {[
                      { blood: 'O+',  from: 'Rahul M.',  to: 'Apollo Hospital', time: '2m ago', status: 'Matched',   statusColor: 'bg-blue-50 text-blue-600' },
                      { blood: 'AB-', from: 'Priya S.',  to: 'AIIMS',           time: '5m ago', status: 'En Route',  statusColor: 'bg-orange-50 text-orange-600' },
                      { blood: 'B+',  from: 'Arjun K.',  to: 'City Hospital',   time: '8m ago', status: 'Delivered', statusColor: 'bg-green-50 text-green-600' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-red-600 font-black text-xs">{item.blood}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{item.from} → {item.to}</p>
                          <p className="text-xs text-gray-400">{item.time}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${item.statusColor}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-6 mb-6 h-24 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  {[{x:'20%',y:'30%'},{x:'50%',y:'55%'},{x:'70%',y:'25%'},{x:'35%',y:'65%'},{x:'80%',y:'60%'}].map((pos, i) => (
                    <div key={i} className="absolute" style={{ left: pos.x, top: pos.y }}>
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                      <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-40" />
                    </div>
                  ))}
                  <div className="absolute bottom-2 right-3 text-xs font-semibold text-gray-400">Blood Map — Live</div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-8 top-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 hidden lg:block">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                    <FiCheck className="text-green-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Match Found</p>
                    <p className="text-xs text-gray-400">O+ donor nearby</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 bottom-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 hidden lg:block">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                    <FiHeart className="text-red-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Life Saved</p>
                    <p className="text-xs text-gray-400">Just now</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="bg-red-500 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: lives,     suffix: '+', label: 'Lives Impacted' },
              { val: donors,    suffix: '+', label: 'Active Donors' },
              { val: hospitals, suffix: '+', label: 'Partner Hospitals' },
              { val: seconds,   suffix: 's', label: 'Avg. Response' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1 tabular-nums">
                  {s.val.toLocaleString()}{s.suffix}
                </div>
                <div className="text-red-200 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full mb-5">
              <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">Platform Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Everything you need<br />to save more lives
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Purpose-built tools for donors, patients, and hospitals working together.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full mb-6">
                <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">How It Works</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                Simple.<br />Fast.<br />Life-saving.
              </h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                From registration to donation in minutes. Our streamlined process removes every barrier between a donor and someone in need.
              </p>
              <div className="space-y-7">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-red-200">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{s.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { role: 'Donor',    bg: 'bg-red-50',    border: 'border-red-100',    iconBg: 'bg-red-500',    icon: <FiHeart />,    perks: ['Donation history tracking','Smart eligibility reminders','Impact dashboard'] },
                { role: 'Patient',  bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-500', icon: <FiUsers />,    perks: ['Submit blood requests','Real-time status updates','Hospital connections'] },
                { role: 'Hospital', bg: 'bg-blue-50',   border: 'border-blue-100',   iconBg: 'bg-blue-500',   icon: <FiActivity />, perks: ['Inventory management','Donor network access','Analytics dashboard'] },
              ].map(r => (
                <div key={r.role} className={`${r.bg} ${r.border} border rounded-2xl p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`${r.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0`}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">{r.role}</h4>
                      <div className="space-y-1">
                        {r.perks.map(p => (
                          <div key={p} className="flex items-center gap-2 text-sm text-gray-600">
                            <FiCheck size={13} className="text-green-500 shrink-0" /> {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full mb-5">
              <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">Real Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Trusted by those<br />on the front lines
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-red-200 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => <FiStar key={j} size={14} className="text-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── CTA ─────────────────────────────────────────────────── */}
      {/* <section className="py-24 bg-red-500 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full mb-8">
            <FiHeart className="text-white text-xs animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide uppercase">Join the Network</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Ready to save<br />a life today?
          </h2>
          <p className="text-red-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Whether you're a donor, patient, or hospital — every second matters. Join BloodConnect and be part of the change.
          </p>
          {!currentUser ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => openAuth('register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-500 font-black rounded-2xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5">
                Create Free Account <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => openAuth('login')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border-2 border-white/30 hover:border-white text-white font-bold rounded-2xl transition-all duration-200 hover:-translate-y-0.5">
                Sign In
              </button>
            </div>
          ) : (
            <Link to={getDashboardPath()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-500 font-black rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
              Go to Dashboard <FiArrowRight />
            </Link>
          )}
        </div>
      </section> */}

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center">
                <FiDroplet className="text-white" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight">BloodConnect</div>
                <div className="text-xs text-gray-500">Saving lives through technology</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-gray-500">
              {['Privacy Policy','Terms of Service','Contact','Careers'].map(l => (
                <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
            <p className="text-gray-600 text-xs">© {new Date().getFullYear()} BloodConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
    </div>
  )
}