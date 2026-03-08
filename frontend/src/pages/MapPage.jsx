import Layout from '../components/Layout'
import BloodMap from '../components/BloodMap'

const MapPage = () => {
  return (
    <Layout>
      <div className="p-4 md:p-8 h-[calc(100vh-5rem)] flex flex-col">
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">Blood Map</h1>
          <p className="text-sm text-gray-500 mt-1">Find available donors near you in real time</p>
        </div>
        <div className="flex-1 min-h-0">
          <BloodMap />
        </div>
      </div>
    </Layout>
  )
}

export default MapPage