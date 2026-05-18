import React, { useState, useMemo } from 'react'
import { Book, Users, Clock, AlertTriangle, ArrowRight, Download, Calendar, ChevronRight, BookOpen, RotateCcw, Bookmark, Bell } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { migrateData } from '../../data/migrate-to-supabase'
import { getDaysRemaining, calculatePenalty } from '../../utils/penalties'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO, differenceInMinutes, differenceInHours, differenceInDays as diffDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import './Dashboard.css'

const COLORS_DONUT = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  const now = new Date()
  const mins = differenceInMinutes(now, d)
  if (mins < 60) return `Hace ${mins} min`
  const hrs = differenceInHours(now, d)
  if (hrs < 24) return `Hace ${hrs} ${hrs === 1 ? 'hora' : 'horas'}`
  const days = diffDays(now, d)
  return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => <div key={i} className="value" style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

const Dashboard = () => {
  const { books, users, loans, reservations, heldBooks, currentUser, showToast } = useAppContext()
  const navigate = useNavigate()
  const [migrating, setMigrating] = useState(false)
  const [chartRange, setChartRange] = useState('7')
  const [barYear, setBarYear] = useState('current')


  const handleMigrate = async () => {
    setMigrating(true)
    showToast('Iniciando migración de datos a Supabase...')
    await migrateData()
    setMigrating(false)
    window.location.reload()
  }

  // KPI computations
  const totalBooks = books.reduce((acc, b) => acc + b.totalCopies, 0)
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue').length
  const todayReturns = loans.filter(l => {
    if (l.status !== 'returned' || !l.returnDate) return false
    const rd = new Date(l.returnDate)
    const now = new Date()
    return rd.toDateString() === now.toDateString()
  }).length
  const activePenalties = loans.filter(l => {
    if (l.status !== 'active' && l.status !== 'overdue') return false
    if (!l.dueDate) return false
    return new Date(l.dueDate) < new Date()
  }).length

  // Chart: Préstamos vs Devoluciones
  const areaData = useMemo(() => {
    const days = parseInt(chartRange)
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'dd MMM', { locale: es })
      const dayLoans = loans.filter(l => {
        if (!l.requestDate) return false
        return new Date(l.requestDate).toDateString() === date.toDateString()
      }).length
      const dayReturns = loans.filter(l => {
        if (!l.returnDate) return false
        return new Date(l.returnDate).toDateString() === date.toDateString()
      }).length
      result.push({ name: dateStr, Préstamos: dayLoans, Devoluciones: dayReturns })
    }
    return result
  }, [loans, chartRange])

  // Chart: Distribución de libros (donut)
  const donutData = useMemo(() => {
    const available = books.reduce((a, b) => a + b.availableCopies, 0)
    const loaned = loans.filter(l => l.status === 'active' || l.status === 'overdue').length
    const reserved = reservations.length + heldBooks.length
    const maintenance = Math.max(0, totalBooks - available - loaned - reserved)
    return [
      { name: 'Disponibles', value: available },
      { name: 'Prestados', value: loaned },
      { name: 'Reservados', value: reserved },
      { name: 'Mantenimiento', value: maintenance },
    ]
  }, [books, loans, reservations, heldBooks, totalBooks])

  // Chart: Préstamos por mes
  const barData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const year = barYear === 'current' ? new Date().getFullYear() : new Date().getFullYear() - 1
    return months.map((m, i) => {
      const count = loans.filter(l => {
        if (!l.requestDate) return false
        const d = new Date(l.requestDate)
        return d.getFullYear() === year && d.getMonth() === i
      }).length
      return { name: m, Préstamos: count }
    })
  }, [loans, barYear])

  // Alerts
  const alerts = useMemo(() => {
    const list = []
    // Overdue loans
    const overdue = loans.filter(l => (l.status === 'active' || l.status === 'overdue') && l.dueDate && new Date(l.dueDate) < new Date())
    if (overdue.length > 0) list.push({ type: 'danger', title: `${overdue.length} préstamos vencidos`, sub: 'Requieren atención inmediata', time: 'Urgente', category: 'vencidos' })
    // Due soon
    const dueSoon = loans.filter(l => {
      if (l.status !== 'active') return false
      if (!l.dueDate) return false
      const { days, status } = getDaysRemaining(l.dueDate)
      return status === 'warning' || status === 'urgent'
    })
    if (dueSoon.length > 0) list.push({ type: 'warning', title: `${dueSoon.length} préstamos por vencer`, sub: 'En los próximos 7 días', time: 'Pronto', category: 'por_vencer' })
    // Pending returns
    const pendRet = loans.filter(l => l.status === 'pending_return')
    if (pendRet.length > 0) list.push({ type: 'info', title: `${pendRet.length} devoluciones pendientes`, sub: 'Esperando revisión', time: 'Pendiente', category: 'devoluciones' })
    // Extension requests
    const extReqs = loans.filter(l => l.extensionRequested)
    if (extReqs.length > 0) list.push({ type: 'purple', title: `${extReqs.length} extensiones pendientes`, sub: 'Solicitudes de prórroga', time: 'Pendiente', category: 'extensiones' })
    // Pending pickups
    const pendPick = loans.filter(l => l.status === 'pending_pickup')
    if (pendPick.length > 0) list.push({ type: 'info', title: `${pendPick.length} retiros pendientes`, sub: 'Libros por entregar', time: 'Pendiente', category: 'retiros' })
    // Reservations
    if (reservations.length > 0) list.push({ type: 'purple', title: `${reservations.length} reservas en cola`, sub: 'Esperando disponibilidad', time: 'Info', category: 'reservas' })
    return list
  }, [loans, reservations])

  // Activity feed
  const recentActivity = useMemo(() => {
    const items = []
    loans.slice(0, 20).forEach(loan => {
      const book = books.find(b => b.id === loan.bookId)
      const user = users.find(u => u.id === loan.userId)
      if (loan.status === 'returned' && loan.returnDate) {
        items.push({ type: 'return', title: `${user?.name || 'Usuario'} devolvió un libro`, sub: book?.title || '', date: loan.returnDate })
      }
      if (loan.requestDate) {
        items.push({ type: 'loan', title: `${user?.name || 'Usuario'} solicitó un préstamo`, sub: book?.title || '', date: loan.requestDate })
      }
      if (loan.extensionRequested) {
        items.push({ type: 'extension', title: `${user?.name || 'Usuario'} solicitó extensión`, sub: book?.title || '', date: loan.requestDate })
      }
    })
    items.sort((a, b) => new Date(b.date) - new Date(a.date))
    return items.slice(0, 5)
  }, [loans, books, users])

  // PDF export
  const exportPDF = (title, headers, rows) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(title, 14, 20)
    doc.setFontSize(9)
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28)
    autoTable(doc, { head: [headers], body: rows, startY: 34, theme: 'grid', styles: { fontSize: 8 } })
    doc.save(`${title.replace(/\s/g, '_')}.pdf`)
    showToast('PDF exportado correctamente')
  }

  const exportLoansReport = () => {
    const rows = loans.filter(l => l.status !== 'returned').map(l => {
      const book = books.find(b => b.id === l.bookId)
      const user = users.find(u => u.id === l.userId)
      return [book?.title || '', user?.name || '', l.status, l.requestDate ? format(new Date(l.requestDate), 'dd/MM/yyyy') : '', l.dueDate ? format(new Date(l.dueDate), 'dd/MM/yyyy') : '']
    })
    exportPDF('Reporte de Préstamos', ['Libro', 'Usuario', 'Estado', 'Solicitud', 'Vencimiento'], rows)
  }

  const exportMonthlyReport = () => {
    const rows = barData.map(d => [d.name, d.Préstamos])
    exportPDF('Préstamos por Mes', ['Mes', 'Cantidad'], rows)
  }

  const iconMap = { loan: <BookOpen size={15} />, return: <RotateCcw size={15} />, reserve: <Bookmark size={15} />, extension: <Clock size={15} />, penalty: <AlertTriangle size={15} /> }
  const alertIconMap = { danger: <AlertTriangle size={15} />, warning: <Bell size={15} />, info: <Clock size={15} />, purple: <Bookmark size={15} /> }



  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1>¡Bienvenido, {currentUser?.name?.split(' ')[0] || 'Administrador'}! 👋</h1>
          <p>Resumen general de la gestión bibliotecaria</p>
        </div>
        <div className="dash-header-right">
          {books.length === 0 && (
            <button onClick={handleMigrate} disabled={migrating} className="dash-migrate-btn">
              {migrating ? 'Migrando...' : '🚀 Migrar Datos'}
            </button>
          )}
          <div className="dash-date-badge">
            <Calendar size={15} />
            {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dash-kpi-row">
        <div className="dash-kpi-card kpi-blue">
          <div className="dash-kpi-icon kpi-blue"><Users size={20} /></div>
          <div className="dash-kpi-info">
            <div className="dash-kpi-value">{users.length.toLocaleString()}</div>
            <div className="dash-kpi-label">Usuarios Registrados</div>
          </div>
        </div>
        <div className="dash-kpi-card kpi-purple">
          <div className="dash-kpi-icon kpi-purple"><Book size={20} /></div>
          <div className="dash-kpi-info">
            <div className="dash-kpi-value">{totalBooks.toLocaleString()}</div>
            <div className="dash-kpi-label">Libros en inventario</div>
          </div>
        </div>
        <div className="dash-kpi-card kpi-cyan">
          <div className="dash-kpi-icon kpi-cyan"><BookOpen size={20} /></div>
          <div className="dash-kpi-info">
            <div className="dash-kpi-value">{activeLoans}</div>
            <div className="dash-kpi-label">Préstamos Activos</div>
          </div>
        </div>
        <div className="dash-kpi-card kpi-green">
          <div className="dash-kpi-icon kpi-green"><RotateCcw size={20} /></div>
          <div className="dash-kpi-info">
            <div className="dash-kpi-value">{todayReturns}</div>
            <div className="dash-kpi-label">Devoluciones Hoy</div>
          </div>
        </div>
        <div className="dash-kpi-card kpi-orange">
          <div className="dash-kpi-icon kpi-orange"><AlertTriangle size={20} /></div>
          <div className="dash-kpi-info">
            <div className="dash-kpi-value">{activePenalties}</div>
            <div className="dash-kpi-label">Moras Activas</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dash-charts-row">
        {/* Préstamos vs Devoluciones */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">Préstamos vs Devoluciones</h3>
            <div className="dash-chart-filter">
              <select value={chartRange} onChange={e => setChartRange(e.target.value)}>
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="14">Últimos 14 días</option>
              </select>
            </div>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPrest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Préstamos" stroke="#3B82F6" fill="url(#gradPrest)" strokeWidth={2} />
                <Area type="monotone" dataKey="Devoluciones" stroke="#10B981" fill="url(#gradDev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-chart-footer">
            <button className="dash-chart-btn" onClick={exportLoansReport}><span>Ver reporte completo</span><Download size={14} /></button>
          </div>
        </div>

        {/* Distribución de Libros */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">Distribución de Libros</h3>
          </div>
          <div className="dash-chart-body" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <div style={{ flex: '0 0 55%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {donutData.map((_, i) => <Cell key={i} fill={COLORS_DONUT[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-donut-center">
                  <div className="total-value">{totalBooks.toLocaleString()}</div>
                  <div className="total-label">Total</div>
                </div>
              </div>
              <div className="dash-chart-legend">
                {donutData.map((d, i) => (
                  <div key={i} className="dash-legend-item">
                    <span className="dash-legend-dot" style={{ background: COLORS_DONUT[i] }}></span>
                    <span>{d.name}</span>
                    <span className="dash-legend-value">{d.value} ({totalBooks > 0 ? ((d.value / totalBooks) * 100).toFixed(1) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dash-chart-footer">
            <button className="dash-chart-btn" onClick={() => navigate('/admin/control-libros')}>Ir a Control de Libros <ArrowRight size={14} /></button>
          </div>
        </div>

        {/* Préstamos por Mes */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">Préstamos por Mes</h3>
            <div className="dash-chart-filter">
              <select value={barYear} onChange={e => setBarYear(e.target.value)}>
                <option value="current">Este año</option>
                <option value="last">Año anterior</option>
              </select>
            </div>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Préstamos" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-chart-footer">
            <button className="dash-chart-btn" onClick={exportMonthlyReport}><span>Exportar reporte PDF</span><Download size={14} /></button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dash-bottom-row">
        {/* Disponibilidad General */}
        <div className="dash-bottom-card">
          <div className="dash-section-header">
            <h3 className="dash-section-title">Disponibilidad General</h3>
          </div>
          <div className="dash-availability-list">
            {books.slice(0, 5).map(book => {
              const perc = book.totalCopies > 0 ? (book.availableCopies / book.totalCopies) * 100 : 0
              const color = perc < 20 ? 'var(--danger-text)' : perc < 50 ? 'var(--warning-text)' : 'var(--success-text)'
              return (
                <div key={book.id} className="dash-avail-item">
                  <div className="dash-avail-top">
                    <span className="dash-avail-name">{book.title}</span>
                    <span className="dash-avail-count" style={{ color }}>{book.availableCopies}/{book.totalCopies}</span>
                  </div>
                  <div className="dash-avail-bar">
                    <div className="dash-avail-fill" style={{ width: `${perc}%`, background: color }}></div>
                  </div>
                </div>
              )
            })}
            {books.length === 0 && <div className="dash-empty"><p>Sin libros registrados</p></div>}
          </div>
          <button className="dash-card-footer-link" onClick={() => navigate('/admin/catalogo')} style={{ marginTop: '1rem' }}>Ir al Catálogo <ArrowRight size={14} /></button>
        </div>

        {/* Actividad Reciente */}
        <div className="dash-bottom-card">
          <div className="dash-section-header">
            <h3 className="dash-section-title">Actividad Reciente</h3>
          </div>
          <div className="dash-activity-list">
            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
              <div key={i} className="dash-activity-item">
                <div className={`dash-activity-icon type-${act.type}`}>{iconMap[act.type]}</div>
                <div className="dash-activity-content">
                  <p className="dash-activity-title">{act.title}</p>
                  <p className="dash-activity-sub">{act.sub}</p>
                </div>
                <span className="dash-activity-time">{timeAgo(act.date)}</span>
              </div>
            )) : <div className="dash-empty"><p>Sin actividad reciente</p></div>}
          </div>
          <button className="dash-card-footer-link" onClick={() => navigate('/admin/prestamos')} style={{ marginTop: '1rem' }}>Ir a Mostrador <ArrowRight size={14} /></button>
        </div>

        {/* Alertas y Pendientes */}
        <div className="dash-bottom-card">
          <div className="dash-section-header">
            <h3 className="dash-section-title">
              Alertas y Pendientes
              {alerts.length > 0 && <span className="dash-alerts-badge">{alerts.length}</span>}
            </h3>
            <button className="dash-section-link" onClick={() => navigate('/admin/prestamos')}>Ver todas <ChevronRight size={14} /></button>
          </div>
          <div className="dash-alert-list">
            {alerts.length > 0 ? alerts.slice(0, 4).map((a, i) => (
              <div key={i} className="dash-alert-item" onClick={() => navigate('/admin/prestamos')}>
                <div className={`dash-alert-icon alert-${a.type}`}>{alertIconMap[a.type]}</div>
                <div className="dash-alert-content">
                  <p className="dash-alert-title">{a.title}</p>
                  <p className="dash-alert-sub">{a.sub}</p>
                </div>
                <div className="dash-alert-meta">
                  <span className="dash-alert-time">{a.time}</span>
                  <ChevronRight size={12} className="dash-alert-arrow" />
                </div>
              </div>
            )) : <div className="dash-empty"><p>Sin alertas pendientes 🎉</p></div>}
          </div>
          <button className="dash-card-footer-link" onClick={() => navigate('/admin/prestamos')} style={{ marginTop: '1rem' }}>Ir a Mostrador <ArrowRight size={14} /></button>
        </div>
      </div>


    </div>
  )
}

export default Dashboard
