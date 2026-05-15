import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Save, X, CheckCircle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

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
  }, [editingBook, isOpen, existingCategories])

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
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999,
      padding: '4rem 1rem', overflowY: 'auto'
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        width: '100%', maxWidth: '500px', padding: '2.5rem', 
        position: 'relative', background: 'var(--bg-secondary)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{editingBook ? 'Editar Ejemplar' : 'Añadir Nuevo Libro'}</h2>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Título Oficial</label>
            <input type="text" required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Autor</label>
            <input type="text" required className="input-field" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>ISBN (Opcional)</label>
              <input type="text" placeholder="Auto-generar..." className="input-field" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                Categoría
                <button type="button" onClick={() => setIsNewCategory(!isNewCategory)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
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
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Imagen de Portada</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {coverPreview && (
                <img src={coverPreview} alt="Preview" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
              )}
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="cover-upload" />
                <label htmlFor="cover-upload" className="btn-secondary" style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '0.75rem', cursor: 'pointer' }}>
                  {coverFile ? 'Cambiar Imagen' : 'Subir Archivo'}
                </label>
              </div>
            </div>
            <input type="url" placeholder="O pega URL de imagen..." className="input-field" style={{ marginTop: '0.5rem' }} value={formData.cover} 
              onChange={e => { setFormData({...formData, cover: e.target.value}); setCoverPreview(e.target.value); setCoverFile(null); }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Stock Total</label>
              <input type="number" min="1" required className="input-field" value={formData.totalCopies} onChange={e => {
                const num = parseInt(e.target.value);
                setFormData({...formData, totalCopies: num, availableCopies: num});
              }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Disponibles</label>
              <input type="number" min="0" max={formData.totalCopies} required className="input-field" value={formData.availableCopies} onChange={e => setFormData({...formData, availableCopies: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
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

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, bookTitle }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Trash2 size={30} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>¿Confirmar Eliminación?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
          Estás a punto de eliminar permanentemente <strong>"{bookTitle}"</strong> del catálogo. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={onConfirm} className="btn-primary" style={{ flex: 1, background: '#EF4444', color: 'white' }}>Eliminar Obra</button>
        </div>
      </div>
    </div>
  );
};

const AdminCatalog = () => {
  const { books, addBook, updateBook, deleteBook, loans, reservations, heldBooks, showToast } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, bookId: null, bookTitle: '' })

  const existingCategories = [...new Set(books.map(b => b.category))].filter(Boolean)
  const categoriesWithAll = ['Todas', ...existingCategories]

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.author.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.isbn.includes(searchTerm);
    const matchesCategory = categoryFilter === 'Todas' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  })

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

  const handleOpenEdit = (book) => {
    setEditingBook(book)
    setIsModalOpen(true)
  }

  const handleOpenAdd = () => {
    setEditingBook(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (book) => {
    const isLoaned = loans.some(l => l.bookId === book.id);
    if (isLoaned) { 
      showToast("No se puede borrar: Libro en préstamo activo.", "error"); 
      return; 
    }
    setDeleteConfirm({ isOpen: true, bookId: book.id, bookTitle: book.title });
  }

  const confirmDelete = async () => {
    const ok = await deleteBook(deleteConfirm.bookId);
    if (ok) {
      showToast('Libro eliminado del sistema.');
    } else {
      showToast('Error al eliminar el libro.', 'error');
    }
    setDeleteConfirm({ isOpen: false, bookId: null, bookTitle: '' });
  }

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <BookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={editingBook ? handleUpdate : handleAdd}
        editingBook={editingBook}
        existingCategories={existingCategories}
      />

      <DeleteConfirmModal 
        isOpen={deleteConfirm.isOpen}
        bookTitle={deleteConfirm.bookTitle}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, bookId: null, bookTitle: '' })}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Inventario Bibliográfico</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión completa del catálogo físico y digital del Campus.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Añadir Obra
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por ISBN, autor o título..." 
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', maxWidth: '100%' }}>
            {categoriesWithAll.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: categoryFilter === cat ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: categoryFilter === cat ? 'white' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: categoryFilter === cat ? 'var(--accent-primary)' : 'var(--border-light)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Identificador Vis.</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Detalles Metadata</th>
                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'center' }}>Disp./ Stock </th>
                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Controles</th>
              </tr>
            </thead>
          <tbody>
            {filteredBooks.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No existen coincidencias.</td></tr>
            ) : filteredBooks.map(book => (
              <tr key={book.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                <td style={{ padding: '1rem' }}>
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    loading="lazy"
                    style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{book.title}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Autor: {book.author}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {book.isbn} | Cat: {book.category}</p>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.5rem', border: '1px solid var(--border-light)' }}>
                    <span style={{ color: book.availableCopies > 0 ? 'var(--success-text)' : 'var(--danger-text)', fontWeight: 600, marginRight: '0.5rem' }}>{book.availableCopies}</span> 
                    <span style={{ color: 'var(--text-muted)' }}>/ {book.totalCopies}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenEdit(book)} className="btn-secondary" style={{ padding: '0.5rem', display: 'flex' }} title="Editar Atributos">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => openDeleteModal(book)} style={{ background: 'transparent', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }} title="Purgar Sistema">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  )
}

export default AdminCatalog
