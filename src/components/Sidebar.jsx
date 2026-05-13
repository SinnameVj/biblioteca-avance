import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Users, LogOut, Grid, BookMarked, User, AlertTriangle, ClipboardList } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const Sidebar = () => {
  const { currentUser, logout } = useAppContext()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getLinks = () => {
    if (currentUser?.role === 'admin') {
      return [
        { path: '/admin', icon: <Grid size={18} />, label: 'Dashboard' },
        { path: '/admin/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
        { path: '/admin/prestamos', icon: <BookMarked size={18} />, label: 'Mostrador' },
        { path: '/admin/usuarios', icon: <Users size={18} />, label: 'Usuarios' },
        { path: '/admin/control-libros', icon: <ClipboardList size={18} />, label: 'Control Libros' },
        { path: '/admin/penalizaciones', icon: <AlertTriangle size={18} />, label: 'Penalizaciones' },
        { path: '/admin/perfil', icon: <User size={18} />, label: 'Perfil' },
      ]
    } else if (currentUser?.role === 'profesor') {
      return [
        { path: '/profesor', icon: <Grid size={18} />, label: 'Inicio' },
        { path: '/profesor/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
        { path: '/profesor/prestamos', icon: <BookMarked size={18} />, label: 'Mis Préstamos' },
        { path: '/profesor/perfil', icon: <User size={18} />, label: 'Perfil' },
      ]
    } else {
      return [
        { path: '/estudiante', icon: <Grid size={18} />, label: 'Inicio' },
        { path: '/estudiante/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
        { path: '/estudiante/prestamos', icon: <BookMarked size={18} />, label: 'Mis Préstamos' },
        { path: '/estudiante/perfil', icon: <User size={18} />, label: 'Perfil' },
      ]
    }
  }

  return (
    <div style={{ 
      width: '240px', 
      background: 'var(--bg-secondary)', 
      borderRight: '1px solid var(--border-light)', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      bottom: 0, 
      zIndex: 100 
    }}>
      {/* Branding Section */}
      <div style={{ padding: '1.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ background: 'var(--accent-primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
          <BookOpen size={16} />
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--text-primary)' }}>UCV Chimbote</span>
      </div>

      {/* Navigation Section */}
      <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {getLinks().map(link => (
          <NavLink 
            key={link.path} 
            to={link.path} 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={link.path === '/admin' || link.path === '/profesor' || link.path === '/estudiante'}
          >
            {link.icon} <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{currentUser?.name}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{currentUser?.username}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-light)', padding: '0.5rem', borderRadius: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
          <LogOut size={14} /> Salir
        </button>
      </div>
    </div>
  )
}

export default Sidebar
