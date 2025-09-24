const { pool } = require('./config/database');
require('dotenv').config();

async function checkCurrentState() {
  try {
    console.log('=== SAFETY ASSESSMENT: Current Database State ===\n');
    
    // Check current risk_level values in college_scores
    const scoresResult = await pool.query('SELECT risk_level, COUNT(*) FROM college_scores GROUP BY risk_level ORDER BY risk_level');
    console.log('Current college_scores risk_level distribution:');
    scoresResult.rows.forEach(row => console.log(`  ${row.risk_level}: ${row.count}`));
    
    // Check if history table has any data
    const historyResult = await pool.query('SELECT COUNT(*) FROM college_scores_history');
    console.log(`\nCollege scores history records: ${historyResult.rows[0].count}`);
    
    // Check constraint definitions
    const constraintResult = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conname IN ('college_scores_risk_level_check', 'college_scores_history_risk_level_check')
    `);
    console.log('\nCurrent constraints:');
    constraintResult.rows.forEach(row => console.log(`  ${row.conname}:`));
    constraintResult.rows.forEach(row => console.log(`    ${row.definition}`));
    
    // Check for any foreign key dependencies
    const fkResult = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name = 'college_scores' OR ccu.table_name = 'college_scores')
    `);
    
    console.log('\nForeign key dependencies involving college_scores:');
    if (fkResult.rows.length === 0) {
      console.log('  None found');
    } else {
      fkResult.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    }
    
    console.log('\n=== SAFETY ASSESSMENT COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCurrentState();