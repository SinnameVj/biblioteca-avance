import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Users, LogOut, Grid, BookMarked, User, AlertTriangle, ClipboardList, ChevronDown, History, Package } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const SIDEBAR_COLLAPSED = '72px'
const SIDEBAR_EXPANDED = '230px'

const Sidebar = () => {
  const { currentUser, logout } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = currentUser?.role === 'admin'

  /* ─── Non-admin links (unchanged) ─── */
  const getLinks = () => {
    if (currentUser?.role === 'profesor') {
      return [
        { path: '/profesor', icon: <Grid size={18} />, label: 'Inicio' },
        { path: '/profesor/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
        { path: '/profesor/prestamos', icon: <BookMarked size={18} />, label: 'Mis Préstamos' },
        { path: '/profesor/historial', icon: <History size={18} />, label: 'Historial' },
        { path: '/profesor/perfil', icon: <User size={18} />, label: 'Perfil' },
      ]
    }
    return [
      { path: '/estudiante', icon: <Grid size={18} />, label: 'Inicio' },
      { path: '/estudiante/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
      { path: '/estudiante/prestamos', icon: <BookMarked size={18} />, label: 'Mis Préstamos' },
      { path: '/estudiante/historial', icon: <History size={18} />, label: 'Historial' },
      { path: '/estudiante/perfil', icon: <User size={18} />, label: 'Perfil' },
    ]
  }

  /* ─── Admin sections ─── */
  const adminSections = [
    {
      title: 'PRINCIPAL',
      items: [{ path: '/admin', icon: <Grid size={18} />, label: 'Dashboard', end: true }]
    },
    {
      title: 'CATÁLOGO',
      expandable: true,
      expandKey: 'inventory',
      icon: <Package size={18} />,
      items: [
        { path: '/admin/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
        { path: '/admin/prestamos', icon: <BookMarked size={18} />, label: 'Mostrador' },
      ]
    },
    {
      title: 'USUARIOS',
      items: [{ path: '/admin/usuarios', icon: <Users size={18} />, label: 'Usuarios' }]
    },
    {
      title: 'CONTROL',
      items: [{ path: '/admin/control-libros', icon: <ClipboardList size={18} />, label: 'Control Libros' }]
    },
    {
      title: 'GESTIÓN',
      items: [{ path: '/admin/penalizaciones', icon: <AlertTriangle size={18} />, label: 'Penalizaciones' }]
    },
    {
      title: 'CUENTA',
      items: [{ path: '/admin/perfil', icon: <User size={18} />, label: 'Perfil' }]
    },
  ]

  const isInventoryActive = location.pathname.startsWith('/admin/catalogo') || location.pathname.startsWith('/admin/prestamos')

  /* ─── Render admin sidebar ─── */
  const renderAdminNav = () => (
    <nav className="sidebar-nav">
      {adminSections.map((section, sIdx) => (
        <div key={sIdx} className="sidebar-section">
          {/* Section title - only visible when expanded */}
          <div className="sidebar-section-title">{section.title}</div>

          {section.expandable ? (
            <>
              {/* Expandable group header */}
              <button
                className={`sidebar-link sidebar-group-toggle${isInventoryActive ? ' group-active' : ''}`}
                onClick={() => setInventoryOpen(!inventoryOpen)}
                title={!expanded ? section.title : undefined}
              >
                <span className="sidebar-link-icon">{section.icon}</span>
                <span className="sidebar-link-label">{section.title.charAt(0) + section.title.slice(1).toLowerCase()}</span>
                <span className={`sidebar-chevron${inventoryOpen ? ' open' : ''}`}><ChevronDown size={14} /></span>
              </button>
              {/* Sub-items */}
              <div className={`sidebar-sub-items${inventoryOpen ? ' sub-open' : ''}`}>
                {section.items.map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}
                    title={!expanded ? link.label : undefined}
                  >
                    <span className="sidebar-link-icon sidebar-sub-icon">{link.icon}</span>
                    <span className="sidebar-link-label">{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </>
          ) : (
            section.items.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                end={link.end}
                title={!expanded ? link.label : undefined}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                <span className="sidebar-link-label">{link.label}</span>
              </NavLink>
            ))
          )}
        </div>
      ))}
    </nav>
  )

  /* ─── Render non-admin nav (unchanged) ─── */
  const renderDefaultNav = () => (
    <nav className="sidebar-nav">
      {getLinks().map(link => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          end={link.path === '/profesor' || link.path === '/estudiante'}
          title={!expanded ? link.label : undefined}
        >
          <span className="sidebar-link-icon">{link.icon}</span>
          <span className="sidebar-link-label">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      <div
        className={`sidebar-root${expanded ? ' sidebar-expanded' : ''}${isAdmin ? ' sidebar-admin' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <BookOpen size={15} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">UCV Chimbote</span>
            {isAdmin && <span className="sidebar-brand-sub">Biblioteca</span>}
          </div>
        </div>

        {/* Navigation */}
        {isAdmin ? renderAdminNav() : renderDefaultNav()}

        {/* User Section */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {isAdmin ? (
                <span className="sidebar-avatar-letter">{(currentUser?.name?.[0] || 'A').toUpperCase()}</span>
              ) : (
                <User size={15} color="var(--text-secondary)" />
              )}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-role">{isAdmin ? 'ADMIN' : currentUser?.role === 'profesor' ? 'DOCENTE' : 'ESTUDIANTE'}</p>
              <p className="sidebar-user-name">{currentUser?.name || currentUser?.username}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout" title={!expanded ? 'Salir' : undefined}>
            <span className="sidebar-link-icon"><LogOut size={15} /></span>
            <span className="sidebar-link-label">Cerrar sesión</span>
          </button>
        </div>
      </div>

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

        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s ease 0.06s, transform 0.2s ease 0.06s;
          pointer-events: none;
          white-space: nowrap;
        }

        .sidebar-root.sidebar-expanded .sidebar-brand-text {
          opacity: 1;
          transform: translateX(0);
        }

        .sidebar-brand-name {
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .sidebar-brand-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* ── Nav ── */
        .sidebar-nav {
          flex: 1;
          padding: 0.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* ── Admin sections ── */
        .sidebar-section {
          padding: 0.15rem 0;
        }

        .sidebar-section-title {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          padding: 0.65rem 0 0.3rem;
          white-space: nowrap;
          overflow: hidden;
          opacity: 0;
          height: 0;
          padding: 0;
          transition: opacity 0.15s ease, height 0.2s ease, padding 0.2s ease;
          pointer-events: none;
          text-indent: 20px;
        }

        .sidebar-root.sidebar-expanded .sidebar-section-title {
          opacity: 1;
          height: auto;
          padding: 0.65rem 0 0.3rem;
        }

        /* ── Links ── */
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0;
          border-radius: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
          margin: 1px 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          width: calc(100% - 16px);
        }

        .sidebar-link:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-primary);
          box-shadow: inset 3px 0 0 var(--accent-primary);
        }

        .sidebar-link.active .sidebar-link-icon {
          color: var(--accent-primary);
        }

        .sidebar-link-icon {
          width: 56px;
          min-width: 56px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.18s ease;
        }

        .sidebar-link-label {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
          white-space: nowrap;
          pointer-events: none;
          flex: 1;
          text-align: left;
        }

        .sidebar-root.sidebar-expanded .sidebar-link-label {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Group toggle (Inventario) ── */
        .sidebar-group-toggle {
          width: calc(100% - 16px);
        }

        .sidebar-group-toggle.group-active {
          color: var(--accent-primary);
        }

        .sidebar-chevron {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          transition: transform 0.25s ease;
          opacity: 0;
        }

        .sidebar-root.sidebar-expanded .sidebar-chevron {
          opacity: 1;
        }

        .sidebar-chevron.open {
          transform: rotate(180deg);
        }

        /* ── Sub-items ── */
        .sidebar-sub-items {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-sub-items.sub-open {
          max-height: 120px;
        }

        .sidebar-sub-link {
          font-size: 0.82rem !important;
          font-weight: 500 !important;
        }

        .sidebar-sub-icon {
          width: 56px !important;
          min-width: 56px !important;
        }

        .sidebar-root.sidebar-expanded .sidebar-sub-link .sidebar-sub-icon {
          width: 56px !important;
          min-width: 56px !important;
          padding-left: 8px;
        }

        .sidebar-sub-link.active {
          background: rgba(59, 130, 246, 0.12);
          color: var(--accent-primary);
          box-shadow: inset 3px 0 0 var(--accent-primary);
        }

        /* ── Footer ── */
        .sidebar-footer {
          border-top: 1px solid var(--border-light);
          padding: 0.75rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
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

        .sidebar-avatar svg {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 50%;
          padding: 6px;
          width: 30px;
          height: 30px;
        }

        .sidebar-avatar-letter {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
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

        .sidebar-user-role {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          white-space: nowrap;
          margin: 0;
        }

        .sidebar-user-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
          margin: 0;
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
      `}</style>
    </>
  )
}

export default Sidebar
