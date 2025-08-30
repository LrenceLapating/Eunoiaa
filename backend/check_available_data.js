// Script to check what data is available for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAvailableData() {
  console.log('🔍 Checking available data for testing...');
  
  try {
    // Check available colleges
    console.log('\n📚 Available Colleges:');
    const { data: colleges, error: collegeError } = await supabase
      .from('students')
      .select('college')
      .not('college', 'is', null);
    
    if (collegeError) {
      console.error('Error fetching colleges:', collegeError);
    } else {
      const uniqueColleges = [...new Set(colleges.map(c => c.college))];
      uniqueColleges.forEach(college => console.log(`  - ${college}`));
    }
    
    // Check available assessment names from bulk_assessments
    console.log('\n📋 Available Assessment Names (from bulk_assessments):');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('assessment_name, assessment_type')
      .not('assessment_name', 'is', null);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
    } else {
      const uniqueAssessments = [...new Set(bulkAssessments.map(a => `${a.assessment_name} (${a.assessment_type})`))].sort();
      uniqueAssessments.forEach(name => console.log(`  - ${name}`));
    }
    
    // Check available assessment types from actual assessment tables
    console.log('\n📋 Available Assessment Types (42-item):');
    const { data: assessments42, error: assess42Error } = await supabase
      .from('assessments_42items')
      .select('assessment_type')
      .not('assessment_type', 'is', null);
    
    if (assess42Error) {
      console.error('Error fetching 42-item assessments:', assess42Error);
    } else {
      const uniqueTypes42 = [...new Set(assessments42.map(a => a.assessment_type))];
      uniqueTypes42.forEach(type => console.log(`  - ${type}`));
    }
    
    console.log('\n📋 Available Assessment Types (84-item):');
    const { data: assessments84, error: assess84Error } = await supabase
      .from('assessments_84items')
      .select('assessment_type')
      .not('assessment_type', 'is', null);
    
    if (assess84Error) {
      console.error('Error fetching 84-item assessments:', assess84Error);
    } else {
      const uniqueTypes84 = [...new Set(assessments84.map(a => a.assessment_type))];
      uniqueTypes84.forEach(type => console.log(`  - ${type}`));
    }
    
    // Check available year levels and sections
    console.log('\n🎓 Available Year Levels:');
    const { data: years, error: yearError } = await supabase
      .from('students')
      .select('year_level')
      .not('year_level', 'is', null);
    
    if (yearError) {
      console.error('Error fetching year levels:', yearError);
    } else {
      const uniqueYears = [...new Set(years.map(y => y.year_level))].sort();
      uniqueYears.forEach(year => console.log(`  - ${year}`));
    }
    
    console.log('\n🏫 Available Sections:');
    const { data: sections, error: sectionError } = await supabase
      .from('students')
      .select('section')
      .not('section', 'is', null);
    
    if (sectionError) {
      console.error('Error fetching sections:', sectionError);
    } else {
      const uniqueSections = [...new Set(sections.map(s => s.section))].sort();
      uniqueSections.slice(0, 10).forEach(section => console.log(`  - ${section}`));
      if (uniqueSections.length > 10) {
        console.log(`  ... and ${uniqueSections.length - 10} more`);
      }
    }
    
    // Check sample assessment data with student info
    console.log('\n🔗 Sample Assessment Data with Student Info (42-item):');
    const { data: sampleData42, error: sampleError42 } = await supabase
      .from('assessments_42items')
      .select(`
        assessment_type,
        student_id,
        students!inner(
          college,
          year_level,
          section
        )
      `)
      .limit(3);
    
    if (sampleError42) {
      console.error('Error fetching 42-item sample data:', sampleError42);
    } else {
      sampleData42.forEach((item, index) => {
        console.log(`  ${index + 1}. Assessment Type: ${item.assessment_type}`);
        console.log(`     College: ${item.students.college}`);
        console.log(`     Year: ${item.students.year_level}, Section: ${item.students.section}`);
      });
    }
    
    console.log('\n🔗 Sample Assessment Data with Student Info (84-item):');
    const { data: sampleData84, error: sampleError84 } = await supabase
      .from('assessments_84items')
      .select(`
        assessment_type,
        student_id,
        students!inner(
          college,
          year_level,
          section
        )
      `)
      .limit(3);
    
    if (sampleError84) {
      console.error('Error fetching 84-item sample data:', sampleError84);
    } else {
      sampleData84.forEach((item, index) => {
        console.log(`  ${index + 1}. Assessment Type: ${item.assessment_type}`);
        console.log(`     College: ${item.students.college}`);
        console.log(`     Year: ${item.students.year_level}, Section: ${item.students.section}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAvailableData().catch(console.error);