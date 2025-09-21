const { supabase } = require('./config/database');

async function testCourseFiltering() {
  try {
    console.log('🔍 Testing Course Filtering Behavior');
    console.log('=====================================\n');

    // Test 1: Check if foreign key constraint exists
    console.log('1. Checking foreign key constraint...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'assessment_assignments'
            AND kcu.column_name = 'student_id';
        `
      });

    if (constraintError) {
      console.log('❌ Error checking constraints:', constraintError.message);
    } else if (constraints && constraints.length > 0) {
      console.log('✅ Foreign key constraint exists:');
      constraints.forEach(constraint => {
        console.log(`   ${constraint.constraint_name}: ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      });
    } else {
      console.log('❌ No foreign key constraint found');
    }

    console.log('\n2. Testing course filtering API endpoint...');
    
    // Test 2: Simulate the assessment-filters API call for CCS
    const collegeName = 'CCS';
    const assessmentType = 'ryff_42';
    
    console.log(`   Testing for college: ${collegeName}, type: ${assessmentType}`);
    
    // Get bulk assessments for CCS
    const { data: bulkAssessments, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .neq('status', 'archived')
      .eq('assessment_type', assessmentType);
    
    if (assessmentError) {
      console.log('❌ Error fetching bulk assessments:', assessmentError.message);
      return;
    }
    
    console.log(`   Found ${bulkAssessments?.length || 0} bulk assessments`);
    
    if (bulkAssessments && bulkAssessments.length > 0) {
      const firstAssessment = bulkAssessments[0];
      console.log(`   Testing with assessment: "${firstAssessment.assessment_name}"`);
      
      // Test 3: Get courses for this assessment (simulating the API logic)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assessment_assignments')
        .select('id, student_id')
        .eq('bulk_assessment_id', firstAssessment.id);

      if (assignmentsError) {
        console.log('❌ Error fetching assignments:', assignmentsError.message);
        return;
      }

      console.log(`   Found ${assignments?.length || 0} assignments`);

      if (assignments && assignments.length > 0) {
        const studentIds = assignments.map(a => a.student_id);
        
        // Get courses from students who have assignments
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, course, college, year_level, section')
          .in('id', studentIds)
          .eq('college', collegeName)
          .not('course', 'is', null);

        if (studentsError) {
          console.log('❌ Error fetching students:', studentsError.message);
          return;
        }

        console.log(`   Found ${studentsData?.length || 0} students with courses`);
        
        if (studentsData && studentsData.length > 0) {
          // Extract unique courses
          const coursesSet = new Set();
          const yearLevelsSet = new Set();
          const sectionsSet = new Set();
          
          studentsData.forEach(student => {
            if (student.course && student.course.trim() !== '') {
              coursesSet.add(student.course);
            }
            if (student.year_level !== null && student.year_level !== undefined) {
              yearLevelsSet.add(student.year_level);
            }
            if (student.section && student.section.trim() !== '') {
              sectionsSet.add(student.section);
            }
          });
          
          const availableCourses = Array.from(coursesSet).sort();
          const availableYearLevels = Array.from(yearLevelsSet).sort((a, b) => a - b);
          const availableSections = Array.from(sectionsSet).sort();
          
          console.log('\n3. Results:');
          console.log(`   ✅ Available Courses: ${JSON.stringify(availableCourses)}`);
          console.log(`   ✅ Available Year Levels: ${JSON.stringify(availableYearLevels)}`);
          console.log(`   ✅ Available Sections: ${JSON.stringify(availableSections)}`);
          
          // Test 4: Test course filtering effect on year levels and sections
          if (availableCourses.length > 0) {
            const testCourse = availableCourses[0];
            console.log(`\n4. Testing course filter with "${testCourse}"...`);
            
            const { data: courseStudents, error: courseStudentsError } = await supabase
              .from('students')
              .select('id, year_level, section')
              .eq('college', collegeName)
              .eq('course', testCourse);

            if (courseStudentsError) {
              console.log('❌ Error fetching course students:', courseStudentsError.message);
            } else {
              const filteredYearLevels = new Set();
              const filteredSections = new Set();
              
              courseStudents.forEach(student => {
                if (student.year_level !== null && student.year_level !== undefined) {
                  filteredYearLevels.add(student.year_level);
                }
                if (student.section && student.section.trim() !== '') {
                  filteredSections.add(student.section);
                }
              });
              
              console.log(`   ✅ Filtered Year Levels for ${testCourse}: ${JSON.stringify(Array.from(filteredYearLevels).sort((a, b) => a - b))}`);
              console.log(`   ✅ Filtered Sections for ${testCourse}: ${JSON.stringify(Array.from(filteredSections).sort())}`);
            }
          }
        } else {
          console.log('❌ No students found with courses for this assessment');
        }
      } else {
        console.log('❌ No assignments found for this assessment');
      }
    } else {
      console.log('❌ No bulk assessments found for this college');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCourseFiltering();