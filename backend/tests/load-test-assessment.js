const { supabaseAdmin } = require('../config/database');
const { calculateRyffScores, determineRiskLevel } = require('../utils/ryffScoring');
const { computeAndStoreCollegeScores } = require('../utils/collegeScoring');
require('dotenv').config();

// Test configuration
const CONCURRENT_STUDENTS = 35;
const TEST_TIMEOUT = 60000; // 60 seconds

// Sample assessment data (42-item Ryff)
const sampleAssessmentData = {
  responses: {
    q1: 4, q2: 3, q3: 5, q4: 2, q5: 4, q6: 3, q7: 5, q8: 2, q9: 4, q10: 3,
    q11: 5, q12: 2, q13: 4, q14: 3, q15: 5, q16: 2, q17: 4, q18: 3, q19: 5, q20: 2,
    q21: 4, q22: 3, q23: 5, q24: 2, q25: 4, q26: 3, q27: 5, q28: 2, q29: 4, q30: 3,
    q31: 5, q32: 2, q33: 4, q34: 3, q35: 5, q36: 2, q37: 4, q38: 3, q39: 5, q40: 2,
    q41: 4, q42: 3
  }
};

class LoadTestRunner {
  constructor() {
    this.results = {
      successful: 0,
      failed: 0,
      errors: [],
      responseTimes: [],
      startTime: null,
      endTime: null
    };
  }

  async setupTestData() {
    console.log('🔧 Setting up test data...');
    
    try {
      // Create a test bulk assessment
      const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
        .from('bulk_assessments')
        .insert({
          assessment_name: `Load Test Assessment ${Date.now()}`,
          assessment_type: 'ryff_42',
          counselor_id: 'b7216f8e-57a9-4e10-84aa-e584405fb1f4', // Valid counselor ID
          target_type: 'all',
          target_colleges: [],
          target_year_levels: [1, 2, 3, 4],
          target_sections: [],
          custom_message: 'Load test assessment',
          scheduled_date: new Date().toISOString(),
          status: 'sent'
        })
        .select()
        .single();

      if (bulkError) throw bulkError;
      console.log(`✅ Created bulk assessment: ${bulkAssessment.id}`);

      // Get test students (first 35 students from database)
      const { data: students, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('id, email')
        .limit(CONCURRENT_STUDENTS);

      if (studentsError) throw studentsError;
      
      if (students.length < CONCURRENT_STUDENTS) {
        throw new Error(`Not enough students in database. Found ${students.length}, need ${CONCURRENT_STUDENTS}`);
      }

      // Create assessment assignments for all test students
      const assignments = students.map(student => ({
        bulk_assessment_id: bulkAssessment.id,
        student_id: student.id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      }));

      const { data: createdAssignments, error: assignmentError } = await supabaseAdmin
        .from('assessment_assignments')
        .insert(assignments)
        .select();

      if (assignmentError) throw assignmentError;
      console.log(`✅ Created ${createdAssignments.length} assessment assignments`);

      return {
        bulkAssessmentId: bulkAssessment.id,
        assignments: createdAssignments,
        students: students
      };
    } catch (error) {
      console.error('❌ Test setup failed:', error.message);
      throw error;
    }
  }

  async simulateStudentSubmission(assignmentId, studentId, testIndex) {
    const startTime = Date.now();
    
    try {
      // Get assignment details
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from('assessment_assignments')
        .select('*, bulk_assessments(assessment_type)')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw new Error(`Assignment fetch failed: ${assignmentError.message}`);
      
      // Calculate Ryff scores
      const ryffScores = calculateRyffScores(sampleAssessmentData.responses);
      const riskLevel = determineRiskLevel(ryffScores);
      
      // Prepare assessment record
      const assessmentRecord = {
        student_id: studentId,
        assignment_id: assignmentId,
        assessment_type: 'ryff_42',
        responses: sampleAssessmentData.responses,
        scores: ryffScores,
        overall_score: ryffScores.overallScore || 0,
        risk_level: riskLevel,
        at_risk_dimensions: Object.keys(ryffScores).filter(dim => ryffScores[dim] < 30),
        completed_at: new Date().toISOString()
      };

      // Insert into appropriate assessment table
      const tableName = assignment.bulk_assessments.assessment_type === 'ryff_84' 
        ? 'assessments_84items' 
        : 'assessments_42items';
      
      const { data: assessmentData, error: assessmentInsertError } = await supabaseAdmin
        .from(tableName)
        .insert(assessmentRecord)
        .select()
        .single();

      if (assessmentInsertError) throw new Error(`Assessment insert failed: ${assessmentInsertError.message}`);

      // Update assignment status
      const { error: updateError } = await supabaseAdmin
        .from('assessment_assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (updateError) throw new Error(`Assignment update failed: ${updateError.message}`);

      // Assessment data is stored directly in assessments_42items/assessments_84items tables
      // No additional ryffscoring table insert needed for testing

      const responseTime = Date.now() - startTime;
      this.results.responseTimes.push(responseTime);
      this.results.successful++;
      
      console.log(`✅ Student ${testIndex + 1} submitted successfully (${responseTime}ms)`);
      return { success: true, responseTime, studentIndex: testIndex + 1 };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.failed++;
      this.results.errors.push({
        studentIndex: testIndex + 1,
        error: error.message,
        responseTime
      });
      
      console.log(`❌ Student ${testIndex + 1} failed: ${error.message} (${responseTime}ms)`);
      return { success: false, error: error.message, responseTime, studentIndex: testIndex + 1 };
    }
  }

  async runConcurrentTest(testData) {
    console.log(`\n🚀 Starting concurrent load test with ${CONCURRENT_STUDENTS} students...`);
    this.results.startTime = Date.now();

    // Create promises for all concurrent submissions
    const submissionPromises = testData.assignments.map((assignment, index) => 
      this.simulateStudentSubmission(assignment.id, assignment.student_id, index)
    );

    // Execute all submissions concurrently
    const results = await Promise.allSettled(submissionPromises);
    
    this.results.endTime = Date.now();
    return results;
  }

  generateReport() {
    const totalTime = this.results.endTime - this.results.startTime;
    const avgResponseTime = this.results.responseTimes.length > 0 
      ? this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length 
      : 0;
    const maxResponseTime = Math.max(...this.results.responseTimes, 0);
    const minResponseTime = Math.min(...this.results.responseTimes, 0);
    
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`Total Students: ${CONCURRENT_STUDENTS}`);
    console.log(`Successful Submissions: ${this.results.successful}`);
    console.log(`Failed Submissions: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.successful / CONCURRENT_STUDENTS) * 100).toFixed(2)}%`);
    console.log(`Total Test Duration: ${totalTime}ms`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`  Student ${error.studentIndex}: ${error.error}`);
      });
    }

    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    if (this.results.successful === CONCURRENT_STUDENTS) {
      console.log('✅ EXCELLENT: All submissions successful!');
    } else if (this.results.successful >= CONCURRENT_STUDENTS * 0.9) {
      console.log('✅ GOOD: 90%+ success rate');
    } else if (this.results.successful >= CONCURRENT_STUDENTS * 0.8) {
      console.log('⚠️  ACCEPTABLE: 80%+ success rate, but needs improvement');
    } else {
      console.log('❌ POOR: Less than 80% success rate - system needs optimization');
    }

    if (avgResponseTime < 1000) {
      console.log('✅ EXCELLENT: Average response time under 1 second');
    } else if (avgResponseTime < 3000) {
      console.log('✅ GOOD: Average response time under 3 seconds');
    } else if (avgResponseTime < 5000) {
      console.log('⚠️  ACCEPTABLE: Average response time under 5 seconds');
    } else {
      console.log('❌ POOR: Average response time over 5 seconds');
    }

    return {
      totalStudents: CONCURRENT_STUDENTS,
      successful: this.results.successful,
      failed: this.results.failed,
      successRate: (this.results.successful / CONCURRENT_STUDENTS) * 100,
      totalTime,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      errors: this.results.errors
    };
  }

  async cleanup(bulkAssessmentId) {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Assessment data cleanup is handled by the assessments_42items/assessments_84items table deletions
      // No separate ryffscoring cleanup needed

      // Delete assessment results from both tables
      await supabaseAdmin
        .from('assessments_42items')
        .delete()
        .eq('bulk_assessment_id', bulkAssessmentId);

      await supabaseAdmin
        .from('assessments_84items')
        .delete()
        .eq('bulk_assessment_id', bulkAssessmentId);

      // Delete assessment assignments
      await supabaseAdmin
        .from('assessment_assignments')
        .delete()
        .eq('bulk_assessment_id', bulkAssessmentId);

      // Delete bulk assessment
      await supabaseAdmin
        .from('bulk_assessments')
        .delete()
        .eq('id', bulkAssessmentId);

      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error.message);
    }
  }
}

// Main test execution
async function runLoadTest() {
  const testRunner = new LoadTestRunner();
  let testData = null;

  try {
    // Setup test data
    testData = await testRunner.setupTestData();
    
    // Run concurrent test
    await testRunner.runConcurrentTest(testData);
    
    // Generate and display report
    const report = testRunner.generateReport();
    
    return report;
  } catch (error) {
    console.error('\n💥 Load test failed:', error.message);
    throw error;
  } finally {
    // Cleanup test data
    if (testData) {
      await testRunner.cleanup(testData.bulkAssessmentId);
    }
  }
}

// Export for use in other scripts
module.exports = { LoadTestRunner, runLoadTest };

// Run test if called directly
if (require.main === module) {
  runLoadTest()
    .then(report => {
      console.log('\n🎉 Load test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Load test failed:', error.message);
      process.exit(1);
    });
}