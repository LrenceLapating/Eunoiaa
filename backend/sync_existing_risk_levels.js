const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * One-time migration script to sync existing risk_level values
 * from assessments_42items and assessments_84items to assessment_assignments
 */
async function syncExistingRiskLevels() {
  console.log('🔄 Starting one-time risk level synchronization...');
  
  try {
    // Step 1: Sync from assessments_42items
    console.log('\n📊 Syncing from assessments_42items...');
    const { data: assessments42, error: error42 } = await supabase
      .from('assessments_42items')
      .select('id, assignment_id, risk_level')
      .not('assignment_id', 'is', null)
      .not('risk_level', 'is', null);
    
    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42.message);
      return;
    }
    
    console.log(`   Found ${assessments42.length} 42-item assessments with risk_level`);
    
    let updated42 = 0;
    for (const assessment of assessments42) {
      // Map risk_level values: low -> healthy, moderate -> moderate, high -> at-risk
      const mappedRiskLevel = mapRiskLevel(assessment.risk_level);
      
      const { error: updateError } = await supabase
        .from('assessment_assignments')
        .update({ 
          risk_level: mappedRiskLevel
        })
        .eq('id', assessment.assignment_id);
      
      if (updateError) {
        console.error(`   ❌ Error updating assignment ${assessment.assignment_id}:`, updateError.message);
      } else {
        updated42++;
        if (updated42 % 10 === 0) {
          console.log(`   ✅ Updated ${updated42}/${assessments42.length} assignments`);
        }
      }
    }
    
    console.log(`   ✅ Successfully updated ${updated42} assignments from 42-item assessments`);
    
    // Step 2: Sync from assessments_84items
    console.log('\n📊 Syncing from assessments_84items...');
    const { data: assessments84, error: error84 } = await supabase
      .from('assessments_84items')
      .select('id, assignment_id, risk_level')
      .not('assignment_id', 'is', null)
      .not('risk_level', 'is', null);
    
    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84.message);
      return;
    }
    
    console.log(`   Found ${assessments84.length} 84-item assessments with risk_level`);
    
    let updated84 = 0;
    for (const assessment of assessments84) {
      // Map risk_level values: low -> healthy, moderate -> moderate, high -> at-risk
      const mappedRiskLevel = mapRiskLevel(assessment.risk_level);
      
      const { error: updateError } = await supabase
        .from('assessment_assignments')
        .update({ 
          risk_level: mappedRiskLevel
        })
        .eq('id', assessment.assignment_id);
      
      if (updateError) {
        console.error(`   ❌ Error updating assignment ${assessment.assignment_id}:`, updateError.message);
      } else {
        updated84++;
        if (updated84 % 10 === 0) {
          console.log(`   ✅ Updated ${updated84}/${assessments84.length} assignments`);
        }
      }
    }
    
    console.log(`   ✅ Successfully updated ${updated84} assignments from 84-item assessments`);
    
    // Step 3: Verification
    console.log('\n🔍 Running verification...');
    await runVerification();
    
    console.log('\n🎉 One-time risk level synchronization completed!');
    console.log(`📊 Total updates: ${updated42 + updated84}`);
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error.message);
    process.exit(1);
  }
}

/**
 * Map risk_level values from assessment tables to assessment_assignments format
 */
function mapRiskLevel(riskLevel) {
  switch (riskLevel) {
    case 'low':
      return 'healthy';
    case 'moderate':
      return 'moderate';
    case 'high':
      return 'at-risk';
    default:
      return riskLevel; // Keep original value if not recognized
  }
}

/**
 * Verify that all risk levels are properly synchronized
 */
async function runVerification() {
  try {
    // Check 42-item assessments
    const { data: mismatches42, error: error42 } = await supabase
      .rpc('check_risk_level_sync_42items');
    
    // Check 84-item assessments  
    const { data: mismatches84, error: error84 } = await supabase
      .rpc('check_risk_level_sync_84items');
    
    if (error42 || error84) {
      console.log('   ⚠️  Could not run RPC verification (functions may not exist)');
      console.log('   💡 Manual verification recommended');
      return;
    }
    
    const totalMismatches = (mismatches42?.length || 0) + (mismatches84?.length || 0);
    
    if (totalMismatches === 0) {
      console.log('   ✅ All risk levels are properly synchronized!');
    } else {
      console.log(`   ⚠️  Found ${totalMismatches} mismatches that may need attention`);
    }
    
  } catch (error) {
    console.log('   ⚠️  Verification error:', error.message);
    console.log('   💡 Manual verification recommended');
  }
}

// Run the synchronization
syncExistingRiskLevels();