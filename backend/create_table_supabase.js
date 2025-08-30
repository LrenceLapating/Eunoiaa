const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createCollegeScoresTable() {
  try {
    console.log('🚀 CREATING COLLEGE SCORES TABLE\n');
    
    // First, let's try to create the table using a simple approach
    // We'll insert a dummy record to create the table structure, then delete it
    
    console.log('📋 Attempting to create college_scores table...');
    
    // Try to insert a sample record to create the table
    const { data, error } = await supabase
      .from('college_scores')
      .insert({
        college_name: 'Test College',
        dimension_name: 'autonomy',
        raw_score: 25.5,
        student_count: 1,
        risk_level: 'moderate',
        assessment_type: 'ryff_42',
        assessment_name: 'Test Assessment',
        last_calculated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Table does not exist. You need to create it manually.');
        console.log('\n📝 Please execute this SQL in your Supabase SQL Editor:');
        console.log('\n```sql');
        console.log(`CREATE TABLE college_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name VARCHAR(255) NOT NULL,
  dimension_name VARCHAR(100) NOT NULL,
  raw_score DECIMAL(10,2) NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('ryff_42', 'ryff_84')),
  assessment_name VARCHAR(255) NOT NULL,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_college_scores_college ON college_scores(college_name);
CREATE INDEX idx_college_scores_dimension ON college_scores(dimension_name);
CREATE INDEX idx_college_scores_assessment_type ON college_scores(assessment_type);
CREATE INDEX idx_college_scores_risk_level ON college_scores(risk_level);
CREATE INDEX idx_college_scores_composite ON college_scores(college_name, dimension_name, assessment_type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_college_scores_updated_at
  BEFORE UPDATE ON college_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();`);
        console.log('```\n');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
        console.log('📋 Copy and paste the SQL above, then click "Run"');
        console.log('\n✅ After creating the table, run: node populate_college_scores.js');
      } else {
        console.error('❌ Error:', error);
      }
      return;
    }
    
    // If successful, delete the test record
    if (data && data.length > 0) {
      await supabase
        .from('college_scores')
        .delete()
        .eq('id', data[0].id);
      
      console.log('✅ College scores table exists and is ready!');
      console.log('🚀 You can now run: node populate_college_scores.js');
    }
    
  } catch (error) {
    console.error('❌ Creation error:', error);
  }
}

createCollegeScoresTable();