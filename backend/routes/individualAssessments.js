const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Create individual assessment
router.post('/create', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const {
      studentId,
      assessmentName,
      assessmentType,
      customMessage,
      scheduleOption,
      scheduledDate
    } = req.body;

    console.log('📝 Creating individual assessment:', {
      counselorId,
      studentId,
      assessmentName,
      assessmentType,
      scheduleOption
    });

    // Validate required fields
    if (!studentId || !assessmentName || !assessmentType) {
      return res.status(400).json({
        success: false,
        message: 'Student, assessment name, and assessment type are required'
      });
    }

    // Get student details for college information
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, college, year_level, section, id_number')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Error fetching student:', studentError);
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get current academic year and semester from academic settings (same logic as bulk assessments)
    let academicYear, semester;
    
    try {
      // Fetch current academic period from academic settings
      const checkDate = new Date().toISOString().split('T')[0];
      
      // Try to find exact semester match first
      const { data: semesterData, error: semesterError } = await supabase
        .from('academic_settings')
        .select('school_year, semester_name')
        .eq('is_active', true)
        .lte('start_date', checkDate)
        .gte('end_date', checkDate)
        .order('start_date', { ascending: false })
        .limit(1);

      if (semesterError) {
        console.error('Error getting semester data:', semesterError);
        throw semesterError;
      }

      if (semesterData && semesterData.length > 0) {
        // Found exact semester match
        const semester_data = semesterData[0];
        academicYear = semester_data.school_year;
        semester = semester_data.semester_name;
        console.log(`Using academic settings: ${academicYear} ${semester}`);
      } else {
        // No semester found, try to find school year only
        const currentYear = new Date(checkDate).getFullYear();
        const { data: yearData, error: yearError } = await supabase
          .from('academic_settings')
          .select('school_year')
          .eq('is_active', true)
          .or(`school_year.like.${currentYear}-%,school_year.like.%-${currentYear}`)
          .order('start_date', { ascending: false })
          .limit(1);
          
        if (yearError) {
          console.error('Error getting year data:', yearError);
          throw yearError;
        }
        
        if (yearData && yearData.length > 0) {
          academicYear = yearData[0].school_year;
          semester = null;
          console.log(`Using academic settings (year only): ${academicYear}`);
        } else {
          throw new Error('No academic settings found');
        }
      }
    } catch (error) {
      console.error('Error fetching academic settings, falling back to automatic detection:', error);
      
      // Fallback: Determine current academic year and semester automatically
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Academic year logic: June-May cycle
      // June-December = 1st semester, January-May = 2nd semester
      if (currentMonth >= 6) {
        // June-December: 1st semester of current academic year
        academicYear = `${currentYear}-${currentYear + 1}`;
        semester = '1st Semester';
      } else {
        // January-May: 2nd semester of previous academic year
        academicYear = `${currentYear - 1}-${currentYear}`;
        semester = '2nd Semester';
      }
      console.log(`Using fallback academic period: ${academicYear} ${semester}`);
    }

    // Check for duplicate assessment (same student, same assessment type, same semester)
    // This matches the bulk assessment logic - one assessment per type per semester
    const { data: existingAssignments, error: duplicateError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        bulk_assessment:bulk_assessments!inner(id, assessment_name, assessment_type, created_at, school_year, semester)
      `)
      .eq('student_id', studentId)
      .eq('bulk_assessments.assessment_type', assessmentType)
      .eq('bulk_assessments.school_year', academicYear)
      .eq('bulk_assessments.semester', semester);

    if (duplicateError) {
      console.error('Error checking for duplicate assessments:', duplicateError);
    }

    if (existingAssignments && existingAssignments.length > 0) {
      const existingAssessment = existingAssignments[0].bulk_assessment;
      return res.status(409).json({
        success: false,
        message: `This student already has a ${assessmentType} assessment for ${academicYear} ${semester} semester`,
        duplicate: true,
        existingAssessment: {
          id: existingAssessment.id,
          name: existingAssessment.assessment_name,
          type: existingAssessment.assessment_type,
          createdAt: existingAssessment.created_at
        }
      });
    }

    // Determine scheduled date
    let finalScheduledDate;
    if (scheduleOption === 'later' && scheduledDate) {
      finalScheduledDate = new Date(scheduledDate).toISOString();
    } else {
      finalScheduledDate = new Date().toISOString(); // Send now
    }

    // Create individual assessment record
    const { data: individualAssessment, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .insert({
        counselor_id: counselorId,
        assessment_name: assessmentName,
        assessment_type: assessmentType,
        target_type: 'individual',
        target_colleges: [student.college],
        target_year_levels: [student.year_level],
        target_sections: [student.section],
        target_student_id: studentId,
        assessment_source: 'individual',
        custom_message: customMessage,
        scheduled_date: finalScheduledDate,
        status: scheduleOption === 'now' ? 'sent' : 'pending',
        school_year: academicYear,
        semester: semester
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error creating individual assessment:', assessmentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create individual assessment'
      });
    }

    // Create assessment assignment for the student (matching bulk assessment pattern)
    const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now (same as bulk)

    const { error: assignmentError } = await supabase
      .from('assessment_assignments')
      .insert({
        bulk_assessment_id: individualAssessment.id,
        student_id: studentId,
        status: 'assigned', // Changed from 'pending' to match bulk assessments
        assigned_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString()
      });

    if (assignmentError) {
      console.error('Error creating assessment assignment:', assignmentError);
      // Rollback the assessment creation
      await supabase
        .from('bulk_assessments')
        .delete()
        .eq('id', individualAssessment.id);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to assign assessment to student'
      });
    }

    console.log('✅ Individual assessment created successfully:', individualAssessment.id);

    res.status(201).json({
      success: true,
      message: `Assessment "${assessmentName}" sent successfully to ${student.name}`,
      assessment: {
        id: individualAssessment.id,
        name: assessmentName,
        type: assessmentType,
        student: {
          id: student.id,
          name: student.name,
          idNumber: student.id_number,
          college: student.college
        },
        scheduledDate: finalScheduledDate,
        status: individualAssessment.status
      }
    });

  } catch (error) {
    console.error('Error in individual assessment creation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get individual assessment history
router.get('/history', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 10, assessment_type } = req.query;
    
    console.log(`📊 Fetching individual assessment history for counselor ${counselorId}, filter: ${assessment_type || 'all'}`);
    
    // Get individual assessments only
    let query = supabase
      .from('bulk_assessments')
      .select(`
        *,
        students!target_student_id (
          id,
          name,
          id_number,
          college,
          year_level,
          section
        )
      `)
      .eq('counselor_id', counselorId)
      .eq('assessment_source', 'individual')
      .not('target_student_id', 'is', null);

    // Apply assessment type filter if provided
    if (assessment_type && assessment_type !== 'all') {
      query = query.eq('assessment_type', assessment_type);
    }

    const { data: assessments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching individual assessment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch individual assessment history'
      });
    }

    console.log(`📋 Found ${assessments.length} individual assessments before pagination`);

    // Get assignment counts for each assessment
    const enrichedAssessments = await Promise.all(assessments.map(async (assessment) => {
      // Get assignment status
      const { data: assignment } = await supabase
        .from('assessment_assignments')
        .select('status, assigned_at, completed_at')
        .eq('bulk_assessment_id', assessment.id)
        .eq('student_id', assessment.target_student_id)
        .single();

      const totalAssigned = 1;
      const totalCompleted = assignment?.status === 'completed' ? 1 : 0;
      const completionPercentage = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

      return {
        id: assessment.id,
        assessmentName: assessment.assessment_name,
        assessmentType: assessment.assessment_type,
        targetStudent: assessment.students ? {
          id: assessment.students.id,
          name: assessment.students.name,
          idNumber: assessment.students.id_number,
          college: assessment.students.college,
          yearLevel: assessment.students.year_level,
          section: assessment.students.section
        } : null,
        customMessage: assessment.custom_message,
        scheduledDate: assessment.scheduled_date,
        status: assessment.status,
        createdAt: assessment.created_at,
        schoolYear: assessment.school_year,
        semester: assessment.semester,
        assignmentStatus: assignment?.status || 'pending',
        assignedAt: assignment?.assigned_at,
        completedAt: assignment?.completed_at,
        totalAssigned: totalAssigned,
        totalCompleted: totalCompleted,
        recipients: totalAssigned,
        completion: completionPercentage,
        completionText: `${totalCompleted}/${totalAssigned}`
      };
    }));

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedAssessments = enrichedAssessments.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      assessments: paginatedAssessments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(enrichedAssessments.length / limit),
        totalItems: enrichedAssessments.length,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error in individual assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get individual assessment details
router.get('/:id/details', verifyCounselorSession, async (req, res) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.id;

    const { data: assessment, error } = await supabase
      .from('bulk_assessments')
      .select(`
        *,
        students!target_student_id (
          id,
          name,
          id_number,
          email,
          college,
          year_level,
          section
        )
      `)
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('assessment_source', 'individual')
      .single();

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Individual assessment not found'
      });
    }

    // Get assignment details
    const { data: assignment } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', id)
      .eq('student_id', assessment.target_student_id)
      .single();

    res.json({
      success: true,
      assessment: {
        id: assessment.id,
        assessmentName: assessment.assessment_name,
        assessmentType: assessment.assessment_type,
        targetStudent: assessment.students,
        customMessage: assessment.custom_message,
        scheduledDate: assessment.scheduled_date,
        status: assessment.status,
        createdAt: assessment.created_at,
        schoolYear: assessment.school_year,
        semester: assessment.semester,
        assignment: assignment
      }
    });

  } catch (error) {
    console.error('Error fetching individual assessment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel individual assessment
router.patch('/:id/cancel', verifyCounselorSession, async (req, res) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.id;

    // Verify ownership and that it's an individual assessment
    const { data: assessment, error: fetchError } = await supabase
      .from('bulk_assessments')
      .select('id, status, assessment_source')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('assessment_source', 'individual')
      .single();

    if (fetchError || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Individual assessment not found'
      });
    }

    if (assessment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Assessment is already cancelled'
      });
    }

    if (assessment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed assessment'
      });
    }

    // Update assessment status
    const { error: updateError } = await supabase
      .from('bulk_assessments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling individual assessment:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel assessment'
      });
    }

    // Update assignment status
    await supabase
      .from('assessment_assignments')
      .update({ status: 'cancelled' })
      .eq('bulk_assessment_id', id);

    res.json({
      success: true,
      message: 'Individual assessment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling individual assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;