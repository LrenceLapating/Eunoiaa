const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Function to cleanup expired assessments based on semester end dates
async function cleanupExpiredAssessments() {
  try {
    console.log('Starting cleanup of expired assessments...');
    
    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Find all bulk assessments where the semester has ended
    const { data: expiredAssessments, error: fetchError } = await supabase
      .from('bulk_assessments')
      .select(`
        id,
        school_year,
        semester,
        assessment_name,
        created_at
      `)
      .eq('status', 'sent')
      .not('school_year', 'is', null)
      .not('semester', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching bulk assessments for cleanup:', fetchError);
      return { success: false, error: fetchError };
    }
    
    if (!expiredAssessments || expiredAssessments.length === 0) {
      console.log('No assessments found for cleanup check.');
      return { success: true, cleanedCount: 0 };
    }
    
    let cleanedCount = 0;
    
    // Check each assessment against academic settings
    for (const assessment of expiredAssessments) {
      // Find the corresponding semester end date
      const { data: semesterData, error: semesterError } = await supabase
        .from('academic_settings')
        .select('end_date')
        .eq('school_year', assessment.school_year)
        .eq('semester_name', `${assessment.semester} Semester`)
        .single();
      
      if (semesterError) {
        console.log(`No semester data found for ${assessment.school_year} ${assessment.semester} Semester`);
        continue;
      }
      
      // Check if current date is past the semester end date
      if (currentDate > semesterData.end_date) {
        console.log(`Cleaning up expired assessment: ${assessment.assessment_name} (ended: ${semesterData.end_date})`);
        
        // Get all assignment IDs for this bulk assessment
        const { data: assignments, error: assignmentError } = await supabase
          .from('assessment_assignments')
          .select('id')
          .eq('bulk_assessment_id', assessment.id);
        
        if (assignmentError) {
          console.error(`Error fetching assignments for bulk assessment ${assessment.id}:`, assignmentError);
          continue;
        }
        
        // Delete related assessment responses (42-item and 84-item)
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          
          // Delete from assessments_42items
          const { error: delete42Error } = await supabase
            .from('assessments_42items')
            .delete()
            .in('assignment_id', assignmentIds);
          
          if (delete42Error) {
            console.error(`Error deleting 42-item assessments for bulk ${assessment.id}:`, delete42Error);
          }
          
          // Delete from assessments_84items
          const { error: delete84Error } = await supabase
            .from('assessments_84items')
            .delete()
            .in('assignment_id', assignmentIds);
          
          if (delete84Error) {
            console.error(`Error deleting 84-item assessments for bulk ${assessment.id}:`, delete84Error);
          }
        }
        
        // Delete assessment assignments (this will cascade to analytics)
        const { error: deleteAssignmentsError } = await supabase
          .from('assessment_assignments')
          .delete()
          .eq('bulk_assessment_id', assessment.id);
        
        if (deleteAssignmentsError) {
          console.error(`Error deleting assignments for bulk assessment ${assessment.id}:`, deleteAssignmentsError);
          continue;
        }
        
        // Finally, delete the bulk assessment itself
        const { error: deleteBulkError } = await supabase
          .from('bulk_assessments')
          .delete()
          .eq('id', assessment.id);
        
        if (deleteBulkError) {
          console.error(`Error deleting bulk assessment ${assessment.id}:`, deleteBulkError);
          continue;
        }
        
        cleanedCount++;
      }
    }
    
    console.log(`Cleanup completed. Removed ${cleanedCount} expired assessments.`);
    return { success: true, cleanedCount };
    
  } catch (error) {
    console.error('Error during assessment cleanup:', error);
    return { success: false, error };
  }
}

// Create a new bulk assessment
router.post('/create', verifyCounselorSession, async (req, res) => {
  try {
    // Note: Automatic cleanup removed to prevent data deletion during duplicate prevention
    
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

    // Get current academic year and semester from academic settings
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
    
    // Check for existing assessments to merge with
    const { data: existingAssessments, error: duplicateCheckError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_colleges, target_year_levels, target_sections, created_at, school_year, semester, status')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', assessmentType)
      .neq('status', 'cancelled');

    let existingAssessmentToMerge = null;

    if (duplicateCheckError) {
      console.error('Error checking for existing assessments:', duplicateCheckError);
    } else if (existingAssessments && existingAssessments.length > 0) {
      // Look for existing assessments in the current semester that can be merged
      const mergeableAssessments = existingAssessments.filter(assessment => {
        // Check if assessment is from current semester
        const assessmentYear = assessment.school_year || academicYear;
        const assessmentSemester = assessment.semester || semester;
        const isSameSemester = assessmentYear === academicYear && assessmentSemester === semester;
        
        if (!isSameSemester) return false;
        
        // Check for overlapping colleges (we want to merge with existing college assessments)
        const currentColleges = targetColleges || [];
        const existingColleges = assessment.target_colleges || [];
        
        // Check if there's any overlap in colleges - if yes, we can merge
        const hasCollegeOverlap = currentColleges.some(college => existingColleges.includes(college));
        
        return hasCollegeOverlap;
      });

      if (mergeableAssessments.length > 0) {
        // Use the first (oldest) assessment for merging
        existingAssessmentToMerge = mergeableAssessments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
        
        console.log(`Found existing assessment to merge with: ${existingAssessmentToMerge.assessment_name} (ID: ${existingAssessmentToMerge.id})`);
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
        status: scheduleOption === 'now' ? 'sent' : 'pending',
        school_year: academicYear,
        semester: semester
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
      // Check for existing assessments of the SAME assessment type in the SAME semester to prevent duplicates
      const studentIds = targetStudents.map(student => student.id);
      console.log(`🔍 Checking for existing ${assessmentType} assessments in ${academicYear} ${semester} semester for ${studentIds.length} students`);
      
      // First, get bulk assessments that match our criteria
      const { data: matchingBulkAssessments, error: bulkError } = await supabase
        .from('bulk_assessments')
        .select('id')
        .eq('assessment_type', assessmentType)
        .eq('school_year', academicYear)
        .eq('semester', semester);

      if (bulkError) {
        console.error('Error checking bulk assessments:', bulkError);
      }

      let existingStudentIds = new Set();
      
      if (matchingBulkAssessments && matchingBulkAssessments.length > 0) {
        const bulkAssessmentIds = matchingBulkAssessments.map(ba => ba.id);
        
        // Now check for existing assignments for these bulk assessments
        const { data: existingAssignments, error: existingError } = await supabase
          .from('assessment_assignments')
          .select('student_id')
          .in('student_id', studentIds)
          .in('bulk_assessment_id', bulkAssessmentIds);

        if (existingError) {
          console.error('Error checking existing assignments:', existingError);
        } else {
          existingStudentIds = new Set(existingAssignments?.map(a => a.student_id) || []);
          console.log(`📋 Found ${existingAssignments?.length || 0} existing ${assessmentType} assignments in ${academicYear} ${semester} semester to skip`);
        }
      } else {
        console.log(`📋 No existing bulk assessments found for ${assessmentType} in ${academicYear} ${semester} semester`);
      }

      // Filter out students who already have assessments of this type in this semester
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
      
      // If no students were assigned (all were skipped), return an error
      if (studentsToAssign.length === 0 && skippedCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Assessment could not be sent. All ${skippedCount} students already have active or taken the ${assessmentType} assignments in the same semester.`,
          data: {
            bulkAssessment,
            assignedStudents: 0,
            skippedStudents: skippedCount,
            totalTargetStudents: targetStudents.length,
            errorType: 'all_students_skipped'
          }
        });
      }
      
      let responseMessage = `Bulk assessment created successfully. Assigned to ${studentsToAssign.length} students.`;
      if (skippedCount > 0) {
        responseMessage += ` ${skippedCount} students were skipped as they already have active or taken the ${assessmentType} assignments.`;
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
    const { page = 1, limit = 10, assessment_type } = req.query;
    
    console.log(`📊 Fetching assessment history for counselor ${counselorId}, filter: ${assessment_type || 'all'}`);
    
    // Get ALL bulk assessments first (we'll handle filtering after grouping)
    let query = supabase
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId);
    
    const { data: assessments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment history'
      });
    }

    console.log(`📋 Found ${assessments.length} total assessments before filtering`);

    // Get assignment counts for each assessment
    const enrichedAssessments = await Promise.all(assessments.map(async (assessment) => {
      // Get total assigned count
      const { count: totalAssigned } = await supabase
        .from('assessment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('bulk_assessment_id', assessment.id);
      
      // Get completed count
      const { count: totalCompleted } = await supabase
        .from('assessment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('bulk_assessment_id', assessment.id)
        .eq('status', 'completed');
      
      const completionPercentage = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      
      return {
        ...assessment,
        total_assigned: totalAssigned || 0,
        total_completed: totalCompleted || 0,
        completion_percentage: completionPercentage
      };
    }));

    // Group assessments by college and assessment type to merge duplicates
    const groupedAssessments = {};
    
    enrichedAssessments.forEach(assessment => {
      // Create a unique key for each college-assessment type combination
      const colleges = assessment.target_colleges || [];
      const assessmentType = assessment.assessment_type;
      
      colleges.forEach(college => {
        const groupKey = `${college}_${assessmentType}`;
        
        if (!groupedAssessments[groupKey]) {
          // First assessment for this college-type combination
          groupedAssessments[groupKey] = {
            id: assessment.id, // Use the first assessment's ID
            assessment_name: assessment.assessment_name,
            assessment_type: assessment.assessment_type,
            target_type: assessment.target_type,
            target_colleges: [college], // Single college for this group
            custom_message: assessment.custom_message,
            scheduled_date: assessment.scheduled_date,
            status: assessment.status,
            created_at: assessment.created_at, // Use earliest date
            updated_at: assessment.updated_at,
            target_year_levels: assessment.target_year_levels || [],
            target_sections: assessment.target_sections || [],
            school_year: assessment.school_year,
            semester: assessment.semester,
            total_assigned: assessment.total_assigned,
            total_completed: assessment.total_completed,
            completion_percentage: assessment.completion_percentage,
            // Keep track of merged assessments
            merged_assessment_ids: [assessment.id],
            merged_sections: assessment.target_sections || []
          };
        } else {
          // Merge with existing group
          const existing = groupedAssessments[groupKey];
          
          // Merge recipient counts
          existing.total_assigned += assessment.total_assigned;
          existing.total_completed += assessment.total_completed;
          
          // Recalculate completion percentage
          existing.completion_percentage = existing.total_assigned > 0 
            ? Math.round((existing.total_completed / existing.total_assigned) * 100) 
            : 0;
          
          // Use the most recent date
          if (new Date(assessment.created_at) > new Date(existing.created_at)) {
            existing.created_at = assessment.created_at;
            existing.updated_at = assessment.updated_at;
          }
          
          // Merge sections
          const newSections = assessment.target_sections || [];
          existing.merged_sections = [...new Set([...existing.merged_sections, ...newSections])];
          existing.target_sections = existing.merged_sections;
          
          // Keep track of merged assessment IDs
          existing.merged_assessment_ids.push(assessment.id);
        }
      });
    });

    // Convert grouped assessments back to array
    let finalAssessments = Object.values(groupedAssessments);
    
    // Apply assessment type filter AFTER grouping
    if (assessment_type && (assessment_type === 'ryff_42' || assessment_type === 'ryff_84')) {
      finalAssessments = finalAssessments.filter(assessment => 
        assessment.assessment_type === assessment_type
      );
      console.log(`🔍 Filtered to ${finalAssessments.length} assessments of type ${assessment_type}`);
    }
    
    // Sort by date
    finalAssessments = finalAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Apply pagination to the filtered results
    const offset = (page - 1) * limit;
    const paginatedAssessments = finalAssessments.slice(offset, offset + limit);

    console.log(`📄 Returning ${paginatedAssessments.length} assessments (page ${page})`);

    res.json({
      success: true,
      data: paginatedAssessments,
      total: finalAssessments.length,
      page: parseInt(page),
      limit: parseInt(limit)
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

    // Get total assessments created
    const { count: totalAssessments, error: totalError } = await supabase
      .from('bulk_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', counselorId);

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

// Manual cleanup endpoint for expired assessments
router.post('/cleanup-expired', verifyCounselorSession, async (req, res) => {
  try {
    const result = await cleanupExpiredAssessments();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Cleanup completed successfully. Removed ${result.cleanedCount} expired assessments.`,
        cleanedCount: result.cleanedCount
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error during cleanup process',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during cleanup',
      error: error.message
    });
  }
});

module.exports = router;