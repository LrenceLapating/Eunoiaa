require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAssessmentAnalyticsTable() {
  try {
    console.log('Creating assessment_analytics table manually...');
    
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('assessment_analytics')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ assessment_analytics table already exists!');
      return;
    }
    
    console.log('Table does not exist, need to create it manually.');
    console.log('\n📋 Please execute the following SQL in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(`
-- Create assessment_analytics table
CREATE TABLE IF NOT EXISTS public.assessment_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  time_taken_minutes INTEGER NOT NULL,
  question_times JSONB NULL DEFAULT '{}'::jsonb,
  start_time TIMESTAMP WITH TIME ZONE NULL,
  end_time TIMESTAMP WITH TIME ZONE NULL,
  navigation_pattern JSONB NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT assessment_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT fk_assessment_analytics_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_assessment_id ON public.assessment_analytics USING btree (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_student_id ON public.assessment_analytics USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_time_taken ON public.assessment_analytics USING btree (time_taken_minutes);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_created_at ON public.assessment_analytics USING btree (created_at);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_assessment_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_assessment_analytics_updated_at
    BEFORE UPDATE ON assessment_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_analytics_updated_at();
`);
    console.log('\n' + '='.repeat(80));
    console.log('\n🔗 Go to: https://supabase.com/dashboard/project/yjpavdpmsmytvdzbywny/sql/new');
    console.log('\n⚠️  After running the SQL, come back and test the timer functionality.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAssessmentAnalyticsTable();