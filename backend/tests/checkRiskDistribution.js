require('dotenv').config();
const { Pool } = require('pg');

async function checkRiskDistribution() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('=== Checking Risk Distribution in Database ===\n');
    
    // Query the college_scores table for CCS college with ryff_42
    const query = `
      SELECT college_name, dimension_name, risk_distribution, student_count, risk_level
      FROM college_scores 
      WHERE college_name = 'CCS' 
      AND assessment_type = 'ryff_42'
      ORDER BY dimension_name
    `;
    
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} records for CCS college with ryff_42:`);
    console.log('');
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Dimension: ${row.dimension_name}`);
      console.log(`   Risk Level: ${row.risk_level}`);
      console.log(`   Student Count: ${row.student_count}`);
      console.log(`   Risk Distribution:`, row.risk_distribution);
      console.log('');
    });
    
    // Check if any risk distribution has non-zero at_risk count
    const hasAtRiskStudents = result.rows.some(row => 
      row.risk_distribution && row.risk_distribution.at_risk > 0
    );
    
    console.log('=== Summary ===');
    console.log(`✓ Total records: ${result.rows.length}`);
    console.log(`${hasAtRiskStudents ? '✓' : '✗'} At-risk students detected: ${hasAtRiskStudents}`);
    
    if (hasAtRiskStudents) {
      console.log('🎉 SUCCESS: Risk distribution is working correctly!');
    } else {
      console.log('❌ ISSUE: No at-risk students found in risk distribution');
    }
    
  } catch (error) {
    console.error('Error checking risk distribution:', error);
  } finally {
    await pool.end();
  }
}

checkRiskDistribution();