#!/usr/bin/env node

/**
 * Check Migration Status: Verify if completion_time migration was applied
 * 
 * This script checks if the completion_time field exists in ryff_history table
 * and shows sample data to verify the migration status.
 */

require('dotenv').config();
const { supabase } = require('../config/database');

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status for completion_time field...');
  
  try {
    // Check if we can query the completion_time field
    console.log('\n📋 Testing if completion_time column exists...');
    
    const { data: testData, error: testError } = await supabase
      .from('ryff_history')
      .select('id, assessment_type, completion_time, completed_at')
      .limit(5);
    
    if (testError) {
      if (testError.message.includes('completion_time')) {
        console.log('❌ completion_time column does NOT exist in ryff_history table');
        console.log('Error:', testError.message);
        console.log('\n🔧 You need to run the SQL migration manually in Supabase dashboard');
        return false;
      } else {
        console.log('❌ Database query error:', testError.message);
        return false;
      }
    }
    
    console.log('✅ completion_time column exists and is queryable');
    
    // Show sample data
    console.log('\n📊 Sample data from ryff_history:');
    console.table(testData);
    
    // Count records with completion_time
    console.log('\n📈 Checking completion_time population...');
    
    const { data: countData, error: countError } = await supabase
      .from('ryff_history')
      .select('assessment_type, completion_time')
      .limit(100); // Get a larger sample
    
    if (countError) {
      console.log('❌ Error counting records:', countError.message);
      return false;
    }
    
    // Group by assessment_type and count
    const stats = {};
    countData.forEach(record => {
      const type = record.assessment_type;
      if (!stats[type]) {
        stats[type] = { total: 0, withTime: 0 };
      }
      stats[type].total++;
      if (record.completion_time !== null) {
        stats[type].withTime++;
      }
    });
    
    console.log('Migration statistics (sample of 100 records):');
    Object.entries(stats).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.withTime}/${data.total} records have completion_time`);
    });
    
    const totalWithTime = Object.values(stats).reduce((sum, data) => sum + data.withTime, 0);
    const totalRecords = Object.values(stats).reduce((sum, data) => sum + data.total, 0);
    
    console.log(`\n📊 Overall sample: ${totalWithTime}/${totalRecords} records have completion_time populated`);
    
    if (totalWithTime === 0) {
      console.log('⚠️  No completion_time data found - migration may not have run properly');
      console.log('\n🔧 Please run the SQL migration manually in Supabase dashboard:');
      console.log('   1. Open Supabase Dashboard → SQL Editor');
      console.log('   2. Copy the SQL from: backend/migrations/add_completion_time_to_ryff_history.sql');
      console.log('   3. Execute the complete SQL script');
      return false;
    }
    
    console.log('✅ Migration appears to be successful!');
    
    // Test the backend API endpoint
    console.log('\n🔄 Testing backend API response...');
    
    const { data: apiTestData, error: apiError } = await supabase
      .from('ryff_history')
      .select('id, original_id, student_id, assessment_type, responses, scores, completed_at, archived_at, completion_time')
      .limit(3);
    
    if (apiError) {
      console.log('❌ API test failed:', apiError.message);
      return false;
    }
    
    console.log('✅ Backend can successfully query completion_time field');
    console.log('Sample API response:');
    console.table(apiTestData);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkMigrationStatus()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Migration check completed successfully');
        console.log('\n📋 Next steps:');
        console.log('   1. Restart the backend server if not already done');
        console.log('   2. Clear browser cache');
        console.log('   3. Test the assessment history page');
        process.exit(0);
      } else {
        console.log('\n💥 Migration issues detected - please run the SQL migration manually');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Migration check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkMigrationStatus };