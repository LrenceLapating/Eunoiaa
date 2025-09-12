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
        return res.status(500).json({
          success: false,
          message: 'Failed to get current academic period'
        });
      }
      
      if (yearData && yearData.length > 0) {
        currentPeriod = {
          school_year: yearData[0].school_year,
          semester_name: null,
          assessment_name_format: yearData[0].school_year
        };
      } else {
        // Fallback to current year format
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

    // Start transaction
    const { data: existingSettings, error: fetchError } = await supabase
      .from('academic_settings')
      .select('id')
      .eq('school_year', schoolYear);

    if (fetchError) {
      console.error('Error fetching existing settings:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing settings'
      });
    }

    // Delete existing settings for this school year
    if (existingSettings && existingSettings.length > 0) {
      const { error: deleteError } = await supabase
        .from('academic_settings')
        .delete()
        .eq('school_year', schoolYear);

      if (deleteError) {
        console.error('Error deleting existing settings:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update existing settings'
        });
      }
    }

    // Insert new settings
    const settingsToInsert = semesters.map(semester => ({
      school_year: schoolYear,
      semester_name: semester.name,
      start_date: semester.startDate,
      end_date: semester.endDate,
      created_by: req.user.userId
    }));

    const { data: insertedSettings, error: insertError } = await supabase
      .from('academic_settings')
      .insert(settingsToInsert)
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
      data: insertedSettings
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