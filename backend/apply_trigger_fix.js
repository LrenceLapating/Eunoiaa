require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyTriggerFix() {
  try {
    console.log('🔧 Applying trigger fix to remove updated_at reference...');
    
    // Create the fixed function
    console.log('1. Creating fixed sync function...');
    
    const { error: functionError } = await supabaseAdmin
      .from('_dummy')
      .select('*')
      .limit(0);
    
    // Use direct SQL execution through a different approach
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION sync_risk_level_to_assignments()
      RETURNS TRIGGER AS $$
      BEGIN
          UPDATE assessment_assignments 
          SET risk_level = CASE 
              WHEN NEW.risk_level = 'low' THEN 'healthy'
              WHEN NEW.risk_level = 'moderate' THEN 'moderate' 
              WHEN NEW.risk_level = 'high' THEN 'at-risk'
              ELSE NEW.risk_level
          END
          WHERE id = NEW.assignment_id;
          
          RAISE NOTICE 'Synced risk_level % from % to assessment_assignments for assignment_id %', 
              NEW.risk_level, TG_TABLE_NAME, NEW.assignment_id;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('✅ Function SQL prepared');
    console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:');
    console.log('\n' + '='.repeat(80));
    console.log(createFunctionSQL);
    console.log('='.repeat(80));
    
    console.log('\n2. Then create the triggers:');
    
    const createTriggersSQL = `
      DROP TRIGGER IF EXISTS trigger_sync_risk_level_42items ON assessments_42items;
      DROP TRIGGER IF EXISTS trigger_sync_risk_level_84items ON assessments_84items;
      
      CREATE TRIGGER trigger_sync_risk_level_42items
          AFTER INSERT OR UPDATE OF risk_level ON assessments_42items
          FOR EACH ROW
          WHEN (NEW.risk_level IS NOT NULL AND NEW.assignment_id IS NOT NULL)
          EXECUTE FUNCTION sync_risk_level_to_assignments();
      
      CREATE TRIGGER trigger_sync_risk_level_84items
          AFTER INSERT OR UPDATE OF risk_level ON assessments_84items
          FOR EACH ROW
          WHEN (NEW.risk_level IS NOT NULL AND NEW.assignment_id IS NOT NULL)
          EXECUTE FUNCTION sync_risk_level_to_assignments();
    `;
    
    console.log('\n' + '='.repeat(80));
    console.log(createTriggersSQL);
    console.log('='.repeat(80));
    
    console.log('\n🎯 After running the above SQL, the trigger will be fixed!');
    console.log('   The updated_at column reference has been removed.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyTriggerFix().then(() => {
  console.log('\n🏁 Instructions provided - please apply the SQL manually');
}).catch(error => {
  console.error('❌ Error:', error);
});