import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { apiService } from '../services/api.service'
import {
  FiUsers, FiDroplet, FiActivity, FiAlertCircle,
  FiCheck, FiX, FiRefreshCw
} from 'react-icons/fi'

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  </div>
)

const AdminDashboard = () => {
  const [stats, setStats] = useState({ donors: 0, hospitals: 0, requests: 0, inventory: 0 })
  const [donors, setDonors]     = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [donorRes, reqRes, invRes, hospRes] = await Promise.all([
        apiService.get('/donors'),
        apiService.get('/blood-requests'),
        apiService.get('/inventory'),
        apiService.get('/hospitals'),
      ])
      setDonors(donorRes.data || [])
      setRequests(reqRes.data || [])
      setStats({
        donors:    (donorRes.data || []).length,
        hospitals: (hospRes.data || []).length,
        requests:  (reqRes.data || []).length,
        inventory: (invRes.data || []).reduce((acc, i) => acc + (i.units || 0), 0),
      })
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Failed to load admin data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">System-wide overview</p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <FiAlertCircle /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Donors"    value={stats.donors}    icon={<FiUsers className="text-blue-600" />}   color="bg-blue-50" />
          <StatCard label="Hospitals"       value={stats.hospitals} icon={<FiActivity className="text-green-600" />} color="bg-green-50" />
          <StatCard label="Blood Requests"  value={stats.requests}  icon={<FiAlertCircle className="text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Total Units"     value={stats.inventory} icon={<FiDroplet className="text-red-600" />}  color="bg-red-50" />
        </div>

        {/* Recent Donors table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Registered Donors</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : donors.length === 0 ? (
            <p className="text-center py-12 text-gray-400">No donors found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Blood Group', 'Phone', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donors.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          {d.bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{d.phone || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          d.eligible !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {d.eligible !== false ? <FiCheck size={10} /> : <FiX size={10} />}
                          {d.eligible !== false ? 'Eligible' : 'Ineligible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Blood Requests</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center py-12 text-gray-400">No requests found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Patient', 'Blood Group', 'Units', 'Urgency', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.slice(0, 20).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{r.patientName || r.patient?.name || '—'}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{r.bloodGroup}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{r.units}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.urgency === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          r.urgency === 'HIGH'     ? 'bg-orange-100 text-orange-700' :
                                                     'bg-gray-100 text-gray-600'
                        }`}>
                          {r.urgency || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'FULFILLED' ? 'bg-green-100 text-green-700' :
                          r.status === 'PENDING'   ? 'bg-amber-100 text-amber-700' :
                                                     'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default AdminDashboard