import React, { useState } from 'react'
import { Book, User, AlertCircle, CheckCircle, Clock, Search, MessageCircle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'

const AdminControlLibros = () => {
  const { users, loans, books } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue')
  
  // Grouping by user to see who has what
  const usersWithLoans = users.filter(u => {
    const hasLoans = loans.some(l => l.userId === u.id && (l.status === 'active' || l.status === 'overdue'))
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase())
    return hasLoans && matchesSearch
  })

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Control de Ejemplares en Circulación</h1>
        <p style={{ color: 'var(--text-muted)' }}>Seguimiento detallado de posesión de libros, estados de devolución y penalizaciones vigentes.</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por usuario responsable..." 
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {usersWithLoans.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Book size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No se encontraron préstamos activos bajo estos criterios.</p>
          </div>
        ) : (
          usersWithLoans.map(user => {
            const userActiveLoans = loans.filter(l => l.userId === user.id && (l.status === 'active' || l.status === 'overdue'))
            
            let totalUserDebt = 0;
            userActiveLoans.forEach(l => {
              const b = books.find(book => book.id === l.bookId);
              const penalty = calculatePenalty(l.dueDate, new Date(), l.manualPenalty, b?.penaltyRate);
              totalUserDebt += penalty.amount;
            });

            return (
              <div key={user.id} className="glass-panel animate-fade-in" style={{ padding: '0', overflow: 'hidden', borderLeft: `4px solid ${totalUserDebt > 0 ? '#EF4444' : 'var(--accent-primary)'}` }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{user.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.username}@ucvvirtual.edu.pe • {user.role.toUpperCase()}</p>
                    </div>
                  </div>
                  {totalUserDebt > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                      <AlertCircle size={16} /> DEUDA: S/ {totalUserDebt.toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {userActiveLoans.map(loan => {
                      const book = books.find(b => b.id === loan.bookId)
                      const { days, status } = getDaysRemaining(loan.dueDate)
                      const isOverdue = status === 'overdue'
                      
                      return (
                        <div key={loan.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', gap: '1rem' }}>
                          <img src={book?.cover} alt="" style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{book?.title}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                              <Clock size={12} color={isOverdue ? '#EF4444' : 'var(--text-muted)'} />
                              <span style={{ color: isOverdue ? '#EF4444' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                                {isOverdue ? `Atrasado por ${days} días` : `Vence en ${days} días`}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Vence: {new Date(loan.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminControlLibros
