const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🔄 Running migration to make department column nullable...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'update_students_department_nullable.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Extract the actual SQL command (remove BEGIN/COMMIT and comments)
    const sqlCommand = 'ALTER TABLE students ALTER COLUMN department DROP NOT NULL;';
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlCommand
    });
    
    if (error) {
      // Try alternative approach using direct query
      console.log('Trying alternative approach...');
      const { error: altError } = await supabase
        .from('students')
        .select('id')
        .limit(1);
      
      if (altError) {
        throw altError;
      }
      
      // Since we can't run DDL directly, let's check if the issue is resolved
      console.log('✅ Database connection verified. The migration may need to be run manually.');
      console.log('Please run this SQL command in your Supabase SQL editor:');
      console.log('ALTER TABLE students ALTER COLUMN department DROP NOT NULL;');
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration required:');
    console.log('Please run this SQL command in your Supabase SQL editor:');
    console.log('ALTER TABLE students ALTER COLUMN department DROP NOT NULL;');
  }
}

runMigration();