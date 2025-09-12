#!/usr/bin/env node

/**
 * Migration Script: Add completion_time to ryff_history table
 * 
 * This script adds the completion_time field to the ryff_history table
 * and populates it with data from the original assessment tables.
 * 
 * Usage: node scripts/run_completion_time_migration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/database');

async function runMigration() {
  console.log('🚀 Starting completion_time migration for ryff_history table...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add_completion_time_to_ryff_history.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and verification queries
      if (statement.includes('SELECT') && statement.includes('COUNT')) {
        console.log(`⏭️  Skipping verification query: ${statement.substring(0, 50)}...`);
        continue;
      }
      
      console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (statementError) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, statementError);
        throw statementError;
      }
    }
    
    // Verify the migration results
    console.log('🔍 Verifying migration results...');
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('ryff_history')
      .select('assessment_type, completion_time')
      .limit(10);
    
    if (verificationError) {
      console.error('❌ Error verifying migration:', verificationError);
    } else {
      console.log('✅ Sample data after migration:');
      console.table(verificationData);
      
      // Count records with completion_time
      const recordsWithTime = verificationData.filter(record => record.completion_time !== null).length;
      console.log(`📊 ${recordsWithTime}/${verificationData.length} sample records have completion_time populated`);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear browser cache');
    console.log('   3. Test the assessment history page');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };