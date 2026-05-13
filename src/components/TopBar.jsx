import React, { useState } from 'react'
import { Bell, UserCircle, LogOut } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const TopBar = () => {
  const { currentUser, logout, loans, heldBooks } = useAppContext()
  const [showNotifs, setShowNotifs] = useState(false)

  // Calculate notifications
  let notificationsCount = 0;
  let notificationsList = [];

  if (currentUser?.role === 'admin') {
    const pendingPickups = loans.filter(l => l.status === 'pending_pickup');
    const pendingReturns = loans.filter(l => l.status === 'pending_return');
    notificationsCount = pendingPickups.length + pendingReturns.length;
    if (pendingPickups.length > 0) notificationsList.push(`${pendingPickups.length} libros por recoger.`);
    if (pendingReturns.length > 0) notificationsList.push(`${pendingReturns.length} devoluciones pendientes.`);
  } else {
    const myHeld = heldBooks.filter(h => h.userId === currentUser.id);
    notificationsCount = myHeld.length;
    if (myHeld.length > 0) notificationsList.push(`Tienes ${myHeld.length} libros listos para retirar.`);
  }

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return <span className="badge badge-info" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>ADMINISTRADOR</span>;
      case 'profesor': return <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA', borderColor: 'rgba(139, 92, 246, 0.3)' }}>DOCENTE</span>;
      default: return <span className="badge badge-success" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80' }}>ESTUDIANTE</span>;
    }
  }

  return (
    <div style={{ height: '70px', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Bell size={20} />
            {notificationsCount > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger-text)', color: '#000', fontSize: '0.7rem', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-secondary)' }}>
                {notificationsCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="animate-fade-in glass-panel" style={{ position: 'absolute', top: '55px', right: '0', width: '280px', padding: '1rem', zIndex: 100 }}>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>NOTIFICACIONES</h4>
              {notificationsList.length > 0 ? notificationsList.map((msg, i) => (
                <div key={i} style={{ padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-primary)', borderBottom: i < notificationsList.length - 1 ? '1px solid var(--bg-tertiary)' : 'none' }}>
                  {msg}
                </div>
              )) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No hay alertas nuevas.</p>
              )}
            </div>
          )}
        </div>

        <div style={{ height: '30px', width: '1px', background: 'var(--border-light)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentUser?.name}</p>
            <div style={{ marginTop: '0.2rem' }}>
              {getRoleBadge(currentUser?.role)}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
            <UserCircle size={28} color="var(--accent-primary)" />
          </div>
          
          <button onClick={logout} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' }} title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopBar
