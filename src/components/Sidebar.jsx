import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Users, LogOut, Grid, BookMarked, User, AlertTriangle, ClipboardList, ChevronRight } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const SIDEBAR_COLLAPSED = '72px'
const SIDEBAR_EXPANDED = '230px'

const Sidebar = () => {
  const { currentUser, logout } = useAppContext()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

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
    <>
      {/* Sidebar */}
      <div
        className={`sidebar-root${expanded ? ' sidebar-expanded' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <BookOpen size={15} />
          </div>
          <span className="sidebar-brand-name">UCV Chimbote</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {getLinks().map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              end={link.path === '/admin' || link.path === '/profesor' || link.path === '/estudiante'}
              title={!expanded ? link.label : undefined}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <User size={15} color="var(--text-secondary)" />
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{currentUser?.name}</p>
              <p className="sidebar-user-sub">{currentUser?.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-logout"
            title={!expanded ? 'Salir' : undefined}
          >
            <span className="sidebar-link-icon"><LogOut size={15} /></span>
            <span className="sidebar-link-label">Salir</span>
          </button>
        </div>
      </div>

      {/* Sidebar CSS scoped here */}
      <style>{`
        .sidebar-root {
          width: ${SIDEBAR_COLLAPSED};
          min-width: ${SIDEBAR_COLLAPSED};
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 200;
          overflow: hidden;
          transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width;
        }

        .sidebar-root.sidebar-expanded {
          width: ${SIDEBAR_EXPANDED};
          box-shadow: 4px 0 24px rgba(0,0,0,0.35);
        }

        /* ── Branding ── */
        .sidebar-brand {
          padding: 1.15rem 0;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          border-bottom: 1px solid var(--border-light);
          min-height: 58px;
          padding-left: 0;
          justify-content: flex-start;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sidebar-logo {
          width: 72px;
          min-width: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-logo svg {
          background: var(--accent-primary);
          width: 28px;
          height: 28px;
          border-radius: 7px;
          padding: 5px;
          color: #FFF;
          flex-shrink: 0;
        }

        .sidebar-brand-name {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: var(--text-primary);
          white-space: nowrap;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s ease 0.06s, transform 0.2s ease 0.06s;
          pointer-events: none;
        }

        .sidebar-root.sidebar-expanded .sidebar-brand-name {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Nav ── */
        .sidebar-nav {
          flex: 1;
          padding: 0.85rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0;
          border-radius: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.88rem;
          transition: background 0.18s ease, color 0.18s ease;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
          margin: 0 8px;
        }

        .sidebar-link:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background: var(--accent-primary);
          color: #FFFFFF;
          box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
        }

        .sidebar-link-icon {
          width: 56px;
          min-width: 56px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: width 0.28s ease;
        }

        .sidebar-link-label {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
          white-space: nowrap;
          pointer-events: none;
        }

        .sidebar-root.sidebar-expanded .sidebar-link-label {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Footer ── */
        .sidebar-footer {
          border-top: 1px solid var(--border-light);
          padding: 0.85rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0;
          overflow: hidden;
          padding: 0.2rem 0;
        }

        .sidebar-avatar {
          width: 72px;
          min-width: 72px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-avatar > * {
          /* wrapper div */
        }

        .sidebar-avatar svg {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 50%;
          padding: 6px;
          width: 30px;
          height: 30px;
        }

        .sidebar-user-info {
          overflow: hidden;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
        }

        .sidebar-root.sidebar-expanded .sidebar-user-info {
          opacity: 1;
          transform: translateX(0);
        }

        .sidebar-user-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .sidebar-user-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 0;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          border-radius: 10px;
          margin: 0 8px;
          overflow: hidden;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .sidebar-logout:hover {
          background: var(--bg-tertiary);
          color: var(--danger-text);
        }

        .sidebar-logout .sidebar-link-icon,
        .sidebar-logout > svg {
          width: 56px;
          min-width: 56px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Make logout icon center like nav icons */
        .sidebar-logout > svg {
          /* direct svg child when no span wrapper */
        }

        /* Tooltip for collapsed state (accessibility) */
        .sidebar-link[title]:not(.sidebar-expanded .sidebar-link)::after {
          display: none;
        }
      `}</style>
    </>
  )
}

export default Sidebar
