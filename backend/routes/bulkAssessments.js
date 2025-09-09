const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Create a new bulk assessment
router.post('/create', verifyCounselorSession, async (req, res) => {
  try {
    const {
      assessmentName,
      assessmentType, // 'ryff_42' or 'ryff_84'
      targetType, // 'specific_students', 'college', 'all_students'
      targetColleges,
      targetYearLevels, // Array of year levels [1, 2, 3, 4]
      targetSections, // Array of sections ['BSCS-3A', 'BSIT-2B']
      specificStudents,
      customMessage,
      scheduleOption, // 'now' or 'scheduled'
      scheduledDate
    } = req.body;

    const counselorId = req.user.id;

    // Validate required fields
    if (!assessmentName || !assessmentType || !targetType) {
      return res.status(400).json({
        success: false,
        message: 'Assessment name, type, and target type are required'
      });
    }

    // Check for duplicate bulk assessments (prevent rapid clicking duplicates)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAssessments, error: duplicateCheckError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_colleges, target_year_levels, target_sections')
      .eq('counselor_id', counselorId)
      .eq('assessment_name', assessmentName)
      .eq('assessment_type', assessmentType)
      .gte('created_at', fiveMinutesAgo)
      .neq('status', 'cancelled');

    if (duplicateCheckError) {
      console.error('Error checking for duplicates:', duplicateCheckError);
    } else if (recentAssessments && recentAssessments.length > 0) {
      // Check if any recent assessment has the same target parameters
      const isDuplicate = recentAssessments.some(assessment => {
        const sameColleges = JSON.stringify(assessment.target_colleges?.sort()) === JSON.stringify(targetColleges?.sort());
        const sameYearLevels = JSON.stringify(assessment.target_year_levels?.sort()) === JSON.stringify(targetYearLevels?.sort());
        const sameSections = JSON.stringify(assessment.target_sections?.sort()) === JSON.stringify(targetSections?.sort());
        return sameColleges && sameYearLevels && sameSections;
      });

      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'A similar assessment was recently created. Please wait a few minutes before creating another identical assessment.'
        });
      }
    }

    // Determine scheduled date
    let finalScheduledDate = null;
    if (scheduleOption === 'scheduled' && scheduledDate) {
      finalScheduledDate = new Date(scheduledDate).toISOString();
    } else {
      finalScheduledDate = new Date().toISOString(); // Send now
    }

    // Create bulk assessment record
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .insert({
        counselor_id: counselorId,
        assessment_name: assessmentName,
        assessment_type: assessmentType,
        target_type: targetType,
        target_colleges: targetColleges || [],
        target_year_levels: targetYearLevels || [],
        target_sections: targetSections || [],
        custom_message: customMessage,
        scheduled_date: finalScheduledDate,
        status: scheduleOption === 'now' ? 'sent' : 'pending'
      })
      .select()
      .single();

    if (bulkError) {
      console.error('Error creating bulk assessment:', bulkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create bulk assessment'
      });
    }

    // Get target students based on target type
    let targetStudents = [];
    
    if (targetType === 'specific_students' && specificStudents) {
      // Get specific students by IDs
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email, college')
        .in('id', specificStudents)
        .eq('status', 'active');
      
      if (!studentsError) {
        targetStudents = students;
      }
    } else if (targetType === 'college' && targetColleges && targetColleges.length > 0) {
      // Get students from specific colleges with optional year level and section filters
      let query = supabase
        .from('students')
        .select('id, name, email, college, year_level, section')
        .in('college', targetColleges)
        .eq('status', 'active');
      
      // Apply year level filter if specified
      if (targetYearLevels && targetYearLevels.length > 0) {
        query = query.in('year_level', targetYearLevels);
      }
      
      // Apply section filter if specified
      if (targetSections && targetSections.length > 0) {
        query = query.in('section', targetSections);
      }
      
      const { data: students, error: studentsError } = await query;
      
      if (!studentsError) {
        targetStudents = students;
      }
    } else if (targetType === 'all_students') {
      // Get all active students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email, college')
        .eq('status', 'active');
      
      if (!studentsError) {
        targetStudents = students;
      }
    }

    // Create assessment assignments for target students
    if (targetStudents.length > 0) {
      // Check for existing active assignments to prevent duplicates
      const studentIds = targetStudents.map(student => student.id);
      const { data: existingAssignments, error: existingError } = await supabase
        .from('assessment_assignments')
        .select('student_id')
        .in('student_id', studentIds)
        .in('status', ['assigned', 'in_progress'])
        .gte('expires_at', new Date().toISOString());

      if (existingError) {
        console.error('Error checking existing assignments:', existingError);
      }

      // Filter out students who already have active assignments
      const existingStudentIds = new Set(existingAssignments?.map(a => a.student_id) || []);
      const studentsToAssign = targetStudents.filter(student => !existingStudentIds.has(student.id));

      if (studentsToAssign.length > 0) {
        const assignments = studentsToAssign.map(student => ({
          bulk_assessment_id: bulkAssessment.id,
          student_id: student.id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }));

        const { error: assignmentError } = await supabase
          .from('assessment_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.error('Error creating assignments:', assignmentError);
          // Don't fail the whole operation, just log the error
        }
      }

      // Update response message to reflect actual assignments created
      const skippedCount = targetStudents.length - studentsToAssign.length;
      let responseMessage = `Bulk assessment created successfully. Assigned to ${studentsToAssign.length} students.`;
      if (skippedCount > 0) {
        responseMessage += ` ${skippedCount} students were skipped as they already have active assignments.`;
      }

      res.json({
        success: true,
        message: responseMessage,
        data: {
          bulkAssessment,
          assignedStudents: studentsToAssign.length,
          skippedStudents: skippedCount,
          totalTargetStudents: targetStudents.length
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Bulk assessment created successfully, but no students matched the criteria.',
        data: {
          bulkAssessment,
          assignedStudents: 0,
          skippedStudents: 0,
          totalTargetStudents: 0
        }
      });
    }

  } catch (error) {
    console.error('Error in bulk assessment creation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get bulk assessment history for counselor
router.get('/history', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;

    // Get bulk assessments with assignment counts (exclude archived)
    const { data: assessments, error } = await supabase
      .from('bulk_assessments')
      .select(`
        *,
        assignment_count:assessment_assignments(count),
        completed_count:assessment_assignments(count).eq(status, 'completed')
      `)
      .eq('counselor_id', counselorId)
      .neq('status', 'archived')  // Exclude archived assessments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching assessment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment history'
      });
    }

    // Calculate completion percentages
    const enrichedAssessments = assessments.map(assessment => {
      const totalAssigned = assessment.assignment_count?.[0]?.count || 0;
      const totalCompleted = assessment.completed_count?.[0]?.count || 0;
      const completionPercentage = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      
      return {
        ...assessment,
        total_assigned: totalAssigned,
        total_completed: totalCompleted,
        completion_percentage: completionPercentage
      };
    });

    res.json({
      success: true,
      data: enrichedAssessments
    });

  } catch (error) {
    console.error('Error in assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed information about a specific bulk assessment
router.get('/:id/details', verifyCounselorSession, async (req, res) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.id;

    // Get bulk assessment details (exclude archived)
    const { data: assessment, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .neq('status', 'archived')  // Exclude archived assessments
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get assignment details with student information (only active students)
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        student:students!inner(
          id,
          name,
          email,
          college,
          section
        )
      `)
      .eq('bulk_assessment_id', id)
      .eq('student.status', 'active');  // Only include active students

    if (assignmentError) {
      console.error('Error fetching assignment details:', assignmentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment details'
      });
    }

    res.json({
      success: true,
      data: {
        assessment,
        assignments
      }
    });

  } catch (error) {
    console.error('Error in assessment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel a pending bulk assessment
router.patch('/:id/cancel', verifyCounselorSession, async (req, res) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.id;

    // Update assessment status to cancelled
    const { data, error } = await supabase
      .from('bulk_assessments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('status', 'pending') // Only allow cancelling pending assessments
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this assessment. It may have already been sent or completed.'
      });
    }

    res.json({
      success: true,
      message: 'Assessment cancelled successfully',
      data
    });

  } catch (error) {
    console.error('Error cancelling assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dashboard statistics
router.get('/stats', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;

    // Get total assessments created (exclude archived)
    const { count: totalAssessments, error: totalError } = await supabase
      .from('bulk_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', counselorId)
      .neq('status', 'archived');  // Exclude archived assessments

    // Get pending assessments
    const { count: pendingAssessments, error: pendingError } = await supabase
      .from('bulk_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', counselorId)
      .eq('status', 'pending');

    // Get total assignments
    const { count: totalAssignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('*, bulk_assessments!inner(counselor_id)', { count: 'exact', head: true })
      .eq('bulk_assessments.counselor_id', counselorId);

    // Get completed assignments
    const { count: completedAssignments, error: completedError } = await supabase
      .from('assessment_assignments')
      .select('*, bulk_assessments!inner(counselor_id)', { count: 'exact', head: true })
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('status', 'completed');

    if (totalError || pendingError || assignmentError || completedError) {
      console.error('Error fetching stats:', { totalError, pendingError, assignmentError, completedError });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }

    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalAssessments: totalAssessments || 0,
        pendingAssessments: pendingAssessments || 0,
        totalAssignments: totalAssignments || 0,
        completedAssignments: completedAssignments || 0,
        completionRate
      }
    });

  } catch (error) {
    console.error('Error in stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unique assessment names for dropdown filtered by college and assessment type
router.get('/assessment-names', verifyCounselorSession, async (req, res) => {
  try {
    const { college_id, assessment_type } = req.query;

    // Build query with filters
    let query = supabase
      .from('bulk_assessments')
      .select('assessment_name, target_colleges, assessment_type')
      .neq('status', 'archived')
      .not('assessment_name', 'is', null);

    // Filter by assessment type if provided
    if (assessment_type) {
      query = query.eq('assessment_type', assessment_type);
    }

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Error fetching assessment names:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment names'
      });
    }

    // Filter by college if provided
    let filteredAssessments = assessments;
    if (college_id) {
      // Create a mapping between full college names and their codes
      const collegeMapping = {
        'College of Computer Studies': ['CCS', 'College of Computer Studies'],
        'College of Engineering': ['COE', 'College of Engineering'],
        'College of Nursing': ['NS', 'College of Nursing', 'Nursing College'],
        'Business Administration': ['BS', 'Business Administration'],
        'GGG': ['GGG'],
        'GGE': ['GGE'],
        'HAAs': ['HAAs'],
        'KUPAL': ['KUPAL'],
        'DDS': ['DDS'],
        'CCC': ['CCC']
      };

      // Get all possible college identifiers for the given college_id
      let possibleCollegeIds = [college_id];
      
      // Check if college_id matches any full name and add corresponding codes
      for (const [fullName, codes] of Object.entries(collegeMapping)) {
        if (fullName === college_id || codes.includes(college_id)) {
          possibleCollegeIds = [...possibleCollegeIds, ...codes];
          break;
        }
      }
      
      // Remove duplicates
      possibleCollegeIds = [...new Set(possibleCollegeIds)];
      
      console.log(`Filtering assessments for college_id: ${college_id}, possible IDs: ${JSON.stringify(possibleCollegeIds)}`);

      filteredAssessments = assessments.filter(assessment => {
        // target_colleges can be a string with comma-separated values or an array
        const targetColleges = typeof assessment.target_colleges === 'string' 
          ? assessment.target_colleges.split(',').map(c => c.trim())
          : assessment.target_colleges || [];
        
        // Check if any of the possible college IDs match the target colleges
        return possibleCollegeIds.some(id => targetColleges.includes(id));
      });
    }

    // Extract unique assessment names and sort them
    const uniqueNames = [...new Set(filteredAssessments.map(a => a.assessment_name))]
      .filter(name => name && name.trim() !== '')
      .sort();

    console.log(`Found ${uniqueNames.length} assessment names for college_id: ${college_id}`);
    console.log('Assessment names:', uniqueNames);

    res.json({
      success: true,
      data: uniqueNames
    });

  } catch (error) {
    console.error('Error in assessment names endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sections for a specific assessment and college
router.get('/sections', verifyCounselorSession, async (req, res) => {
  try {
    const { college_name, assessment_name, assessment_type } = req.query;

    if (!college_name || !assessment_name) {
      return res.status(400).json({
        success: false,
        message: 'College name and assessment name are required'
      });
    }

    console.log(`\n🔍 SECTIONS ENDPOINT CALLED!`);
    console.log(`Fetching sections for college: ${college_name}, assessment: ${assessment_name}, type: ${assessment_type}`);
    console.log(`Request query params:`, req.query);

    // Query the database to get actual sections that received this specific assessment
    // First get the bulk assessment
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('id')
      .eq('assessment_name', assessment_name)
      .neq('status', 'archived')
      .single();

    if (assessmentError || !assessmentData) {
      console.error('Error fetching assessment or assessment not found:', assessmentError);
      // Fallback to mock sections if assessment not found
      let sections = [];
      
      if (college_name.toLowerCase().includes('computer') || college_name.toLowerCase().includes('ccs')) {
        sections = ['BSIT-4A', 'BSIT-4B', 'BSCS-4A', 'BSCS-4B', 'BSIS-4A'];
      } else if (college_name.toLowerCase().includes('engineering') || college_name.toLowerCase().includes('coe')) {
        sections = ['BSCE-4A', 'BSCE-4B', 'BSEE-4A', 'BSME-4A'];
      } else if (college_name.toLowerCase().includes('nursing') || college_name.toLowerCase().includes('ns')) {
        sections = ['BSN-4A', 'BSN-4B', 'BSN-4C'];
      } else if (college_name.toLowerCase().includes('business') || college_name.toLowerCase().includes('bs')) {
        sections = ['BSBA-4A', 'BSBA-4B', 'BSA-4A'];
      } else {
        sections = ['Section A', 'Section B', 'Section C'];
      }
      
      console.log('Using fallback sections:', sections);
      return res.json({
        success: true,
        data: sections
      });
    }

    // Get assignment data for this assessment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('student_id')
      .eq('bulk_assessment_id', assessmentData.id);

    if (assignmentError || !assignmentData || assignmentData.length === 0) {
      console.error('Error fetching assignments or no assignments found:', assignmentError);
      return res.json({
        success: true,
        data: []
      });
    }

    // Get student details for these assignments, filtered by college
    const studentIds = assignmentData.map(a => a.student_id);
    
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('section, college')
      .in('id', studentIds)
      .eq('college', college_name);

    if (studentError) {
      console.error('Error fetching student data:', studentError);
      return res.json({
        success: true,
        data: []
      });
    }

    // Extract unique sections
    const uniqueSections = new Set();
    
    if (studentData && studentData.length > 0) {
      studentData.forEach(student => {
        if (student.section) {
          uniqueSections.add(student.section);
        }
      });
    }

    const sections = Array.from(uniqueSections).sort();
    
    console.log(`Found ${sections.length} unique sections for assessment '${assessment_name}' in college '${college_name}':`, sections);
    console.log(`🚀 RETURNING SECTIONS TO FRONTEND:`, sections);
    console.log(`📤 Full response:`, { success: true, data: sections });

    res.json({
      success: true,
      data: sections
    });

  } catch (error) {
    console.error('Error in sections endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;