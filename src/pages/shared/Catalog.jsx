import React, { useState } from 'react'
import { Search, Bookmark, Star, Tag, Filter, ChevronRight, CheckCircle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import BorrowModal from '../../components/BorrowModal'
import { useNavigate } from 'react-router-dom'

const Catalog = () => {
  const { books, currentUser, reserveBook, reservations, heldBooks, loans, requestBorrow } = useAppContext()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [borrowModalData, setBorrowModalData] = useState({ isOpen: false, book: null })

  const categories = ['All', ...new Set(books.map(b => b.category))]

  const filteredBooks = books.filter(b => {
    const matchCat = selectedCategory === 'All' || b.category === selectedCategory
    const matchSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.author.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  })

  const handleBorrowRequest = (book) => {
    setBorrowModalData({ isOpen: true, book })
  }

  const confirmBorrow = (bookId, userId, isExtending, phone) => {
    requestBorrow(bookId, userId, isExtending, phone);
    setBorrowModalData({ isOpen: false, book: null });
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '2rem' }}>
      {borrowModalData.isOpen && (
        <BorrowModal 
          book={borrowModalData.book}
          currentUser={currentUser}
          onConfirm={confirmBorrow}
          onCancel={() => setBorrowModalData({ isOpen: false, book: null })}
        />
      )}

      {/* LEFT SIDEBAR: CATEGORIES */}
      <aside style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Filter size={18} color="var(--accent-primary)" /> Categorías
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className="sidebar-category-btn"
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                background: selectedCategory === c ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                color: selectedCategory === c ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.1s',
                fontWeight: selectedCategory === c ? 600 : 500,
                fontSize: '0.85rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Tag size={14} style={{ opacity: selectedCategory === c ? 1 : 0.6 }} />
                {c === 'All' ? 'Todas' : c}
              </span>
              {selectedCategory === c && <ChevronRight size={12} />}
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT: BOOK GRID */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar libros..." 
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {filteredBooks.map(book => {
            const isReservedByMe = reservations.some(r => r.bookId === book.id && r.userId === currentUser.id)
            const isLoanedByMe = loans.some(l => l.bookId === book.id && l.userId === currentUser.id)
            const isHeldForMe = heldBooks.some(h => h.bookId === book.id && h.userId === currentUser.id)

            return (
              <div key={book.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '260px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem', background: 'var(--bg-tertiary)', position: 'relative' }}>
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {book.availableCopies === 0 && (
                     <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                       NO DISPONIBLE
                     </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                    {book.availableCopies} en Stock
                  </span>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>{book.author}</p>
                
                <div style={{ marginTop: 'auto' }}>
                  {isLoanedByMe ? (
                    <button className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }} disabled>En posesión</button>
                  ) : isHeldForMe ? (
                    <button onClick={() => navigate('/estudiante')} className="btn-primary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}>
                      ¡Libro Listo! Ver Inicio
                    </button>
                  ) : isReservedByMe ? (
                    (() => {
                      const queue = reservations
                        .filter(r => r.bookId === book.id)
                        .sort((a, b) => (b.priority - a.priority) || new Date(a.date) - new Date(b.date));
                      const pos = queue.findIndex(r => r.userId === currentUser.id) + 1;
                      return (
                        <button className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)' }} disabled>
                          Puesto {pos} en cola
                        </button>
                      );
                    })()
                  ) : book.availableCopies > 0 ? (
                    <button onClick={() => handleBorrowRequest(book)} className="btn-primary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}>Solicitar</button>
                  ) : (
                    <button 
                      onClick={() => reserveBook(book.id, currentUser.id, currentUser.role === 'profesor')} 
                      className={currentUser.role === 'profesor' ? "btn-gold" : "btn-secondary"} 
                      style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}
                    >
                      {currentUser.role === 'profesor' ? 'Reservar Prioridad' : 'Unirse a la Fila'}
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

export default Catalog
