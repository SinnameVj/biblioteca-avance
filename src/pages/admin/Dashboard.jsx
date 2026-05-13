import React from 'react'
import { Book, Users, Clock, AlertTriangle, Search, User } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { migrateData } from '../../data/migrate-to-supabase'
import UserDetailsModal from '../../components/UserDetailsModal'

const StatCard = ({ title, value, icon, color, delay }) => (
  <div className={`glass-panel animate-fade-in delay-${delay}`} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `var(--bg-tertiary)`, border: `1px solid var(--border-light)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'Inter', fontWeight: 600 }}>{value}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{title}</p>
    </div>
  </div>
)

import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'

const Dashboard = () => {
  const { books, users, loans, reservations, heldBooks, showToast } = useAppContext()
  const navigate = useNavigate()
  const [migrating, setMigrating] = React.useState(false)
  const handleMigrate = async () => {
    setMigrating(true)
    showToast('Iniciando migración de datos a Supabase...')
    await migrateData()
    setMigrating(false)
    window.location.reload()
  }

  const totalBooks = books.reduce((acc, book) => acc + book.totalCopies, 0)
  const activeLoans = loans.filter(l => l.status === 'active').length
  const totalPending = loans.filter(l => l.status === 'pending_pickup' || l.status === 'pending_return').length;

  const getLoanStatusBadge = (loan) => {
    if (loan.status === 'active') {
      const { status } = getDaysRemaining(loan.dueDate);
      return status === 'overdue' ? 
        <span className="badge badge-danger">Retraso</span> : 
        <span className="badge badge-success">Activo</span>;
    }
    if (loan.status === 'pending_pickup') return <span className="badge badge-warning">Pendiente</span>;
    if (loan.status === 'pending_return') return <span className="badge badge-info">En Revisión</span>;
    return <span className="badge">{loan.status}</span>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Resumen Ejecutivo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Estado situacional de la Biblioteca UCV Campus Chimbote.</p>
        </div>
        
        {books.length === 0 && (
          <button 
            onClick={handleMigrate} 
            disabled={migrating}
            className="btn-primary" 
            style={{ background: 'var(--accent-gold)', color: 'black' }}
          >
            {migrating ? 'Migrando...' : '🚀 Migrar Datos Iniciales'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Total Ejemplares" value={totalBooks} icon={<Book size={24} />} color="var(--accent-primary)" delay="1" />
        <StatCard title="Usuarios Registrados" value={users.length} icon={<Users size={24} />} color="#8B5CF6" delay="2" />
        <StatCard title="Préstamos Oficiales" value={activeLoans} icon={<Clock size={24} />} color="var(--success-text)" delay="3" />
        <StatCard title="Pendientes Revisión" value={totalPending} icon={<AlertTriangle size={24} />} color="var(--accent-gold)" delay="4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Últimas Operaciones (Más Recientes)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Libro</th>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Usuario</th>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Fecha Solicitud</th>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loans.slice(-8).reverse().map(loan => {
                const book = books.find(b => b.id === loan.bookId)
                const user = users.find(u => u.id === loan.userId)
                
                return (
                  <tr key={loan.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 500, color: 'var(--text-primary)' }}>{book?.title}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{user?.name || 'Usuario...'}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{new Date(loan.requestDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 0' }}>
                      {getLoanStatusBadge(loan)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Disponibilidad General</h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {books.slice(0, 4).map(book => {
              const perc = (book.availableCopies / book.totalCopies) * 100
              const color = perc < 20 ? 'var(--danger-text)' : perc < 50 ? 'var(--warning-text)' : 'var(--success-text)'
              const bg = perc < 20 ? 'var(--danger-bg)' : perc < 50 ? 'var(--warning-bg)' : 'var(--success-bg)'
              
              return (
                <div key={book.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', color: 'var(--text-secondary)' }}>{book.title}</span>
                    <span style={{ color: color }}>{book.availableCopies}/{book.totalCopies}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${perc}%`, background: color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <button onClick={() => navigate('/admin/catalogo')} className="btn-secondary" style={{ marginTop: '2rem', width: '100%' }}>
            Manejar el inventario
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
