// Load environment variables
require('dotenv').config();

const { supabase } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running college_scores table migration...');
    
    // Create the college_scores table directly
    console.log('Creating college_scores table...');
    
    // First, check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('college_scores')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ college_scores table already exists!');
      return;
    }
    
    // Since we can't execute DDL directly, let's create the table using a different approach
    // We'll use the existing migration runner that should be available
    console.log('Table does not exist. Please run the SQL migration manually in Supabase dashboard:');
    console.log('\n--- Copy and paste this SQL in Supabase SQL Editor ---');
    
    const sqlPath = path.join(__dirname, 'migrations', 'create_college_scores_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(sql);
    console.log('\n--- End of SQL ---\n');
    
    console.log('After running the SQL in Supabase dashboard, the college_scores table will be ready.');
    
  } catch (error) {
    console.error('❌ Migration check failed:', error);
    
    // If we get here, the table likely doesn't exist
    console.log('\nPlease create the college_scores table manually in Supabase dashboard:');
    console.log('\n--- Copy and paste this SQL in Supabase SQL Editor ---');
    
    const sqlPath = path.join(__dirname, 'migrations', 'create_college_scores_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(sql);
    console.log('\n--- End of SQL ---\n');
  }
}

runMigration();