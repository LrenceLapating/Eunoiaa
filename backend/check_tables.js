const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('Checking database tables...');
  
  const tables = ['students', 'bulk_assessments', 'assessment_responses', 'assignments'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists with columns:`, Object.keys(data[0] || {}));
        console.log(`   Records count: ${data.length > 0 ? 'Has data' : 'Empty'}`);
      }
    } catch (e) {
      console.log(`❌ Table '${table}' failed:`, e.message);
    }
  }
}

checkTables();