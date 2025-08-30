require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSectionsEndpoint() {
  const assessment_name = '2027-2028 1st Semester - TEST FOR FILTER SECTION 42';
  const college_name = 'CCS';
  
  console.log(`Testing sections endpoint for assessment: "${assessment_name}" and college: "${college_name}"`);
  
  try {
    // First get the bulk assessment
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('id')
      .eq('assessment_name', assessment_name)
      .neq('status', 'archived')
      .single();

    if (assessmentError || !assessmentData) {
      console.error('Error fetching assessment or assessment not found:', assessmentError);
      return;
    }

    console.log('Assessment found:', assessmentData);

    // Get assignment data for this assessment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('student_id')
      .eq('bulk_assessment_id', assessmentData.id);

    if (assignmentError || !assignmentData || assignmentData.length === 0) {
      console.error('Error fetching assignments or no assignments found:', assignmentError);
      return;
    }

    console.log(`Found ${assignmentData.length} assignments`);

    // Get student details for these assignments, filtered by college
    const studentIds = assignmentData.map(a => a.student_id);
    
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('section, college')
      .in('id', studentIds)
      .eq('college', college_name);

    if (studentError) {
      console.error('Error fetching student data:', studentError);
      return;
    }

    console.log(`Found ${studentData.length} students in college ${college_name}`);
    console.log('Student data:', studentData);

    // Extract unique sections
    const uniqueSections = new Set();
    
    if (studentData && studentData.length > 0) {
      studentData.forEach(student => {
        if (student.section) {
          uniqueSections.add(student.section);
        }
      });
    }

    const sections = Array.from(uniqueSections).sort();
    
    console.log('\nFinal result:');
    console.log('Sections that should be returned by API:', sections);
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testSectionsEndpoint();