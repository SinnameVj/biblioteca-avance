import React, { useState } from 'react'
import { BookOpen, Clock, AlertCircle, Bookmark, CheckCircle, XCircle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining } from '../../utils/penalties'
import BorrowModal from '../../components/BorrowModal'
import { useNavigate } from 'react-router-dom'

const EstudianteDashboard = () => {
  const { books, loans, reservations, heldBooks, currentUser, reserveBook, claimHeldBook, rejectHeldBook, requestBorrow } = useAppContext()
  const [borrowModalData, setBorrowModalData] = useState({ isOpen: false, book: null, heldId: null })
  const navigate = useNavigate()

  const myLoans = loans.filter(l => l.userId === currentUser.id && l.status !== 'returned')
  const myHeldBooks = heldBooks.filter(h => h.userId === currentUser.id)
  const myReservations = reservations.filter(r => r.userId === currentUser.id)
  
  const catalogBooks = [...books].slice(0, 4)

  const handleBorrowRequest = (book, heldId = null) => {
    setBorrowModalData({ isOpen: true, book, heldId })
  }

  const confirmBorrow = (bookId, userId, isExtending, phone) => {
    if (borrowModalData.heldId) {
      claimHeldBook(borrowModalData.heldId, phone);
    } else {
      requestBorrow(bookId, userId, isExtending, phone);
    }
    setBorrowModalData({ isOpen: false, book: null, heldId: null });
  }

  return (
    <div>
      {borrowModalData.isOpen && (
        <BorrowModal 
          book={borrowModalData.book}
          currentUser={currentUser}
          onConfirm={confirmBorrow}
          onCancel={() => setBorrowModalData({ isOpen: false, book: null, heldId: null })}
        />
      )}

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', fontFamily: 'Inter', fontWeight: 600 }}>Mi Escritorio</h1>
        <p style={{ color: 'var(--text-muted)' }}>Bienvenido {currentUser?.name}. Administra tus operaciones y reservas activas.</p>
      </div>

      {myHeldBooks.length > 0 && (
        <div style={{ marginBottom: '3rem', background: 'rgba(139, 92, 246, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', fontWeight: 600 }}>
            <CheckCircle size={20} /> ✨ ¡Tu turno en cola ha llegado!
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myHeldBooks.map(h => {
              const book = books.find(b => b.id === h.bookId)
              return (
                <div key={h.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-light)', borderLeft: '4px solid #8B5CF6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={book.cover} alt={book.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{book.title}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tu reserva de la fila ya está lista para ser solicitada.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => rejectHeldBook(h.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <XCircle size={16} /> Cancelar
                    </button>
                    <button onClick={() => handleBorrowRequest(book, h.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#8B5CF6', color: 'white', fontSize: '0.85rem', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle size={16} /> Solicitar Ya
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontFamily: 'Inter' }}>
            <BookOpen size={20} color="var(--text-secondary)" /> Ejemplares a mi cargo
          </h2>
          <button onClick={() => navigate('/estudiante/prestamos')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Ver Historial Completo</button>
        </div>

        {myLoans.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No asumes préstamos en el sistema actualmente.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {myLoans.map(loan => {
              const book = books.find(b => b.id === loan.bookId)
              
              let statusText = 'ESPERANDO ENTREGA FÍSICA'
              let progressColor = 'var(--text-primary)'
              let progressBg = 'var(--warning-bg)'
              
              if (loan.status === 'pending_pickup') {
                statusText = 'RECOGIDA PENDIENTE'
                progressBg = 'var(--bg-tertiary)'
                progressColor = 'var(--text-muted)'
              } else if (loan.status === 'pending_return') {
                statusText = 'ESPERANDO REVISIÓN ADMIN'
                progressBg = 'var(--info-bg)'
              } else {
                const { days, status } = getDaysRemaining(loan.dueDate)
                if (status === 'overdue') {
                  statusText = `ATRASO POR ${days} DÍAS`
                  progressColor = 'var(--danger-text)'
                  progressBg = 'var(--danger-bg)'
                } else {
                  statusText = `QUEDAN ${days} DÍAS`
                  progressColor = 'var(--success-text)'
                  progressBg = 'var(--success-bg)'
                }
              }

              return (
                <div key={loan.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <img src={book?.cover} alt={book?.title} style={{ width: '70px', height: '105px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', fontWeight: 600 }}>{book?.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{book?.author}</p>
                      <span className="badge" style={{ background: progressBg, color: progressColor, marginTop: '0.5rem' }}>
                        <Clock size={12} /> {statusText}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'Inter' }}>Recomendaciones del Catálogo</h2>
          <button onClick={() => navigate('/estudiante/catalogo')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Ver todo el Catálogo</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {catalogBooks.map((book, idx) => {
            const isReservedByMe = myReservations.some(r => r.bookId === book.id)
            const isLoanedByMe = loans.some(l => l.bookId === book.id && l.userId === currentUser.id && l.status !== 'returned')
            const isHeldForMe = myHeldBooks.some(h => h.bookId === book.id)

            return (
              <div key={book.id} className={`glass-panel animate-fade-in delay-${idx+1}`} style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '260px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border-light)' }}>
                  <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', fontWeight: 600 }}>{book.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{book.author}</p>
                
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge" style={{ 
                    background: book.availableCopies > 0 ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color: book.availableCopies > 0 ? 'var(--success-text)' : 'var(--warning-text)'
                  }}>
                    {book.availableCopies} Disp.
                  </span>
                  
                  {isLoanedByMe ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operación Activa</span>
                  ) : isHeldForMe ? (
                    <button 
                      onClick={() => {
                        const heldId = myHeldBooks.find(h => h.bookId === book.id)?.id;
                        if (heldId) handleBorrowRequest(book, heldId);
                      }} 
                      className="btn-primary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--info-text)' }}
                    >
                      ¡Solicitar Ya!
                    </button>
                  ) : isReservedByMe ? (
                    (() => {
                      const queue = reservations
                        .filter(r => r.bookId === book.id)
                        .sort((a, b) => (b.priority - a.priority) || new Date(a.date) - new Date(b.date));
                      const pos = queue.findIndex(r => r.userId === currentUser.id) + 1;
                      return (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'block' }}>
                            Puesto {pos} en cola
                          </span>
                          <span style={{ fontSize: '0.65rem', color: book.availableCopies > 0 ? 'var(--success-text)' : 'var(--text-muted)' }}>
                            {book.availableCopies > 0 ? `Stock: ${book.availableCopies}` : 'Sin stock'}
                          </span>
                        </div>
                      );
                    })()
                  ) : book.availableCopies > 0 ? (
                    <button onClick={() => handleBorrowRequest(book)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Solicitar</button>
                  ) : (
                    <button 
                      onClick={() => reserveBook(book.id, currentUser.id, currentUser.role === 'profesor')} 
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Unirse a la Fila
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default EstudianteDashboard
