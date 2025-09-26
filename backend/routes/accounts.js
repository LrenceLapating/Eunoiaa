const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { supabase, supabaseAdmin } = require('../config/database');
const { validateStudentData, sanitizeStudentData } = require('../utils/validation');
const { computeAndStoreCollegeScores, getCollegeScores } = require('../utils/collegeScoring');
const { archiveCollegeScores } = require('../utils/archiveCollegeScores');
const { verifyStudentSession } = require('../middleware/sessionManager');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.endsWith('.xlsx') ? '.xlsx' : '.csv';
    cb(null, `students-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const isCSV = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');
    const isXLSX = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.endsWith('.xlsx');
    
    if (isCSV || isXLSX) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and XLSX files are allowed'), false);
    }
  }
});

// GET /api/accounts/colleges - Get all colleges with student counts (active students only)
router.get('/colleges', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('college')
      .eq('status', 'active')
      .not('college', 'is', null);

    if (error) throw error;

    // College code to full name mapping
    const collegeMapping = {
      'CCS': 'College of Computing and Information Sciences',
      'CABE': 'College of Architecture and Built Environment',
      'CEA': 'College of Engineering and Architecture',
      'CN': 'College of Nursing'
    };

    // Count students by college
    const collegeStats = data.reduce((acc, student) => {
      const college = student.college;
      acc[college] = (acc[college] || 0) + 1;
      return acc;
    }, {});

    const colleges = Object.entries(collegeStats).map(([code, totalUsers]) => ({
      name: code, // Use college code (abbreviation) for display
      code: code, // Keep the original code for backend operations
      fullName: collegeMapping[code] || code, // Keep full name for reference if needed
      totalUsers
    }));

    res.json({ colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// GET /api/accounts/colleges/:collegeName/sections - Get sections data for a specific college (active students only)
// GET /api/accounts/colleges/:collegeName/assessment-filters - Get dynamic year levels and sections based on bulk assessments
router.get('/colleges/:collegeName/assessment-filters', async (req, res) => {
  try {
    const { collegeName } = req.params;
    const { assessmentType, assessmentName, course } = req.query; // 'ryff_42' or 'ryff_84' or 'all', specific assessment name, and course filter
    
    // Get bulk assessments for this college and assessment type with their target year levels and sections
    let assessmentQuery = supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .neq('status', 'archived');
    
    // Filter by assessment type if specified
    if (assessmentType && assessmentType !== 'all') {
      assessmentQuery = assessmentQuery.eq('assessment_type', assessmentType);
    }
    
    // Filter by specific assessment name if specified
    if (assessmentName) {
      assessmentQuery = assessmentQuery.eq('assessment_name', assessmentName);
    }
    
    const { data: bulkAssessments, error: assessmentError } = await assessmentQuery;
    
    if (assessmentError) throw assessmentError;
    
    // Debug logging
    console.log('🔍 Assessment Filters Debug:');
    console.log(`   College: ${collegeName}`);
    console.log(`   Assessment Type: ${assessmentType}`);
    console.log(`   Assessment Name: ${assessmentName}`);
    console.log(`   Found ${bulkAssessments ? bulkAssessments.length : 0} assessments`);
    if (bulkAssessments) {
      bulkAssessments.forEach((assessment, index) => {
        console.log(`     ${index + 1}. "${assessment.assessment_name}"`);
        console.log(`        Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
        console.log(`        Sections: ${JSON.stringify(assessment.target_sections)}`);
      });
    }
    
    // If no assessments found, return empty arrays
    if (!bulkAssessments || bulkAssessments.length === 0) {
      return res.json({
        success: true,
        data: {
          yearLevels: [],
          sections: [],
          totalAssessments: 0
        }
      });
    }
    
    // Get available courses - FIXED to match year/section logic
    // Only show courses from students who received assessments (like year levels and sections)
    const coursesSet = new Set();
    
    // Get students who received assessments through assessment_assignments
    const bulkAssessmentIds = bulkAssessments.map(ba => ba.id);
    
    const { data: assignedStudents, error: assignedStudentsError } = await supabase
      .from('assessment_assignments')
      .select(`
        student_id,
        students!inner(course)
      `)
      .in('bulk_assessment_id', bulkAssessmentIds)
      .not('students.course', 'is', null);

    if (assignedStudentsError) {
      console.error('Error fetching assigned students for courses:', assignedStudentsError);
      throw assignedStudentsError;
    }

    // Extract unique courses from students who received assessments
    assignedStudents.forEach(assignment => {
      const course = assignment.students?.course;
      if (course && course.trim() !== '') {
        coursesSet.add(course);
      }
    });
    
    const availableCourses = Array.from(coursesSet).sort();
    
    console.log('🔍 COURSE DEBUG: Available courses for college =', availableCourses);

    // Extract unique year levels and sections from all bulk assessments
    const yearLevelsSet = new Set();
    const sectionsSet = new Set();
    
    // If course filter is applied, filter assessments by students in that course
    let filteredAssessments = bulkAssessments;
    if (course && course !== 'All Courses') {
      // Get students in the selected course
      const { data: courseStudents, error: courseStudentsError } = await supabase
        .from('students')
        .select('id, year_level, section')
        .eq('college', collegeName)
        .eq('course', course);

      if (courseStudentsError) {
        console.error('Error fetching course students:', courseStudentsError);
        throw courseStudentsError;
      }

      // Get year levels and sections from students in this course
      courseStudents.forEach(student => {
        if (student.year_level !== null && student.year_level !== undefined) {
          yearLevelsSet.add(student.year_level);
        }
        if (student.section && student.section.trim() !== '') {
          sectionsSet.add(student.section);
        }
      });
    } else {
      // No course filter, use all assessments
      bulkAssessments.forEach(assessment => {
        // Add target year levels from this assessment
        if (assessment.target_year_levels && Array.isArray(assessment.target_year_levels)) {
          assessment.target_year_levels.forEach(year => {
            if (year !== null && year !== undefined) {
              yearLevelsSet.add(year);
            }
          });
        }
        
        // Add target sections from this assessment
        if (assessment.target_sections && Array.isArray(assessment.target_sections)) {
          assessment.target_sections.forEach(section => {
            if (section && section.trim() !== '') {
              sectionsSet.add(section);
            }
          });
        }
      });
    }
    
    // Convert to sorted arrays
    const availableYearLevels = Array.from(yearLevelsSet).sort((a, b) => a - b);
    const availableSections = Array.from(sectionsSet).sort();
    
    // Debug logging for final results
    console.log('📊 Final Results:');
    console.log(`   Courses: ${JSON.stringify(availableCourses)}`);
    console.log(`   Year Levels: ${JSON.stringify(availableYearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(availableSections)}`);
    console.log(`   Total Assessments: ${bulkAssessments.length}`);
    console.log(`   Course Filter Applied: ${course || 'None'}`);
    console.log('');
    
    console.log('🔍 COURSE DEBUG: About to send response with availableCourses =', availableCourses);
    
    const responseData = {
      success: true,
      data: {
        courses: availableCourses,
        yearLevels: availableYearLevels,
        sections: availableSections,
        totalAssessments: bulkAssessments.length
      }
    };
    
    console.log('🔍 COURSE DEBUG: Full response data =', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching assessment filters:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch assessment filters' 
    });
  }
});

router.get('/colleges/:collegeName/sections', async (req, res) => {
  try {
    const { collegeName } = req.params;
    
    // Get all active students for the specified college
    const { data, error } = await supabase
      .from('students')
      .select('section, year_level')
      .eq('college', collegeName)
      .eq('status', 'active')
      .not('section', 'is', null)
      .not('year_level', 'is', null);

    if (error) throw error;

    // Group students by year level and section
    const yearData = {};
    const sectionCounts = {};
    
    data.forEach(student => {
      const yearLevel = student.year_level;
      const section = student.section;
      
      if (!yearData[yearLevel]) {
        yearData[yearLevel] = new Set();
      }
      yearData[yearLevel].add(section);
      
      const sectionKey = `${yearLevel}-${section}`;
      sectionCounts[sectionKey] = (sectionCounts[sectionKey] || 0) + 1;
    });

    // Calculate year counts
    const yearCounts = {
      first: yearData['1st'] ? yearData['1st'].size : 0,
      second: yearData['2nd'] ? yearData['2nd'].size : 0,
      third: yearData['3rd'] ? yearData['3rd'].size : 0,
      fourth: yearData['4th'] ? yearData['4th'].size : 0
    };

    const totalSections = Object.values(yearCounts).reduce((sum, count) => sum + count, 0);
    const totalStudents = data.length;

    // Create programs structure for CollegeFilter component
    const programsMap = new Map();
    
    Object.keys(yearData).forEach(yearLevel => {
      const sections = Array.from(yearData[yearLevel]);
      
      sections.forEach(sectionName => {
        // Extract program name from section (e.g., 'BSIT-4A' -> 'BSIT')
        const programName = sectionName.split('-')[0];
        const year = parseInt(yearLevel.charAt(0));
        const sectionKey = `${yearLevel}-${sectionName}`;
        
        if (!programsMap.has(programName)) {
          programsMap.set(programName, new Map());
        }
        
        if (!programsMap.get(programName).has(year)) {
          programsMap.get(programName).set(year, []);
        }
        
        programsMap.get(programName).get(year).push({
          id: `${collegeName.toLowerCase().replace(/\s+/g, '-')}-${sectionName.toLowerCase()}`,
          name: sectionName,
          studentCount: sectionCounts[sectionKey] || 0
        });
      });
    });
    
    // Convert to array format expected by frontend
    const programs = [];
    programsMap.forEach((yearLevels, programName) => {
      const yearLevelArray = [];
      yearLevels.forEach((sections, year) => {
        yearLevelArray.push({
          year: year,
          sections: sections
        });
      });
      
      programs.push({
        name: programName,
        yearLevels: yearLevelArray
      });
    });

    res.json({
      yearCounts,
      totalSections,
      totalStudents,
      programs
    });
  } catch (error) {
    console.error('Error fetching college sections:', error);
    res.status(500).json({ error: 'Failed to fetch college sections' });
  }
});

// GET /api/accounts/history - Get students with historical assessment data
router.get('/history', async (req, res) => {
  try {
    const { 
      college, 
      semester,
      page = 1, 
      limit = 50, 
      search = '' 
    } = req.query;

    console.log('Fetching historical students with params:', { college, semester, page, limit, search });

    // Get unique student IDs from ryff_history table
    let historyQuery = supabase
      .from('ryff_history')
      .select('student_id, archived_at')
      .order('archived_at', { ascending: false });

    const { data: historyData, error: historyError } = await historyQuery;

    if (historyError) {
      console.error('Error fetching from ryff_history:', historyError);
      throw historyError;
    }

    if (!historyData || historyData.length === 0) {
      return res.json({
        students: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // Get unique student IDs
    const uniqueStudentIds = [...new Set(historyData.map(item => item.student_id))];
    console.log(`Found ${uniqueStudentIds.length} unique students with historical data`);

    if (uniqueStudentIds.length === 0) {
      return res.json({
        students: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // Get student details for these IDs
    let studentsQuery = supabase
      .from('students')
      .select('*')
      .in('id', uniqueStudentIds);

    // Apply filters
    if (college && college !== 'all') {
      studentsQuery = studentsQuery.eq('college', college);
    }

    if (semester) {
      studentsQuery = studentsQuery.eq('semester', semester);
    }

    if (search) {
      studentsQuery = studentsQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,id_number.ilike.%${search}%`);
    }

    const { data: studentsData, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw studentsError;
    }

    // Add archived_at information to students
    const studentsWithHistory = (studentsData || []).map(student => {
      const studentHistory = historyData.filter(h => h.student_id === student.id);
      const latestArchived = studentHistory.reduce((latest, current) => {
        return new Date(current.archived_at) > new Date(latest.archived_at) ? current : latest;
      }, studentHistory[0]);

      return {
        ...student,
        archived_at: latestArchived?.archived_at,
        isHistorical: true
      };
    });

    // Apply pagination
    const total = studentsWithHistory.length;
    const offset = (page - 1) * limit;
    const paginatedStudents = studentsWithHistory.slice(offset, offset + limit);

    console.log(`Returning ${paginatedStudents.length} historical students out of ${total} total`);

    res.json({
      students: paginatedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch student history' });
  }
});

// GET /api/accounts/students - Get active students with filtering and pagination
router.get('/students', async (req, res) => {
  try {
    const { college, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Filter by college
    if (college && college !== 'all') {
      query = query.eq('college', college);
    }

    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,id_number.ilike.%${search}%,section.ilike.%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      students: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/accounts/deactivate-students - Deactivate all active students
router.post('/deactivate-students', async (req, res) => {
  try {
    // First, deactivate all students and move their assessments to history
    const { data, error } = await supabaseAdmin
      .rpc('deactivate_all_students');

    if (error) {
      console.error('Error deactivating students:', error);
      return res.status(500).json({ error: 'Failed to deactivate students' });
    }

    console.log('✅ Students deactivated successfully:', data);

    // Then, archive college scores to college_scores_history
    console.log('🗄️ Starting college scores archiving...');
    console.log('🔍 About to call archiveCollegeScores function...');
    
    try {
      const archiveResult = await archiveCollegeScores();
      console.log('📊 Archive function returned:', JSON.stringify(archiveResult, null, 2));

      if (!archiveResult.success) {
        console.error('❌ Error archiving college scores:', archiveResult.error);
        // Don't fail the entire operation, but log the error
        console.warn('⚠️ Student deactivation succeeded but college score archiving failed');
      } else {
        console.log('✅ College scores archived successfully:', archiveResult);
        console.log(`📈 Archived ${archiveResult.archived_count || 0} college score records`);
      }
    } catch (archiveError) {
      console.error('💥 Exception during college score archiving:', archiveError);
      console.error('Stack trace:', archiveError.stack);
    }

    res.json({
      message: 'All active students have been deactivated successfully',
      deactivatedCount: data?.deactivated_students || 0,
      totalMovedAssessments: data?.total_moved_assessments || 0,
      archivedCollegeScores: archiveResult.archived_count || 0,
      details: {
        studentDeactivation: data,
        collegeScoreArchiving: archiveResult
      }
    });
  } catch (error) {
    console.error('Error in deactivate students:', error);
    res.status(500).json({ error: 'Failed to deactivate students' });
  }
});

// POST /api/accounts/upload-csv - Upload and process CSV file
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      body: req.body
    });

    if (!req.file) {
      console.log('No file uploaded in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if deactivatePrevious option is enabled
    const deactivatePrevious = req.body.deactivatePrevious === 'true' || req.body.deactivatePrevious === true;
    
    // If deactivatePrevious is true, deactivate all existing students first
    let deactivatedCount = 0;
    if (deactivatePrevious) {
      try {
        // First, let's check what student statuses exist in the database
        const { data: statusCheck, error: statusError } = await supabase
          .from('students')
          .select('status');
        
        if (statusError) {
          console.error('Error checking student statuses:', statusError);
        } else {
          const statusCounts = statusCheck.reduce((acc, student) => {
            acc[student.status] = (acc[student.status] || 0) + 1;
            return acc;
          }, {});
          console.log('Current student statuses in database:', statusCounts);
        }
        
        const { data: deactivateData, error: deactivateError } = await supabase
          .rpc('deactivate_all_students');
        
        if (deactivateError) {
          console.error('Error deactivating previous students:', deactivateError);
          return res.status(500).json({ error: 'Failed to deactivate previous students' });
        }
        
        // Extract the actual count from the JSON response
        deactivatedCount = deactivateData?.deactivated_students || 0;
        const totalMovedAssessments = deactivateData?.total_moved_assessments || 0;
        console.log('Deactivation result:', deactivateData);
        console.log(`Deactivated ${deactivatedCount} previous students`);
        console.log(`Moved ${totalMovedAssessments} assessments to history`);
        
        // Archive college scores after deactivating students
        console.log('📊 Starting college score archiving after student deactivation...');
        try {
          const archiveResult = await archiveCollegeScores();
          console.log('✅ College score archiving completed:', JSON.stringify(archiveResult, null, 2));
          console.log(`📈 Archived ${archiveResult.archivedCount || 0} college score records`);
        } catch (archiveError) {
          console.error('❌ College score archiving failed:', archiveError);
          console.error('Stack trace:', archiveError.stack);
          console.warn('⚠️ Student deactivation succeeded but college score archiving failed');
        }
        
        // Archive orphaned bulk assessments after deactivating students
        try {
          const { data: archiveData, error: archiveError } = await supabase
            .rpc('archive_orphaned_bulk_assessments');
          
          if (!archiveError && archiveData && archiveData[0]) {
            const { archived_assessments, archived_assignments } = archiveData[0];
            console.log(`Archived ${archived_assessments || 0} orphaned bulk assessments and ${archived_assignments || 0} assignments`);
          }
        } catch (archiveError) {
          console.error('Warning: Failed to archive orphaned assessments:', archiveError);
          // Don't fail the whole operation, just log the warning
        }
      } catch (error) {
        console.error('Error in deactivate operation:', error);
        return res.status(500).json({ error: 'Failed to deactivate previous students' });
      }
    }

    const filePath = req.file.path;
    const students = [];
    const errors = [];
    let rowNumber = 1;

    // Determine file type and parse accordingly
    const isXLSX = req.file.originalname.endsWith('.xlsx');
    
    let parsePromise;
    
    if (isXLSX) {
      // Parse XLSX file
      parsePromise = new Promise(async (resolve, reject) => {
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(filePath);
          
          // Try to get the 'Student Template' worksheet first, then fall back to first worksheet
          let worksheet = workbook.getWorksheet('Student Template');
          if (!worksheet) {
            worksheet = workbook.getWorksheet(1); // Fall back to first worksheet
          }
          if (!worksheet) {
            reject(new Error('No worksheet found in Excel file'));
            return;
          }
          
          // Get headers from first row
          const headerRow = worksheet.getRow(1);
          const headers = [];
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value ? cell.value.toString().trim() : '';
          });
          
          // Debug: Log the headers found in the Excel file
          console.log('Excel headers found:', headers);
          console.log('Worksheet name:', worksheet.name);
          
          // Process data rows
          worksheet.eachRow((row, rowIndex) => {
            if (rowIndex === 1) return; // Skip header row
            
            rowNumber = rowIndex;
            try {
              const rowData = {};
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  let cellValue = '';
                  if (cell.value !== null && cell.value !== undefined) {
                    // Handle different cell value types
                    if (typeof cell.value === 'object' && cell.value.text) {
                      cellValue = cell.value.text.toString().trim();
                    } else {
                      cellValue = cell.value.toString().trim();
                    }
                  }
                  rowData[header] = cellValue;
                }
              });
              
              // Skip empty rows
              if (Object.values(rowData).every(val => !val)) return;
              
              // Validate and sanitize data
              const validationResult = validateStudentData(rowData, rowNumber);
              if (validationResult.isValid) {
                const sanitizedData = sanitizeStudentData(rowData);
                students.push(sanitizedData);
              } else {
                errors.push(...validationResult.errors);
              }
            } catch (error) {
              errors.push(`Row ${rowNumber}: ${error.message}`);
            }
          });
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // Parse CSV file
      parsePromise = new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            rowNumber++;
            try {
              // Validate and sanitize data
              const validationResult = validateStudentData(row, rowNumber);
              if (validationResult.isValid) {
                const sanitizedData = sanitizeStudentData(row);
                students.push(sanitizedData);
              } else {
                errors.push(...validationResult.errors);
              }
            } catch (error) {
              errors.push(`Row ${rowNumber}: ${error.message}`);
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    }

    await parsePromise;

    console.log(`Parsing completed. Found ${students.length} valid students, ${errors.length} errors`);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'File validation failed',
        errors: errors,
        validStudents: students.length
      });
    }

    if (students.length === 0) {
      return res.status(400).json({ error: 'No valid student data found in file' });
    }

    // Use upsert logic to update existing students or insert new ones
    let processedCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;
    
    for (const student of students) {
      try {
        // Use direct database upsert to include course field (same approach as Add New Student)
        const { data, error } = await supabase
          .from('students')
          .upsert({
            name: student.name,
            email: student.email,
            section: student.section,
            course: student.course, // Include the course field
            id_number: student.id_number,
            year_level: student.year_level,
            college: student.college,
            gender: student.gender, // Include the gender field
            semester: student.semester,
            status: 'active',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id_number',
            ignoreDuplicates: false
          })
          .select();
        
        if (error) {
          console.error('Error upserting student:', error);
          errors.push(`Failed to process student: ${student.name}`);
        } else {
          processedCount++;
          if (data === 'updated') {
            updatedCount++;
          } else {
            insertedCount++;
          }
        }
      } catch (error) {
        console.error('Database error:', error);
        errors.push(`Database error for student: ${student.name}`);
      }
    }

    // Note: Bulk assessments are now created separately through the BulkAssessment component
    // This allows counselors to choose the assessment type (42 or 84 items) and customize settings

    if (errors.length > 0) {
      const partialResponse = { 
        message: 'File processed with some errors',
        studentsProcessed: processedCount,
        studentsInserted: insertedCount,
        studentsUpdated: updatedCount,
        errors: errors
      };
      
      // Include deactivation info if applicable
      if (deactivatePrevious) {
        partialResponse.studentsDeactivated = deactivatedCount;
        partialResponse.message = `File processed with some errors. ${deactivatedCount} previous students deactivated, ${processedCount} students processed.`;
      }
      
      return res.status(207).json(partialResponse);
    }

    const response = {
      message: 'File uploaded and processed successfully',
      studentsProcessed: processedCount,
      studentsInserted: insertedCount,
      studentsUpdated: updatedCount
    };
    
    // Include deactivation info if applicable
    if (deactivatePrevious) {
      response.studentsDeactivated = deactivatedCount;
      response.message = `File uploaded successfully. ${deactivatedCount} previous students deactivated, ${processedCount} students processed.`;
    }
    
    res.json(response);

  } catch (error) {
    console.error('Error processing CSV:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// POST /api/accounts/students - Create a new student
router.post('/students', async (req, res) => {
  try {
    const { name, email, section, college, course, id_number, year_level, semester, gender } = req.body;

    // Validate required fields
    if (!name || !email || !id_number || !college || !year_level || !gender) {
      return res.status(400).json({ error: 'Missing required fields: name, email, id_number, college, year_level, gender' });
    }

    // Check if student with same ID number already exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('id_number', id_number)
      .eq('status', 'active')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError;
    }

    if (existingStudent) {
      return res.status(409).json({ error: 'Student with this ID number already exists' });
    }

    // Create new student
    const studentData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      section: section ? section.trim() : null,
      college: college.trim(),
      course: course ? course.trim() : null,
      id_number: id_number.trim(),
      year_level: year_level,
      semester: semester || '1st',
      gender: gender,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Student created successfully', 
      student: data 
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/accounts/students/:id - Update student information
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate update data
    const allowedFields = ['name', 'email', 'section', 'year_level', 'college', 'course', 'gender'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('students')
      .update(filteredUpdates)
      .eq('id_number', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student: data });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/accounts/students/:id - Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id_number', id);

    if (error) throw error;

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// GET /api/accounts/csv-template - Download Excel template with dropdown validation
router.get('/csv-template', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Template');
    
    // Define college options
    const colleges = ['CABE', 'CAH', 'CCS', 'CEA', 'CHESFS', 'CMBS', 'CM', 'CN', 'CPC', 'CTE'];
    
    // Define course mapping with course codes for section generation
    const courseMapping = {
      'CABE': [
        { name: 'Bachelor of Science in Accountancy', code: 'BSA' },
        { name: 'Bachelor of Science in Management Accounting', code: 'BSMA' },
        { name: 'Bachelor of Science in Accounting Information System', code: 'BSAIS' },
        { name: 'Bachelor of Science in Real Estate Management', code: 'BSREM' },
        { name: 'BSBA Major in Marketing Management', code: 'BSBA-MM' },
        { name: 'BSBA Major in Financial Management', code: 'BSBA-FM' },
        { name: 'BSBA Major in Human Resource Management', code: 'BSBA-HRM' }
      ],
      'CAH': [
        { name: 'BA Communication', code: 'ABComm' },
        { name: 'BA English Language Studies', code: 'ABELS' },
        { name: 'BA Philosophy (Law, Management, Research)', code: 'ABPhilo' },
        { name: 'BA Psychology', code: 'ABPsy' },
        { name: 'BS Psychology', code: 'BSPsy' }
      ],
      'CCS': [
        { name: 'BS Information Technology', code: 'BSIT' },
        { name: 'BS Information Systems', code: 'BSIS' },
        { name: 'BS Computer Science', code: 'BSCS' }
      ],
      'CEA': [
        { name: 'BS Architecture', code: 'BArch' },
        { name: 'BS Civil Engineering', code: 'BSCE' },
        { name: 'BS Computer Engineering', code: 'BSCpE' },
        { name: 'BS Electronics Engineering', code: 'BSECE' }
      ],
      'CHESFS': [
        { name: 'BS Nutrition and Dietetics', code: 'BSND' },
        { name: 'BS Hotel, Restaurant & Institutional Management', code: 'BSHRIM' },
        { name: 'BS Tourism Management', code: 'BSTour' }
      ],
      'CM': [
        { name: 'Bachelor of Music in Music Education', code: 'BMME' }
      ],
      'CMBS': [
        { name: 'BS Medical Technology / Medical Laboratory Science', code: 'BSMT' },
        { name: 'BS Biology', code: 'BSBio' }
      ],
      'CN': [
        { name: 'BS Nursing', code: 'BSN' }
      ],
      'CPC': [
        { name: 'BS Chemistry', code: 'BSChem' },
        { name: 'BS Pharmacy', code: 'BSPharma' },
        { name: 'BS Pharmacy Major in Clinical Pharmacy', code: 'BSPharmaClin' }
      ],
      'CTE': [
        { name: 'Bachelor of Early Childhood Education', code: 'BECEd' },
        { name: 'Bachelor of Elementary Education', code: 'BEEd' },
        { name: 'Bachelor of Special Needs Education', code: 'BSNEd' },
        { name: 'Bachelor of Physical Education', code: 'BPED' },
        { name: 'BSEd Major in English', code: 'BSEd-Eng' },
        { name: 'BSEd Major in Filipino', code: 'BSEd-Fil' },
        { name: 'BSEd Major in Sciences', code: 'BSEd-Sci' },
        { name: 'BSEd Major in Mathematics (Specialized in Business & Computing Education)', code: 'BSEd-Math' }
      ]
    };
    
    // Create a hidden worksheet for dropdown values
    const dropdownSheet = workbook.addWorksheet('DropdownValues');
    dropdownSheet.state = 'hidden';
    
    // Add college values to the hidden sheet (column A)
    colleges.forEach((college, index) => {
      dropdownSheet.getCell(`A${index + 1}`).value = college;
    });
    
    // Create separate columns for each college's courses
    let currentColumn = 2; // Start from column B
    const collegeColumns = {};
    
    colleges.forEach(college => {
      const courses = courseMapping[college] || [];
      const columnLetter = String.fromCharCode(64 + currentColumn); // Convert to letter (B, C, D, etc.)
      
      // Add courses for this college to the current column
      courses.forEach((course, index) => {
        dropdownSheet.getCell(`${columnLetter}${index + 1}`).value = course.name;
      });
      
      // Store the column range for this college
      collegeColumns[college] = `DropdownValues!$${columnLetter}$1:$${columnLetter}$${courses.length}`;
      currentColumn++;
    });
    
    // Set up headers in the requested order: Name, College, Course, Year Level, Section, ID Number, Email, Gender, Semester
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'College', key: 'college', width: 15 },
      { header: 'Course', key: 'course', width: 35 },
      { header: 'Year Level', key: 'yearLevel', width: 12 },
      { header: 'Section', key: 'section', width: 15 },
      { header: 'ID Number', key: 'idNumber', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Semester', key: 'semester', width: 15 }
    ];
    
    // Add sample data
    worksheet.addRows([
      {
        name: 'John Doe',
        college: 'CCS',
        course: 'BS Information Technology',
        yearLevel: '4',
        section: 'BSIT-4A',
        idNumber: '2020-12345',
        email: 'john.doe@student.edu',
        gender: 'Male',
        semester: '1st Semester'
      },
      {
        name: 'Jane Smith',
        college: 'CCS',
        course: 'BS Computer Science',
        yearLevel: '3',
        section: 'BSCS-3B',
        idNumber: '2021-67890',
        email: 'jane.smith@student.edu',
        gender: 'Female',
        semester: '1st Semester'
      },
      {
        name: 'Mike Johnson',
        college: 'CEA',
        course: 'BS Civil Engineering',
        yearLevel: '2',
        section: 'BSCE-2A',
        idNumber: '2022-11111',
        email: 'mike.johnson@student.edu',
        gender: 'Male',
        semester: '1st Semester'
      },
      {
        name: 'Sarah Wilson',
        college: 'CABE',
        course: 'Bachelor of Science in Accountancy',
        yearLevel: '1',
        section: 'BSA-1A',
        idNumber: '2023-22222',
        email: 'sarah.wilson@student.edu',
        gender: 'Female',
        semester: '1st Semester'
      },
      {
        name: 'Alex Brown',
        college: 'CN',
        course: 'BS Nursing',
        yearLevel: '2',
        section: 'BSN-2B',
        idNumber: '2022-33333',
        email: 'alex.brown@student.edu',
        gender: 'Male',
        semester: '1st Semester'
      }
    ]);
    
    // Add data validation for college column (column B) using reference to hidden sheet
    worksheet.dataValidations.add('B2:B1000', {
      type: 'list',
      allowBlank: false,
      formulae: [`DropdownValues!$A$1:$A$${colleges.length}`],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid College',
      error: 'Please select a valid college from the dropdown list.'
    });
    
    // Create a mapping sheet for college-to-column lookup
    const mappingSheet = workbook.addWorksheet('CollegeMapping');
    mappingSheet.state = 'hidden';
    
    // Add college-to-column mapping
    const collegeToColumn = {
      'CABE': 'B', 'CAH': 'C', 'CCS': 'D', 'CEA': 'E', 
      'CHESFS': 'F', 'CM': 'G', 'CMBS': 'H', 'CN': 'I', 
      'CPC': 'J', 'CTE': 'K'
    };
    
    let mappingRow = 1;
    Object.entries(collegeToColumn).forEach(([college, column]) => {
      mappingSheet.getCell(`A${mappingRow}`).value = college;
      mappingSheet.getCell(`B${mappingRow}`).value = column;
      mappingRow++;
    });
    
    // Add validation for course column (column C) - using dynamic INDIRECT
    worksheet.dataValidations.add('C2:C1000', {
      type: 'list',
      allowBlank: false,
      formulae: [`INDIRECT("DropdownValues!"&VLOOKUP(B2,CollegeMapping!$A$1:$B$10,2,FALSE)&"$1:"&VLOOKUP(B2,CollegeMapping!$A$1:$B$10,2,FALSE)&"$50")`],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Course',
      error: 'Please select a valid course for your chosen college. Make sure to select a college first.'
    });
    
    // Add validation for year level (column D)
    worksheet.dataValidations.add('D2:D1000', {
      type: 'list',
      allowBlank: false,
      formulae: ['"1,2,3,4"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Year Level',
      error: 'Please select a valid year level (1-4).'
    });
    
    // Add validation for gender (column H)
    worksheet.dataValidations.add('H2:H1000', {
      type: 'list',
      allowBlank: false,
      formulae: ['"Male,Female"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Gender',
      error: 'Please select either Male or Female.'
    });
    
    // Add validation for semester (column I)
    worksheet.dataValidations.add('I2:I1000', {
      type: 'list',
      allowBlank: false,
      formulae: ['"1st Semester,2nd Semester,Summer"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Semester',
      error: 'Please select a valid semester.'
    });

    // Add a helper worksheet for section lookup
    const sectionHelperSheet = workbook.addWorksheet('SectionHelper');
    sectionHelperSheet.state = 'hidden';
    
    // Create a lookup table for sections based on course codes
    const courseCodes = {};
    colleges.forEach(college => {
      const courses = courseMapping[college] || [];
      courses.forEach(course => {
        courseCodes[course.name] = course.code;
      });
    });
    
    // Add course codes to helper sheet for lookup (Column A: Course Name, Column B: Course Code)
    let helperRow = 1;
    Object.entries(courseCodes).forEach(([courseName, courseCode]) => {
      sectionHelperSheet.getCell(`A${helperRow}`).value = courseName;
      sectionHelperSheet.getCell(`B${helperRow}`).value = courseCode;
      helperRow++;
    });
    
    // Create section combinations for all course codes and year levels
    // Columns C-F will contain sections for years 1-4 respectively
    const yearColumns = ['C', 'D', 'E', 'F']; // Years 1, 2, 3, 4
    const sections = ['A', 'B', 'C'];
    
    Object.values(courseCodes).forEach((courseCode, courseIndex) => {
      yearColumns.forEach((column, yearIndex) => {
        const yearLevel = yearIndex + 1;
        let sectionRow = courseIndex * 3 + 1; // Each course gets 3 rows (A, B, C sections)
        
        sections.forEach((section, sectionIndex) => {
          const sectionCode = `${courseCode}-${yearLevel}${section}`;
          sectionHelperSheet.getCell(`${column}${sectionRow + sectionIndex}`).value = sectionCode;
        });
      });
    });
    
    // Add validation for section column (column E) - dynamic based on course and year level
    worksheet.dataValidations.add('E2:E1000', {
      type: 'list',
      allowBlank: false,
      formulae: [`INDIRECT("SectionHelper!"&CHAR(67+D2-1)&(MATCH(C2,SectionHelper!$A:$A,0)-1)*3+1&":"&CHAR(67+D2-1)&(MATCH(C2,SectionHelper!$A:$A,0)-1)*3+3)`],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Section',
      error: 'Please select a valid section. Make sure to select Course and Year Level first.'
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add borders to all cells with data
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Apply borders to the header row and sample data rows
    for (let row = 1; row <= worksheet.rowCount; row++) {
      for (let col = 1; col <= 9; col++) { // A to I columns (including Gender)
        worksheet.getCell(row, col).border = borderStyle;
      }
    }
    
    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.addRows([
      ['STUDENT TEMPLATE INSTRUCTIONS'],
      [''],
      ['Column Order: Name | College | Course | Year Level | Section | ID Number | Email | Gender | Semester'],
      [''],
      ['How to use this template:'],
      ['1. Fill in student information in the "Student Template" sheet'],
      ['2. College column (B) has a dropdown - select from the available options'],
      ['3. Course column (C) has a DYNAMIC dropdown - automatically shows only courses for your selected college'],
      ['4. Year Level column (D) has a dropdown - select 1, 2, 3, or 4'],
      ['5. Section column (E) has a DYNAMIC dropdown - automatically shows sections for your selected course and year'],
      ['   Examples: Select BSIT + Year 1 → shows BSIT-1A, BSIT-1B, BSIT-1C'],
      ['6. ID Number column (F) - Enter unique student ID'],
      ['7. Email column (G) - Enter valid email address'],
      ['8. Semester column (H) has a dropdown - select from available options'],
      [''],
      ['Dynamic Section Examples:'],
      ['• Select "BS Information Technology" + "1" → Dropdown shows: BSIT-1A, BSIT-1B, BSIT-1C'],
      ['• Select "Bachelor of Science in Accountancy" + "2" → Dropdown shows: BSA-2A, BSA-2B, BSA-2C'],
      ['• Select "BS Nursing" + "3" → Dropdown shows: BSN-3A, BSN-3B, BSN-3C'],
      ['• Select "BS Computer Science" + "4" → Dropdown shows: BSCS-4A, BSCS-4B, BSCS-4C'],
      [''],
      ['Important Notes:'],
      ['• Do not modify the hidden sheets (DropdownValues, CollegeMapping, SectionHelper)'],
      ['• IMPORTANT: Select College → Course → Year Level → Section (in this order)'],
      ['• Course dropdown filters based on selected college'],
      ['• Section dropdown filters based on selected course AND year level'],
      ['• ID Numbers must be unique'],
      ['• Email addresses must be valid and unique'],
      ['• All fields are required'],
      [''],
      ['College Abbreviations:'],
      ['CABE - College of Accountancy and Business Education'],
      ['CAH - College of Arts and Humanities'],
      ['CCS - College of Computer Studies'],
      ['CEA - College of Engineering and Architecture'],
      ['CHESFS - College of Home Economics, Sports and Food Science'],
      ['CM - College of Music'],
      ['CMBS - College of Mathematics and Biological Sciences'],
      ['CN - College of Nursing'],
      ['CPC - College of Pharmacy and Chemistry'],
      ['CTE - College of Teacher Education'],
      [''],
      ['Course Code Reference:'],
      ['CABE: BSA, BSMA, BSAIS, BSREM, BSBA-MM, BSBA-FM, BSBA-HRM'],
      ['CAH: ABComm, ABELS, ABPhilo, ABPsy, BSPsy'],
      ['CCS: BSIT, BSIS, BSCS'],
      ['CEA: BArch, BSCE, BSCpE, BSECE'],
      ['CHESFS: BSND, BSHRIM, BSTour'],
      ['CM: BMME'],
      ['CMBS: BSMT, BSBio'],
      ['CN: BSN'],
      ['CPC: BSChem, BSPharma, BSPharmaClin'],
      ['CTE: BECEd, BEEd, BSNEd, BPED, BSEd-Eng, BSEd-Fil, BSEd-Sci, BSEd-Math']
    ]);
    
    // Style instructions sheet
    instructionsSheet.getRow(1).font = { bold: true, size: 14 };
    instructionsSheet.getRow(3).font = { bold: true };
    instructionsSheet.getRow(10).font = { bold: true };
    instructionsSheet.getRow(17).font = { bold: true };
    instructionsSheet.getColumn(1).width = 60;
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_template.xlsx"');
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating Excel template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Debug route to check student statuses
router.get('/debug/student-statuses', async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch students', details: error });
    }
    
    // Group by status
    const statusCounts = students.reduce((acc, student) => {
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      total_students: students.length,
      status_counts: statusCounts,
      students: students
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student statuses' });
  }
});

// Debug route to test deactivate_all_students function directly
router.post('/debug/test-deactivation', async (req, res) => {
  try {
    console.log('🔍 Testing deactivate_all_students function...');
    
    // Check current counts before deactivation
    const { data: beforeStudents, error: beforeError } = await supabase
      .from('students')
      .select('status', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (beforeError) {
      console.error('Error checking students before:', beforeError);
    } else {
      console.log('Active students before deactivation:', beforeStudents);
    }
    
    // Check assessment counts before (ryffscoring table no longer used)
    // Assessment data is now stored in assessments_42items and assessments_84items tables
    
    const { data: assess42Count } = await supabase
      .from('assessments_42items')
      .select('*', { count: 'exact', head: true });
    
    const { data: assess84Count } = await supabase
      .from('assessments_84items')
      .select('*', { count: 'exact', head: true });
    
    console.log('Assessment counts before:', {
      // ryffscoring table no longer used - data in assessments_42items/assessments_84items
      assessments_42items: assess42Count,
      assessments_84items: assess84Count
    });
    
    // Call the deactivation function
    const { data: deactivateData, error: deactivateError } = await supabaseAdmin
      .rpc('deactivate_all_students');
    
    if (deactivateError) {
      console.error('Deactivation error:', deactivateError);
      return res.status(500).json({ 
        error: 'Deactivation failed', 
        details: deactivateError,
        message: 'The deactivate_all_students function returned an error'
      });
    }
    
    console.log('Deactivation result:', deactivateData);
    
    // Archive college scores to college_scores_history
    console.log('🗄️ Testing college scores archiving...');
    const archiveResult = await archiveCollegeScores();
    
    if (!archiveResult.success) {
      console.error('Error archiving college scores:', archiveResult.error);
    } else {
      console.log('✅ College scores archived successfully:', archiveResult);
    }
    
    // Check counts after deactivation
    const { data: afterStudents, error: afterError } = await supabase
      .from('students')
      .select('status', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (afterError) {
      console.error('Error checking students after:', afterError);
    } else {
      console.log('Active students after deactivation:', afterStudents);
    }
    
    // Check college scores tables after archiving
    const { data: collegeScoresCount } = await supabase
      .from('college_scores')
      .select('*', { count: 'exact', head: true });
    
    const { data: collegeScoresHistoryCount } = await supabase
      .from('college_scores_history')
      .select('*', { count: 'exact', head: true });
    
    res.json({
      success: true,
      deactivation_result: deactivateData,
      archive_result: archiveResult,
      before_counts: {
        active_students: beforeStudents,
        // ryffscoring table no longer used - data in assessments_42items/assessments_84items
        assessments_42items: assess42Count,
        assessments_84items: assess84Count
      },
      after_counts: {
        active_students: afterStudents,
        college_scores: collegeScoresCount,
        college_scores_history: collegeScoresHistoryCount
      }
    });
    
  } catch (error) {
    console.error('Test deactivation error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message,
      stack: error.stack
    });
  }
});

// GET /api/accounts/colleges/scores - Get computed college scores with optional year, section, and course filtering
router.get('/colleges/scores', async (req, res) => {
  try {
    const { college, assessmentType, assessmentName, yearLevel, section, course } = req.query;
    
    console.log('🔍 College scores request with filters:', {
      college,
      assessmentType,
      assessmentName,
      yearLevel,
      section,
      course
    });
    
    // Get college scores (is_active parameter removed for compatibility)
    const result = await getCollegeScores(college, assessmentType, assessmentName, yearLevel, section, course);
    
    if (result.success) {
      res.json({
        success: true,
        colleges: result.colleges
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching college scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch college scores'
    });
  }
});

// GET /api/accounts/colleges/history - Get historical college scores from college_scores_history
router.get('/colleges/history', async (req, res) => {
  try {
    let { college, assessmentType, assessmentName, yearLevel, section } = req.query;
    
    // Decode assessmentName if it's URL encoded
    if (assessmentName) {
      try {
        // Try to decode multiple times in case of double encoding
        let decodedName = assessmentName;
        let previousName = '';
        while (decodedName !== previousName && decodedName.includes('%')) {
          previousName = decodedName;
          decodedName = decodeURIComponent(decodedName);
        }
        assessmentName = decodedName;
      } catch (error) {
        console.log('⚠️ Could not decode assessmentName:', assessmentName);
      }
    }
    
    console.log('📊 College History Request:', {
      college,
      assessmentType,
      assessmentName,
      yearLevel,
      section
    });

    // Use getHistoricalCollegeScores for archived data instead of getCollegeScores
    const { getHistoricalCollegeScores } = require('../utils/collegeHistoryScoring');
    const result = await getHistoricalCollegeScores(college, assessmentType, assessmentName, yearLevel, section);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch college history data'
      });
    }

    // Format response to match the expected structure for the frontend
    // The history array contains assessments with proper assessment names and archived dates
    const response = {
      success: true,
      college: college,
      assessmentType: assessmentType,
      assessmentName: assessmentName,
      yearLevel: yearLevel,
      section: section,
      colleges: result.colleges, // For compatibility with college summary format
      history: result.history // Historical data grouped by assessment with proper dates and names
    };

    console.log('📊 College History Response (Historical):', {
      college: college,
      assessmentType: assessmentType,
      assessmentName: assessmentName,
      yearLevel: yearLevel,
      section: section,
      historyCount: result.history.length,
      historyItems: result.history.map(h => ({
        assessmentName: h.assessmentName,
        archivedAt: h.archivedAt,
        collegesCount: h.colleges.length
      }))
    });

    res.json(response);

  } catch (error) {
    console.error('Error in college history endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/accounts/colleges/compute-scores - Compute and store college scores
router.post('/colleges/compute-scores', async (req, res) => {
  try {
    const { college, assessmentType, assessmentName } = req.body;
    
    // Validate that assessmentName is provided to prevent "General Assessment" records
    if (!assessmentName || assessmentName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'assessmentName is required. Cannot compute scores without specifying the assessment name to prevent data conflicts.'
      });
    }
    
    const result = await computeAndStoreCollegeScores(college, assessmentType, assessmentName);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        collegeCount: result.collegeCount,
        scoreCount: result.scoreCount
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error computing college scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute college scores'
    });
  }
});

// GET /api/accounts/colleges/assessment-names - Get assessment names from college_scores table
router.get('/colleges/assessment-names', async (req, res) => {
  try {
    const { college, assessmentType } = req.query;
    
    console.log('🔍 Fetching assessment names from college_scores for college:', college, 'assessmentType:', assessmentType);
    
    // Build query to get unique assessment names from college_scores
    // Note: is_active filter removed to avoid database errors since column doesn't exist
    // All college scores are treated as active by default
    let query = supabase
      .from('college_scores')
      .select('assessment_name, college_name, assessment_type')
      .not('assessment_name', 'is', null);
    
    // Filter by college if provided
    if (college) {
      query = query.eq('college_name', college);
    }
    
    // Filter by assessment type if provided
    if (assessmentType && assessmentType !== 'all') {
      query = query.eq('assessment_type', assessmentType);
    }
    
    const { data: scores, error } = await query;
    
    if (error) {
      console.error('Error fetching assessment names from college_scores:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment names'
      });
    }
    
    // Get unique assessment names
    const uniqueAssessmentNames = [...new Set(scores.map(score => score.assessment_name))];
    
    console.log('✅ Found assessment names for type', assessmentType, ':', uniqueAssessmentNames);
    
    res.json({
      success: true,
      assessmentNames: uniqueAssessmentNames
    });
    
  } catch (error) {
    console.error('Error in assessment-names endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment names'
    });
  }
});

// GET /api/accounts/colleges/assessment-periods - Get assessment periods for selected colleges
router.get('/colleges/assessment-periods', async (req, res) => {
  try {
    const { colleges } = req.query;
    
    if (!colleges) {
      return res.status(400).json({
        success: false,
        message: 'Colleges parameter is required'
      });
    }
    
    // Parse colleges array from query string
    const collegeList = Array.isArray(colleges) ? colleges : colleges.split(',');
    
    console.log('🔍 Fetching assessment periods for colleges:', collegeList);
    
    // Fetch current assessments from college_scores
    const { data: currentScores, error: currentError } = await supabase
      .from('college_scores')
      .select('assessment_name, assessment_type, college_name, last_calculated')
      .in('college_name', collegeList)
      .not('assessment_name', 'is', null);
    
    if (currentError) {
      console.error('Error fetching current college scores:', currentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch current assessment data'
      });
    }
    
    // Fetch historical assessments from college_scores_history
    const { data: historicalScores, error: historicalError } = await supabase
      .from('college_scores_history')
      .select('assessment_name, assessment_type, college_name, archived_at, last_calculated')
      .in('college_name', collegeList)
      .not('assessment_name', 'is', null);
    
    if (historicalError) {
      console.error('Error fetching historical college scores:', historicalError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch historical assessment data'
      });
    }
    
    // Process and combine the data
    const assessmentPeriods = new Map();
    
    // Process current assessments
    currentScores.forEach(score => {
      const key = `${score.assessment_name}_${score.assessment_type}`;
      if (!assessmentPeriods.has(key)) {
        assessmentPeriods.set(key, {
          id: key,
          name: score.assessment_name,
          assessmentType: score.assessment_type,
          dateRange: score.last_calculated ? new Date(score.last_calculated).toLocaleDateString() : 'Current',
          participants: 0,
          colleges: new Set(),
          isHistorical: false,
          lastCalculated: score.last_calculated
        });
      }
      assessmentPeriods.get(key).colleges.add(score.college_name);
    });
    
    // Process historical assessments
    historicalScores.forEach(score => {
      const key = `${score.assessment_name}_${score.assessment_type}_historical`;
      if (!assessmentPeriods.has(key)) {
        assessmentPeriods.set(key, {
          id: key,
          name: `${score.assessment_name} (Historical)`,
          assessmentType: score.assessment_type,
          dateRange: score.archived_at ? new Date(score.archived_at).toLocaleDateString() : 'Historical',
          participants: 0,
          colleges: new Set(),
          isHistorical: true,
          archivedAt: score.archived_at
        });
      }
      assessmentPeriods.get(key).colleges.add(score.college_name);
    });
    
    // Convert to array and calculate participants (estimate based on colleges)
    const periodsArray = Array.from(assessmentPeriods.values()).map(period => ({
      ...period,
      colleges: Array.from(period.colleges),
      participants: Array.from(period.colleges).length * 50 // Rough estimate
    }));
    
    // Sort by date (most recent first)
    periodsArray.sort((a, b) => {
      const dateA = new Date(a.lastCalculated || a.archivedAt || 0);
      const dateB = new Date(b.lastCalculated || b.archivedAt || 0);
      return dateB - dateA;
    });
    
    console.log('✅ Found assessment periods:', periodsArray.length);
    
    res.json({
      success: true,
      assessmentPeriods: periodsArray,
      totalPeriods: periodsArray.length
    });
    
  } catch (error) {
    console.error('Error in assessment-periods endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment periods'
    });
  }
});

// GET /api/accounts/student-status - Check current student status
router.get('/student-status', verifyStudentSession, async (req, res) => {
  try {
    // Get student ID from verified session (middleware provides req.user)
    const studentId = req.user.id;
    
    // Check student status in database
    const { data: student, error } = await supabase
      .from('students')
      .select('status')
      .eq('id', studentId)
      .single();
    
    if (error) {
      console.error('Error checking student status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check student status'
      });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        status: student.status
      }
    });
    
  } catch (error) {
    console.error('Error in student-status endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;