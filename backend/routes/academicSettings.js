const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Use the proper counselor authentication middleware
const requireCounselorAuth = verifyCounselorSession;

// GET /api/academic-settings - Get all academic settings
router.get('/', requireCounselorAuth, async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('academic_settings')
      .select('*')
      .eq('is_active', true)
      .order('school_year', { ascending: true })
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching academic settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch academic settings'
      });
    }

    // Group settings by school year
    const groupedSettings = {};
    settings.forEach(setting => {
      if (!groupedSettings[setting.school_year]) {
        groupedSettings[setting.school_year] = {
          schoolYear: setting.school_year,
          semesters: []
        };
      }
      groupedSettings[setting.school_year].semesters.push({
        id: setting.id,
        name: setting.semester_name,
        startDate: setting.start_date,
        endDate: setting.end_date
      });
    });

    const schoolYears = Object.keys(groupedSettings).sort();
    const academicSettings = {
      schoolYears: schoolYears,
      selectedSchoolYear: schoolYears.length > 0 ? schoolYears[schoolYears.length - 1] : '',
      semesters: groupedSettings[schoolYears[schoolYears.length - 1]]?.semesters || []
    };

    res.json({
      success: true,
      data: academicSettings,
      groupedSettings: groupedSettings
    });
  } catch (error) {
    console.error('Error in GET /academic-settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/academic-settings/current - Get current academic period
router.get('/current', async (req, res) => {
  try {
    const checkDate = req.query.date || new Date().toISOString().split('T')[0];
    
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
      return res.status(500).json({
        success: false,
        message: 'Failed to get current academic period'
      });
    }

    let currentPeriod = null;
    
    if (semesterData && semesterData.length > 0) {
      // Found exact semester match
      const semester = semesterData[0];
      currentPeriod = {
        school_year: semester.school_year,
        semester_name: semester.semester_name,
        assessment_name_format: `${semester.school_year} ${semester.semester_name}`
      };
    } else {
      // No semester found for current date, get the most recent active academic setting
      const { data: recentData, error: recentError } = await supabase
        .from('academic_settings')
        .select('school_year, semester_name, start_date')
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1);
        
      if (recentError) {
        console.error('Error getting recent academic data:', recentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to get current academic period'
        });
      }
      
      if (recentData && recentData.length > 0) {
        const recent = recentData[0];
        currentPeriod = {
          school_year: recent.school_year,
          semester_name: recent.semester_name,
          assessment_name_format: recent.semester_name ? 
            `${recent.school_year} ${recent.semester_name}` : 
            recent.school_year
        };
      } else {
        // Final fallback to current year format if no data exists
        const currentYear = new Date(checkDate).getFullYear();
        const fallbackYear = `${currentYear}-${currentYear + 1}`;
        currentPeriod = {
          school_year: fallbackYear,
          semester_name: null,
          assessment_name_format: fallbackYear
        };
      }
    }
    
    res.json({
      success: true,
      data: currentPeriod
    });
  } catch (error) {
    console.error('Error in GET /academic-settings/current:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/academic-settings - Create or update academic settings
router.post('/', requireCounselorAuth, async (req, res) => {
  try {
    const { schoolYear, semesters } = req.body;

    if (!schoolYear || !semesters || !Array.isArray(semesters)) {
      return res.status(400).json({
        success: false,
        message: 'School year and semesters array are required'
      });
    }

    // Validate school year format
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(schoolYear)) {
      return res.status(400).json({
        success: false,
        message: 'School year must be in format YYYY-YYYY'
      });
    }

    // Validate semesters
    for (const semester of semesters) {
      if (!semester.name || !semester.startDate || !semester.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Each semester must have name, startDate, and endDate'
        });
      }

      if (new Date(semester.startDate) >= new Date(semester.endDate)) {
        return res.status(400).json({
          success: false,
          message: `End date must be after start date for ${semester.name}`
        });
      }
    }

    // Delete existing records with the same semester names to ensure global uniqueness
    const semesterNames = semesters.map(semester => semester.name);
    const { error: deleteError } = await supabase
      .from('academic_settings')
      .delete()
      .in('semester_name', semesterNames);

    if (deleteError) {
      console.error('Error deleting existing semester records:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear existing semester records: ' + deleteError.message
      });
    }

    // Prepare all semester records for insertion
    const semesterRecords = semesters.map(semester => ({
      school_year: schoolYear,
      semester_name: semester.name,
      start_date: semester.startDate,
      end_date: semester.endDate,
      created_by: req.user.userId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert all records in a single operation
    const { data: insertedData, error: insertError } = await supabase
      .from('academic_settings')
      .insert(semesterRecords)
      .select();

    if (insertError) {
      console.error('Error inserting academic settings:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save academic settings: ' + insertError.message
      });
    }

    res.json({
      success: true,
      message: 'Academic settings saved successfully',
      data: insertedData
    });
  } catch (error) {
    console.error('Error in POST /academic-settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/academic-settings/school-year - Add new school year
router.post('/school-year', requireCounselorAuth, async (req, res) => {
  try {
    const { schoolYear } = req.body;

    if (!schoolYear) {
      return res.status(400).json({
        success: false,
        message: 'School year is required'
      });
    }

    // Validate school year format
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(schoolYear)) {
      return res.status(400).json({
        success: false,
        message: 'School year must be in format YYYY-YYYY'
      });
    }

    // Check if school year already exists
    const { data: existingYear, error: checkError } = await supabase
      .from('academic_settings')
      .select('school_year')
      .eq('school_year', schoolYear)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing school year:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing school year'
      });
    }

    if (existingYear && existingYear.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'School year already exists'
      });
    }

    // Create default semesters for the new school year
    const startYear = parseInt(schoolYear.split('-')[0]);
    const endYear = parseInt(schoolYear.split('-')[1]);
    
    const defaultSemesters = [
      {
        school_year: schoolYear,
        semester_name: '1st Semester',
        start_date: `${startYear}-08-15`,
        end_date: `${startYear}-12-20`,
        created_by: req.user.userId
      },
      {
        school_year: schoolYear,
        semester_name: '2nd Semester',
        start_date: `${endYear}-01-15`,
        end_date: `${endYear}-05-30`,
        created_by: req.user.userId
      },
      {
        school_year: schoolYear,
        semester_name: 'Summer',
        start_date: `${endYear}-06-01`,
        end_date: `${endYear}-07-31`,
        created_by: req.user.userId
      }
    ];

    const { data: insertedSemesters, error: insertError } = await supabase
      .from('academic_settings')
      .insert(defaultSemesters)
      .select();

    if (insertError) {
      console.error('Error inserting default semesters:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create school year'
      });
    }

    res.json({
      success: true,
      message: 'School year added successfully',
      data: {
        schoolYear: schoolYear,
        semesters: insertedSemesters
      }
    });
  } catch (error) {
    console.error('Error in POST /academic-settings/school-year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/academic-settings/:schoolYear - Delete school year and all its semesters
router.delete('/:schoolYear', requireCounselorAuth, async (req, res) => {
  try {
    const { schoolYear } = req.params;

    // Check if school year exists
    const { data: existingSettings, error: checkError } = await supabase
      .from('academic_settings')
      .select('id')
      .eq('school_year', schoolYear);

    if (checkError) {
      console.error('Error checking school year:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check school year'
      });
    }

    if (!existingSettings || existingSettings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'School year not found'
      });
    }

    // Check if school year is being used in bulk assessments
    const { data: usedInAssessments, error: assessmentCheckError } = await supabase
      .from('bulk_assessments')
      .select('id')
      .eq('school_year', schoolYear)
      .limit(1);

    if (assessmentCheckError) {
      console.error('Error checking assessments:', assessmentCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check if school year is in use'
      });
    }

    if (usedInAssessments && usedInAssessments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete school year that is used in existing assessments'
      });
    }

    // Delete the school year settings
    const { error: deleteError } = await supabase
      .from('academic_settings')
      .delete()
      .eq('school_year', schoolYear);

    if (deleteError) {
      console.error('Error deleting school year:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete school year'
      });
    }

    res.json({
      success: true,
      message: 'School year deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /academic-settings/:schoolYear:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;