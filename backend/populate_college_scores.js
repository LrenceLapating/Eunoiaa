const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Ryff Well-being dimensions
const DIMENSIONS = [
  'autonomy',
  'personal_growth', 
  'purpose_in_life',
  'self_acceptance',
  'positive_relations',
  'environmental_mastery'
];

// Risk level calculation based on score ranges
function calculateRiskLevel(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 70) return 'low';
  if (percentage >= 50) return 'moderate';
  return 'high';
}

// Get assessment type max scores
function getMaxScore(assessmentType) {
  return assessmentType === 'ryff_42' ? 42 : 84;
}

async function populateCollegeScores() {
  try {
    console.log('🚀 STARTING COLLEGE SCORES POPULATION\n');
    
    // 1. Check if college_scores table exists, if not skip table creation
    console.log('📋 Checking college_scores table...');
    
    // Try to query the table to see if it exists
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('college_scores')
      .select('id')
      .limit(1);
    
    if (tableCheckError && tableCheckError.code === 'PGRST116') {
      console.log('⚠️  College scores table does not exist. Please create it manually using the SQL script.');
      console.log('📄 Use the create_college_scores_table.sql file or create the table through Supabase dashboard.');
      return;
    } else if (tableCheckError) {
      console.error('❌ Error checking table:', tableCheckError);
      return;
    }
    
    console.log('✅ College scores table exists\n');
    
    // 2. Clear existing data
    console.log('🧹 Clearing existing college scores data...');
    const { error: deleteError } = await supabase
      .from('college_scores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('❌ Error clearing data:', deleteError);
      return;
    }
    console.log('✅ Existing data cleared\n');
    
    // 3. Get all completed assessments and related data separately
    console.log('📊 Fetching assessment data...');
    
    // Get completed assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('id, student_id, bulk_assessment_id')
      .eq('status', 'completed');
    
    if (assignmentError) {
      console.error('❌ Error fetching assignments:', assignmentError);
      return;
    }
    
    console.log(`✅ Found ${assignments.length} completed assignments`);
    
    // Get students data
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, college')
      .not('college', 'is', null);
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }
    
    console.log(`✅ Found ${students.length} students with colleges`);
    
    // Get bulk assessments data
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type');
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`✅ Found ${bulkAssessments.length} bulk assessments`);
    
    // Create lookup maps for efficient joining
    const studentMap = new Map(students.map(s => [s.id, s]));
    const bulkAssessmentMap = new Map(bulkAssessments.map(b => [b.id, b]));
    
    // Join the data manually
    const assessmentData = assignments
      .map(assignment => {
        const student = studentMap.get(assignment.student_id);
        const bulkAssessment = bulkAssessmentMap.get(assignment.bulk_assessment_id);
        
        if (student && bulkAssessment) {
          return {
            id: assignment.id,
            student_id: assignment.student_id,
            bulk_assessment_id: assignment.bulk_assessment_id,
            students: student,
            bulk_assessments: bulkAssessment
          };
        }
        return null;
      })
      .filter(item => item !== null);
    
    console.log(`✅ Successfully joined ${assessmentData.length} complete assessment records\n`);
    
    // 4. Process each assessment type separately
    const collegeScores = new Map();
    
    for (const assignment of assessmentData) {
      const { students: student, bulk_assessments: bulkAssessment } = assignment;
      const assessmentType = bulkAssessment.assessment_type;
      const tableName = assessmentType === 'ryff_42' ? 'assessments_42items' : 'assessments_84items';
      
      // Get the actual assessment scores
      const { data: scoreData, error: scoreError } = await supabase
        .from(tableName)
        .select('scores, overall_score')
        .eq('assignment_id', assignment.id)
        .single();
      
      if (scoreError || !scoreData) {
        console.log(`⚠️  No scores found for assignment ${assignment.id}`);
        continue;
      }
      
      const scores = typeof scoreData.scores === 'string' 
        ? JSON.parse(scoreData.scores) 
        : scoreData.scores;
      
      // Process each dimension
      for (const dimension of DIMENSIONS) {
        if (scores[dimension] !== undefined) {
          const key = `${student.college}|${dimension}|${assessmentType}|${bulkAssessment.assessment_name}`;
          
          if (!collegeScores.has(key)) {
            collegeScores.set(key, {
              college_name: student.college,
              dimension_name: dimension,
              assessment_type: assessmentType,
              assessment_name: bulkAssessment.assessment_name,
              scores: [],
              student_count: 0
            });
          }
          
          const entry = collegeScores.get(key);
          entry.scores.push(scores[dimension]);
          entry.student_count++;
        }
      }
    }
    
    console.log(`📈 Processing ${collegeScores.size} college-dimension combinations...\n`);
    
    // 5. Calculate averages and prepare insert data
    const insertData = [];
    
    for (const [key, data] of collegeScores) {
      const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      const maxScore = getMaxScore(data.assessment_type);
      const riskLevel = calculateRiskLevel(averageScore, maxScore);
      
      insertData.push({
        college_name: data.college_name,
        dimension_name: data.dimension_name,
        raw_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
        student_count: data.student_count,
        risk_level: riskLevel,
        assessment_type: data.assessment_type,
        assessment_name: data.assessment_name,
        last_calculated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`💾 Inserting ${insertData.length} college score records...`);
    
    // 6. Insert data in batches
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('college_scores')
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        continue;
      }
      
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} records)`);
    }
    
    console.log(`\n🎉 SUCCESS! Inserted ${insertedCount} college score records`);
    
    // 7. Display summary statistics
    console.log('\n📊 SUMMARY STATISTICS:');
    
    const { data: summaryData } = await supabase
      .from('college_scores')
      .select('college_name, assessment_type, dimension_name, student_count, risk_level')
      .order('college_name');
    
    if (summaryData) {
      // Group by college
      const collegeStats = {};
      summaryData.forEach(record => {
        if (!collegeStats[record.college_name]) {
          collegeStats[record.college_name] = {
            total_records: 0,
            total_students: 0,
            assessment_types: new Set(),
            risk_levels: { low: 0, moderate: 0, high: 0 }
          };
        }
        
        const stats = collegeStats[record.college_name];
        stats.total_records++;
        stats.total_students += record.student_count;
        stats.assessment_types.add(record.assessment_type);
        stats.risk_levels[record.risk_level]++;
      });
      
      console.log('\n🏫 College Statistics:');
      Object.entries(collegeStats).forEach(([college, stats]) => {
        console.log(`\n${college}:`);
        console.log(`  - Records: ${stats.total_records}`);
        console.log(`  - Total Student Assessments: ${stats.total_students}`);
        console.log(`  - Assessment Types: ${Array.from(stats.assessment_types).join(', ')}`);
        console.log(`  - Risk Distribution: Low(${stats.risk_levels.low}) Moderate(${stats.risk_levels.moderate}) High(${stats.risk_levels.high})`);
      });
    }
    
    console.log('\n✅ College scores population completed successfully!');
    
  } catch (error) {
    console.error('❌ Population error:', error);
  }
}

populateCollegeScores();