import React, { useState } from 'react'
import { BookMarked, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'

const ReturnModal = ({ loan, book, onConfirm, onCancel, penalty }) => {
  if (!loan || !book) return null;
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-panel animate-fade-in" style={{ width: '420px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', fontWeight: 600 }}>Tramitar Entrega</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <img src={book.cover} alt={book.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', fontWeight: 600 }}>{book.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{book.author}</p>
          </div>
        </div>

        {penalty > 0 ? (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--danger-text)', fontSize: '0.9rem', fontWeight: 600 }}>Multa Pendiente</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.5, color: 'var(--danger-text)' }}>
              Usted debe pagar en caja: <strong>S/ {penalty.toFixed(2)}</strong> al entregar el libro.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Al solicitar la entrega, usted deberá acercarse al mostrador y devolver el ejemplar físico al Administrador de turno.
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={onConfirm} className="btn-primary">Aceptar y Enviar</button>
        </div>
      </div>
    </div>
  )
}

const MisPrestamos = () => {
  const { books, loans, reservations, heldBooks, currentUser, requestReturn, requestExtension, claimHeldBook } = useAppContext()
  const [returnModal, setReturnModal] = useState({ isOpen: false, loan: null, book: null, penalty: 0 })

  const myLoans = loans.filter(l => l.userId === currentUser.id && l.status !== 'returned')
  const myReservations = reservations.filter(r => r.userId === currentUser.id)
  const myHeldBooks = heldBooks.filter(h => h.userId === currentUser.id)

  const handleReturnClick = (loan, book) => {
    const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book.penaltyRate);
    setReturnModal({ isOpen: true, loan, book, penalty: penalty.amount })
  }

  const confirmReturn = () => {
    requestReturn(returnModal.loan.id);
    setReturnModal({ isOpen: false, loan: null, book: null, penalty: 0 });
  }

  const getQueuePosition = (bookId) => {
    const bookRes = reservations
      .filter(r => r.bookId === bookId)
      .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || new Date(a.date) - new Date(b.date));
    
    return bookRes.findIndex(r => r.userId === currentUser.id) + 1;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {returnModal.isOpen && (
        <ReturnModal 
          loan={returnModal.loan} book={returnModal.book} penalty={returnModal.penalty}
          onConfirm={confirmReturn} onCancel={() => setReturnModal({ isOpen: false, loan: null, book: null, penalty: 0 })}
        />
      )}

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Préstamos Oficiales</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Panel de seguimiento de tus responsabilidades y reservas bibliográficas.</p>
      </div>

      {/* SECCIÓN DE PRÉSTAMOS ACTIVOS */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '8px', height: '20px', borderRadius: '4px', background: 'var(--accent-primary)' }}></div>
          Libros en Posesión ({myLoans.length})
        </h2>
        
        {myLoans.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-light)' }}>
            <BookMarked size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-muted)' }}>No tienes libros físicos por devolver actualmente.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {myLoans.map(loan => {
              const book = books.find(b => b.id === loan.bookId)
              
              let statusBadge = null;
              let canManipulate = false;
              let isOverdue = false;

              if (loan.status === 'pending_pickup') {
                statusBadge = <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Clock size={12}/> Listo para Recoger</span>
              } else if (loan.status === 'pending_return') {
                statusBadge = <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><CheckCircle size={12}/> Entregado (Revisión)</span>
              } else if (loan.status === 'active' || loan.status === 'overdue') {
                // 'overdue' en BD y 'active' que venció por cálculo son equivalentes
                canManipulate = true;
                const { days, status } = getDaysRemaining(loan.dueDate)
                const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate);

                if (loan.status === 'overdue' || status === 'overdue') {
                  isOverdue = true;
                  statusBadge = <span className="badge badge-danger"><Clock size={12}/> Vencido — Mora: S/ {penalty.amount.toFixed(2)}</span>
                } else {
                  statusBadge = <span className="badge badge-success"><Clock size={12}/> Quedan {days} días</span>
                }
              }

              return (
                <div key={loan.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', border: isOverdue ? '1px solid #EF4444' : '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <img src={book?.cover} alt={book?.title} style={{ width: '80px', height: '115px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{book?.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{book?.author}</p>
                      {statusBadge}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                    {canManipulate && !loan.extensionRequested && !isOverdue && (
                      <button onClick={() => requestExtension(loan.id)} className="btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }}>
                        Pedir +14 días
                      </button>
                    )}
                    <button 
                      onClick={() => handleReturnClick(loan, book)} 
                      disabled={!canManipulate || loan.status === 'pending_pickup'} 
                      className="btn-primary" 
                      style={{ 
                        flex: 1, 
                        fontSize: '0.85rem', 
                        opacity: (canManipulate && loan.status !== 'pending_pickup') ? 1 : 0.4,
                        background: (canManipulate && loan.status !== 'pending_pickup') ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        cursor: (canManipulate && loan.status !== 'pending_pickup') ? 'pointer' : 'not-allowed',
                        color: (canManipulate && loan.status !== 'pending_pickup') ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      {loan.status === 'pending_pickup' ? 'Esperando Recogida' : 'Tramitar Devolución'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN DE LIBROS LISTOS (HELD) - Provenientes de la cola */}
      {myHeldBooks.length > 0 && (
        <div style={{ marginBottom: '4rem', background: 'rgba(139, 92, 246, 0.05)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#8B5CF6' }}>
            <CheckCircle size={22} /> ✨ ¡Tu turno en cola ha llegado! ({myHeldBooks.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {myHeldBooks.map(h => {
              const book = books.find(b => b.id === h.bookId)
              return (
                <div key={h.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', borderLeft: '4px solid #8B5CF6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={book?.cover} alt="" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{book?.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ya puedes solicitar el préstamo físico.</p>
                    </div>
                  </div>
                  <button onClick={() => claimHeldBook(h.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#8B5CF6' }}>
                    Solicitar Entrega
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN DE RESERVAS EN ESPERA */}
      {myReservations.length > 0 && (
        <section className="animate-fade-in">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '8px', height: '20px', borderRadius: '4px', background: '#8B5CF6' }}></div>
            Mis Reservas en Espera ({myReservations.length})
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {myReservations.map(res => {
              const book = books.find(b => b.id === res.bookId)
              const position = getQueuePosition(res.bookId)
              
              return (
                <div key={res.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', borderLeft: '4px solid #8B5CF6' }}>
                  <img src={book?.cover} alt="" style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px', opacity: 0.8 }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{book?.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Reservado el {new Date(res.date).toLocaleDateString()}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#8B5CF6' }}>Puesto {position}</span>
                        <span style={{ fontSize: '0.75rem', color: '#8B5CF6', opacity: 0.8 }}>en cola de espera</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: book?.availableCopies > 0 ? 'var(--success-text)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {book?.availableCopies > 0 ? `🔥 ¡Hay ${book.availableCopies} en stock! El sistema te lo asignará pronto.` : `⏳ Sin stock físico actualmente.`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default MisPrestamos
