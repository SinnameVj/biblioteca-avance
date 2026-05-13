import React, { useState } from 'react'
import { AlertTriangle, User, Calendar, DollarSign, CheckCircle, Settings, Book, Edit2, Save, X, Search } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'

const AdminPenalties = () => {
  const { loans, books, users, forceReturn, updateBookPenalty, showToast } = useAppContext()
  const [view, setView] = useState('monitor') // 'monitor' o 'config'
  const [editingBook, setEditingBook] = useState(null)
  const [tempRate, setTempRate] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Estados de búsqueda
  const [monitorSearch, setMonitorSearch] = useState("")
  const [configSearch, setConfigSearch] = useState("")

  const overdueLoans = loans.filter(l => {
    // 1. Mostrar si está activo y vencido
    const { status: overdueStatus } = getDaysRemaining(l.dueDate)
    const isOverdueActive = l.status === 'active' && overdueStatus === 'overdue'
    
    // 2. Mostrar si está en revisión (pending_return) pero TIENE mora
    const penaltyAmount = calculatePenalty(l.dueDate, new Date(), l.manualPenalty, books.find(b => String(b.id) === String(l.bookId))?.penaltyRate).amount
    const isPendingWithMora = l.status === 'pending_return' && penaltyAmount > 0.01

    if (!isOverdueActive && !isPendingWithMora) return false;
    
    // Filtrar por búsqueda de usuario
    if (monitorSearch) {
      const user = users.find(u => String(u.id) === String(l.userId))
      return user?.name.toLowerCase().includes(monitorSearch.toLowerCase()) || 
             user?.username.toLowerCase().includes(monitorSearch.toLowerCase())
    }
    return true
  })

  const filteredConfigBooks = books.filter(b => {
    if (!configSearch) return true;
    const search = configSearch.toLowerCase();
    return (
      b.title.toLowerCase().includes(search) ||
      b.author.toLowerCase().includes(search) ||
      (b.isbn && b.isbn.toLowerCase().includes(search))
    )
  })

  const handleResolvePenalty = async (loanId) => {
    setIsProcessing(true)
    const result = await forceReturn(loanId)
    if (result.success) {
      showToast('Deuda liquidada y libro devuelto con éxito', 'success')
    } else {
      showToast(result.error || 'Error al procesar la liquidación', 'error')
    }
    setIsProcessing(false)
  }

  const handleUpdateRate = async (bookId) => {
    setIsProcessing(true)
    const result = await updateBookPenalty(bookId, tempRate);
    if (result.success) {
      showToast('Tarifa actualizada correctamente', 'success')
      setEditingBook(null);
      setTempRate("");
    } else {
      showToast(result.error || 'Error al actualizar la tarifa', 'error')
    }
    setIsProcessing(false)
  }

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle color="var(--danger-text)" /> Centro de Gestión de Moras
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Controla las cuentas por cobrar y configura las tarifas por libro.</p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', padding: '0.4rem', gap: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <button 
            onClick={() => setView('monitor')} 
            className={view === 'monitor' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            Monitor de Morosos
          </button>
          <button 
            onClick={() => setView('config')} 
            className={view === 'config' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Settings size={14} style={{ marginRight: '0.4rem' }} /> Tarifas por Libro
          </button>
        </div>
      </div>

      {/* Buscador Contextual */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search size={20} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder={view === 'monitor' ? "Buscar alumno con deuda..." : "Buscar libro por nombre, autor o ISBN..."}
          className="input-field"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem' }}
          value={view === 'monitor' ? monitorSearch : configSearch}
          onChange={(e) => view === 'monitor' ? setMonitorSearch(e.target.value) : setConfigSearch(e.target.value)}
        />
      </div>

      {view === 'monitor' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {overdueLoans.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              <p>{monitorSearch ? 'No se encontraron alumnos que coincidan con la búsqueda.' : 'No hay cuentas morosas activas. ¡Todo está en regla! ✨'}</p>
            </div>
          ) : overdueLoans.map(loan => {
            const book = books.find(b => b.id === loan.bookId)
            const user = users.find(u => u.id === loan.userId)
            const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate)

            return (
              <div key={loan.id} className="glass-panel" style={{ 
                padding: '1.5rem', 
                border: '1px solid var(--danger-border)', 
                position: 'relative',
                background: loan.status === 'pending_return' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: loan.status === 'pending_return' ? 'var(--info-text)' : 'var(--danger-text)' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={18} color="var(--text-secondary)" />
                      <span style={{ fontWeight: 600 }}>{user?.name}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '1.5rem' }}>@{user?.username}</span>
                  </div>
                  <span className={`badge ${loan.status === 'pending_return' ? 'badge-info' : 'badge-danger'}`}>
                    {loan.status === 'pending_return' ? 'Listo p. Devolver' : 'Retraso Activo'}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Libro Retenido:</p>
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{book?.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Tasa: S/ {book?.penaltyRate?.toFixed(2)} / día</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto a Cobrar</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger-text)' }}>
                      S/ {penalty.amount.toFixed(2)}
                    </p>
                  </div>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleResolvePenalty(loan.id)} 
                    className="btn-primary" 
                    style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)', fontSize: '0.8rem', opacity: isProcessing ? 0.5 : 1 }}
                  >
                    Liquidar Deuda
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Libro / Colección</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Categoría</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Tarifa Diaria (Mora)</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfigBooks.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron libros que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : filteredConfigBooks.map(book => (
                <tr key={book.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Book size={16} color="var(--accent-primary)" />
                      <div>
                        <p style={{ fontWeight: 500 }}>{book.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{book.author} | ISBN: {book.isbn || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{book.category}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {editingBook === book.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>S/</span>
                        <input 
                          type="number" 
                          step="0.5"
                          className="input-field" 
                          style={{ width: '80px', padding: '0.4rem' }}
                          value={tempRate}
                          onChange={e => setTempRate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600 }}>
                        S/ {book.penaltyRate?.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    {editingBook === book.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingBook(null)} className="btn-secondary" style={{ padding: '0.4rem' }}><X size={16} /></button>
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleUpdateRate(book.id)} 
                          className="btn-primary" 
                          style={{ padding: '0.4rem', background: '#10B981', opacity: isProcessing ? 0.5 : 1 }}
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingBook(book.id); setTempRate(book.penaltyRate); }}
                        className="btn-secondary" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        <Edit2 size={14} /> Cambiar Tarifa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPenalties
