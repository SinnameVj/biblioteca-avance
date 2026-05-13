export const USERS = [
  { id: 1, name: 'Admin Principal', username: 'admin', password: '123', role: 'admin' },
  { id: 2, name: 'Prof. Garcia', username: '', password: '123', role: 'profesor' },
  { id: 3, name: 'Maria Lopez', username: 'maria.lopez', password: '123', role: 'estudiante' }
];

export const CATEGORIES = [
  'Literatura', 'Ciencias', 'Historia', 'Tecnología', 'Arte', 'Filosofía'
];

export const BOOKS = [
  {
    id: 1,
    title: 'Cien Años de Soledad',
    author: 'Gabriel García Márquez',
    category: 'Literatura',
    isbn: '978-0307474728',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
    totalCopies: 5,
    availableCopies: 3,
  },
  {
    id: 2,
    title: 'Breve Historia del Tiempo',
    author: 'Stephen Hawking',
    category: 'Ciencias',
    isbn: '978-0553380163',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300',
    totalCopies: 3,
    availableCopies: 0,
  },
  {
    id: 3,
    title: 'El Código Da Vinci',
    author: 'Dan Brown',
    category: 'Literatura',
    isbn: '978-0307474278',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    id: 4,
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'Historia',
    isbn: '978-0062316097',
    cover: 'https://images.unsplash.com/photo-1531901599143-df5010ab9438?auto=format&fit=crop&q=80&w=300',
    totalCopies: 2,
    availableCopies: 1,
  },
  {
    id: 5,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Tecnología',
    isbn: '978-0132350884',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=300',
    totalCopies: 6,
    availableCopies: 2,
  }
];

export const INITIAL_LOANS = [
  {
    id: 1,
    bookId: 2,
    userId: 3,
    borrowDate: '2026-04-01T10:00:00Z',
    dueDate: '2026-04-15T10:00:00Z',
    status: 'active'
  },
  {
    id: 2,
    bookId: 1,
    userId: 2,
    borrowDate: '2026-03-20T10:00:00Z',
    dueDate: '2026-04-03T10:00:00Z',
    status: 'overdue'
  }
];

export const INITIAL_RESERVATIONS = [];
