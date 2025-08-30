require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAssessmentSections() {
  try {
    console.log('Checking sections for assessment: "2027-2028 1st Semester - TEST FOR FILTER SECTION 42"');
    
    // First, let's see if this assessment exists
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_colleges, status')
      .eq('assessment_name', '2027-2028 1st Semester - TEST FOR FILTER SECTION 42');
    
    if (assessmentError) {
      console.error('Error fetching assessment:', assessmentError);
      return;
    }
    
    console.log('\nAssessment found:', assessmentData.length > 0);
    if (assessmentData.length > 0) {
      console.log('Assessment details:', assessmentData);
      
      // Get the assessment ID
      const assessmentId = assessmentData[0].id;
      
      // Now get the assignment data separately
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assessment_assignments')
        .select('student_id')
        .eq('bulk_assessment_id', assessmentId);
      
      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        return;
      }
      
      console.log('\nFound', assignmentData.length, 'student assignments');
      
      if (assignmentData.length > 0) {
        // Get student details for these assignments
        const studentIds = assignmentData.map(a => a.student_id);
        
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, name, section, college')
          .in('id', studentIds);
        
        if (studentError) {
          console.error('Error fetching student data:', studentError);
          return;
        }
        
        console.log('\nStudent data found:', studentData.length, 'students');
        
        const sections = new Set();
        const colleges = new Set();
        
        studentData.forEach(student => {
          if (student.section) {
            sections.add(student.section);
          }
          if (student.college) {
            colleges.add(student.college);
          }
        });
        
        console.log('\nColleges that received this assessment:');
        Array.from(colleges).sort().forEach(college => console.log('- ' + college));
        
        console.log('\nSections that received this assessment:');
        Array.from(sections).sort().forEach(section => console.log('- ' + section));
        
        console.log('\nTotal unique sections:', sections.size);
        console.log('Total unique colleges:', colleges.size);
        
        // Show some sample students
        console.log('\nSample students (first 5):');
        studentData.slice(0, 5).forEach(student => {
          console.log(`- ${student.name} (${student.section}, ${student.college})`);
        });
        
      } else {
        console.log('No assignments found for this assessment');
      }
      
    } else {
      console.log('No assessment found with this exact name.');
      
      // Let's check for similar assessment names
      const { data: similarAssessments, error: similarError } = await supabase
        .from('bulk_assessments')
        .select('assessment_name')
        .ilike('assessment_name', '%TEST FOR FILTER SECTION%');
      
      if (!similarError && similarAssessments.length > 0) {
        console.log('\nSimilar assessments found:');
        similarAssessments.forEach(a => console.log('- ' + a.assessment_name));
      }
      return;
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssessmentSections();