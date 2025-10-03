const EmailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');
  
  const emailService = new EmailService();
  
  // Test data
  const testStudent = {
    email: 'test.student@example.com', // Replace with your actual test email
    name: 'Test Student',
    id_number: 'TEST001'
  };
  
  console.log('📧 Test Student Data:');
  console.log(`   Name: ${testStudent.name}`);
  console.log(`   Email: ${testStudent.email}`);
  console.log(`   ID Number: ${testStudent.id_number}`);
  console.log(`   Temporary Password: ${emailService.getTemporaryPassword()}\n`);
  
  try {
    console.log('🚀 Sending test email...');
    const result = await emailService.sendTemporaryPasswordEmail(testStudent);
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log(`   Message: ${result.message}`);
      console.log(`   Temporary Password: ${result.temporaryPassword}`);
      console.log(`   Auth User ID: ${result.authUserId}`);
      console.log('\n📝 Next Steps:');
      console.log('   1. Check your email inbox for the magic link');
      console.log('   2. Try logging in with:');
      console.log(`      - Username: ${testStudent.id_number} or ${testStudent.email}`);
      console.log(`      - Password: ${result.temporaryPassword}`);
    } else {
      console.log('❌ FAILED!');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log('💥 EXCEPTION!');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
  
  console.log('\n🔍 Testing password validation...');
  console.log(`   Is "L3mb4y" temporary password? ${emailService.isTemporaryPassword('L3mb4y')}`);
  console.log(`   Is "student123" temporary password? ${emailService.isTemporaryPassword('student123')}`);
  console.log(`   Is "wrongpass" temporary password? ${emailService.isTemporaryPassword('wrongpass')}`);
}

// Run the test
testEmailService().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});