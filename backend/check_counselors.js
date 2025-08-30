require('dotenv').config();
const { supabase } = require('./config/database');

async function checkCounselors() {
  try {
    console.log('Checking counselors table structure...');
    
    // Get counselors without status filter first
    const { data: counselors, error } = await supabase
      .from('counselors')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('Error fetching counselors:', error);
      return;
    }
    
    if (counselors && counselors.length > 0) {
      console.log('Counselors table structure (first record):');
      console.log(JSON.stringify(counselors[0], null, 2));
      
      console.log('\nAll counselors:');
      counselors.forEach((counselor, index) => {
        console.log(`${index + 1}. Email: ${counselor.email}, Name: ${counselor.name || 'N/A'}, ID: ${counselor.id}`);
      });
    } else {
      console.log('No counselors found in the database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCounselors();