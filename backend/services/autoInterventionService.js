const { supabaseAdmin } = require('../config/database');
const aiService = require('../utils/aiService');
const riskLevelService = require('./riskLevelService');

class AutoInterventionService {
  constructor() {
    this.isRunning = false;
    this.processedStudents = new Set();
  }

  /**
   * Initialize the auto intervention service
   * This runs on server startup
   */
  async initialize() {
    console.log('🤖 Auto AI Intervention Service: Starting automatic mode...');
    
    try {
      // First ensure all completed assessments have risk levels
      console.log('🎯 Calculating missing risk levels...');
      await riskLevelService.initialize();
      
      // Generate interventions for students who need them
      console.log('🧠 Generating missing AI interventions...');
      await this.generateMissingInterventions();
      
      // Start periodic checks for new assessments
      this.startPeriodicCheck();
      
      console.log('✅ Auto intervention service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize auto intervention service:', error);
    }
  }

  /**
   * Generate interventions for students who don't have them yet
   */
  async generateMissingInterventions() {
    try {
      console.log('🔍 Checking for students needing AI interventions...');
      
      // Get all students with completed assessments but no interventions
      // First, get all student IDs who already have interventions
      const { data: existingInterventions, error: existingError } = await supabaseAdmin
        .from('counselor_interventions')
        .select('student_id');
      
      if (existingError) {
        console.error('Error fetching existing interventions:', existingError);
        return;
      }
      
      const existingStudentIds = existingInterventions?.map(i => i.student_id) || [];
      
      // Get students with completed assessments from both assessment tables
      const studentsNeedingInterventions = [];
      
      // Build query for assessments_42items
      let query42 = supabaseAdmin
        .from('assessments_42items')
        .select('id, student_id, risk_level, scores, overall_score, at_risk_dimensions')
        .not('risk_level', 'is', null);
      
      // Only add the filter if there are existing student IDs
      if (existingStudentIds.length > 0) {
        query42 = query42.filter('student_id', 'not.in', `(${existingStudentIds.join(',')})`);
      }
      
      const { data: assessments42, error: error42 } = await query42;

      if (error42) {
        console.error('Error fetching 42-item assessments:', error42);
        return;
      }
      
      // Build query for assessments_84items
      let query84 = supabaseAdmin
        .from('assessments_84items')
        .select('id, student_id, risk_level, scores, overall_score, at_risk_dimensions')
        .not('risk_level', 'is', null);
      
      // Only add the filter if there are existing student IDs
      if (existingStudentIds.length > 0) {
        query84 = query84.filter('student_id', 'not.in', `(${existingStudentIds.join(',')})`);
      }
      
      const { data: assessments84, error: error84 } = await query84;

      if (error84) {
        console.error('Error fetching 84-item assessments:', error84);
        return;
      }
      
      // Get corresponding assessment assignments for these students
      const allStudentIds = [
        ...(assessments42?.map(a => a.student_id) || []),
        ...(assessments84?.map(a => a.student_id) || [])
      ];
      
      let assignmentMap = {};
      if (allStudentIds.length > 0) {
        const { data: assignments } = await supabaseAdmin
          .from('assessment_assignments')
          .select('id, student_id')
          .in('student_id', allStudentIds);
        
        // Create a map of student_id to assignment_id
        assignments?.forEach(assignment => {
          assignmentMap[assignment.student_id] = assignment.id;
        });
      }
      
      // Combine assessments with their types and assignment IDs
      if (assessments42) {
        assessments42.forEach(assessment => {
          const assignmentId = assignmentMap[assessment.student_id];
          if (assignmentId) {
            studentsNeedingInterventions.push({ 
              ...assessment, 
              assessment_type: 'ryff_42',
              assignment_id: assignmentId
            });
          }
        });
      }
      
      if (assessments84) {
        assessments84.forEach(assessment => {
          const assignmentId = assignmentMap[assessment.student_id];
          if (assignmentId) {
            studentsNeedingInterventions.push({ 
              ...assessment, 
              assessment_type: 'ryff_84',
              assignment_id: assignmentId
            });
          }
        });
      }

      if (!studentsNeedingInterventions || studentsNeedingInterventions.length === 0) {
        console.log('✅ No students need new AI interventions');
        return;
      }

      console.log(`📝 Found ${studentsNeedingInterventions.length} students needing AI interventions`);

      // Generate interventions in batches to avoid overwhelming the AI service
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < studentsNeedingInterventions.length; i += batchSize) {
        const batch = studentsNeedingInterventions.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(studentsNeedingInterventions.length/batchSize)}...`);
        
        // Process batch with delay between requests
        for (const assignment of batch) {
          try {
            await this.generateInterventionForStudent(assignment);
            successCount++;
            
            // Add delay between AI requests to avoid rate limiting
            await this.delay(2000); // 2 second delay
          } catch (error) {
            console.error(`Failed to generate intervention for student ${assignment.student_id}:`, error);
            failCount++;
          }
        }
        
        // Longer delay between batches
        if (i + batchSize < studentsNeedingInterventions.length) {
          await this.delay(5000); // 5 second delay between batches
        }
      }

      console.log(`✅ Auto intervention generation completed: ${successCount} successful, ${failCount} failed`);
    } catch (error) {
      console.error('Error in generateMissingInterventions:', error);
    }
  }

  /**
   * Generate AI intervention for a specific student
   */
  async generateInterventionForStudent(assignment) {
    try {
      // Get student information
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, name, email, id_number, college, section')
        .eq('id', assignment.student_id)
        .single();
        
      if (studentError || !student) {
        console.error(`Error fetching student ${assignment.student_id}:`, studentError);
        throw new Error(`Failed to fetch student: ${studentError?.message || 'Student not found'}`);
      }
      
      const riskLevel = assignment.risk_level || 'moderate';
      
      console.log(`🤖 Generating AI intervention for ${student.name} (Risk: ${riskLevel})`);

      // Check if intervention already exists (double-check to prevent race conditions)
      const { data: existingIntervention, error: checkError } = await supabaseAdmin
        .from('counselor_interventions')
        .select('id, created_at')
        .eq('student_id', student.id)
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking existing intervention for student ${student.id}:`, checkError);
        throw new Error(`Failed to check existing interventions: ${checkError.message}`);
      }

      if (existingIntervention) {
        console.log(`⚠️ Intervention already exists for student ${student.id} (created: ${existingIntervention.created_at}), skipping`);
        return;
      }
      
      // Add to processed set to prevent duplicate processing in same session
      if (this.processedStudents.has(student.id)) {
        console.log(`⚠️ Student ${student.id} already processed in this session, skipping`);
        return;
      }
      
      this.processedStudents.add(student.id);

      // Test AI service connection before generating
      const connectionTest = await aiService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`AI service not available: ${connectionTest.error}`);
      }

      // Generate AI intervention content
      console.log(`🔄 Calling AI service for student ${student.name}...`);
      const aiResponse = await aiService.generateIntervention({
        name: student.name, // Fix: use 'name' instead of 'studentName'
        college: student.college,
        yearLevel: 'N/A', // Not available in current student schema
        section: student.section,
        assessmentType: assignment.assessment_type,
        scores: assignment.scores,
        overallScore: assignment.overall_score,
        subscales: assignment.scores, // Add subscales for compatibility
        atRiskDimensions: assignment.at_risk_dimensions || []
      }, assignment.risk_level);

      console.log(`📝 AI Response received:`, { 
        hasTitle: !!aiResponse?.title, 
        hasText: !!aiResponse?.text,
        titleLength: aiResponse?.title?.length || 0,
        textLength: aiResponse?.text?.length || 0
      });

      if (!aiResponse || !aiResponse.title || !aiResponse.text) {
        console.error('❌ Invalid AI response:', aiResponse);
        throw new Error('AI service failed to generate valid intervention');
      }

      // Get a default counselor ID for AI-generated interventions
      const { data: defaultCounselor } = await supabaseAdmin
        .from('counselors')
        .select('id')
        .limit(1)
        .single();

      if (!defaultCounselor) {
        throw new Error('No counselor found in database for AI intervention assignment');
      }

      // Check if intervention already exists for this student and assessment
      const { data: duplicateIntervention } = await supabaseAdmin
        .from('counselor_interventions')
        .select('id')
        .eq('student_id', student.id)
        .eq('assessment_id', assignment.assignment_id)
        .limit(1)
        .single();

      if (duplicateIntervention) {
        console.log(`⚠️ Intervention already exists for student ${student.first_name} ${student.last_name}, skipping`);
        return;
      }

      // Save intervention to database with pending status
      const { error: insertError } = await supabaseAdmin
        .from('counselor_interventions')
        .insert({
          student_id: student.id,
          assessment_id: assignment.assignment_id, // Use assignment ID from assessment_assignments table
          risk_level: assignment.risk_level,
          intervention_title: aiResponse.title,
          intervention_text: aiResponse.text,
          counselor_message: 'This intervention was automatically generated by our AI system based on your assessment results.',
          counselor_id: defaultCounselor.id, // Use first available counselor
          status: 'pending', // Auto-generated interventions are automatically sent to students
          is_read: false
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log(`✅ AI intervention generated successfully for ${student.name} (ID: ${student.id})`);
    } catch (error) {
      console.error(`❌ Failed to generate intervention for student ${assignment.student_id}:`, error);
      throw error;
    }
  }

  /**
   * Start periodic checks for new students needing interventions
   */
  startPeriodicCheck() {
    console.log('⏰ Starting periodic intervention checks (every 2 minutes)...');
    
    // Check every 2 minutes for new students needing interventions
    setInterval(async () => {
      if (!this.isRunning) {
        console.log('🔄 Running periodic intervention check...');
        await this.generateMissingInterventions();
      } else {
        console.log('⏳ Skipping periodic check - service already running');
      }
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Manually trigger intervention generation
   */
  async triggerGeneration() {
    if (this.isRunning) {
      console.log('⚠️ Auto intervention service is already running');
      return { success: false, message: 'Service already running' };
    }

    this.isRunning = true;
    try {
      await this.generateMissingInterventions();
      return { success: true, message: 'Intervention generation completed' };
    } catch (error) {
      console.error('Error in manual intervention trigger:', error);
      return { success: false, message: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Utility function to add delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      processedStudents: this.processedStudents.size
    };
  }
}

// Create singleton instance
const autoInterventionService = new AutoInterventionService();

module.exports = autoInterventionService;