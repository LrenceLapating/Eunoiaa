/**
 * Script to set up default counselor account with proper password hashing
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupCounselor() {
  try {
    console.log('Setting up default counselor account...');
    
    // Hash the default password
    const defaultPassword = 'counselor123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    console.log('Password hashed successfully');
    
    // Check if counselor already exists
    const { data: existingCounselor, error: checkError } = await supabase
      .from('counselors')
      .select('id')
      .eq('email', 'counselor@eunoia.edu')
      .single();
    
    if (existingCounselor) {
      console.log('Counselor already exists, updating password...');
      
      // Update existing counselor password
      const { error: updateError } = await supabase
        .from('counselors')
        .update({ password_hash: hashedPassword })
        .eq('email', 'counselor@eunoia.edu');
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('Counselor password updated successfully');
    } else {
      console.log('Creating new counselor account...');
      
      // Insert new counselor
      const { error: insertError } = await supabase
        .from('counselors')
        .insert({
          email: 'counselor@eunoia.edu',
          name: 'Default Counselor',
          password_hash: hashedPassword,
          college: 'Student Affairs',
          role: 'counselor'
        });
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('Counselor account created successfully');
    }
    
    console.log('\nDefault counselor credentials:');
    console.log('Email: counselor@eunoia.edu');
    console.log('Password: counselor123');
    console.log('\nSetup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up counselor:', error);
    process.exit(1);
  }
}

setupCounselor();