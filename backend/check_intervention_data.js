const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkInterventionData() {
  try {
    console.log('🔍 Checking intervention data for student popos...\n');
    
    // First, find the student ID for popos
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', '444444');
    
    if (studentError) {
      console.log('❌ Error finding student with ID 444444:', studentError);
      console.log('🔍 Let me search by name instead...');
      
      const { data: studentsByName, error: nameError } = await supabase
        .from('students')
        .select('id, name')
        .ilike('name', '%popos%');
      
      if (nameError) {
        console.error('❌ Error searching students by name:', nameError);
        return;
      }
      
      if (!studentsByName || studentsByName.length === 0) {
        console.log('❌ No student found with name containing "popos"');
        return;
      }
      
      console.log('📋 Found students:', studentsByName);
      const student = studentsByName[0];
      console.log(`✅ Using student: ${student.name} (ID: ${student.id})\n`);
      
      // Get the latest intervention for this student
      const { data: interventions, error: interventionError } = await supabase
        .from('ai_interventions')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (interventionError) {
        console.error('❌ Error fetching interventions:', interventionError);
        return;
      }
      
      if (!interventions || interventions.length === 0) {
         console.log(`❌ No AI interventions found for student ${student.name} (${student.id})`);
         console.log('🔍 Let me check counselor_interventions table...');
         
         // Check counselor_interventions table
         const { data: counselorInterventions, error: counselorError } = await supabase
           .from('counselor_interventions')
           .select('*')
           .eq('student_id', student.id)
           .order('created_at', { ascending: false })
           .limit(1);
         
         if (counselorError) {
           console.error('❌ Error fetching counselor interventions:', counselorError);
           return;
         }
         
         if (!counselorInterventions || counselorInterventions.length === 0) {
           console.log(`❌ No counselor interventions found either for student ${student.name} (${student.id})`);
           return;
         }
         
         const intervention = counselorInterventions[0];
         console.log('📋 Latest counselor intervention data:');
         console.log('ID:', intervention.id);
         console.log('Student ID:', intervention.student_id);
         console.log('Created at:', intervention.created_at);
         console.log('Status:', intervention.status);
         console.log('Risk level:', intervention.risk_level);
         console.log('\n📝 Intervention content:');
         console.log('Title:', intervention.intervention_title);
         console.log('Text:', intervention.intervention_text);
         console.log('\n🎯 Structured data:');
         console.log('Overall strategy:', intervention.overall_strategy);
         console.log('Dimension interventions:', JSON.stringify(intervention.dimension_interventions, null, 2));
         console.log('Action plan:', JSON.stringify(intervention.action_plan, null, 2));
         
         return;
       }
      
      const intervention = interventions[0];
      console.log('📋 Latest intervention data:');
      console.log('ID:', intervention.id);
      console.log('Student ID:', intervention.student_id);
      console.log('Created at:', intervention.created_at);
      console.log('Status:', intervention.status);
      console.log('Risk level:', intervention.risk_level);
      console.log('\n📝 Intervention content:');
      console.log('Title:', intervention.title);
      console.log('Text:', intervention.text);
      console.log('\n🎯 Dimension interventions:');
      console.log('Dimension interventions:', JSON.stringify(intervention.dimension_interventions, null, 2));
      
      // Also check if there are any recent interventions
      const { data: recentInterventions, error: recentError } = await supabase
        .from('ai_interventions')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!recentError && recentInterventions) {
        console.log(`\n📊 Total interventions for ${student.name}: ${recentInterventions.length}`);
        recentInterventions.forEach((int, index) => {
          console.log(`${index + 1}. ${int.created_at} - Status: ${int.status} - Risk: ${int.risk_level}`);
        });
      }
      
      return;
    }
    
    // Get the latest intervention for popos
    const { data: interventions, error: interventionError } = await supabase
      .from('ai_interventions')
      .select('*')
      .eq('student_id', '444444')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (interventionError) {
      console.error('❌ Error fetching interventions:', interventionError);
      return;
    }
    
    if (!interventions || interventions.length === 0) {
      console.log('❌ No interventions found for student popos (444444)');
      return;
    }
    
    const intervention = interventions[0];
    console.log('📋 Latest intervention data:');
    console.log('ID:', intervention.id);
    console.log('Student ID:', intervention.student_id);
    console.log('Created at:', intervention.created_at);
    console.log('Status:', intervention.status);
    console.log('Risk level:', intervention.risk_level);
    console.log('\n📝 Intervention content:');
    console.log('Title:', intervention.title);
    console.log('Text:', intervention.text);
    console.log('\n🎯 Dimension interventions:');
    console.log('Dimension interventions:', JSON.stringify(intervention.dimension_interventions, null, 2));
    
    // Also check if there are any recent interventions
    const { data: recentInterventions, error: recentError } = await supabase
      .from('ai_interventions')
      .select('*')
      .eq('student_id', '444444')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!recentError && recentInterventions) {
      console.log(`\n📊 Total interventions for popos: ${recentInterventions.length}`);
      recentInterventions.forEach((int, index) => {
        console.log(`${index + 1}. ${int.created_at} - Status: ${int.status} - Risk: ${int.risk_level}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkInterventionData();