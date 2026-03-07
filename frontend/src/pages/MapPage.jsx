import Layout from '../components/Layout'
import BloodMap from '../components/BloodMap'

const MapPage = () => {
    return (
        <Layout>
            <div className="p-4 md:p-8 h-[calc(100vh-5rem)]">
                <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Blood Map</h1>
                <BloodMap />
            </div>
        </Layout>
    )
}

export default MapPage
