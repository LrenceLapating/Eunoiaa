require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking assessment table structures...');
  
  try {
    // Check 42-item table structure
    console.log('\n📋 42-item Assessment Table Structure:');
    const { data: data42, error: error42 } = await supabase
      .from('assessments_42items')
      .select('*')
      .limit(1);
    
    if (error42) {
      console.error('Error fetching 42-item structure:', error42);
    } else if (data42 && data42.length > 0) {
      console.log('Columns:', Object.keys(data42[0]));
    }
    
    // Check 84-item table structure
    console.log('\n📋 84-item Assessment Table Structure:');
    const { data: data84, error: error84 } = await supabase
      .from('assessments_84items')
      .select('*')
      .limit(1);
    
    if (error84) {
      console.error('Error fetching 84-item structure:', error84);
    } else if (data84 && data84.length > 0) {
      console.log('Columns:', Object.keys(data84[0]));
    }
    
    // Check bulk_assessments table structure
    console.log('\n📋 Bulk Assessments Table Structure:');
    const { data: bulkData, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(1);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments structure:', bulkError);
    } else if (bulkData && bulkData.length > 0) {
      console.log('Columns:', Object.keys(bulkData[0]));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure().catch(console.error);