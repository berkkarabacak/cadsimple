import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import Landing from './pages/Landing'
import Workspace from './pages/Workspace'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Workspace />} />
      </Routes>
      <Toaster theme="dark" position="bottom-center" toastOptions={{ style: { background: '#111826', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' } }} />
    </>
  )
}
