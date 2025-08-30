require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function cleanupGeneralAssessmentRecords() {
  console.log('🧹 Cleaning up incorrect "General Assessment" records...');
  
  try {
    // 1. First, let's see what "General Assessment" records exist
    console.log('\n📊 Current "General Assessment" records:');
    const { data: generalRecords, error: fetchError } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_name', 'General Assessment')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching General Assessment records:', fetchError);
      return;
    }
    
    console.log(`Found ${generalRecords.length} "General Assessment" records`);
    
    if (generalRecords.length === 0) {
      console.log('✅ No "General Assessment" records found to clean up.');
      return;
    }
    
    // Group by creation date to understand the pattern
    const recordsByDate = {};
    generalRecords.forEach(record => {
      const date = record.created_at.split('T')[0]; // Get just the date part
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });
    
    console.log('\n📅 Records grouped by creation date:');
    Object.keys(recordsByDate).forEach(date => {
      console.log(`   ${date}: ${recordsByDate[date].length} records`);
    });
    
    // 2. Check if there are any legitimate "General Assessment" bulk assessments
    console.log('\n🔍 Checking for legitimate "General Assessment" bulk assessments...');
    const { data: legitimateAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, status, created_at')
      .eq('assessment_name', 'General Assessment');
    
    if (bulkError) {
      console.error('Error checking bulk assessments:', bulkError);
      return;
    }
    
    console.log(`Found ${legitimateAssessments.length} legitimate "General Assessment" bulk assessments`);
    
    if (legitimateAssessments.length > 0) {
      console.log('\n⚠️ Found legitimate "General Assessment" bulk assessments:');
      legitimateAssessments.forEach(assessment => {
        console.log(`   - ID: ${assessment.id}, Status: ${assessment.status}, Created: ${assessment.created_at}`);
      });
      
      // For legitimate assessments, we need to be more careful
      console.log('\n🤔 Since there are legitimate "General Assessment" bulk assessments,');
      console.log('we need to identify which college_scores records are legitimate vs. incorrect.');
      
      // Check if any of the legitimate assessments have completed assignments
      for (const assessment of legitimateAssessments) {
        const { data: assignments, error: assignError } = await supabase
          .from('assessment_assignments')
          .select('id')
          .eq('bulk_assessment_id', assessment.id)
          .eq('status', 'completed')
          .limit(1);
        
        if (assignError) {
          console.error(`Error checking assignments for assessment ${assessment.id}:`, assignError);
          continue;
        }
        
        if (assignments && assignments.length > 0) {
          console.log(`   ✅ Assessment ${assessment.id} has completed assignments - its scores are legitimate`);
        } else {
          console.log(`   ❌ Assessment ${assessment.id} has no completed assignments - its scores might be incorrect`);
        }
      }
      
      console.log('\n⚠️ Manual review required. Not automatically deleting records.');
      console.log('Please review the above information and manually clean up if needed.');
      
    } else {
      // No legitimate "General Assessment" bulk assessments found
      console.log('\n✅ No legitimate "General Assessment" bulk assessments found.');
      console.log('All "General Assessment" college_scores records appear to be incorrect and can be safely deleted.');
      
      // Ask for confirmation (in a real scenario, you might want to add a command line argument)
      console.log('\n🗑️ Proceeding to delete all "General Assessment" college_scores records...');
      
      const { data: deleteResult, error: deleteError } = await supabase
        .from('college_scores')
        .delete()
        .eq('assessment_name', 'General Assessment');
      
      if (deleteError) {
        console.error('❌ Error deleting General Assessment records:', deleteError);
        return;
      }
      
      console.log(`✅ Successfully deleted ${generalRecords.length} "General Assessment" records`);
    }
    
    // 3. Final verification
    console.log('\n📊 Final verification - remaining "General Assessment" records:');
    const { data: remainingRecords, error: finalError } = await supabase
      .from('college_scores')
      .select('count(*)', { count: 'exact', head: true })
      .eq('assessment_name', 'General Assessment');
    
    if (finalError) {
      console.error('Error in final verification:', finalError);
    } else {
      console.log(`Remaining "General Assessment" records: ${remainingRecords || 0}`);
    }
    
    console.log('\n✅ Cleanup process completed!');
    
  } catch (error) {
    console.error('❌ Error in cleanup process:', error);
  }
}

// Run the cleanup
cleanupGeneralAssessmentRecords()
  .then(() => {
    console.log('\n🎉 Cleanup process finished!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Cleanup process failed:', error);
    process.exit(1);
  });