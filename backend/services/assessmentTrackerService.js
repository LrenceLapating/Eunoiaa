const { supabaseAdmin } = require('../config/database');

class AssessmentTrackerService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Get all incomplete assessments (students with assignments but no ryffscoring records)
   * @param {Object} filters - Optional filters for college, counselor, etc.
   * @returns {Promise<Object>} - List of incomplete assessments with student details
   */
  async getIncompleteAssessments(filters = {}) {
    try {
      console.log('🔍 Fetching incomplete assessments...');
      
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
      
      if (filters.counselor_id) {
        query = query.eq('bulk_assessments.counselor_id', filters.counselor_id);
      }

      const { data: assignments, error: assignmentError } = await query;

      if (assignmentError) {
        throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
      }

      if (!assignments || assignments.length === 0) {
        return {
          success: true,
          data: [],
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

      // Calculate days pending and format data for frontend
      const now = new Date();
      const enrichedAssessments = incompleteAssessments.map(assignment => {
        const assignedDate = new Date(assignment.assigned_at);
        const daysPending = Math.floor((now - assignedDate) / (1000 * 60 * 60 * 24));
        
        // Format assessment type for display
        const assessmentType = assignment.bulk_assessments.assessment_type === 'ryff_42' ? '42' : '84';
        
        return {
          id: assignment.id,
          student_name: assignment.students.name,
          college: assignment.students.college,
          course: assignment.students.course || 'N/A',
          section: assignment.students.section,
          assessment: assessmentType,
          days_pending: daysPending,
          assigned_at: assignment.assigned_at,
          expires_at: assignment.expires_at
        };
      });

      // Sort by days pending (most pending first)
      enrichedAssessments.sort((a, b) => b.days_pending - a.days_pending);

      console.log(`✅ Found ${enrichedAssessments.length} incomplete assessments`);

      return {
        success: true,
        data: enrichedAssessments,
        summary: {
          total_incomplete: enrichedAssessments.length
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