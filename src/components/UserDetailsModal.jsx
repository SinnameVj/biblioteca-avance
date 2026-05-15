import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Book, Clock, CheckCircle, AlertCircle, History } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../utils/penalties'

const UserDetailsModal = ({ user, onClose, allLoans, allBooks }) => {
  const { approveBorrow, rejectBorrow, approveReturn, rejectReturn } = useAppContext();

  if (!user) return null;

  const userLoans = allLoans.filter(l => String(l.userId) === String(user.id));
  // Un préstamo 'overdue' es un 'active' que venció — deben tratarse igual en conteos
  const activeLoansCount = userLoans.filter(l => l.status === 'active' || l.status === 'overdue').length;
  const overdueLoansCount = userLoans.filter(l => l.status === 'overdue' || (l.status === 'active' && getDaysRemaining(l.dueDate).status === 'overdue')).length;
  const pendingLoans = userLoans.filter(l => l.status === 'pending_pickup' || l.status === 'pending_return');

  // Sumar mora de libros activos Y vencidos
  const totalDebt = userLoans
    .filter(l => l.status === 'active' || l.status === 'overdue')
    .reduce((acc, l) => {
      const b = allBooks.find(bk => String(bk.id) === String(l.bookId));
      return acc + calculatePenalty(l.dueDate, new Date(), l.manualPenalty, b?.penaltyRate).amount;
    }, 0);



  const modalContent = (
    <div style={{
      position: 'fixed', 
      inset: 0,
      width: '100%', 
      height: '100%',
      background: 'rgba(0,0,0,0.7)', 
      backdropFilter: 'blur(8px)',
      zIndex: 9999, 
      padding: '2rem 1rem', 
      overflowY: 'scroll', // Forzamos scrollbar para evitar saltos
      display: 'block' // Cambiamos a block para scroll natural
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '850px', 
        margin: '0 auto 10rem auto', // Margen inferior gigante para que no se tape nada
        padding: '2.5rem', 
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        minHeight: '200px'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: overdueLoansCount > 0 ? '#EF4444' : 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{user.name}</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{user.username}@ucvvirtual.edu.pe | <span style={{ textTransform: 'capitalize' }}>{user.role}</span></p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {user.id}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>En Posesión / Retraso</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              <span style={{ color: 'var(--accent-primary)' }}>{activeLoansCount}</span>
              <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>/</span>
              <span style={{ color: '#EF4444' }}>{overdueLoansCount}</span>
            </p>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Pendientes Gestión</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--accent-gold)' }}>{pendingLoans.length}</p>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Mora Total Actual</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#EF4444' }}>
              S/ {totalDebt.toFixed(2)}
            </p>
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--accent-primary)" /> Gestión de Préstamos Activos
        </h3>

        {userLoans.filter(l => l.status !== 'returned').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '12px', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '0.9rem' }}>No hay préstamos activos actualmente.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {userLoans.filter(l => l.status !== 'returned').map(loan => {
              const book = allBooks.find(b => String(b.id) === String(loan.bookId));
              const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate);
              // overdue puede venir de BD directamente O calcularse desde la fecha
              const isOverdue = loan.status === 'overdue' || (loan.status === 'active' && getDaysRemaining(loan.dueDate).status === 'overdue');
              const isPending = loan.status === 'pending_pickup' || loan.status === 'pending_return';

              return (
                <div key={loan.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', borderLeft: isOverdue ? '4px solid #EF4444' : isPending ? '4px solid var(--accent-gold)' : '4px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={book?.cover} alt="" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{book?.title || 'Libro no encontrado'}</p>
                        {(loan.status === 'active' || loan.status === 'overdue') ? (
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: isOverdue ? '#EF4444' : 'var(--text-muted)', 
                            margin: '0.2rem 0',
                            fontWeight: isOverdue ? 700 : 400
                          }}>
                            {isOverdue ? `⚠️ Vencido desde: ${new Date(loan.dueDate).toLocaleDateString()}` : `Vence el: ${new Date(loan.dueDate).toLocaleDateString()}`}
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', margin: '0.2rem 0' }}>Estado: En espera de acción</p>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {(loan.status === 'active' || loan.status === 'overdue') && (
                        isOverdue ? <span className="badge badge-danger">Retraso</span> : <span className="badge badge-success">Activo</span>
                      )}
                      
                      {loan.status === 'pending_pickup' && (
                        <>
                          <button onClick={() => rejectBorrow(loan.id)} className="btn-secondary" style={{ padding: '0.4rem', color: '#EF4444' }} title="Rechazar">
                            <X size={16} />
                          </button>
                          <button onClick={() => approveBorrow(loan.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', background: 'var(--success-bg)', color: 'var(--success-text)', fontSize: '0.75rem', border: '1px solid var(--success-border)' }}>
                            Entregar Libro
                          </button>
                        </>
                      )}

                      {loan.status === 'pending_return' && (
                        <button onClick={() => approveReturn(loan.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', background: 'var(--info-bg)', color: 'var(--info-text)', fontSize: '0.75rem', border: '1px solid var(--info-border)' }}>
                          Confirmar Recepción
                        </button>
                      )}
                    </div>
                  </div>

                  {(loan.status === 'active' || loan.status === 'overdue') && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mora Acumulada (automática)</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: penalty.amount > 0 ? '#EF4444' : 'var(--success-text)' }}>
                          S/ {penalty.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HISTORIAL DE ACTIVIDAD (RETORNADOS) */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <History size={20} /> Historial de Actividad
        </h3>

        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Obra / Título</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Fecha Préstamo</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Mora Liquidada</th>
              </tr>
            </thead>
            <tbody>
              {userLoans.filter(l => l.status === 'returned').length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay registros históricos para este usuario.</td>
                </tr>
              ) : (
                userLoans.filter(l => l.status === 'returned').map(loan => {
                  const book = allBooks.find(b => String(b.id) === String(loan.bookId));
                  return (
                    <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>{book?.title || 'Libro eliminado'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{book?.author}</p>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                        {new Date(loan.requestDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>
                        {(loan.paidPenalty || 0) > 0 ? (
                          <span style={{ color: 'var(--success-text)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            S/ {loan.paidPenalty.toFixed(2)} pagados
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>S/ 0.00 (A tiempo)</span>
                        )}
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
  );

  return createPortal(modalContent, document.body);
}

export default UserDetailsModal
