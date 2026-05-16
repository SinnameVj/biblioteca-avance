import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      {/* marginLeft matches sidebar collapsed width (72px) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '72px', minHeight: '100vh', minWidth: 0 }}>
        <TopBar />
        <main className="animate-fade-in" style={{ padding: '2rem', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
