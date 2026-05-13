import { supabase } from '../lib/supabase';
import { BOOKS, CATEGORIES } from './seed';

export const migrateData = async () => {
  console.log('Starting migration to Supabase...');

  // 1. Migrate Categories
  console.log('Migrating categories...');
  const { error: catError } = await supabase
    .from('categories')
    .upsert(CATEGORIES.map(name => ({ name })), { onConflict: 'name' });

  if (catError) {
    console.error('Error migrating categories:', catError);
    return;
  }
  console.log('Categories migrated successfully.');

  // 2. Migrate Books
  console.log('Migrating books...');
  const booksToMigrate = BOOKS.map(({ id, ...book }) => ({
    ...book,
    // Map property names if they differ from SQL schema
    total_copies: book.totalCopies,
    available_copies: book.availableCopies,
  }));

  // Remove the old property names
  booksToMigrate.forEach(b => {
    delete b.totalCopies;
    delete b.availableCopies;
  });

  const { error: bookError } = await supabase
    .from('books')
    .upsert(booksToMigrate, { onConflict: 'isbn' });

  if (bookError) {
    console.error('Error migrating books:', bookError);
    return;
  }
  console.log('Books migrated successfully.');

  console.log('Migration complete!');
};
