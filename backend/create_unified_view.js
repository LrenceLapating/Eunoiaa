require('dotenv').config();
const { supabase } = require('./config/database');

async function createUnifiedView() {
  try {
    console.log('Creating unified assessments view...');
    
    // Create the unified view
    const createViewSQL = `
      CREATE OR REPLACE VIEW assessments AS
      SELECT 
          id,
          student_id,
          NULL as assignment_id,
          assessment_type,
          responses,
          scores,
          overall_score,
          risk_level,
          completed_at,
          created_at
      FROM assessments_42items
      WHERE assessment_type IN ('ryff_42', '42-item')
      
      UNION ALL
      
      SELECT 
          id,
          student_id,
          NULL as assignment_id,
          assessment_type,
          responses,
          scores,
          overall_score,
          risk_level,
          completed_at,
          created_at
      FROM assessments_84items
      WHERE assessment_type IN ('ryff_84', '84-item');
    `;
    
    const { data: viewResult, error: viewError } = await supabase.rpc('exec_sql', {
      sql: createViewSQL
    });
    
    if (viewError) {
      console.error('Error creating view:', viewError);
      // Try alternative approach using raw SQL
      console.log('Trying alternative approach...');
      
      // Since we can't execute DDL directly, let's check if we can query the tables
      const { data: testData, error: testError } = await supabase
        .from('assessments_42items')
        .select('id, student_id, assessment_type, responses, scores, overall_score, risk_level, completed_at, created_at')
        .limit(1);
      
      if (testError) {
        console.error('Cannot access assessments_42items:', testError);
      } else {
        console.log('Successfully accessed assessments_42items');
        
        // Test if we can create a simple view through Supabase
        console.log('Note: The unified view needs to be created directly in the database.');
        console.log('You may need to run the SQL manually in the Supabase dashboard.');
      }
    } else {
      console.log('Successfully created unified assessments view!');
    }
    
    // Test the view if it exists
    console.log('\nTesting unified view...');
    const { data: viewData, error: viewTestError } = await supabase
      .from('assessments')
      .select('count', { count: 'exact', head: true });
    
    if (viewTestError) {
      console.log('Unified view test failed:', viewTestError.message);
    } else {
      console.log('Unified view is working!');
    }
    
  } catch (error) {
    console.error('Error creating unified view:', error);
  }
  
  process.exit(0);
}

createUnifiedView();