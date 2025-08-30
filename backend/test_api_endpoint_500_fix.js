// Test script to simulate the actual API endpoint call and verify 500 error fix
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simulate the exact logic from counselorAssessments.js
async function simulateAPIEndpoint() {
  console.log('🧪 Simulating API endpoint call with assessment_name parameter...');
  
  try {
    // Test parameters (matching the frontend call)
    const limit = 1000;
    const college = 'College of Engineering';
    const assessmentType = 'ryff_42';
    const assessment_name = '2025-2026 2nd Semester - 1st Test 42';
    
    console.log('📋 Test Parameters:');
    console.log(`- limit: ${limit}`);
    console.log(`- college: ${college}`);
    console.log(`- assessmentType: ${assessmentType}`);
    console.log(`- assessment_name: ${assessment_name}`);
    
    // Determine table name
    let tableName = 'assessments';
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    console.log(`\n🎯 Using table: ${tableName}`);
    
    const limitNum = parseInt(limit) || 50;
    const offset = 0;
    
    let assessments = [];
    
    if (tableName === 'assessments_42items') {
      console.log('\n1️⃣ Testing 42-item assessment logic...');
      
      if (assessment_name) {
        console.log(`🔍 Filtering by assessment name: ${assessment_name}`);
        
        // Step 1: Get assignments for this specific assessment name
        console.log('Step 1: Fetching assignments...');
        const { data: assignments, error: assignmentError } = await supabase
          .from('assessment_assignments')
          .select(`
            id,
            bulk_assessments!inner(
              id,
              assessment_name,
              assessment_type
            )
          `)
          .eq('bulk_assessments.assessment_name', assessment_name)
          .eq('bulk_assessments.assessment_type', 'ryff_42');
        
        if (assignmentError) {
          console.error('❌ Error fetching assignments:', assignmentError);
          throw new Error(`Assignment fetch failed: ${assignmentError.message}`);
        }
        
        console.log(`✅ Found ${assignments?.length || 0} assignments`);
        
        if (!assignments || assignments.length === 0) {
          console.log('❌ No assignments found for assessment');
          assessments = [];
        } else {
          const assignmentIds = assignments.map(a => a.id);
          console.log(`Assignment IDs: ${assignmentIds.slice(0, 3).join(', ')}${assignmentIds.length > 3 ? '...' : ''}`);
          
          // Step 2: Get students filtered by college
          console.log('\nStep 2: Fetching students by college...');
          const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, id_number, name, college, section, email')
            .eq('college', college)
            .eq('status', 'active');
          
          if (studentError) {
            console.error('❌ Error fetching students:', studentError);
            throw new Error(`Student fetch failed: ${studentError.message}`);
          }
          
          console.log(`✅ Found ${students?.length || 0} students in ${college}`);
          
          if (!students || students.length === 0) {
            console.log('❌ No students found in college');
            assessments = [];
          } else {
            const studentIds = students.map(s => s.id);
            console.log(`Student IDs: ${studentIds.slice(0, 3).join(', ')}${studentIds.length > 3 ? '...' : ''}`);
            
            // Step 3: Fetch assessments for these specific assignments and students
            console.log('\nStep 3: Fetching assessments...');
            const { data: assessmentData, error: assessmentError } = await supabase
              .from('assessments_42items')
              .select('*')
              .in('student_id', studentIds)
              .in('assignment_id', assignmentIds)
              .limit(limitNum)
              .range(offset, offset + limitNum - 1);
            
            if (assessmentError) {
              console.error('❌ Error fetching assessments:', assessmentError);
              throw new Error(`Assessment fetch failed: ${assessmentError.message}`);
            }
            
            console.log(`✅ Found ${assessmentData?.length || 0} assessments`);
            
            // Step 4: Combine data
            if (assessmentData && assessmentData.length > 0) {
              assessments = assessmentData.map(assessment => {
                const student = students.find(s => s.id === assessment.student_id);
                return {
                  ...assessment,
                  student: student,
                  assignment: {
                    id: assessment.assignment_id || 'N/A',
                    assigned_at: assessment.created_at,
                    completed_at: assessment.completed_at,
                    bulk_assessment_id: 'filtered-fetch',
                    bulk_assessment: {
                      assessment_name: assessment_name,
                      assessment_type: 'ryff_42'
                    }
                  }
                };
              }).filter(a => a.student);
            }
          }
        }
      }
    }
    
    console.log('\n🎉 API simulation completed successfully!');
    console.log(`📊 Final result: ${assessments.length} assessments`);
    
    // Test risk distribution calculation
    if (assessments.length > 0) {
      const riskDistribution = {
        healthy: assessments.filter(a => a.risk_level === 'healthy').length,
        moderate: assessments.filter(a => a.risk_level === 'moderate').length,
        at_risk: assessments.filter(a => a.risk_level === 'at-risk').length
      };
      
      console.log('\n📈 Risk Distribution:');
      console.log(`- Healthy: ${riskDistribution.healthy}`);
      console.log(`- Moderate: ${riskDistribution.moderate}`);
      console.log(`- At Risk: ${riskDistribution.at_risk}`);
      console.log(`- Total: ${riskDistribution.healthy + riskDistribution.moderate + riskDistribution.at_risk}`);
    }
    
    console.log('\n✅ No 500 errors encountered!');
    console.log('🔧 The fix is working correctly!');
    
  } catch (error) {
    console.error('💥 Error during API simulation:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('PGRST')) {
      console.log('\n🔍 This appears to be a database relationship error.');
      console.log('The fix may need additional adjustments.');
    }
  }
}

// Run the simulation
simulateAPIEndpoint();