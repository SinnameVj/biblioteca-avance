import React, { useState, useMemo } from 'react'
import { XSquare, AlertTriangle, MessageCircle, Clock, BookOpen, User, Package, ArrowRight, ChevronRight, BookMarked, RefreshCw, Bell, DollarSign, X, Search } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'
import { useNavigate } from 'react-router-dom'
import './Mostrador.css'

const PREVIEW_LIMIT = 3

/* ─── Reusable Role Badge ─── */
const RoleBadge = ({ role }) => {
  const isDocente = role === 'profesor'
  return (
    <span className={`role-badge ${isDocente ? 'docente' : 'estudiante'}`}>
      {isDocente ? 'DOCENTE' : 'ESTUDIANTE'}
    </span>
  )
}

/* ─── Full-List Modal with Search ─── */
const ListModal = ({ title, onClose, searchPlaceholder, children, searchValue, onSearchChange }) => (
  <div className="mostrador-modal-overlay" onClick={onClose}>
    <div className="mostrador-modal" onClick={e => e.stopPropagation()}>
      <div className="mostrador-modal-header">
        <h3>{title}</h3>
        <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="mostrador-modal-search">
        <input
          type="text"
          placeholder={searchPlaceholder || 'Buscar por nombre, correo o libro...'}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          autoFocus
        />
      </div>
      <div className="mostrador-modal-body">{children}</div>
    </div>
  </div>
)

const AdminPrestamos = () => {
  const { loans, books, users, reservations, approveBorrow, approveReturn, rejectBorrow, approveExtension, rejectExtension, showToast } = useAppContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('devoluciones')
  const [showAllPickups, setShowAllPickups] = useState(false)
  const [showAllReturns, setShowAllReturns] = useState(false)
  const [pickupSearch, setPickupSearch] = useState('')
  const [returnSearch, setReturnSearch] = useState('')

  const pendingPickups = loans.filter(l => l.status === 'pending_pickup')
  const pendingReturns = loans.filter(l => l.status === 'pending_return')
  const extensionRequests = loans.filter(l => l.status === 'active' && l.extensionRequested)

  const overdueLoans = loans.filter(l => {
    if (l.status !== 'active' && l.status !== 'overdue') return false
    const { status } = getDaysRemaining(l.dueDate)
    return status === 'overdue'
  })
  const urgentLoans = loans.filter(l => {
    if (l.status !== 'active') return false
    const { status } = getDaysRemaining(l.dueDate)
    return status === 'urgent' || status === 'warning'
  })
  const priorityReservations = reservations.filter(r => r.priority)

  const todayReceptions = loans.filter(l => {
    if (l.status !== 'returned' || !l.returnDate) return false
    return new Date(l.returnDate).toDateString() === new Date().toDateString()
  }).length

  // Filtered lists for modals
  const filteredPickups = useMemo(() => {
    if (!pickupSearch.trim()) return pendingPickups
    const q = pickupSearch.toLowerCase()
    return pendingPickups.filter(loan => {
      const book = books.find(b => b.id === loan.bookId)
      const user = users.find(u => u.id === loan.userId)
      return (book?.title?.toLowerCase().includes(q) || user?.name?.toLowerCase().includes(q) || user?.email?.toLowerCase().includes(q) || user?.username?.toLowerCase().includes(q))
    })
  }, [pickupSearch, pendingPickups, books, users])

  const filteredReturns = useMemo(() => {
    if (!returnSearch.trim()) return pendingReturns
    const q = returnSearch.toLowerCase()
    return pendingReturns.filter(loan => {
      const book = books.find(b => b.id === loan.bookId)
      const user = users.find(u => u.id === loan.userId)
      return (book?.title?.toLowerCase().includes(q) || user?.name?.toLowerCase().includes(q) || user?.email?.toLowerCase().includes(q) || user?.username?.toLowerCase().includes(q))
    })
  }, [returnSearch, pendingReturns, books, users])

  const handleWhatsApp = (phone, name, bookTitle, type = 'pickup') => {
    if (!phone) { showToast('El usuario no registró un número de teléfono.', 'error'); return }
    const cleanPhone = phone.replace(/\D/g, '')
    const prefix = cleanPhone.length === 9 ? '51' : ''
    let message = ''
    if (type === 'pickup') {
      message = `¡Hola ${name}! 👋 Tenemos noticias de la Biblioteca UCV. El libro *"${bookTitle}"* que solicitaste ya está listo para recoger en el mostrador. ¡Te esperamos! 📚✨`
    } else if (type === 'queue') {
      message = `¡Excelentes noticias, ${name}! 🚀 El libro *"${bookTitle}"* que tenías en reserva ya cuenta con stock disponible. ¡Acércate pronto a la biblioteca para solicitarlo! 📖🔥`
    }
    window.open(`https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleConfirmReturn = async (loanId, penaltyAmount) => {
    const success = await approveReturn(loanId)
    if (success) {
      if (penaltyAmount > 0.01) {
        showToast(`✅ Libro recibido. Deuda pendiente de cobro: S/ ${penaltyAmount.toFixed(2)}`, 'error')
        setTimeout(() => navigate('/admin/penalizaciones'), 1500)
      } else {
        showToast('✅ Libro recibido y registrado correctamente.')
      }
    } else {
      showToast('Error al procesar la devolución. Intente de nuevo.', 'error')
    }
  }

  /* ─── Render a single pickup card ─── */
  const renderPickupCard = (loan) => {
    const book = books.find(b => b.id === loan.bookId)
    const user = users.find(u => u.id === loan.userId)
    const isDocente = user?.role === 'profesor'
    return (
      <div key={loan.id} className="pickup-card">
        <img src={book?.cover} alt="" className="pickup-cover" />
        <div className="pickup-info">
          <div className="pickup-title">{book?.title}</div>
          <div className="pickup-user">
            <User size={12} />
            <strong>{user?.name}</strong>
            <RoleBadge role={user?.role} />
            {isDocente && <span className="pickup-badge priority">★ Docente</span>}
          </div>
          <div className="pickup-meta-row">
            <div className="pickup-meta-item">
              <span className="meta-label">Solicitado</span>
              <span className="meta-value">{new Date(loan.requestDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {new Date(loan.requestDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        <div className="pickup-actions">
          <button className="btn-deliver" onClick={() => approveBorrow(loan.id)}>Entregar</button>
          <button className="btn-whatsapp" onClick={() => handleWhatsApp(loan.phone || user?.phone, user?.name, book?.title, 'pickup')} title="Avisar por WhatsApp"><MessageCircle size={15} /></button>
          <button className="btn-reject" onClick={() => rejectBorrow(loan.id)} title="Denegar solicitud"><XSquare size={15} /></button>
        </div>
      </div>
    )
  }

  /* ─── Render a single return item ─── */
  const renderReturnItem = (loan) => {
    const book = books.find(b => b.id === loan.bookId)
    const user = users.find(u => u.id === loan.userId)
    const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate)
    return (
      <div key={loan.id} className="op-item">
        <img src={book?.cover} alt="" className="op-cover" />
        <div className="op-info">
          <h4>{book?.title}</h4>
          <div className="op-sub">Devuelto por: <strong>{user?.name}</strong></div>
          {penalty.amount > 0 ? (
            <div style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={12} /> MORA: S/ {penalty.amount.toFixed(2)}
            </div>
          ) : (
            <div style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.3rem' }}>✓ A tiempo</div>
          )}
        </div>
        <div className="op-meta">
          <div className="op-date">{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className={`op-status ${penalty.amount > 0 ? 'pending-review' : 'received'}`}>{penalty.amount > 0 ? 'Pendiente revisión' : 'Recibido'}</div>
        </div>
        <div className="op-actions">
          <button className={`btn-op ${penalty.amount > 0 ? 'warning' : 'primary'}`} onClick={() => handleConfirmReturn(loan.id, penalty.amount)}>
            {penalty.amount > 0 ? 'Revisar' : 'Registrar'}
          </button>
        </div>
      </div>
    )
  }

  const hasAlerts = overdueLoans.length > 0 || urgentLoans.length > 0 || priorityReservations.length > 0 || extensionRequests.length > 0

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>

      {/* HEADER */}
      <div className="mostrador-header">
        <div>
          <h1>Mostrador <BookMarked size={24} className="header-icon" /></h1>
          <p className="header-subtitle">Gestión de préstamos, devoluciones, reservas y extensiones.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="mostrador-stats-row">
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap amber"><Package size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Esperando Recogida en Ventanilla</div>
            <div className="stat-value">{pendingPickups.length}</div>
            <div className="stat-sub">Listo para entregar</div>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap blue"><BookOpen size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Recepciones Hoy</div>
            <div className="stat-value">{todayReceptions}</div>
            <div className="stat-sub">Libros devueltos</div>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon-wrap green"><RefreshCw size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Extensiones Pendientes</div>
            <div className="stat-value">{extensionRequests.length}</div>
            <div className="stat-sub">Por aprobar</div>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon-wrap purple"><Clock size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Reservas en Espera</div>
            <div className="stat-value">{reservations.length}</div>
            <div className="stat-sub">En cola</div>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon-wrap red"><AlertTriangle size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Alertas Activas</div>
            <div className="stat-value">{overdueLoans.length + urgentLoans.length}</div>
            <div className="stat-sub">Requieren atención</div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="mostrador-main-grid">

        {/* LEFT COLUMN */}
        <div className="mostrador-left-col">

          {/* ESPERANDO RECOGIDA */}
          <div className="mostrador-section">
            <div className="mostrador-section-header">
              <h2>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F59E0B', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
                Esperando Recogida en Ventanilla
                <span className="section-subtitle"> - Solicitudes por entregar</span>
              </h2>
            </div>
            <div className="mostrador-section-body">
              {pendingPickups.length === 0 ? (
                <div className="mostrador-empty"><Clock size={40} className="empty-icon" /><p>No hay entregas pendientes por ahora.</p></div>
              ) : (
                pendingPickups.slice(0, PREVIEW_LIMIT).map(renderPickupCard)
              )}
            </div>
            {pendingPickups.length > 0 && (
              <div className="mostrador-section-footer">
                <button onClick={() => { setPickupSearch(''); setShowAllPickups(true) }}>
                  Ver todas las solicitudes ({pendingPickups.length}) <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* GESTIÓN OPERATIVA DIARIA */}
          <div className="mostrador-section">
            <div className="mostrador-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div>
                <h2 style={{ marginBottom: '0.15rem' }}>Control de solicitudes</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Procesa devoluciones y extensiones.</span>
              </div>
            </div>
            <div className="mostrador-tabs">
              <button className={`mostrador-tab ${activeTab === 'devoluciones' ? 'active' : ''}`} onClick={() => setActiveTab('devoluciones')}>
                Devoluciones <span className="tab-count">{pendingReturns.length}</span>
              </button>
              <button className={`mostrador-tab ${activeTab === 'extensiones' ? 'active' : ''}`} onClick={() => setActiveTab('extensiones')}>
                Extensiones <span className="tab-count">{extensionRequests.length}</span>
              </button>
            </div>
            <div className="mostrador-section-body">
              {activeTab === 'devoluciones' && (
                <>
                  {pendingReturns.length === 0 ? (
                    <div className="mostrador-empty"><BookOpen size={36} className="empty-icon" /><p>No hay devoluciones por confirmar.</p></div>
                  ) : (
                    pendingReturns.slice(0, PREVIEW_LIMIT).map(renderReturnItem)
                  )}
                  {pendingReturns.length > PREVIEW_LIMIT && (
                    <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
                      <button onClick={() => { setReturnSearch(''); setShowAllReturns(true) }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Ver todas las devoluciones ({pendingReturns.length}) <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'extensiones' && (
                <>
                  {extensionRequests.length === 0 ? (
                    <div className="mostrador-empty"><RefreshCw size={36} className="empty-icon" /><p>No hay solicitudes de extensión pendientes.</p></div>
                  ) : (
                    extensionRequests.map(loan => {
                      const book = books.find(b => b.id === loan.bookId)
                      const user = users.find(u => u.id === loan.userId)
                      const extensionDays = user?.role === 'profesor' ? 30 : 14
                      const { status } = getDaysRemaining(loan.dueDate)
                      return (
                        <div key={loan.id} className="op-item">
                          <img src={book?.cover} alt="" className="op-cover" />
                          <div className="op-info">
                            <h4>{book?.title}</h4>
                            <div className="op-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              Solicita: <strong>{user?.name}</strong> <RoleBadge role={user?.role} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.75rem' }}>
                              <span style={{ color: status === 'overdue' ? '#EF4444' : 'var(--text-muted)' }}>Vence: {new Date(loan.dueDate).toLocaleDateString('es-PE')}</span>
                              <span style={{ color: '#10B981', fontWeight: 700 }}>+{extensionDays} días solicitados</span>
                            </div>
                          </div>
                          <div className="op-actions">
                            <button className="btn-op danger-outline" onClick={() => { rejectExtension(loan.id); showToast('Extensión rechazada.') }} title="Rechazar"><XSquare size={16} /></button>
                            <button className="btn-op success" onClick={() => { approveExtension(loan.id); showToast(`✅ Extensión aprobada: +${extensionDays} días para ${user?.name}`) }}>Aprobar +{extensionDays}d</button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="mostrador-right-col">

          {/* LISTA DE ESPERA */}
          <div className="mostrador-section">
            <div className="mostrador-section-header">
              <h2>Lista de Espera</h2>
              <span className="section-badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>{reservations.length} en cola</span>
            </div>
            <div className="mostrador-section-body" style={{ padding: '0.5rem 1.5rem' }}>
              {reservations.length === 0 ? (
                <div className="mostrador-empty" style={{ padding: '1.5rem 0' }}><p style={{ fontSize: '0.82rem' }}>No hay usuarios en lista de espera.</p></div>
              ) : (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.5rem 0 0.25rem', fontWeight: 600, letterSpacing: '0.03em' }}>Usuarios esperando disponibilidad de libros.</div>
                  {[...reservations].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || new Date(a.date) - new Date(b.date)).slice(0, 5).map((res, idx) => {
                    const book = books.find(b => b.id === res.bookId)
                    const user = users.find(u => u.id === res.userId)
                    const isAvailable = book?.availableCopies > 0
                    const userLoans = loans.filter(l => l.userId === user?.id && l.phone)
                    const finalPhone = user?.phone || (userLoans.length > 0 ? userLoans[0].phone : null)
                    return (
                      <div key={res.id} className="queue-list-item">
                        <div className="queue-position">{idx + 1}</div>
                        <div className="queue-info">
                          <div className="queue-book-title">{book?.title}</div>
                          <div className="queue-user-name">{user?.name}</div>
                        </div>
                        {res.priority && <span className="queue-priority-badge">Prioridad</span>}
                        {isAvailable && (
                          <button className="queue-notify-btn" onClick={() => handleWhatsApp(finalPhone, user?.name, book?.title, 'queue')} title="Notificar stock disponible"><MessageCircle size={14} /></button>
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
            {reservations.length > 5 && (
              <div className="mostrador-section-footer"><button>Ver lista completa <ArrowRight size={14} /></button></div>
            )}
          </div>

          {/* RECORDATORIOS Y ALERTAS */}
          <div className="mostrador-section">
            <div className="mostrador-section-header"><h2>Recordatorios y Alertas</h2></div>
            <div className="mostrador-section-body" style={{ padding: '0.75rem 1rem' }}>
              {overdueLoans.length > 0 && (
                <div className="alert-item" onClick={() => navigate('/admin/penalizaciones')}>
                  <div className="alert-icon-wrap alert-red"><DollarSign size={18} /></div>
                  <div className="alert-info">
                    <div className="alert-title">{overdueLoans.length === 1 ? `${users.find(u => u.id === overdueLoans[0].userId)?.name || 'Usuario'} tiene una deuda activa` : `${overdueLoans.length} usuarios con deudas activas`}</div>
                    <div className="alert-sub">{overdueLoans.length === 1 ? (() => { const bk = books.find(b => b.id === overdueLoans[0].bookId); const p = calculatePenalty(overdueLoans[0].dueDate, new Date(), overdueLoans[0].manualPenalty, bk?.penaltyRate); return `S/ ${p.amount.toFixed(2)} por libros vencidos` })() : 'Total acumulado pendiente de cobro'}</div>
                  </div>
                  <ChevronRight size={16} className="alert-chevron" />
                </div>
              )}
              {urgentLoans.length > 0 && (
                <div className="alert-item">
                  <div className="alert-icon-wrap alert-amber"><Bell size={18} /></div>
                  <div className="alert-info">
                    <div className="alert-title">{urgentLoans.length} libros vencen pronto</div>
                    <div className="alert-sub">Requieren atención</div>
                  </div>
                  <ChevronRight size={16} className="alert-chevron" />
                </div>
              )}
              {extensionRequests.length > 0 && (
                <div className="alert-item" onClick={() => setActiveTab('extensiones')}>
                  <div className="alert-icon-wrap alert-green"><RefreshCw size={18} /></div>
                  <div className="alert-info">
                    <div className="alert-title">{extensionRequests.length} solicitud{extensionRequests.length > 1 ? 'es' : ''} de extensión pendiente{extensionRequests.length > 1 ? 's' : ''}</div>
                    <div className="alert-sub">Esperando aprobación</div>
                  </div>
                  <ChevronRight size={16} className="alert-chevron" />
                </div>
              )}
              {priorityReservations.length > 0 && (
                <div className="alert-item">
                  <div className="alert-icon-wrap alert-purple"><User size={18} /></div>
                  <div className="alert-info">
                    <div className="alert-title">{priorityReservations.length} reservas prioritarias en espera</div>
                    <div className="alert-sub">Docentes con prioridad</div>
                  </div>
                  <ChevronRight size={16} className="alert-chevron" />
                </div>
              )}
              {!hasAlerts && (
                <div className="mostrador-empty" style={{ padding: '1.5rem 0' }}><p style={{ fontSize: '0.82rem' }}>Sin alertas activas. ¡Todo en orden! ✨</p></div>
              )}
            </div>
            {hasAlerts && (
              <div className="mostrador-section-footer">
                <button onClick={() => setActiveTab('extensiones')}>Ver todos los recordatorios <ArrowRight size={14} /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: All Pickups */}
      {showAllPickups && (
        <ListModal title="Todos los Pedidos Listos" onClose={() => setShowAllPickups(false)} searchValue={pickupSearch} onSearchChange={setPickupSearch} searchPlaceholder="Buscar por nombre, correo o libro...">
          {filteredPickups.length === 0 ? (
            <div className="mostrador-modal-empty">No se encontraron resultados.</div>
          ) : filteredPickups.map(renderPickupCard)}
        </ListModal>
      )}

      {/* MODAL: All Returns */}
      {showAllReturns && (
        <ListModal title="Todas las Devoluciones" onClose={() => setShowAllReturns(false)} searchValue={returnSearch} onSearchChange={setReturnSearch} searchPlaceholder="Buscar por nombre, correo o libro...">
          {filteredReturns.length === 0 ? (
            <div className="mostrador-modal-empty">No se encontraron resultados.</div>
          ) : filteredReturns.map(renderReturnItem)}
        </ListModal>
      )}
    </div>
  )
}

export default AdminPrestamos
