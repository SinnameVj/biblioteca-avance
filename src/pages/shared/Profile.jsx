import React, { useState } from 'react'
import { User, Phone, Mail, Shield } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

const Profile = () => {
  const { currentUser, updateProfile } = useAppContext()

  const [name, setName] = useState(currentUser.name || '')
  const [phone, setPhone] = useState(currentUser.phone || '')
  const [success, setSuccess] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile(currentUser.id, name, phone)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const roleLabel = currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'profesor' ? 'Docente' : 'Estudiante'

  return (
    <div className="animate-fade-in" style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.3rem' }}>Mi Perfil</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gestiona tu información personal y datos de contacto.</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        {/* Avatar & Role Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0 }}>
            {(currentUser.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.05em', background: currentUser.role === 'profesor' ? 'rgba(139,92,246,0.2)' : currentUser.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.18)', color: currentUser.role === 'profesor' ? '#C4B5FD' : currentUser.role === 'admin' ? '#FBBF24' : '#93C5FD', border: `1px solid ${currentUser.role === 'profesor' ? 'rgba(139,92,246,0.38)' : currentUser.role === 'admin' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.32)'}` }}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <User size={13} /> Nombre Completo
            </label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <Phone size={13} /> WhatsApp / Celular
            </label>
            <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Ej. 987654321" maxLength={9} />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <Mail size={13} /> Correo Institucional
            </label>
            <input type="text" className="input-field" value={`${currentUser.username}@ucvvirtual.edu.pe`} disabled style={{ opacity: 0.55, background: 'var(--bg-tertiary)' }} />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <Shield size={13} /> Rol del Sistema
            </label>
            <input type="text" className="input-field" value={roleLabel} disabled style={{ opacity: 0.55, background: 'var(--bg-tertiary)' }} />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
            {success ? '✓ ¡Guardado!' : 'Actualizar Datos'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
