import React, { useState, useMemo } from 'react'
import { BookOpen, CheckCircle, Clock, DollarSign, Search, ArrowRight, X, AlertTriangle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'
import './Historial.css'

const Historial = () => {
  const { currentUser, loans, books, reservations } = useAppContext()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('historial')
  const [showLoansModal, setShowLoansModal] = useState(false)

  const myLoans = useMemo(() => loans.filter(l => l.userId === currentUser.id), [loans, currentUser.id])
  const returnedLoans = useMemo(() => myLoans.filter(l => l.status === 'returned'), [myLoans])
  const activeLoans = useMemo(() => myLoans.filter(l => l.status === 'active' || l.status === 'overdue'), [myLoans])
  const myReservations = useMemo(() => reservations.filter(r => r.userId === currentUser.id), [reservations, currentUser.id])

  // Stats
  const totalRead = returnedLoans.length
  const inPossession = activeLoans.length
  const totalReservations = myReservations.length
  const totalDebt = useMemo(() => {
    let sum = 0
    activeLoans.forEach(l => {
      const b = books.find(bk => bk.id === l.bookId)
      sum += calculatePenalty(l.dueDate, new Date(), l.manualPenalty, b?.penaltyRate).amount
    })
    return sum
  }, [activeLoans, books])

  // Upcoming (3 days or less)
  const upcoming = useMemo(() => {
    return activeLoans.map(l => {
      const b = books.find(bk => bk.id === l.bookId)
      const { days, status } = getDaysRemaining(l.dueDate)
      return { loan: l, book: b, days, status }
    }).filter(r => r.status === 'urgent' || r.status === 'overdue')
  }, [activeLoans, books])

  // Active loans for summary
  const activeSummary = useMemo(() => {
    const soonCount = activeLoans.filter(l => {
      const { status } = getDaysRemaining(l.dueDate)
      return status === 'urgent' || status === 'warning'
    }).length
    return { active: activeLoans.length, soon: soonCount }
  }, [activeLoans])

  // Enriched returned loans for table
  const historyRows = useMemo(() => returnedLoans.map(l => {
    const b = books.find(bk => bk.id === l.bookId)
    const wasLate = (l.paidPenalty || 0) > 0
    return { loan: l, book: b, wasLate, penalty: l.paidPenalty || 0 }
  }), [returnedLoans, books])

  // Filtered history
  const filtered = useMemo(() => {
    let list = historyRows
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.book?.title?.toLowerCase().includes(q) || r.book?.isbn?.toLowerCase().includes(q))
    }
    if (statusFilter === 'ok') list = list.filter(r => !r.wasLate)
    if (statusFilter === 'late') list = list.filter(r => r.wasLate)
    return list
  }, [historyRows, search, statusFilter])

  // Reservations rows
  const reservationRows = useMemo(() => myReservations.map(r => {
    const b = books.find(bk => bk.id === r.bookId)
    return { res: r, book: b }
  }), [myReservations, books])

  // Extensions
  const extensionLoans = useMemo(() => myLoans.filter(l => l.extensionRequested).map(l => {
    const b = books.find(bk => bk.id === l.bookId)
    return { loan: l, book: b }
  }), [myLoans, books])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="hs-header">
        <h1>Mi Historial</h1>
        <p className="hs-subtitle">Revisa tus préstamos anteriores, reservas y solicitudes.</p>
      </div>

      {/* Stats */}
      <div className="hs-stats-row">
        <div className="hs-stat stat-blue">
          <div className="hs-stat-icon blue"><BookOpen size={20} /></div>
          <div className="hs-stat-body"><div className="hs-stat-value">{totalRead}</div><div className="hs-stat-label">Libros leídos</div></div>
        </div>
        <div className="hs-stat stat-green">
          <div className="hs-stat-icon green"><CheckCircle size={20} /></div>
          <div className="hs-stat-body"><div className="hs-stat-value">{inPossession}</div><div className="hs-stat-label">En posesión</div></div>
        </div>
        <div className="hs-stat stat-amber">
          <div className="hs-stat-icon amber"><Clock size={20} /></div>
          <div className="hs-stat-body"><div className="hs-stat-value">{totalReservations}</div><div className="hs-stat-label">Reservas realizadas</div></div>
        </div>
        <div className="hs-stat stat-red">
          <div className="hs-stat-icon red"><DollarSign size={20} /></div>
          <div className="hs-stat-body"><div className="hs-stat-value">S/ {totalDebt.toFixed(2)}</div><div className="hs-stat-label">Mora acumulada</div></div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="hs-main-grid">
        {/* Left */}
        <div className="hs-left-col">
          <div className="hs-table-panel">
            {/* Tabs */}
            <div className="hs-tabs">
              <button className={`hs-tab ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
                Historial <span className="hs-tab-count">{returnedLoans.length}</span>
              </button>
              <button className={`hs-tab ${activeTab === 'reservas' ? 'active' : ''}`} onClick={() => setActiveTab('reservas')}>
                Reservas <span className="hs-tab-count">{myReservations.length}</span>
              </button>
              <button className={`hs-tab ${activeTab === 'extensiones' ? 'active' : ''}`} onClick={() => setActiveTab('extensiones')}>
                Extensiones <span className="hs-tab-count">{extensionLoans.length}</span>
              </button>
            </div>

            {/* Historial Tab */}
            {activeTab === 'historial' && (
              <>
                <div className="hs-filters">
                  <div className="hs-search-wrap">
                    <Search size={14} />
                    <input placeholder="Buscar por libro o código…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className="hs-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Todos los estados</option>
                    <option value="ok">Devuelto correctamente</option>
                    <option value="late">Devuelto con retraso</option>
                  </select>
                </div>

                <div className="hs-table-wrap">
                  {filtered.length === 0 ? (
                    <div className="hs-empty"><BookOpen size={36} /><p>No se encontraron registros en tu historial.</p></div>
                  ) : (
                    <table className="hs-table">
                      <thead><tr><th>Libro</th><th>Devuelto el</th><th>Estado</th><th style={{ textAlign: 'right' }}>Mora</th></tr></thead>
                      <tbody>
                        {filtered.map(r => (
                          <tr key={r.loan.id}>
                            <td>
                              <div className="hs-book-cell">
                                <img src={r.book?.cover} alt="" className="hs-book-cover" />
                                <div>
                                  <div className="hs-book-title">{r.book?.title || 'Libro eliminado'}</div>
                                  <div className="hs-book-author">{r.book?.author}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="hs-date">{r.loan.returnDate ? new Date(r.loan.returnDate).toLocaleDateString('es-PE') : '—'}</span></td>
                            <td><span className={`hs-status ${r.wasLate ? 'late' : 'ok'}`}>{r.wasLate ? 'Devuelto con retraso' : 'Devuelto correctamente'}</span></td>
                            <td style={{ textAlign: 'right' }}><span className={`hs-penalty ${r.penalty > 0 ? 'has' : 'none'}`}>S/ {r.penalty.toFixed(2)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* Reservas Tab */}
            {activeTab === 'reservas' && (
              <div className="hs-table-wrap">
                {reservationRows.length === 0 ? (
                  <div className="hs-empty"><Clock size={36} /><p>No tienes reservas activas.</p></div>
                ) : (
                  <table className="hs-table">
                    <thead><tr><th>Libro</th><th>Fecha reserva</th><th>Prioridad</th></tr></thead>
                    <tbody>
                      {reservationRows.map(r => (
                        <tr key={r.res.id}>
                          <td>
                            <div className="hs-book-cell">
                              <img src={r.book?.cover} alt="" className="hs-book-cover" />
                              <div><div className="hs-book-title">{r.book?.title || '—'}</div><div className="hs-book-author">{r.book?.author}</div></div>
                            </div>
                          </td>
                          <td><span className="hs-date">{r.res.date ? new Date(r.res.date).toLocaleDateString('es-PE') : '—'}</span></td>
                          <td>{r.res.priority ? <span className="hs-status late">Prioritaria</span> : <span className="hs-status ok">Normal</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Extensiones Tab */}
            {activeTab === 'extensiones' && (
              <div className="hs-table-wrap">
                {extensionLoans.length === 0 ? (
                  <div className="hs-empty"><CheckCircle size={36} /><p>No tienes solicitudes de extensión pendientes.</p></div>
                ) : (
                  <table className="hs-table">
                    <thead><tr><th>Libro</th><th>Vence</th><th>Estado</th></tr></thead>
                    <tbody>
                      {extensionLoans.map(r => (
                        <tr key={r.loan.id}>
                          <td>
                            <div className="hs-book-cell">
                              <img src={r.book?.cover} alt="" className="hs-book-cover" />
                              <div><div className="hs-book-title">{r.book?.title}</div><div className="hs-book-author">{r.book?.author}</div></div>
                            </div>
                          </td>
                          <td><span className="hs-date">{new Date(r.loan.dueDate).toLocaleDateString('es-PE')}</span></td>
                          <td><span className="hs-status late">Pendiente de aprobación</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="hs-right-col">
          {/* Personal Summary */}
          <div className="hs-panel">
            <div className="hs-panel-header"><h3>Resumen personal</h3></div>
            <div className="hs-panel-body">
              <div className="hs-summary-item"><span className="hs-summary-label blue">Préstamos activos</span><span className="hs-summary-value">{activeSummary.active}</span></div>
              <div className="hs-summary-item"><span className="hs-summary-label amber">Próximos a vencer</span><span className="hs-summary-value">{activeSummary.soon}</span></div>
              <div className="hs-summary-item"><span className="hs-summary-label red">Mora acumulada</span><span className="hs-summary-value">S/ {totalDebt.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="hs-panel">
            <div className="hs-panel-header"><h3>Próximos a vencer</h3></div>
            <div className="hs-panel-body">
              {upcoming.length === 0 ? (
                <div style={{ padding: '0.75rem 0', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sin libros próximos a vencer ✨</div>
              ) : upcoming.slice(0, 3).map(r => (
                <div key={r.loan.id} className="hs-upcoming-card">
                  <img src={r.book?.cover} alt="" className="hs-upcoming-cover" />
                  <div className="hs-upcoming-info">
                    <div className="hs-upcoming-title">{r.book?.title}</div>
                    <div className="hs-upcoming-author">{r.book?.author}</div>
                    <div className={`hs-upcoming-due ${r.status === 'overdue' ? 'urgent' : 'warning'}`}>
                      {r.status === 'overdue' ? `Vencido hace ${r.days} días` : `Vence en ${r.days} días`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hs-panel-footer">
              <button onClick={() => setShowLoansModal(true)}>Ver mis préstamos <ArrowRight size={13} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Préstamos activos */}
      {showLoansModal && (
        <div className="hs-modal-overlay" onClick={() => setShowLoansModal(false)}>
          <div className="hs-modal" onClick={e => e.stopPropagation()}>
            <div className="hs-modal-header">
              <h3>Mis préstamos activos</h3>
              <button className="hs-modal-close" onClick={() => setShowLoansModal(false)}><X size={15} /></button>
            </div>
            <div className="hs-modal-body">
              {activeLoans.length === 0 ? (
                <div className="hs-empty" style={{ padding: '1.5rem 0' }}><p>No tienes préstamos activos actualmente.</p></div>
              ) : activeLoans.map(l => {
                const b = books.find(bk => bk.id === l.bookId)
                const { days, status } = getDaysRemaining(l.dueDate)
                const penalty = calculatePenalty(l.dueDate, new Date(), l.manualPenalty, b?.penaltyRate)
                return (
                  <div key={l.id} className="hs-upcoming-card" style={{ padding: '0.75rem 0' }}>
                    <img src={b?.cover} alt="" className="hs-upcoming-cover" />
                    <div className="hs-upcoming-info">
                      <div className="hs-upcoming-title">{b?.title}</div>
                      <div className="hs-upcoming-author">{b?.author}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vence: {new Date(l.dueDate).toLocaleDateString('es-PE')}</span>
                        <span className={`hs-upcoming-due ${status === 'overdue' ? 'urgent' : status === 'urgent' ? 'warning' : ''}`}>
                          {status === 'overdue' ? `Retrasado ${days}d` : `${days} días restantes`}
                        </span>
                      </div>
                      {penalty.amount > 0 && <div style={{ fontSize: '0.72rem', color: '#F87171', fontWeight: 600, marginTop: '0.1rem' }}>Mora: S/ {penalty.amount.toFixed(2)}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Historial
