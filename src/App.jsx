import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import { CheckCircle, AlertCircle } from 'lucide-react'

import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCatalog from './pages/admin/Catalog'
import AdminPrestamos from './pages/admin/Prestamos'
import AdminPenalties from './pages/admin/Penalties'
import AdminUsuarios from './pages/admin/Usuarios'
import AdminControlLibros from './pages/admin/ControlLibros'
import ProfDashboard from './pages/profesor/Dashboard'
import EstudianteDashboard from './pages/estudiante/Dashboard'
import Catalog from './pages/shared/Catalog'
import MisPrestamos from './pages/shared/MisPrestamos'
import Profile from './pages/shared/Profile'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAppContext()
  if (!currentUser) return <Navigate to="/login" />
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    switch(currentUser.role) {
      case 'admin': return <Navigate to="/admin" />
      case 'profesor': return <Navigate to="/profesor" />
      case 'estudiante': return <Navigate to="/estudiante" />
      default: return <Navigate to="/login" />
    }
  }
  return children
}

function App() {
  const { currentUser, loading, configError, toast } = useAppContext()

  if (configError) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f172a',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f87171', marginBottom: '1rem' }}>Falta Configuración de Supabase</h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
            No he podido encontrar tus credenciales de Supabase. 
            <br /><br />
            <strong>Por favor:</strong>
            <ol style={{ textAlign: 'left', marginTop: '1rem' }}>
              <li>Crea un archivo llamado <code>.env</code> en la carpeta raíz del proyecto.</li>
              <li>Copia el contenido de <code>.env.example</code> a <code>.env</code>.</li>
              <li>Pega tu URL y Anon Key de Supabase en ese archivo.</li>
              <li>Reinicia el servidor de desarrollo (npm run dev).</li>
            </ol>
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f172a',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.1)', 
            borderTopColor: '#3b82f6', 
            borderRadius: '50%',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Cargando Biblioteca...</h2>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>Conectando con Supabase</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {toast && (
          <div style={{ 
            position: 'fixed', top: '2rem', right: '2rem', 
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: toast.type === 'error' ? '#EF4444' : '#10B981',
            padding: '1rem 1.5rem', borderRadius: '12px', 
            border: `1px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
            zIndex: 99999, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            backdropFilter: 'blur(10px)'
          }} className="animate-fade-in">
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span style={{ fontWeight: 600 }}>{toast.message}</span>
          </div>
        )}
        
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to={`/${currentUser.role}`} /> : <Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><MainLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="catalogo" element={<AdminCatalog />} />
            <Route path="prestamos" element={<AdminPrestamos />} />
            <Route path="penalizaciones" element={<AdminPenalties />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="control-libros" element={<AdminControlLibros />} />
            <Route path="perfil" element={<Profile />} />
          </Route>
          
          {/* Professor Routes */}
          <Route path="/profesor" element={<PrivateRoute allowedRoles={['profesor']}><MainLayout /></PrivateRoute>}>
            <Route index element={<ProfDashboard />} />
            <Route path="catalogo" element={<Catalog />} />
            <Route path="prestamos" element={<MisPrestamos />} />
            <Route path="perfil" element={<Profile />} />
          </Route>
          
          {/* Student Routes */}
          <Route path="/estudiante" element={<PrivateRoute allowedRoles={['estudiante']}><MainLayout /></PrivateRoute>}>
            <Route index element={<EstudianteDashboard />} />
            <Route path="catalogo" element={<Catalog />} />
            <Route path="prestamos" element={<MisPrestamos />} />
            <Route path="perfil" element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
