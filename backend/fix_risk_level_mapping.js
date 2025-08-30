require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Map risk level values from assessment tables to assessment_assignments constraint
 * Assessment tables use: 'low', 'moderate', 'high'
 * Assessment_assignments constraint expects: 'healthy', 'moderate', 'at-risk'
 */
function mapRiskLevelForAssignments(riskLevel) {
  const mapping = {
    'low': 'healthy',
    'moderate': 'moderate',
    'high': 'at-risk'
  };
  
  return mapping[riskLevel] || riskLevel;
}

async function fixRiskLevelMapping() {
  try {
    console.log('🔄 Fixing risk_level mapping for assessment_assignments...');
    
    // 1. Find all completed assignments without risk_level
    console.log('\n🔍 Finding completed assignments without risk_level...');
    
    const { data: assignmentsToUpdate, error: fetchError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        status,
        completed_at,
        risk_level,
        bulk_assessment:bulk_assessments(
          id,
          assessment_type,
          assessment_name
        )
      `)
      .eq('status', 'completed')
      .is('risk_level', null);
    
    if (fetchError) {
      console.error('❌ Error fetching assignments:', fetchError);
      return;
    }
    
    if (!assignmentsToUpdate || assignmentsToUpdate.length === 0) {
      console.log('✅ No assignments need risk_level backfill!');
      return;
    }
    
    console.log(`📊 Found ${assignmentsToUpdate.length} assignments to update`);
    
    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    // 2. Process each assignment
    for (const assignment of assignmentsToUpdate) {
      try {
        console.log(`\n🔄 Processing assignment ${assignment.id}...`);
        console.log(`   Assessment: ${assignment.bulk_assessment.assessment_name}`);
        console.log(`   Type: ${assignment.bulk_assessment.assessment_type}`);
        
        // Determine which assessment table to check
        const assessmentType = assignment.bulk_assessment.assessment_type;
        const tableName = assessmentType === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
        
        // Find the corresponding assessment record
        const { data: assessmentRecord, error: assessmentError } = await supabaseAdmin
          .from(tableName)
          .select('id, risk_level, overall_score')
          .eq('assignment_id', assignment.id)
          .single();
        
        if (assessmentError || !assessmentRecord) {
          console.log(`   ⚠️  No assessment record found in ${tableName}`);
          notFoundCount++;
          continue;
        }
        
        if (!assessmentRecord.risk_level) {
          console.log(`   ⚠️  Assessment record exists but has no risk_level`);
          notFoundCount++;
          continue;
        }
        
        console.log(`   ✅ Found risk_level: ${assessmentRecord.risk_level}`);
        
        // Map the risk level to the correct format for assessment_assignments
        const mappedRiskLevel = mapRiskLevelForAssignments(assessmentRecord.risk_level);
        console.log(`   🔄 Mapping '${assessmentRecord.risk_level}' to '${mappedRiskLevel}'`);
        
        // Update the assignment with the mapped risk_level
        const { error: updateError } = await supabaseAdmin
          .from('assessment_assignments')
          .update({ risk_level: mappedRiskLevel })
          .eq('id', assignment.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating assignment:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Updated assignment with risk_level: ${mappedRiskLevel}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing assignment ${assignment.id}:`, error);
        errorCount++;
      }
    }
    
    // 3. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total assignments processed: ${assignmentsToUpdate.length}`);
    console.log(`   Successfully updated: ${successCount}`);
    console.log(`   Assessment records not found: ${notFoundCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Risk level mapping fix completed successfully!');
      
      // 4. Verify the results
      console.log('\n🔍 Verifying results...');
      
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('assessment_assignments')
        .select('id, risk_level')
        .eq('status', 'completed');
      
      if (!verifyError && verifyData) {
        const totalCompleted = verifyData.length;
        const withRiskLevel = verifyData.filter(a => a.risk_level !== null).length;
        const withoutRiskLevel = totalCompleted - withRiskLevel;
        
        console.log(`   Total completed assignments: ${totalCompleted}`);
        console.log(`   With risk_level: ${withRiskLevel}`);
        console.log(`   Without risk_level: ${withoutRiskLevel}`);
        
        if (withRiskLevel > 0) {
          const riskDistribution = {};
          verifyData.forEach(a => {
            if (a.risk_level) {
              riskDistribution[a.risk_level] = (riskDistribution[a.risk_level] || 0) + 1;
            }
          });
          console.log('   Risk level distribution:', riskDistribution);
        }
      }
    } else {
      console.log('\n⚠️  No assignments were successfully updated');
    }
    
    if (notFoundCount > 0) {
      console.log('\n💡 Note: Some assignments had no corresponding assessment records.');
      console.log('   This could happen if:');
      console.log('   - The assessment was marked completed but never actually submitted');
      console.log('   - There was an error during the original submission process');
      console.log('   - The assessment records were deleted or corrupted');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixRiskLevelMapping();