require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('❌ Missing Supabase configuration!');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('\n🔗 Testing database connection...');

supabase
  .from('students')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Database Error:', error.message);
      if (error.message.includes('relation "students" does not exist')) {
        console.log('\n📋 The "students" table does not exist in your Supabase database.');
        console.log('Please create it using the SQL provided in the README.md file.');
      }
    } else {
      console.log('✅ Database connected successfully!');
      console.log('✅ Students table exists and is accessible.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
  });