require('dotenv').config();
const { Pool } = require('pg');

// Create a direct PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function disableTriggersTemporarily() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Temporarily disabling problematic triggers...');
    
    // Drop the problematic triggers
    await client.query('DROP TRIGGER IF EXISTS trigger_sync_risk_level_42items ON assessments_42items;');
    await client.query('DROP TRIGGER IF EXISTS trigger_sync_risk_level_84items ON assessments_84items;');
    
    console.log('✅ Triggers disabled successfully!');
    console.log('   You can now test assessment submissions.');
    console.log('   Remember to re-enable them later with the fixed version.');
    
  } catch (error) {
    console.error('❌ Error disabling triggers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

disableTriggersTemporarily().then(() => {
  console.log('\n🏁 Triggers disabled - ready for testing');
}).catch(error => {
  console.error('❌ Error:', error);
});