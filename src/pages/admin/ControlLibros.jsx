import React, { useState, useMemo } from 'react'
import { BookOpen, Search, MessageCircle, Clock, AlertTriangle, DollarSign, ArrowRight, X, ChevronLeft, ChevronRight, RefreshCw, User } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'
import './ControlLibros.css'

const PER_PAGE = 4

const statusLabel = (s) => {
  if (s === 'overdue') return { text: 'Vencido', cls: 'overdue' }
  if (s === 'urgent') return { text: 'Vence pronto', cls: 'urgent' }
  if (s === 'warning') return { text: 'Vence pronto', cls: 'warning' }
  return { text: 'A tiempo', cls: 'safe' }
}

const dueText = (days, status) => {
  if (status === 'overdue') return `Retrasado ${days} días`
  return `Vence en ${days} días`
}

const avatarColors = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4']
const getAvatarColor = (name) => avatarColors[(name || '').charCodeAt(0) % avatarColors.length]

const AdminControlLibros = () => {
  const { users, loans, books, reservations } = useAppContext()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showDebtors, setShowDebtors] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [debtorSearch, setDebtorSearch] = useState('')
  const [waPreview, setWaPreview] = useState(null)

  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active' || l.status === 'overdue'), [loans])

  // Enriched rows
  const rows = useMemo(() => activeLoans.map(loan => {
    const user = users.find(u => u.id === loan.userId)
    const book = books.find(b => b.id === loan.bookId)
    const { days, status } = getDaysRemaining(loan.dueDate)
    const penalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate)
    const phone = loan.phone || user?.phone || null
    return { loan, user, book, days, status, penalty, phone }
  }), [activeLoans, users, books])

  // Stats
  const totalCirculation = rows.length
  const soonCount = rows.filter(r => r.status === 'warning' || r.status === 'urgent').length
  const overdueCount = rows.filter(r => r.status === 'overdue').length
  const totalDebt = rows.reduce((s, r) => s + r.penalty.amount, 0)

  // Filtered
  const filtered = useMemo(() => {
    let list = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.username?.toLowerCase().includes(q) ||
        r.book?.title?.toLowerCase().includes(q) ||
        r.book?.isbn?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter(r => {
        if (statusFilter === 'safe') return r.status === 'safe'
        if (statusFilter === 'soon') return r.status === 'warning' || r.status === 'urgent'
        if (statusFilter === 'overdue') return r.status === 'overdue'
        return true
      })
    }
    if (roleFilter !== 'all') {
      list = list.filter(r => {
        if (roleFilter === 'estudiante') return r.user?.role === 'estudiante'
        if (roleFilter === 'profesor') return r.user?.role === 'profesor'
        return true
      })
    }
    return list
  }, [rows, search, statusFilter, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  // Debtors
  const debtors = useMemo(() => {
    const map = {}
    rows.forEach(r => {
      if (r.penalty.amount <= 0 || !r.user) return
      if (!map[r.user.id]) map[r.user.id] = { user: r.user, amount: 0, books: 0 }
      map[r.user.id].amount += r.penalty.amount
      map[r.user.id].books++
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [rows])

  // Alerts
  const extensionRequests = loans.filter(l => l.status === 'active' && l.extensionRequested)
  const alerts = useMemo(() => {
    const a = []
    if (overdueCount > 0) a.push({ type: 'red', title: `${overdueCount} libros vencidos`, sub: 'Requieren atención inmediata' })
    if (soonCount > 0) a.push({ type: 'amber', title: `${soonCount} libros vencen pronto`, sub: 'En los próximos 3 días' })
    if (extensionRequests.length > 0) a.push({ type: 'blue', title: `${extensionRequests.length} solicitudes de extensión`, sub: 'Pendientes de aprobación' })
    return a
  }, [overdueCount, soonCount, extensionRequests.length])

  // WhatsApp
  const openWaPreview = (r) => {
    const { user, book, days, status, phone } = r
    const dueStr = new Date(r.loan.dueDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    let msg = ''
    if (status === 'overdue') {
      msg = `Hola ${user?.name} 👋\n\nTe recordamos que el libro "${book?.title}" venció el ${dueStr}.\n⚠️ Llevas ${days} días de retraso.\n\nPor favor devuélvelo lo antes posible para evitar mayores penalizaciones.\n\n¡Gracias! ✨\n- Biblioteca UCV Chimbote 📚`
    } else {
      msg = `Hola ${user?.name} 👋\n\nTe recordamos que el libro "${book?.title}" vence el ${dueStr}.\n📚 Te quedan ${days} días para devolverlo.\n\nSi deseas extender el préstamo, puedes solicitarlo directamente desde el sistema.\n\n¡Gracias! ✨\n- Biblioteca UCV Chimbote 📚`
    }
    setWaPreview({ user, phone, msg })
  }

  const sendWa = () => {
    if (!waPreview?.phone) return
    const clean = waPreview.phone.replace(/\D/g, '')
    const prefix = clean.length === 9 ? '51' : ''
    window.open(`https://wa.me/${prefix}${clean}?text=${encodeURIComponent(waPreview.msg)}`, '_blank')
    setWaPreview(null)
  }

  // Pagination helpers
  const pageNums = () => {
    const nums = []
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) nums.push(i) }
    else {
      nums.push(1)
      if (safePage > 3) nums.push('...')
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) nums.push(i)
      if (safePage < totalPages - 2) nums.push('...')
      nums.push(totalPages)
    }
    return nums
  }

  const filteredDebtors = debtors.filter(d => {
    if (!debtorSearch.trim()) return true
    const q = debtorSearch.toLowerCase()
    return d.user.name?.toLowerCase().includes(q) || d.user.username?.toLowerCase().includes(q)
  })

  return (
    <div className="animate-fade-in">
      {/* HEADER */}
      <div className="cl-header">
        <h1>Control de Libros</h1>
        <p className="cl-subtitle">Supervisión y control de todos los ejemplares en circulación.</p>
      </div>

      {/* STATS */}
      <div className="cl-stats-row">
        <div className="cl-stat stat-blue">
          <div className="cl-stat-icon blue"><BookOpen size={20} /></div>
          <div className="cl-stat-body">
            <div className="cl-stat-value">{totalCirculation}</div>
            <div className="cl-stat-label">En circulación</div>
          </div>
        </div>
        <div className="cl-stat stat-amber">
          <div className="cl-stat-icon amber"><Clock size={20} /></div>
          <div className="cl-stat-body">
            <div className="cl-stat-value">{soonCount}</div>
            <div className="cl-stat-label">Vencen pronto</div>
          </div>
        </div>
        <div className="cl-stat stat-red">
          <div className="cl-stat-icon red"><AlertTriangle size={20} /></div>
          <div className="cl-stat-body">
            <div className="cl-stat-value">{overdueCount}</div>
            <div className="cl-stat-label">Vencidos</div>
          </div>
        </div>
        <div className="cl-stat stat-purple">
          <div className="cl-stat-icon purple"><DollarSign size={20} /></div>
          <div className="cl-stat-body">
            <div className="cl-stat-value">S/ {totalDebt.toFixed(2)}</div>
            <div className="cl-stat-label">Mora total</div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="cl-main-grid">
        {/* LEFT */}
        <div className="cl-left-col">
          {/* Filters */}
          <div className="cl-filters">
            <div className="cl-search-wrap">
              <Search size={15} />
              <input placeholder="Buscar por usuario, libro o código…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="cl-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="all">Todos los estados</option>
              <option value="safe">A tiempo</option>
              <option value="soon">Vence pronto</option>
              <option value="overdue">Vencido</option>
            </select>
            <select className="cl-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
              <option value="all">Todos los roles</option>
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Docente</option>
            </select>
          </div>

          {/* Table */}
          <div className="cl-table-panel">
            {filtered.length === 0 ? (
              <div className="cl-empty"><BookOpen size={38} /><p>No se encontraron préstamos activos bajo estos criterios.</p></div>
            ) : (
              <>
                <div className="cl-table-wrap">
                  <table className="cl-table">
                    <thead><tr>
                      <th>Usuario</th><th>Libro</th><th>Fecha préstamo</th><th>Vence</th><th>Estado</th><th>Mora</th><th>Acción</th>
                    </tr></thead>
                    <tbody>
                      {pageRows.map(r => {
                        const sl = statusLabel(r.status)
                        const isDocente = r.user?.role === 'profesor'
                        return (
                          <tr key={r.loan.id}>
                            <td>
                              <div className="cl-user-cell">
                                <div className="cl-user-avatar" style={{ background: getAvatarColor(r.user?.name), color: '#fff' }}>
                                  {(r.user?.name || '?')[0]}
                                </div>
                                <div className="cl-user-details">
                                  <div className="cl-user-name">{r.user?.name}</div>
                                  <div className="cl-user-email">{r.user?.username}@ucvvirtual.edu.pe</div>
                                  <span className={`cl-role-badge ${isDocente ? 'docente' : 'estudiante'}`}>
                                    {isDocente ? 'DOCENTE' : 'ESTUDIANTE'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="cl-book-cell">
                                <img src={r.book?.cover} alt="" className="cl-book-cover" />
                                <div className="cl-book-info">
                                  <div className="cl-book-title">{r.book?.title}</div>
                                  <div className="cl-book-author">{r.book?.author}</div>
                                  <div className="cl-book-code">Código: {r.book?.isbn || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="cl-date">{r.loan.borrowDate ? new Date(r.loan.borrowDate).toLocaleDateString('es-PE') : '—'}</span></td>
                            <td>
                              <div className="cl-due-main">{new Date(r.loan.dueDate).toLocaleDateString('es-PE')}</div>
                              <div className={`cl-due-sub ${r.status}`}>{dueText(r.days, r.status)}</div>
                            </td>
                            <td><span className={`cl-status-badge ${sl.cls}`}>{sl.text}</span></td>
                            <td>
                              <div className={`cl-penalty ${r.penalty.amount > 0 ? 'has-debt' : 'no-debt'}`}>
                                S/ {r.penalty.amount.toFixed(2)}
                              </div>
                              {r.penalty.amount > 0 && <div className="cl-penalty-sub">Deuda activa</div>}
                            </td>
                            <td><button className="cl-btn-wa" title="WhatsApp" onClick={() => openWaPreview(r)}><MessageCircle size={15} /></button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="cl-pagination">
                  <span className="cl-pagination-info">Mostrando {(safePage-1)*PER_PAGE+1} a {Math.min(safePage*PER_PAGE, filtered.length)} de {filtered.length} registros</span>
                  <div className="cl-pagination-btns">
                    <button className="cl-page-btn" disabled={safePage<=1} onClick={() => setPage(safePage-1)}><ChevronLeft size={14} /></button>
                    {pageNums().map((n,i) => n === '...' ? <span key={`e${i}`} className="cl-page-ellipsis">…</span> : <button key={n} className={`cl-page-btn ${n===safePage?'active':''}`} onClick={() => setPage(n)}>{n}</button>)}
                    <button className="cl-page-btn" disabled={safePage>=totalPages} onClick={() => setPage(safePage+1)}><ChevronRight size={14} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="cl-right-col">
          {/* Circulation Summary */}
          <div className="cl-panel">
            <div className="cl-panel-header"><h3>Resumen de Circulación</h3></div>
            <div className="cl-panel-body">
              <div className="cl-circ-item"><span className="cl-circ-label blue">En circulación</span><span className="cl-circ-value">{totalCirculation}</span></div>
              <div className="cl-circ-item"><span className="cl-circ-label amber">Vencen pronto</span><span className="cl-circ-value">{soonCount}</span></div>
              <div className="cl-circ-item"><span className="cl-circ-label red">Vencidos</span><span className="cl-circ-value">{overdueCount}</span></div>
              <div className="cl-circ-item"><span className="cl-circ-label purple">Mora total</span><span className="cl-circ-value">S/ {totalDebt.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Debtors */}
          <div className="cl-panel">
            <div className="cl-panel-header"><h3>Usuarios con deuda</h3></div>
            <div className="cl-panel-body">
              {debtors.length === 0 ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin deudores activos ✨</div>
              ) : debtors.slice(0, 4).map((d, i) => (
                <div key={d.user.id} className="cl-debtor-item">
                  <div className="cl-debtor-pos">{i + 1}</div>
                  <div className="cl-debtor-info">
                    <div className="cl-debtor-name">{d.user.name}</div>
                    <div className="cl-debtor-sub">{d.books} libro{d.books > 1 ? 's' : ''} vencido{d.books > 1 ? 's' : ''}</div>
                  </div>
                  <div className="cl-debtor-amount">S/ {d.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
            {debtors.length > 0 && (
              <div className="cl-panel-footer">
                <button onClick={() => { setDebtorSearch(''); setShowDebtors(true) }}>Ver todos los deudores <ArrowRight size={13} /></button>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="cl-panel">
            <div className="cl-panel-header"><h3>Alertas importantes</h3></div>
            <div className="cl-panel-body">
              {alerts.length === 0 ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin alertas activas ✨</div>
              ) : alerts.map((a, i) => (
                <div key={i} className="cl-alert-item">
                  <div className={`cl-alert-icon ${a.type}`}>
                    {a.type === 'red' ? <AlertTriangle size={15} /> : a.type === 'amber' ? <Clock size={15} /> : <RefreshCw size={15} />}
                  </div>
                  <div className="cl-alert-info">
                    <div className="cl-alert-title">{a.title}</div>
                    <div className="cl-alert-sub">{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {alerts.length > 0 && (
              <div className="cl-panel-footer">
                <button onClick={() => setShowAlerts(true)}>Ver todas las alertas <ArrowRight size={13} /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Debtors */}
      {showDebtors && (
        <div className="cl-modal-overlay" onClick={() => setShowDebtors(false)}>
          <div className="cl-modal" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>Todos los deudores</h3>
              <button className="cl-modal-close" onClick={() => setShowDebtors(false)}><X size={16} /></button>
            </div>
            <div className="cl-modal-search">
              <input placeholder="Buscar por nombre o correo…" value={debtorSearch} onChange={e => setDebtorSearch(e.target.value)} autoFocus />
            </div>
            <div className="cl-modal-body">
              {filteredDebtors.length === 0 ? (
                <div className="cl-modal-empty">No se encontraron resultados.</div>
              ) : (
                <table className="cl-modal-table">
                  <thead><tr><th>Usuario</th><th>Libros vencidos</th><th>Mora total</th></tr></thead>
                  <tbody>
                    {filteredDebtors.map(d => (
                      <tr key={d.user.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.user.name}</td>
                        <td>{d.books}</td>
                        <td style={{ fontWeight: 600, color: '#F87171' }}>S/ {d.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Alerts */}
      {showAlerts && (
        <div className="cl-modal-overlay" onClick={() => setShowAlerts(false)}>
          <div className="cl-modal" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>Todas las alertas importantes</h3>
              <button className="cl-modal-close" onClick={() => setShowAlerts(false)}><X size={16} /></button>
            </div>
            <div className="cl-modal-body" style={{ paddingTop: '1rem' }}>
              <table className="cl-modal-table">
                <thead><tr><th>Alerta</th><th>Detalle</th><th>Fecha</th></tr></thead>
                <tbody>
                  {overdueCount > 0 && <tr><td style={{ color: '#F87171', fontWeight: 600 }}>{overdueCount} libros vencidos</td><td>Requieren atención inmediata</td><td>{new Date().toLocaleDateString('es-PE')}</td></tr>}
                  {soonCount > 0 && <tr><td style={{ color: '#FBBF24', fontWeight: 600 }}>{soonCount} libros vencen pronto</td><td>En los próximos 3 días</td><td>{new Date().toLocaleDateString('es-PE')}</td></tr>}
                  {extensionRequests.length > 0 && <tr><td style={{ color: '#60A5FA', fontWeight: 600 }}>{extensionRequests.length} solicitudes de extensión</td><td>Pendientes de aprobación</td><td>{new Date().toLocaleDateString('es-PE')}</td></tr>}
                  {debtors.length > 0 && <tr><td style={{ color: '#F87171', fontWeight: 600 }}>{debtors.length} usuario{debtors.length > 1 ? 's' : ''} con deuda alta</td><td>Mora mayor a S/ {debtors.reduce((s,d)=>s+d.amount,0).toFixed(2)}</td><td>{new Date().toLocaleDateString('es-PE')}</td></tr>}
                  {reservations.filter(r => r.priority).length > 0 && <tr><td style={{ color: '#C4B5FD', fontWeight: 600 }}>{reservations.filter(r => r.priority).length} reservas prioritarias</td><td>En espera de disponibilidad</td><td>{new Date().toLocaleDateString('es-PE')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WhatsApp Preview */}
      {waPreview && (
        <div className="cl-modal-overlay" onClick={() => setWaPreview(null)}>
          <div className="cl-modal cl-wa-preview" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>Vista previa del mensaje WhatsApp</h3>
              <button className="cl-modal-close" onClick={() => setWaPreview(null)}><X size={16} /></button>
            </div>
            <div className="cl-modal-body">
              <div className="cl-wa-phone">
                <div className="cl-wa-phone-avatar"><User size={16} /></div>
                <div>
                  <div className="cl-wa-phone-name">{waPreview.user?.name}</div>
                  <div className="cl-wa-phone-num">{waPreview.phone ? `+51 ${waPreview.phone}` : 'Sin número'}</div>
                </div>
              </div>
              <div className="cl-wa-bubble">
                {waPreview.msg}
                <div className="cl-wa-bubble-time">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
              </div>
              <p className="cl-wa-note">Este mensaje se enviará automáticamente por WhatsApp al número registrado del usuario.</p>
              <div className="cl-wa-actions">
                <button className="cl-wa-send" onClick={sendWa} disabled={!waPreview.phone}>
                  <MessageCircle size={15} /> Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminControlLibros
