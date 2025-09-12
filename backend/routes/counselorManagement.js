const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// GET /api/counselor-management/profile - Get counselor profile
router.get('/profile', verifyCounselorSession, async (req, res) => {
  try {
    const { data: counselor, error } = await supabase
      .from('counselors')
      .select('id, name, email, college, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false,
        error: 'Counselor not found' 
      });
    }

    res.json({ 
      success: true,
      data: counselor 
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// PATCH /api/counselor-management/profile - Update counselor profile
router.patch('/profile', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { name, college } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (college) updateData.college = college;
    updateData.updated_at = new Date().toISOString();

    const { data: counselor, error } = await supabase
      .from('counselors')
      .update(updateData)
      .eq('id', counselorId)
      .select('id, name, email, college, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      data: counselor,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/counselor-management/deactivate - Deactivate counselor and cleanup data
router.patch('/deactivate', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    
    console.log(`🔄 Starting counselor deactivation process for: ${counselorId}`);
    
    // Start a transaction-like process
    const cleanupResults = {
      counselor_updated: false,
      ryffscoring_cleared: 0,
      counselor_interventions_cleared: 0,
      bulk_assessments_archived: 0
    };

    // 1. Assessment data is preserved in assessments_42items/assessments_84items tables
      console.log('🧹 Checking student data (assessments preserved)...');
    
    // First, get all students assigned to this counselor through bulk assessments
    const { data: counselorStudents, error: studentsError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        student_id,
        bulk_assessment:bulk_assessments!inner(
          counselor_id
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId);
    
    if (studentsError) {
      console.error('Error fetching counselor students:', studentsError);
    } else {
      const studentIds = [...new Set(counselorStudents.map(s => s.student_id))];
      
      // Note: Assessment data is stored in assessments_42items/assessments_84items tables
      // These tables are not cleared during counselor deactivation as they contain
      // permanent student assessment records that may be needed for historical analysis
      if (studentIds.length > 0) {
        console.log(`ℹ️  Found ${studentIds.length} student records (assessment data preserved in assessments tables)`);
        cleanupResults.ryffscoring_cleared = 0; // No longer applicable
      }
    }

    // 2. Clear counselor interventions
    console.log('🧹 Clearing counselor interventions...');
    const { data: counselorInterventions, error: interventionsError } = await supabaseAdmin
      .from('counselor_interventions')
      .delete()
      .eq('counselor_id', counselorId)
      .select('id');
    
    if (interventionsError) {
      console.error('Error clearing counselor interventions:', interventionsError);
    } else {
      cleanupResults.counselor_interventions_cleared = counselorInterventions?.length || 0;
      console.log(`✅ Cleared ${cleanupResults.counselor_interventions_cleared} counselor interventions`);
    }

    // 3. Archive bulk assessments
    console.log('🗄️ Archiving bulk assessments...');
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('counselor_id', counselorId)
      .neq('status', 'archived')
      .select('id');
    
    if (bulkError) {
      console.error('Error archiving bulk assessments:', bulkError);
    } else {
      cleanupResults.bulk_assessments_archived = bulkAssessments?.length || 0;
      console.log(`✅ Archived ${cleanupResults.bulk_assessments_archived} bulk assessments`);
    }

    // 5. Finally, deactivate the counselor
    console.log('👤 Deactivating counselor...');
    const { data: counselor, error: counselorError } = await supabaseAdmin
      .from('counselors')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', counselorId)
      .select('id, name, email, is_active')
      .single();
    
    if (counselorError) {
      console.error('Error deactivating counselor:', counselorError);
      return res.status(500).json({
        success: false,
        error: 'Failed to deactivate counselor',
        details: counselorError.message
      });
    }
    
    cleanupResults.counselor_updated = true;
    console.log(`✅ Counselor ${counselor.name} deactivated successfully`);

    // Log the complete cleanup summary
    console.log('📊 Deactivation Summary:', cleanupResults);

    res.json({
      success: true,
      message: 'Counselor deactivated successfully',
      data: {
        counselor: counselor,
        cleanup_summary: cleanupResults
      }
    });

  } catch (error) {
    console.error('Counselor deactivation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during deactivation',
      details: error.message
    });
  }
});

// PATCH /api/counselor-management/reactivate - Reactivate counselor
router.patch('/reactivate', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    
    console.log(`🔄 Reactivating counselor: ${counselorId}`);

    const { data: counselor, error } = await supabaseAdmin
      .from('counselors')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', counselorId)
      .select('id, name, email, is_active')
      .single();
    
    if (error) {
      console.error('Error reactivating counselor:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reactivate counselor'
      });
    }

    console.log(`✅ Counselor ${counselor.name} reactivated successfully`);

    res.json({
      success: true,
      message: 'Counselor reactivated successfully',
      data: counselor
    });

  } catch (error) {
    console.error('Counselor reactivation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during reactivation'
    });
  }
});

// GET /api/counselor-management/status - Get counselor status
router.get('/status', verifyCounselorSession, async (req, res) => {
  try {
    const { data: counselor, error } = await supabase
      .from('counselors')
      .select('id, name, email, is_active')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false,
        error: 'Counselor not found' 
      });
    }

    res.json({ 
      success: true,
      data: {
        is_active: counselor.is_active,
        status: counselor.is_active ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;