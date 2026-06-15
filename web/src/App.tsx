import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GameDetailPage from './pages/GameDetailPage'
import PicksPage from './pages/PicksPage'
import ParlayPage from './pages/ParlayPage'
import ProfilePage from './pages/ProfilePage'
import TopPicksPage from './pages/TopPicksPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/top-picks" element={<TopPicksPage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/picks" element={<PicksPage />} />
        <Route path="/parlay" element={<ParlayPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  )
}

export default App
