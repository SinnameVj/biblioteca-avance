import React, { useState } from 'react'
import { User, Phone, CheckCircle, Lock, BookOpen, History, Award, Clock, AlertTriangle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { calculatePenalty } from '../../utils/penalties'

const Profile = () => {
  const { currentUser, updateProfile, loans, books } = useAppContext()
  
  const [name, setName] = useState(currentUser.name || '')
  const [phone, setPhone] = useState(currentUser.phone || '')
  const [success, setSuccess] = useState(false)

  const myAllLoans = loans.filter(l => l.userId === currentUser.id)
  const activeCount = myAllLoans.filter(l => l.status === 'active' || l.status === 'overdue').length
  const returnedCount = myAllLoans.filter(l => l.status === 'returned').length

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile(currentUser.id, name, phone)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Mi Centro de Cuenta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestiona tu identidad y revisa tu trayectoria en la biblioteca.</p>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Libros Pedidos</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{myAllLoans.length}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
            <Award size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completados</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{returnedCount}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.75rem', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>En Posesión</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left: Settings */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--accent-primary)" /> Datos de Perfil
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>WhatsApp / Celular</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} 
                  placeholder="Ej. 987654321"
                  maxLength={9}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Correo (Bloqueado)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={`${currentUser.username}@ucvvirtual.edu.pe`} 
                  disabled 
                  style={{ opacity: 0.6, background: 'var(--bg-tertiary)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              {success ? '¡Guardado!' : 'Actualizar Datos'}
            </button>
          </form>
        </div>

        {/* Right: History */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="var(--accent-gold)" /> Historial de Biblioteca
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Obra / Libro</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Préstamo</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, textAlign: 'right' }}>Mora</th>
                </tr>
              </thead>
              <tbody>
                {myAllLoans.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aún no tienes registros de actividad.
                    </td>
                  </tr>
                ) : (
                  myAllLoans.map(loan => {
                    const book = books.find(b => b.id === loan.bookId)
                    const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate)
                    
                    return (
                      <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{book?.title || 'Libro eliminado'}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{book?.author}</p>
                        </td>
                        <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(loan.requestDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          {loan.status === 'returned' ? (
                            <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> Devuelto
                            </span>
                          ) : loan.status === 'active' || loan.status === 'overdue' ? (
                            <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={14} /> En posesión
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Procesando</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                          {loan.status === 'returned' ? (
                            loan.paidPenalty > 0 ? (
                              <span style={{ color: 'var(--success-text)' }}>Liquidado: S/ {loan.paidPenalty.toFixed(2)}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Sin deuda</span>
                            )
                          ) : penalty.amount > 0 ? (
                            <span style={{ color: 'var(--danger-text)' }}>Pendiente: S/ {penalty.amount.toFixed(2)}</span>
                          ) : 'S/ 0.00'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
