import dynamic from 'next/dynamic'

// Disable SSR so WebSocket uses browser's  — will want SSR solution
const App = dynamic(() => import('../containers/app'), { ssr: false })

const Index = () => <App />

export default Index
