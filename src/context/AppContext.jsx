import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculatePenalty } from '../utils/penalties';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [heldBooks, setHeldBooks] = useState([]);
  const [categories, setCategories] = useState([]);

  // Auth session management
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Supabase configuration is missing! Please create a .env file.');
      setConfigError(true);
      setLoading(false);
      return;
    }
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setDataLoaded(true);
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setUsers([]);
        setDataLoaded(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setCurrentUser(data);
      if (data.role === 'admin') {
        await fetchAllUsers();
      }
      // Fetch library data and wait for it before declaring load complete
      await fetchData();
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      setUsers(data);
    }
  };

  // Fetch library data from Supabase
  const processAllQueues = async (currentBooks, currentRes) => {
    // Books that have stock and have people in queue
    const booksWithStockAndQueue = currentBooks.filter(b => b.available_copies > 0 && currentRes.some(r => r.book_id === b.id));
    
    for (const book of booksWithStockAndQueue) {
      await processQueueForBook(book.id);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch Books
      const { data: booksData } = await supabase.from('books').select('*');
      if (booksData) {
        setBooks(booksData.map(b => ({
          ...b,
          totalCopies: b.total_copies,
          availableCopies: b.available_copies,
          penaltyRate: b.penalty_rate || 1.00
        })));
      }

      // Fetch Categories
      const { data: catData } = await supabase.from('categories').select('name');
      if (catData) {
        setCategories(catData.map(c => c.name));
      }

      // Fetch Loans
      const { data: loansData } = await supabase.from('loans').select('*').order('request_date', { ascending: false });
      if (loansData) {
        const mappedLoans = loansData.map(l => ({
          ...l,
          bookId: l.book_id,
          userId: l.user_id,
          requestDate: l.request_date,
          borrowDate: l.borrow_date,
          dueDate: l.due_date,
          returnDate: l.return_date,
          isExtending: l.is_extending,
          extensionRequested: l.extension_requested,
          manualPenalty: l.manual_penalty || 0,
          paidPenalty: l.paid_penalty || 0
        }));
        setLoans(mappedLoans);

        // Auto-sync: mark overdue loans in Supabase if not already marked
        const now = new Date().toISOString();
        const overdueIds = loansData
          .filter(l => l.status === 'active' && l.due_date && l.due_date < now)
          .map(l => l.id);
        if (overdueIds.length > 0) {
          await supabase.from('loans').update({ status: 'overdue' }).in('id', overdueIds);
          // Update local state immediately too
          setLoans(prev => prev.map(l => 
            overdueIds.includes(l.id) ? { ...l, status: 'overdue' } : l
          ));
        }
      }

      // Fetch Reservations
      const { data: resData } = await supabase.from('reservations').select('*');
      if (resData) {
        setReservations(resData.map(r => ({
          ...r,
          bookId: r.book_id,
          userId: r.user_id
        })));
      }

      // Fetch Held Books
      const { data: heldData } = await supabase.from('held_books').select('*');
      if (heldData) {
        setHeldBooks(heldData.map(h => ({
          ...h,
          bookId: h.book_id,
          userId: h.user_id,
          assignedDate: h.assigned_date
        })));
      }

      // Auto-process all queues if there's stock
      const { data: freshBooks } = await supabase.from('books').select('*');
      const { data: freshRes } = await supabase.from('reservations').select('*');
      if (freshBooks && freshRes) {
        await processAllQueues(freshBooks, freshRes);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    // Only fetch data independently if user is already authenticated
    // (first load is handled by fetchUserProfile)
    if (currentUser) {
      fetchData();
    }

    // REALTIME SUBSCRIPTIONS
    const channel = supabase
      .channel('library_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'held_books' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchAllUsers();
        if (currentUser) fetchUserProfile(currentUser.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Remove currentUser.id dependency — subscription should live for the full session

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { success: !error, error };
  };
  
  const registerUser = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          username: userData.username,
          role: userData.role || 'estudiante'
        }
      }
    });
    return { success: !error, error };
  };

  const updateProfile = async (userId, newName, newPhone) => {
    const { error } = await supabase
      .from('profiles')
      .update({ name: newName, phone: newPhone })
      .eq('id', userId);

    if (!error) {
      setCurrentUser(prev => prev ? { ...prev, name: newName, phone: newPhone } : null);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const requestBorrow = async (bookId, userId, isExtending = false, phone = '') => {
    const book = books.find(b => b.id === bookId);
    if (book && book.availableCopies > 0) {
      // 1. Update book availability
      const { error: bookError } = await supabase
        .from('books')
        .update({ available_copies: book.availableCopies - 1 })
        .eq('id', bookId);
      
      if (bookError) return false;

      // 2. Create loan record
      const { data, error: loanError } = await supabase
        .from('loans')
        .insert([{
          book_id: bookId,
          user_id: userId,
          phone,
          request_date: new Date().toISOString(),
          is_extending: isExtending,
          status: 'pending_pickup'
        }])
        .select();

      if (loanError) {
        // Rollback book availability if loan creation fails
        await supabase.from('books').update({ available_copies: book.availableCopies }).eq('id', bookId);
        return false;
      }

      setBooks(books.map(b => b.id === bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b));
      const newLoan = {
        ...data[0],
        bookId: data[0].book_id,
        userId: data[0].user_id,
        requestDate: data[0].request_date,
        isExtending: data[0].is_extending
      };
      setLoans([...loans, newLoan]);
      return true;
    }
    return false;
  };

  const approveBorrow = async (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const durationDays = loan.isExtending ? 30 : 14;
    const borrowDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('loans')
      .update({
        status: 'active',
        borrow_date: borrowDate,
        due_date: dueDate
      })
      .eq('id', loanId);

    if (!error) {
      setLoans(loans.map(l => l.id === loanId ? { ...l, status: 'active', borrowDate, dueDate } : l));
    }
  };

  const rejectBorrow = async (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      // 1. Restore book availability
      const book = books.find(b => b.id === loan.bookId);
      if (book) {
        await supabase.from('books').update({ available_copies: book.availableCopies + 1 }).eq('id', book.id);
        setBooks(books.map(b => b.id === book.id ? { ...b, availableCopies: book.availableCopies + 1 } : b));
      }
      
      // 2. Delete loan
      const { error } = await supabase.from('loans').delete().eq('id', loanId);
      if (!error) {
        setLoans(loans.filter(l => l.id !== loanId));
      }
    }
  };

  const requestReturn = async (loanId) => {
    const { error } = await supabase.from('loans').update({ status: 'pending_return' }).eq('id', loanId);
    if (!error) {
      setLoans(loans.map(l => (l.id === loanId ? { ...l, status: 'pending_return' } : l)));
    }
  };

  const approveReturn = async (loanId) => {
    const loan = loans.find(l => String(l.id) === String(loanId));
    if (loan) {
      const book = books.find(b => String(b.id) === String(loan.bookId));
      
      // Calcular mora real al momento de la devolución
      const finalPenalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate);
      const paidAmount = finalPenalty.amount;

      // 1. Update loan status to 'returned' con la mora real
      const { error: loanError } = await supabase
        .from('loans')
        .update({ 
          status: 'returned',
          return_date: new Date().toISOString(),
          paid_penalty: paidAmount  // Guardar el monto real de mora
        })
        .eq('id', loanId);

      if (loanError) {
        console.error('Supabase update error:', loanError);
        return false;
      }

      // 2. Check for reservations
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*')
        .eq('book_id', book.id)
        .order('priority', { ascending: false })
        .order('date', { ascending: true });

      if (reservationsData && reservationsData.length > 0) {
        const nextInQueue = reservationsData[0];
        await supabase.from('reservations').delete().eq('id', nextInQueue.id);
        const { data: heldData } = await supabase
          .from('held_books')
          .insert([{
            book_id: book.id,
            user_id: nextInQueue.user_id,
            assigned_date: new Date().toISOString()
          }])
          .select();

        if (heldData) {
          setHeldBooks([...heldBooks, {
            ...heldData[0],
            bookId: heldData[0].book_id,
            userId: heldData[0].user_id,
            assignedDate: heldData[0].assigned_date
          }]);
          setReservations(reservations.filter(r => r.id !== nextInQueue.id));
        }
      } else {
        await supabase.from('books').update({ available_copies: book.availableCopies + 1 }).eq('id', book.id);
        setBooks(books.map(b => b.id === book.id ? { ...b, availableCopies: b.availableCopies + 1 } : b));
      }

      setLoans(loans.map(l => l.id === loanId ? { 
        ...l, 
        status: 'returned', 
        paidPenalty: paidAmount,
        returnDate: new Date().toISOString()
      } : l));
      return true;
    }
    return false;
  };

  const forceReturn = async (loanId) => {
    try {
      const loan = loans.find(l => String(l.id) === String(loanId));
      if (!loan) return { success: false, error: 'Préstamo no encontrado' };

      const book = books.find(b => String(b.id) === String(loan.bookId));
      
      // Calcular la mora final antes de cerrar
      const finalPenalty = calculatePenalty(loan.dueDate, new Date(), loan.manualPenalty, book?.penaltyRate);

      // 1. Update loan status and record the payment
      const { error: loanError } = await supabase
        .from('loans')
        .update({ 
          status: 'returned', 
          due_date: new Date().toISOString(), // Fecha de devolución real
          paid_penalty: finalPenalty.amount
        })
        .eq('id', loanId);

      if (loanError) throw loanError;

      // 2. Check for reservations before restoring inventory
      if (book) {
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('*')
          .eq('book_id', book.id)
          .order('priority', { ascending: false })
          .order('date', { ascending: true });

        if (reservationsData && reservationsData.length > 0) {
          // Assign to next in queue
          const nextInQueue = reservationsData[0];
          await supabase.from('reservations').delete().eq('id', nextInQueue.id);
          const { data: heldData } = await supabase
            .from('held_books')
            .insert([{
              book_id: book.id,
              user_id: nextInQueue.user_id,
              assigned_date: new Date().toISOString()
            }])
            .select();

          if (heldData) {
            setHeldBooks(prev => [...prev, {
              ...heldData[0],
              bookId: heldData[0].book_id,
              userId: heldData[0].userId,
              assignedDate: heldData[0].assigned_date
            }]);
            setReservations(prev => prev.filter(r => r.id !== nextInQueue.id));
          }
          // Do NOT increment available_copies, it remains 'held'
        } else {
          // No one waiting, restore to public inventory
          const newAvailable = (book.availableCopies || 0) + 1;
          await supabase.from('books').update({ available_copies: newAvailable }).eq('id', book.id);
          setBooks(prev => prev.map(b => String(b.id) === String(book.id) ? { ...b, availableCopies: newAvailable } : b));
        }
      }

      // 3. Update local state
      setLoans(prev => prev.map(l => String(l.id) === String(loanId) ? { 
        ...l, 
        status: 'returned', 
        paidPenalty: finalPenalty.amount,
        returnDate: new Date().toISOString()
      } : l));
      
      return { success: true };
    } catch (err) {
      console.error('Error in forceReturn:', err);
      return { success: false, error: err.message };
    }
  };

  // Extensión logic
  const requestExtension = async (loanId) => {
    const { error } = await supabase.from('loans').update({ extension_requested: true }).eq('id', loanId);
    if (!error) {
      setLoans(loans.map(l => (l.id === loanId ? { ...l, extensionRequested: true } : l)));
    }
  }

  const approveExtension = async (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // Determine extension days by user role: 30 for professors, 14 for students
    const loanUser = users.find(u => String(u.id) === String(loan.userId));
    const extensionDays = loanUser?.role === 'profesor' ? 30 : 14;

    const newDueDate = new Date(new Date(loan.dueDate).getTime() + extensionDays * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('loans')
      .update({
        extension_requested: false,
        due_date: newDueDate
      })
      .eq('id', loanId);

    if (!error) {
      setLoans(loans.map(l => (l.id === loanId ? { ...l, extensionRequested: false, dueDate: newDueDate } : l)));
    }
  }

  const rejectExtension = async (loanId) => {
    const { error } = await supabase.from('loans').update({ extension_requested: false }).eq('id', loanId);
    if (!error) {
      setLoans(loans.map(l => (l.id === loanId ? { ...l, extensionRequested: false } : l)));
    }
  }

  const reserveBook = async (bookId, userId, isPriority = false) => {
    if (reservations.find(r => r.bookId === bookId && r.userId === userId)) return false;
    
    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        book_id: bookId,
        user_id: userId,
        priority: isPriority,
        date: new Date().toISOString()
      }])
      .select();

    if (!error && data) {
      setReservations([...reservations, {
        ...data[0],
        bookId: data[0].book_id,
        userId: data[0].user_id
      }]);
      return true;
    }
    return false;
  };

  const claimHeldBook = async (heldId, phone = '') => {
    const held = heldBooks.find(h => h.id === heldId);
    if (held) {
      // 1. Create loan
      const { data, error: loanError } = await supabase
        .from('loans')
        .insert([{
          book_id: held.bookId,
          user_id: held.userId,
          phone: phone,
          request_date: new Date().toISOString(),
          status: 'pending_pickup'
        }])
        .select();

      if (!loanError && data) {
        // 2. Delete held book
        await supabase.from('held_books').delete().eq('id', heldId);
        
        setHeldBooks(heldBooks.filter(h => h.id !== heldId));
        setLoans([...loans, {
          ...data[0],
          bookId: data[0].book_id,
          userId: data[0].user_id,
          requestDate: data[0].request_date
        }]);
        return true;
      }
    }
    return false;
  };

  const rejectHeldBook = async (heldId) => {
    const held = heldBooks.find(h => h.id === heldId);
    if (held) {
      const book = books.find(b => b.id === held.bookId);
      
      // 1. Delete held book
      await supabase.from('held_books').delete().eq('id', heldId);
      setHeldBooks(heldBooks.filter(h => h.id !== heldId));

      // 2. Check for next in queue
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*')
        .eq('book_id', book.id)
        .order('priority', { ascending: false })
        .order('date', { ascending: true });

      if (reservationsData && reservationsData.length > 0) {
        const nextInQueue = reservationsData[0];
        
        await supabase.from('reservations').delete().eq('id', nextInQueue.id);
        const { data: heldData } = await supabase
          .from('held_books')
          .insert([{
            book_id: book.id,
            user_id: nextInQueue.user_id,
            assigned_date: new Date().toISOString()
          }])
          .select();

        if (heldData) {
          setHeldBooks(prev => [...prev.filter(h => h.id !== heldId), {
            ...heldData[0],
            bookId: heldData[0].book_id,
            userId: heldData[0].user_id,
            assignedDate: heldData[0].assigned_date
          }]);
          setReservations(reservations.filter(r => r.id !== nextInQueue.id));
        }
      } else {
        await supabase.from('books').update({ available_copies: book.availableCopies + 1 }).eq('id', book.id);
        setBooks(books.map(b => b.id === book.id ? { ...b, availableCopies: b.availableCopies + 1 } : b));
      }
      return true;
    }
    return false;
  }

  const uploadBookCover = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading cover:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('book-covers').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const processQueueForBook = async (bookId) => {
    // 1. Get fresh book data
    const { data: bookData } = await supabase.from('books').select('available_copies').eq('id', bookId).single();
    if (!bookData || bookData.available_copies <= 0) return;

    let currentAvailable = bookData.available_copies;

    // 2. Get reservations
    const { data: resData } = await supabase
      .from('reservations')
      .select('*')
      .eq('book_id', bookId)
      .order('priority', { ascending: false })
      .order('date', { ascending: true });

    if (!resData || resData.length === 0) return;

    // 3. Process each reservation until stock runs out
    for (const res of resData) {
      if (currentAvailable <= 0) break;

      // Assign to held_books
      const { data: heldData } = await supabase
        .from('held_books')
        .insert([{
          book_id: bookId,
          user_id: res.user_id,
          assigned_date: new Date().toISOString()
        }])
        .select();

      if (heldData) {
        // Remove from reservations
        await supabase.from('reservations').delete().eq('id', res.id);
        currentAvailable--;
      }
    }

    // 4. Update final stock
    await supabase.from('books').update({ available_copies: currentAvailable }).eq('id', bookId);
    
    // Refresh local state will happen via the realtime subscription or manual refresh
    fetchData(); 
  };

  const addBook = async (book, coverFile = null) => {
    let coverUrl = book.cover;
    if (coverFile) {
      const uploadedUrl = await uploadBookCover(coverFile);
      if (uploadedUrl) coverUrl = uploadedUrl;
    }

    // Generar ISBN automático si no existe
    const finalIsbn = book.isbn || `ISBN-${Math.floor(Math.random() * 90000) + 10000}`;

    const { data, error } = await supabase
      .from('books')
      .insert([{
        title: book.title,
        author: book.author,
        isbn: finalIsbn,
        category: book.category,
        cover: coverUrl,
        total_copies: parseInt(book.totalCopies),
        available_copies: parseInt(book.totalCopies)
      }])
      .select();

    if (error) {
      console.error('Error adding book:', error);
      return false;
    }

    if (data) {
      const newBook = { ...data[0], totalCopies: data[0].total_copies, availableCopies: data[0].available_copies };
      await processQueueForBook(newBook.id);
      setBooks(prev => [...prev, newBook]);
      return true;
    }
    return false;
  };

  const updateBook = async (updatedBook, coverFile = null) => {
    let coverUrl = updatedBook.cover;
    if (coverFile) {
      const uploadedUrl = await uploadBookCover(coverFile);
      if (uploadedUrl) coverUrl = uploadedUrl;
    }

    const { error } = await supabase
      .from('books')
      .update({
        title: updatedBook.title,
        author: updatedBook.author,
        isbn: updatedBook.isbn,
        category: updatedBook.category,
        cover: coverUrl,
        total_copies: parseInt(updatedBook.totalCopies),
        available_copies: parseInt(updatedBook.availableCopies)
      })
      .eq('id', updatedBook.id);

    if (error) {
      console.error('Error updating book:', error);
      return false;
    }

    // NEW: Process queue if there's stock
    await processQueueForBook(updatedBook.id);
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? { ...updatedBook, cover: coverUrl } : b));
    return true;
  };

  const deleteBook = async (bookId) => {
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (!error) {
      setBooks(books.filter(b => b.id !== bookId));
      return true;
    }
    return false;
  };



  const updateBookPenalty = async (bookId, rate) => {
    const numericRate = parseFloat(rate);
    if (isNaN(numericRate)) return { success: false, error: 'Tasa no válida' };

    const { error } = await supabase
      .from('books')
      .update({ penalty_rate: numericRate })
      .eq('id', bookId);
    
    if (!error) {
      setBooks(prev => prev.map(b => String(b.id) === String(bookId) ? { ...b, penaltyRate: numericRate } : b));
      return { success: true };
    }
    console.error('Supabase error:', error);
    return { success: false, error: error.message };
  };

  const value = {
    currentUser, users, books, loans, reservations, heldBooks, categories, loading: loading || !dataLoaded, configError,
    login, registerUser, updateProfile, logout,
    requestBorrow, approveBorrow, rejectBorrow,
    requestReturn, approveReturn, forceReturn,
    requestExtension, approveExtension, rejectExtension,
    reserveBook, claimHeldBook, rejectHeldBook,
    addBook, updateBook, deleteBook, updateBookPenalty,
    toast, showToast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
