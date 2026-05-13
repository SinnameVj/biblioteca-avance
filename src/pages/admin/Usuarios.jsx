import React, { useState } from 'react'
import { User, DollarSign, Clock, CheckCircle, MessageCircle, AlertCircle, History, Search } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'
import UserDetailsModal from '../../components/UserDetailsModal'

const AdminUsuarios = () => {
  const { users, loans, books } = useAppContext()
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = users.filter(u => 
    u.role !== 'admin' && (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const generateWhatsappLink = (user, userLoans, debt, penaltyDays) => {
    // Tomamos el teléfono del perfil del usuario
    const phone = user.phone || "999888777";
    
    // Buscamos el libro más crítico (o el primero activo)
    const userActiveLoans = loans.filter(l => l.userId === user.id && l.status === 'active')
    const criticalLoan = userActiveLoans[0];
    const book = books.find(b => b.id === criticalLoan?.bookId);
    const { days, status } = criticalLoan ? getDaysRemaining(criticalLoan.dueDate) : { days: 0, status: 'safe' };

    let message = "";
    
    if (debt > 0) {
      message = `¡Atención ${user.name}! 🚨\n\nLe saludamos de la Biblioteca UCV Campus Chimbote. Notamos que tiene una mora pendiente por retraso en devolución. ⚠️\n\n💰 Deuda acumulada: S/ ${debt.toFixed(2)}\n\nPor favor, acérquese a mostrador lo antes posible para regularizar su situación. ¡Evite mayores recargos! 📚✨`;
    } else {
       message = `¡Hola ${user.name}! 👋✨\n\nLe saludamos de la Biblioteca UCV Campus Chimbote. ¿En qué podemos ayudarle hoy? Recuerde que nuestro horario de atención es de L-V 8am a 8pm. 📚🚀`;
    }
    return `https://wa.me/51${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Directorio General de Usuarios</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gestión de perfiles, búsqueda de identidad institucional y comunicación directa.</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo institucional..." 
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Identidad del Estamento</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Tipo de Usuario</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Estado Financiero</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Gestión / Contacto</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron usuarios con esos criterios.</td></tr>
            ) : filteredUsers.map(user => {
              // Incluir tanto 'active' como 'overdue' para el cálculo correcto de deuda
              const userActiveLoans = loans.filter(l => l.userId === user.id && (l.status === 'active' || l.status === 'overdue'))
              let totalDebt = 0;
              let maxDaysLate = 0;
              
              userActiveLoans.forEach(l => {
                const b = books.find(book => book.id === l.bookId);
                const penalty = calculatePenalty(l.dueDate, new Date(), l.manualPenalty, b?.penaltyRate);
                totalDebt += penalty.amount;
                if (penalty.daysLate > maxDaysLate) maxDaysLate = penalty.daysLate;
              });

              return (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="var(--accent-primary)" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{user.username}@ucvvirtual.edu.pe</p>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`badge ${user.role === 'profesor' ? 'badge-warning' : 'badge-info'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {user.role}
                    </span>
                  </td>
                  
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {totalDebt > 0 ? (
                      <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.85rem' }}>S/ {totalDebt.toFixed(2)} Pendiente</span>
                    ) : (
                      <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.85rem' }}>Al día</span>
                    )}
                  </td>
                  
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSelectedUser(user)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                        Ver Perfil
                      </button>
                      <a href={generateWhatsappLink(user, userActiveLoans, totalDebt, maxDaysLate)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#25D366', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          allLoans={loans} 
          allBooks={books} 
        />
      )}
    </div>
  )
}

export default AdminUsuarios
