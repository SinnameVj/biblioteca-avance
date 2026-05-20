import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, Save, X, BookOpen, CheckCircle, Package, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import './Inventario.css'

/* ═══════════════════════════════════════
   Book Modal (Add / Edit) — visual upgrade
   ═══════════════════════════════════════ */
const BookModal = ({ isOpen, onClose, onSubmit, editingBook, existingCategories }) => {
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', category: 'General', cover: '', totalCopies: 1, availableCopies: 1 })
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useAppContext();

  useEffect(() => {
    if (editingBook) {
      setFormData(editingBook);
      setCoverPreview(editingBook.cover);
      setIsNewCategory(false);
      setNewCategoryName('');
    } else {
      setFormData({ title: '', author: '', isbn: '', category: existingCategories[0] || 'General', cover: '', totalCopies: 1, availableCopies: 1 });
      setCoverPreview(null);
      setCoverFile(null);
      setIsNewCategory(false);
      setNewCategoryName('');
    }
    setIsSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBook, isOpen])

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = isNewCategory ? newCategoryName.trim() : formData.category;
    if (!finalCategory) { showToast("Por favor seleccione o escriba una categoría.", "error"); return; }
    
    setIsSaving(true);
    const success = await onSubmit({
      ...formData,
      category: finalCategory,
      totalCopies: parseInt(formData.totalCopies),
      availableCopies: parseInt(formData.availableCopies)
    }, coverFile);
    
    if (success) {
      onClose();
    } else {
      showToast("Error al guardar los cambios.", "error");
      setIsSaving(false);
    }
  }

  return (
    <div className="inv-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="inv-modal animate-fade-in">
        <div className="inv-modal-header">
          <h2>{editingBook ? 'Editar Ejemplar' : 'Añadir Nueva Obra'}</h2>
          <button className="inv-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="inv-modal-form">
          <div>
            <label className="inv-form-label">Título Oficial</label>
            <input type="text" required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="inv-form-label">Autor</label>
            <input type="text" required className="input-field" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
          </div>
          <div className="inv-form-row">
            <div>
              <label className="inv-form-label">ISBN (Opcional)</label>
              <input type="text" placeholder="Auto-generar..." className="input-field" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} />
            </div>
            <div>
              <label className="inv-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Categoría
                <button type="button" onClick={() => setIsNewCategory(!isNewCategory)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  {isNewCategory ? 'Seleccionar' : 'Crear Nueva'}
                </button>
              </label>
              {isNewCategory ? (
                 <input type="text" required placeholder="Escriba nueva..." className="input-field" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              ) : (
                 <select required className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                   {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              )}
            </div>
          </div>
          <div>
            <label className="inv-form-label">Imagen de Portada</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {coverPreview && (
                <img src={coverPreview} alt="Preview" style={{ width: '55px', height: '75px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-light)' }} />
              )}
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="cover-upload" />
                <label htmlFor="cover-upload" className="btn-secondary" style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '0.65rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                  {coverFile ? 'Cambiar Imagen' : 'Subir Archivo'}
                </label>
              </div>
            </div>
            <input type="url" placeholder="O pega URL de imagen..." className="input-field" style={{ marginTop: '0.5rem' }} value={formData.cover} 
              onChange={e => { setFormData({...formData, cover: e.target.value}); setCoverPreview(e.target.value); setCoverFile(null); }} />
          </div>
          <div className="inv-form-row">
            <div>
              <label className="inv-form-label">Stock Total</label>
              <input type="number" min="1" required className="input-field" value={formData.totalCopies} onChange={e => {
                const num = parseInt(e.target.value);
                setFormData({...formData, totalCopies: num, availableCopies: num});
              }} />
            </div>
            <div>
              <label className="inv-form-label">Disponibles</label>
              <input type="number" min="0" max={formData.totalCopies} required className="input-field" value={formData.availableCopies} onChange={e => setFormData({...formData, availableCopies: e.target.value})} />
            </div>
          </div>
          <div className="inv-form-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSaving ? 'Guardando...' : <><Save size={16} /> Guardar Registro</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   Delete Confirm Modal
   ═══════════════════════════════════════ */
const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, bookTitle }) => {
  if (!isOpen) return null;
  return (
    <div className="inv-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="inv-modal animate-fade-in" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Trash2 size={28} />
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>¿Confirmar Eliminación?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Estás a punto de eliminar permanentemente <strong>"{bookTitle}"</strong> del catálogo. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={onConfirm} className="btn-primary" style={{ flex: 1, background: '#EF4444', color: 'white' }}>Eliminar Obra</button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   Helper: book stock status
   ═══════════════════════════════════════ */
const getBookStatus = (book) => {
  if (book.availableCopies === 0) return { label: 'Sin stock', cls: 'no-stock' }
  if (book.availableCopies <= 3) return { label: 'Bajo stock', cls: 'low-stock' }
  return { label: 'Disponible', cls: 'available' }
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
const AdminCatalog = () => {
  const { books, addBook, updateBook, deleteBook, loans, showToast } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, bookId: null, bookTitle: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const existingCategories = [...new Set(books.map(b => b.category))].filter(Boolean)
  const categoriesWithAll = ['Todas', ...existingCategories]

  // KPI data
  const totalCopies = books.reduce((a, b) => a + b.totalCopies, 0)
  const totalAvailable = books.reduce((a, b) => a + b.availableCopies, 0)
  const totalLoaned = loans.filter(l => l.status === 'active' || l.status === 'overdue').length
  const noStockBooks = books.filter(b => b.availableCopies === 0)
  const lowStockBooks = books.filter(b => b.availableCopies > 0 && b.availableCopies <= 3)

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.isbn && b.isbn.includes(searchTerm))
      const matchesCategory = categoryFilter === 'Todas' || b.category === categoryFilter
      let matchesStatus = true
      if (statusFilter === 'Disponible') matchesStatus = b.availableCopies > 3
      else if (statusFilter === 'Bajo stock') matchesStatus = b.availableCopies > 0 && b.availableCopies <= 3
      else if (statusFilter === 'Sin stock') matchesStatus = b.availableCopies === 0
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [books, searchTerm, categoryFilter, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize))
  const paginatedBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [searchTerm, categoryFilter, statusFilter, pageSize])

  const handleAdd = async (data, file) => {
    const ok = await addBook(data, file);
    if (ok) showToast('¡Libro añadido exitosamente!');
    return ok;
  }

  const handleUpdate = async (data, file) => {
    const ok = await updateBook(data, file);
    if (ok) showToast('¡Registro actualizado correctamente!');
    return ok;
  }

  const handleOpenEdit = (book) => { setEditingBook(book); setIsModalOpen(true); }
  const handleOpenAdd = () => { setEditingBook(null); setIsModalOpen(true); }

  const openDeleteModal = (book) => {
    const isLoaned = loans.some(l => l.bookId === book.id);
    if (isLoaned) { showToast("No se puede borrar: Libro en préstamo activo.", "error"); return; }
    setDeleteConfirm({ isOpen: true, bookId: book.id, bookTitle: book.title });
  }

  const confirmDelete = async () => {
    const ok = await deleteBook(deleteConfirm.bookId);
    if (ok) showToast('Libro eliminado del sistema.');
    else showToast('Error al eliminar el libro.', 'error');
    setDeleteConfirm({ isOpen: false, bookId: null, bookTitle: '' });
  }

  const clearFilters = () => { setSearchTerm(''); setCategoryFilter('Todas'); setStatusFilter('Todos'); }

  const renderPageButtons = () => {
    const btns = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)

    if (start > 1) { btns.push(<button key={1} className="inv-page-btn" onClick={() => setPage(1)}>1</button>); if (start > 2) btns.push(<span key="d1" className="inv-page-dots">...</span>) }
    for (let i = start; i <= end; i++) btns.push(<button key={i} className={`inv-page-btn${i === page ? ' active' : ''}`} onClick={() => setPage(i)}>{i}</button>)
    if (end < totalPages) { if (end < totalPages - 1) btns.push(<span key="d2" className="inv-page-dots">...</span>); btns.push(<button key={totalPages} className="inv-page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>) }
    return btns
  }

  return (
    <div className="inv-page-wrapper animate-fade-in">
      <BookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={editingBook ? handleUpdate : handleAdd} editingBook={editingBook} existingCategories={existingCategories} />
      <DeleteConfirmModal isOpen={deleteConfirm.isOpen} bookTitle={deleteConfirm.bookTitle} onConfirm={confirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, bookId: null, bookTitle: '' })} />

      {/* Header */}
      <div className="inv-header">
        <div className="inv-header-left">
          <h1>Inventario Bibliográfico</h1>
          <p>Gestión completa del inventario físico y digital del Campus.</p>
        </div>
        <div className="inv-header-right">
          <button className="inv-btn-add" onClick={handleOpenAdd}><Plus size={16} /> Añadir obra</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="inv-kpi-row">
        <div className="inv-kpi-card kpi-blue">
          <div className="inv-kpi-icon kpi-blue"><Package size={20} /></div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-value">{totalCopies.toLocaleString()}</div>
            <div className="inv-kpi-label">Total de ejemplares</div>
          </div>
        </div>
        <div className="inv-kpi-card kpi-green">
          <div className="inv-kpi-icon kpi-green"><CheckCircle size={20} /></div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-value">{totalAvailable.toLocaleString()}</div>
            <div className="inv-kpi-label">Disponibles</div>
            {totalCopies > 0 && <div className="inv-kpi-sub green">{((totalAvailable / totalCopies) * 100).toFixed(1)}% del total</div>}
          </div>
        </div>
        <div className="inv-kpi-card kpi-purple">
          <div className="inv-kpi-icon kpi-purple"><BookOpen size={20} /></div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-value">{totalLoaned}</div>
            <div className="inv-kpi-label">Prestados</div>
            {totalCopies > 0 && <div className="inv-kpi-sub purple">{((totalLoaned / totalCopies) * 100).toFixed(1)}% del total</div>}
          </div>
        </div>
        <div className="inv-kpi-card kpi-orange">
          <div className="inv-kpi-icon kpi-orange"><AlertTriangle size={20} /></div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-value">{noStockBooks.length}</div>
            <div className="inv-kpi-label">Sin stock</div>
            {totalCopies > 0 && <div className="inv-kpi-sub orange">{((noStockBooks.length / books.length) * 100).toFixed(1)}% del total</div>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inv-filters-bar">
        <div className="inv-search-wrap">
          <Search size={16} />
          <input className="inv-search-input" placeholder="Buscar por título, autor o ISBN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="inv-filter-group">
          <span className="inv-filter-label">Categoría</span>
          <select className="inv-filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categoriesWithAll.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="inv-filter-group">
          <span className="inv-filter-label">Estado</span>
          <select className="inv-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="Bajo stock">Bajo stock</option>
            <option value="Sin stock">Sin stock</option>
          </select>
        </div>
        <button className="inv-btn-clear" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}><Filter size={14} /> Limpiar filtros</button>
      </div>

      {/* Main layout: Table + Alerts */}
      <div className="inv-main-layout">
        {/* Table */}
        <div className="inv-table-panel">
          <div className="inv-table-header">
            <h3 className="inv-table-title">Listado de obras</h3>
            <span className="inv-table-count">{filteredBooks.length} resultado{filteredBooks.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Disponibles</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBooks.length === 0 ? (
                  <tr><td colSpan="5"><div className="inv-empty"><p>No existen coincidencias con los filtros actuales.</p></div></td></tr>
                ) : paginatedBooks.map(book => {
                  const status = getBookStatus(book)
                  const perc = book.totalCopies > 0 ? (book.availableCopies / book.totalCopies) * 100 : 0
                  const barColor = perc === 0 ? '#EF4444' : perc <= 37.5 ? '#F59E0B' : '#10B981'
                  return (
                    <tr key={book.id}>
                      <td>
                        <div className="inv-book-cell">
                          <img src={book.cover} alt="" className="inv-book-cover" loading="lazy" />
                          <div className="inv-book-info">
                            <p className="inv-book-title">{book.title}</p>
                            <p className="inv-book-author">Autor: {book.author}</p>
                            <p className="inv-book-isbn">ISBN: {book.isbn || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="inv-cat-badge">{book.category}</span></td>
                      <td><span className={`inv-status-badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div className="inv-avail-cell">
                          <div className="inv-avail-text">{book.availableCopies} / {book.totalCopies} disponibles</div>
                          <div className="inv-avail-bar">
                            <div className="inv-avail-fill" style={{ width: `${perc}%`, background: barColor }} />
                          </div>
                          <div className="inv-avail-perc">{perc.toFixed(0)}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="inv-actions">
                          <button className="inv-btn-action" onClick={() => handleOpenEdit(book)} title="Editar"><Edit size={15} /></button>
                          <button className="inv-btn-action danger" onClick={() => openDeleteModal(book)} title="Eliminar"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="inv-pagination">
              <button className="inv-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
              {renderPageButtons()}
              <button className="inv-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
              <div className="inv-page-size">
                <span>Filas por página:</span>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Alerts Sidebar */}
        <div className="inv-alerts-panel">
          <div className="inv-alerts-header">
            <h3 className="inv-alerts-title">Alertas del inventario</h3>
            <button className="inv-alerts-link" onClick={clearFilters}>Ver todas</button>
          </div>
          <div className="inv-alerts-body">
            <div className="inv-alert-item" onClick={() => { setStatusFilter('Sin stock'); setCategoryFilter('Todas'); setSearchTerm(''); }}>
              <div className="inv-alert-icon red"><AlertTriangle size={18} /></div>
              <div className="inv-alert-info">
                <p className="inv-alert-info-title">{noStockBooks.length} obras sin stock</p>
                <p className="inv-alert-info-sub">Requieren reposición</p>
              </div>
              <ChevronRight size={16} className="inv-alert-chevron" />
            </div>
            <div className="inv-alert-item" onClick={() => { setStatusFilter('Bajo stock'); setCategoryFilter('Todas'); setSearchTerm(''); }}>
              <div className="inv-alert-icon amber"><Package size={18} /></div>
              <div className="inv-alert-info">
                <p className="inv-alert-info-title">{lowStockBooks.length} obras con bajo stock</p>
                <p className="inv-alert-info-sub">Stock menor al mínimo recomendado</p>
              </div>
              <ChevronRight size={16} className="inv-alert-chevron" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCatalog
