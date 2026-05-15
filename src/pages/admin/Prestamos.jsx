import React from 'react'
import { CheckSquare, XSquare, PlusCircle, AlertTriangle, MessageCircle, Clock, BookOpen, User } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'
import { useNavigate } from 'react-router-dom'

const AdminPrestamos = () => {
  const { loans, books, users, reservations, approveBorrow, approveReturn, rejectBorrow, approveExtension, rejectExtension, showToast } = useAppContext()
  const navigate = useNavigate()

  const pendingPickups = loans.filter(l => l.status === 'pending_pickup')
  const pendingReturns = loans.filter(l => l.status === 'pending_return')
  const extensionRequests = loans.filter(l => l.status === 'active' && l.extensionRequested)

  const handleWhatsApp = (phone, name, bookTitle, type = 'pickup') => {
    if (!phone) {
      showToast('El usuario no registró un número de teléfono.', 'error');
      return;
    }
    
    // Limpiar número (solo dígitos)
    const cleanPhone = phone.replace(/\D/g, '');
    const prefix = cleanPhone.length === 9 ? '51' : ''; // Asumir Perú si son 9 dígitos
    
    let message = '';
    if (type === 'pickup') {
      message = `¡Hola ${name}! 👋 Tenemos noticias de la Biblioteca UCV. El libro *"${bookTitle}"* que solicitaste ya está listo para recoger en el mostrador. ¡Te esperamos! 📚✨`;
    } else if (type === 'queue') {
      message = `¡Excelentes noticias, ${name}! 🚀 El libro *"${bookTitle}"* que tenías en reserva ya cuenta con stock disponible. ¡Acércate pronto a la biblioteca para solicitarlo! 📖🔥`;
    }

    const url = `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleConfirmReturn = async (loanId, penaltyAmount) => {
    // Siempre recibimos el libro primero — la mora se registra pero no bloquea
    const success = await approveReturn(loanId);
    if (success) {
      if (penaltyAmount > 0.01) {
        showToast(`✅ Libro recibido. Deuda pendiente de cobro: S/ ${penaltyAmount.toFixed(2)}`, 'error');
        setTimeout(() => navigate('/admin/penalizaciones'), 1500);
      } else {
        showToast('✅ Libro recibido y registrado correctamente.');
      }
    } else {
      showToast('Error al procesar la devolución. Intente de nuevo.', 'error');
    }
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mostrador</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Gestión de flujos físicos, reservas y comunicación directa con el alumnado.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pendientes Hoy</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{pendingPickups.length + pendingReturns.length}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3.5rem' }}>
        
        {/* 1. ENTREGAS FISICAS PENDIENTES */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B', boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)' }}></div>
              Esperando Recogida en Ventanilla
            </h2>
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontWeight: 600 }}>{pendingPickups.length} Pedidos</span>
          </div>
          
          {pendingPickups.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)' }}>
              <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No hay entregas pendientes por ahora.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.25rem' }}>
              {pendingPickups.map(loan => {
                const book = books.find(b => b.id === loan.bookId)
                const user = users.find(u => u.id === loan.userId)
                
                return (
                  <div key={loan.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '4px solid #F59E0B' }}>
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={book?.cover} alt="" style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--bg-secondary)', borderRadius: '50%', padding: '4px', border: '1px solid var(--border-light)' }}>
                          <BookOpen size={14} color="var(--accent-primary)" />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>{book?.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User size={14} /> <strong>{user?.name}</strong> <span style={{ opacity: 0.6 }}>• {user?.role}</span>
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solicitado el: {new Date(loan.requestDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--bg-tertiary)' }}>
                      <button 
                        onClick={() => handleWhatsApp(loan.phone || user?.phone, user?.name, book?.title, 'pickup')}
                        style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                        <MessageCircle size={18} /> Avisar por WhatsApp
                      </button>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => rejectBorrow(loan.id)} className="btn-secondary" style={{ padding: '0.6rem', color: 'var(--danger-text)' }} title="Denegar">
                          <XSquare size={20} />
                        </button>
                        <button onClick={() => approveBorrow(loan.id)} className="btn-primary" style={{ padding: '0.6rem 1.25rem', background: '#10B981', color: 'white', border: 'none', fontWeight: 600 }}>
                          Entregar Libro
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 2. DEVOLUCIONES PENDIENTES */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3B82F6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)' }}></div>
              Recepción de Libros
            </h2>
          </div>
          
          {pendingReturns.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>No hay devoluciones por confirmar.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.25rem' }}>
              {pendingReturns.map(loan => {
                const book = books.find(b => b.id === loan.bookId)
                const user = users.find(u => u.id === loan.userId)
                const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate)

                return (
                  <div key={loan.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #3B82F6' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={book?.cover} alt="" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{book?.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Retorna: <strong>{user?.name}</strong></p>
                        {penalty.amount > 0 ? (
                          <div style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={14} /> REQUIERE COBRO: S/ {penalty.amount.toFixed(2)}
                          </div>
                        ) : (
                          <div style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.4rem' }}>✓ Libro a tiempo</div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConfirmReturn(loan.id, penalty.amount)} 
                      className="btn-primary" 
                      style={{ 
                        background: penalty.amount > 0 ? 'rgba(239, 68, 68, 0.1)' : '#3B82F6', 
                        color: penalty.amount > 0 ? '#EF4444' : 'white', 
                        border: penalty.amount > 0 ? '1px solid #EF4444' : 'none',
                        padding: '0.75rem 1rem'
                      }}
                    >
                      {penalty.amount > 0 ? 'Liquidar Mora' : 'Recibido'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 3. SOLICITUDES DE EXTENSIÓN */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
              Solicitudes de Extensión
            </h2>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 600 }}>{extensionRequests.length} Pendientes</span>
          </div>
          
          {extensionRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>No hay solicitudes de extensión pendientes.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.25rem' }}>
              {extensionRequests.map(loan => {
                const book = books.find(b => b.id === loan.bookId)
                const user = users.find(u => u.id === loan.userId)
                const extensionDays = user?.role === 'profesor' ? 30 : 14
                const { days, status } = getDaysRemaining(loan.dueDate)

                return (
                  <div key={loan.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #10B981' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={book?.cover} alt="" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{book?.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Solicita: <strong>{user?.name}</strong>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: user?.role === 'profesor' ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: 600 }}>
                            [{user?.role === 'profesor' ? 'DOCENTE' : 'ESTUDIANTE'}]
                          </span>
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                          <span style={{ color: status === 'overdue' ? '#EF4444' : 'var(--text-muted)' }}>
                            Vence: {new Date(loan.dueDate).toLocaleDateString()}
                          </span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>
                            +{extensionDays} días solicitados
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { rejectExtension(loan.id); showToast('Extensión rechazada.'); }} className="btn-secondary" style={{ padding: '0.6rem', color: 'var(--danger-text)' }} title="Rechazar">
                        <XSquare size={20} />
                      </button>
                      <button onClick={() => { approveExtension(loan.id); showToast(`✅ Extensión aprobada: +${extensionDays} días para ${user?.name}`); }} className="btn-primary" style={{ padding: '0.6rem 1.25rem', background: '#10B981', color: 'white', border: 'none', fontWeight: 600 }}>
                        Aprobar +{extensionDays}d
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 4. LISTA DE ESPERA (RESERVAS) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8B5CF6', boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' }}></div>
              Lista de Espera Activa
            </h2>
            <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', fontWeight: 600 }}>{reservations.length} En Fila</span>
          </div>
          
          {reservations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>No hay usuarios en lista de espera.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
              {reservations.map(res => {
                const book = books.find(b => b.id === res.bookId)
                const user = users.find(u => u.id === res.userId)
                const isAvailable = book?.availableCopies > 0;
                
                // Fallback: si el usuario no tiene teléfono en perfil, buscamos si alguna vez lo puso al pedir otro libro
                const userLoans = loans.filter(l => l.userId === user?.id && l.phone);
                const fallbackPhone = userLoans.length > 0 ? userLoans[0].phone : null;
                const finalPhone = user?.phone || fallbackPhone;
                
                return (
                  <div key={res.id} className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${res.priority ? '#8B5CF6' : 'var(--text-muted)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <img src={book?.cover} alt="" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{book?.title}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.name} {res.priority && <span style={{ color: '#8B5CF6', fontSize: '0.7rem', fontWeight: 700 }}>[DOCENTE]</span>}</p>
                        </div>
                      </div>
                      {isAvailable && (
                        <button 
                          onClick={() => handleWhatsApp(finalPhone, user?.name, book?.title, 'queue')}
                          style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                        >
                          <MessageCircle size={14} /> Notificar Stock
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default AdminPrestamos
