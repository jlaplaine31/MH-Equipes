import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import JoinPage from './pages/JoinPage'
import EditPage from './pages/EditPage'
import WaitingPage from './pages/WaitingPage'

const BASE = '/equipes'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/session/:id" element={<AdminPage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route path="/edit/:token" element={<EditPage />} />
          <Route path="/waiting/:token" element={<WaitingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
