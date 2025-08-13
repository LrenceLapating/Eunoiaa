require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug84RangeIssue() {
  try {
    console.log('🔍 Debugging 84-item assessment range issue...');
    
    // Test 1: Simple count of all 84-item assessments
    console.log('\n=== Test 1: Count all 84-item assessments ===');
    const { count, error: countError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting 84-item assessments:', countError);
    } else {
      console.log(`✅ Total 84-item assessments in database: ${count}`);
    }
    
    // Test 2: Fetch all without pagination
    console.log('\n=== Test 2: Fetch all 84-item assessments without pagination ===');
    const { data: allAssessments, error: allError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (allError) {
      console.error('❌ Error fetching all 84-item assessments:', allError);
    } else {
      console.log(`✅ Found ${allAssessments?.length || 0} 84-item assessments`);
      allAssessments?.forEach((assessment, index) => {
        console.log(`  ${index + 1}. ID: ${assessment.id} | Student: ${assessment.student_id} | Score: ${assessment.overall_score}`);
      });
    }
    
    // Test 3: Test the exact pagination logic from the API
    console.log('\n=== Test 3: Test API pagination logic ===');
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log(`Page: ${page}, Limit: ${limitNum}, Offset: ${offset}`);
    console.log(`Range: ${offset} to ${offset + limitNum - 1}`);
    
    const { data: paginatedAssessments, error: paginatedError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (paginatedError) {
      console.error('❌ Error with paginated query:', paginatedError);
    } else {
      console.log(`✅ Paginated query returned ${paginatedAssessments?.length || 0} assessments`);
      paginatedAssessments?.forEach((assessment, index) => {
        console.log(`  ${index + 1}. ID: ${assessment.id} | Student: ${assessment.student_id} | Score: ${assessment.overall_score}`);
      });
    }
    
    // Test 4: Test without .limit() and .range()
    console.log('\n=== Test 4: Test without limit and range ===');
    const { data: simpleAssessments, error: simpleError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (simpleError) {
      console.error('❌ Error with simple query:', simpleError);
    } else {
      console.log(`✅ Simple query returned ${simpleAssessments?.length || 0} assessments`);
    }
    
    // Test 5: Test with just .limit()
    console.log('\n=== Test 5: Test with just limit ===');
    const { data: limitOnlyAssessments, error: limitOnlyError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(20);
    
    if (limitOnlyError) {
      console.error('❌ Error with limit-only query:', limitOnlyError);
    } else {
      console.log(`✅ Limit-only query returned ${limitOnlyAssessments?.length || 0} assessments`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
  
  process.exit(0);
}

debug84RangeIssue();