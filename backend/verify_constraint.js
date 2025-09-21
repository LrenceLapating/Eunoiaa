const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyConstraint() {
    try {
        // Check if we have environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.log('❌ Missing Supabase environment variables');
            console.log('Please ensure .env file exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
            return;
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        console.log('🔍 Checking foreign key constraints on assessment_assignments table...\n');

        // Test the relationship by trying to query with joins
        console.log('🧪 Testing if the relationship works by querying data...\n');
        
        // Try to get assessment_assignments with student data
        const { data: testData, error } = await supabase
            .from('assessment_assignments')
            .select(`
                id,
                student_id,
                students (
                    id,
                    name,
                    college_id,
                    colleges (
                        id,
                        name,
                        code
                    )
                )
            `)
            .limit(5);

        if (error) {
            console.log('❌ Error testing relationship:', error.message);
            console.log('❌ This suggests the foreign key constraint is MISSING or not working');
            console.log('\n💡 You need to run this SQL command:');
            console.log('ALTER TABLE public.assessment_assignments');
            console.log('ADD CONSTRAINT assessment_assignments_student_id_fkey');
            console.log('FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE;');
            return;
        }

        console.log('✅ Relationship test successful!');
        console.log(`📊 Found ${testData?.length || 0} assessment assignments`);
        
        if (testData && testData.length > 0) {
            console.log('\n📋 Sample data with relationships:');
            testData.forEach((assignment, index) => {
                console.log(`${index + 1}. Assignment ID: ${assignment.id}`);
                console.log(`   Student ID: ${assignment.student_id}`);
                if (assignment.students) {
                    console.log(`   Student Name: ${assignment.students.name}`);
                    if (assignment.students.colleges) {
                        console.log(`   College: ${assignment.students.colleges.name} (${assignment.students.colleges.code})`);
                    }
                } else {
                    console.log('   ⚠️ Student data not found (NULL student_id or missing relationship)');
                }
                console.log('');
            });
        }

        console.log('\n🎯 Foreign Key Status:');
        console.log('✅ student_id foreign key constraint appears to be working');
        console.log('✅ PostgREST can successfully join assessment_assignments with students and colleges');

    } catch (error) {
        console.log('❌ Script error:', error.message);
    }
}

verifyConstraint();