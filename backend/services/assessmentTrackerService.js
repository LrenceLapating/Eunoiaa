const { supabaseAdmin } = require('../config/database');

class AssessmentTrackerService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Get all incomplete assessments (students with assignments but no ryffscoring records)
   * @param {Object} filters - Optional filters for college, counselor, etc.
   * @param {Object} pagination - Pagination options { page, limit }
   * @returns {Promise<Object>} - List of incomplete assessments with student details
   */
  async getIncompleteAssessments(filters = {}, pagination = {}) {
    try {
      console.log('🔍 Fetching incomplete assessments...');
      
      // Set pagination defaults and limits
      const page = Math.max(1, parseInt(pagination.page) || 1);
      const limit = Math.min(100, Math.max(10, parseInt(pagination.limit) || 20)); // Max 100 records per page
      const offset = (page - 1) * limit;
      
      console.log(`📄 Pagination: page ${page}, limit ${limit}, offset ${offset}`);
      console.log('🔍 Filters:', filters);

      // Build the base query
      let query = supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id,
          student_id,
          bulk_assessment_id,
          status,
          assigned_at,
          expires_at,
          students!inner(
            id,
            name,
            email,
            id_number,
            college,
            course,
            section
          ),
          bulk_assessments!inner(
            id,
            assessment_type,
            counselor_id,
            created_at
          )
        `)
        .eq('status', 'assigned')
        .gt('expires_at', new Date().toISOString());

      // Apply filters if provided
      if (filters.college_id) {
        query = query.eq('students.college', filters.college_id);
      }
      
      if (filters.college) {
        query = query.eq('students.college', filters.college);
      }
      
      if (filters.course) {
        query = query.eq('students.course', filters.course);
      }
      
      if (filters.section) {
        query = query.eq('students.section', filters.section);
      }
      
      if (filters.counselor_id) {
        query = query.eq('bulk_assessments.counselor_id', filters.counselor_id);
      }

      if (filters.assessment_type) {
        query = query.eq('bulk_assessments.assessment_type', filters.assessment_type);
      }
      
      if (filters.search) {
        // Apply search filter to student name, email, or id_number
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,id_number.ilike.%${filters.search}%`);
      }

      // Performance safeguard: Add timeout for long-running queries
      const queryTimeout = setTimeout(() => {
        console.warn('⚠️ Query taking too long, potential performance issue');
      }, 10000); // 10 second warning

      const { data: assignments, error: assignmentError } = await query;
      
      // Clear the timeout since query completed
      clearTimeout(queryTimeout);

      if (assignmentError) {
        console.error('❌ Error fetching assignments:', assignmentError);
        throw new Error('Failed to fetch assessment assignments');
      }

      // Performance safeguard: Check if we're dealing with too much data
      if (assignments && assignments.length > 10000) {
        console.warn(`⚠️ Large dataset detected: ${assignments.length} records. Consider adding more filters.`);
      }

      console.log(`📊 Found ${assignments?.length || 0} assignments to process`);

      if (!assignments || assignments.length === 0) {
        return {
          success: true,
          data: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit: limit,
            hasNextPage: false,
            hasPreviousPage: false
          },
          summary: {
            total_incomplete: 0
          },
          message: 'No active assignments found'
        };
      }

      // Get student IDs who have completed assessments (have ryffscoring records)
      const studentIds = assignments.map(a => a.student_id);
      
      const { data: completedAssessments, error: completedError } = await supabaseAdmin
        .from('ryffscoring')
        .select('student_id, assignment_id')
        .in('student_id', studentIds);

      if (completedError) {
        throw new Error(`Failed to fetch completed assessments: ${completedError.message}`);
      }

      // Create a set of completed student-assignment combinations
      const completedSet = new Set();
      if (completedAssessments) {
        completedAssessments.forEach(comp => {
          completedSet.add(`${comp.student_id}-${comp.assignment_id}`);
        });
      }

      // Filter out completed assessments
      const incompleteAssessments = assignments.filter(assignment => {
        const key = `${assignment.student_id}-${assignment.id}`;
        return !completedSet.has(key);
      });

      // Performance safeguard: Process in batches for large datasets
      const BATCH_SIZE = 1000;
      const enrichedAssessments = [];
      
      for (let i = 0; i < incompleteAssessments.length; i += BATCH_SIZE) {
        const batch = incompleteAssessments.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(incompleteAssessments.length / BATCH_SIZE)}`);
        
        const enrichedBatch = batch.map(assignment => {
          const assignedDate = new Date(assignment.assigned_at);
          const currentDate = new Date();
          const daysPending = Math.floor((currentDate - assignedDate) / (1000 * 60 * 60 * 24));

          // Format assessment type for display
          let assessmentType = 'ryff';
          if (assignment.bulk_assessments.assessment_type === 'ryff_42') {
            assessmentType = '42';
          } else if (assignment.bulk_assessments.assessment_type === 'ryff_84') {
            assessmentType = '84';
          }

          return {
            assignment_id: assignment.id,
            student_id: assignment.student_id,
            student_name: assignment.students.name,
            college: assignment.students.college,
            course: assignment.students.course || 'N/A',
            section: assignment.students.section,
            assessment_title: 'RYFF Psychological Well-being Scale',
            assessment: assessmentType,
            assigned_at: assignment.assigned_at,
            expires_at: assignment.expires_at,
            days_pending: daysPending
          };
        });
        
        enrichedAssessments.push(...enrichedBatch);
        
        // Add small delay between batches to prevent overwhelming the system
        if (i + BATCH_SIZE < incompleteAssessments.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Sort by days pending (most pending first)
      enrichedAssessments.sort((a, b) => b.days_pending - a.days_pending);

      // Apply pagination to the results
      const totalCount = enrichedAssessments.length;
      const paginatedAssessments = enrichedAssessments.slice(offset, offset + limit);
      const totalPages = Math.ceil(totalCount / limit);

      console.log(`✅ Found ${totalCount} incomplete assessments, returning ${paginatedAssessments.length} for page ${page}`);

      return {
        success: true,
        data: paginatedAssessments,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalCount,
          limit: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        summary: {
          total_incomplete: totalCount
        }
      };

    } catch (error) {
      console.error('❌ Error fetching incomplete assessments:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Calculate urgency level based on days until expiry and days since assigned
   * @param {number} daysUntilExpiry - Days until the assessment expires
   * @param {number} daysSinceAssigned - Days since the assessment was assigned
   * @returns {string} - Urgency level: critical, high, medium, low
   */
  calculateUrgencyLevel(daysUntilExpiry, daysSinceAssigned) {
    // Critical: Expires in 1 day or less, or overdue
    if (daysUntilExpiry <= 1) {
      return 'critical';
    }
    
    // High: Expires in 2-3 days or assigned more than 7 days ago
    if (daysUntilExpiry <= 3 || daysSinceAssigned >= 7) {
      return 'high';
    }
    
    // Medium: Expires in 4-7 days or assigned 4-6 days ago
    if (daysUntilExpiry <= 7 || daysSinceAssigned >= 4) {
      return 'medium';
    }
    
    // Low: Everything else
    return 'low';
  }

  /**
   * Get summary statistics for incomplete assessments
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Summary statistics
   */
  async getSummaryStats(filters = {}) {
    try {
      const result = await this.getIncompleteAssessments(filters);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        summary: result.summary,
        total_students: result.data.length
      };

    } catch (error) {
      console.error('❌ Error getting summary stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get incomplete assessments for a specific college
   * @param {string} collegeId - College ID to filter by
   * @returns {Promise<Object>} - Filtered incomplete assessments
   */
  async getIncompleteByCollege(collegeId) {
    return this.getIncompleteAssessments({ college_id: collegeId });
  }

  /**
   * Get incomplete assessments for a specific counselor
   * @param {string} counselorId - Counselor ID to filter by
   * @returns {Promise<Object>} - Filtered incomplete assessments
   */
  async getIncompleteByCounselor(counselorId) {
    return this.getIncompleteAssessments({ counselor_id: counselorId });
  }

  /**
   * Get service status
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      service: 'Assessment Tracker Service',
      version: '1.0.0'
    };
  }
}

// Create singleton instance
const assessmentTrackerService = new AssessmentTrackerService();

module.exports = assessmentTrackerService;