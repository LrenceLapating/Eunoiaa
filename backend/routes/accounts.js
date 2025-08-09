const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/database');
const { validateStudentData, sanitizeStudentData } = require('../utils/validation');

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
    cb(null, `students-${uniqueSuffix}.csv`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
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

    // Count students by college
    const collegeStats = data.reduce((acc, student) => {
      const college = student.college;
      acc[college] = (acc[college] || 0) + 1;
      return acc;
    }, {});

    const colleges = Object.entries(collegeStats).map(([name, totalUsers]) => ({
      name,
      totalUsers
    }));

    res.json({ colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// GET /api/accounts/colleges/:collegeName/sections - Get sections data for a specific college (active students only)
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

// GET /api/accounts/history - Get archived students from history
router.get('/history', async (req, res) => {
  try {
    const { 
      college, 
      semester,
      page = 1, 
      limit = 50, 
      search = '' 
    } = req.query;

    let query = supabase
      .from('students_history')
      .select('*', { count: 'exact' })
      .order('archived_at', { ascending: false });

    // Apply filters
    if (college && college !== 'all') {
      query = query.eq('college', college);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,id_number.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      students: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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
    const { data, error } = await supabase
      .rpc('deactivate_all_students');

    if (error) {
      console.error('Error deactivating students:', error);
      return res.status(500).json({ error: 'Failed to deactivate students' });
    }

    res.json({
      message: 'All active students have been deactivated successfully',
      deactivatedCount: data
    });
  } catch (error) {
    console.error('Error in deactivate students:', error);
    res.status(500).json({ error: 'Failed to deactivate students' });
  }
});

// POST /api/accounts/upload-csv - Upload and process CSV file
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    // Check if deactivatePrevious option is enabled
    const deactivatePrevious = req.body.deactivatePrevious === 'true' || req.body.deactivatePrevious === true;
    
    // If deactivatePrevious is true, deactivate all existing students first
    let deactivatedCount = 0;
    if (deactivatePrevious) {
      try {
        const { data: deactivateData, error: deactivateError } = await supabase
          .rpc('deactivate_all_students');
        
        if (deactivateError) {
          console.error('Error deactivating previous students:', deactivateError);
          return res.status(500).json({ error: 'Failed to deactivate previous students' });
        }
        
        deactivatedCount = deactivateData || 0;
        console.log(`Deactivated ${deactivatedCount} previous students`);
        
        // Archive orphaned bulk assessments after deactivating students
        try {
          const { data: archiveData, error: archiveError } = await supabase
            .rpc('archive_orphaned_bulk_assessments');
          
          if (!archiveError && archiveData && archiveData[0]) {
            const { archived_assessments, archived_assignments } = archiveData[0];
            console.log(`Archived ${archived_assessments} orphaned bulk assessments and ${archived_assignments} assignments`);
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

    // Parse CSV file
    const parsePromise = new Promise((resolve, reject) => {
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

    await parsePromise;

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'CSV validation failed',
        errors: errors,
        validStudents: students.length
      });
    }

    if (students.length === 0) {
      return res.status(400).json({ error: 'No valid student data found in CSV' });
    }

    // Use upsert logic to update existing students or insert new ones
    let processedCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;
    
    for (const student of students) {
      try {
        const { data, error } = await supabase
          .rpc('upsert_student', {
            p_name: student.name,
            p_email: student.email,
            p_section: student.section,
            p_department: student.college, // Use college for department field for backward compatibility
            p_id_number: student.id_number,
            p_year_level: student.year_level,
            p_college: student.college,
            p_semester: student.semester
          });
        
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
        message: 'CSV processed with some errors',
        studentsProcessed: processedCount,
        studentsInserted: insertedCount,
        studentsUpdated: updatedCount,
        errors: errors
      };
      
      // Include deactivation info if applicable
      if (deactivatePrevious) {
        partialResponse.studentsDeactivated = deactivatedCount;
        partialResponse.message = `CSV processed with some errors. ${deactivatedCount} previous students deactivated, ${processedCount} students processed.`;
      }
      
      return res.status(207).json(partialResponse);
    }

    const response = {
      message: 'CSV uploaded and processed successfully',
      studentsProcessed: processedCount,
      studentsInserted: insertedCount,
      studentsUpdated: updatedCount
    };
    
    // Include deactivation info if applicable
    if (deactivatePrevious) {
      response.studentsDeactivated = deactivatedCount;
      response.message = `CSV uploaded successfully. ${deactivatedCount} previous students deactivated, ${processedCount} students processed.`;
    }
    
    res.json(response);

  } catch (error) {
    console.error('Error processing CSV:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// POST /api/accounts/students - Create a new student
router.post('/students', async (req, res) => {
  try {
    const { name, email, section, college, id_number, year_level, semester } = req.body;

    // Validate required fields
    if (!name || !email || !id_number || !college || !year_level) {
      return res.status(400).json({ error: 'Missing required fields: name, email, id_number, college, year_level' });
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
      id_number: id_number.trim(),
      year_level: year_level,
      semester: semester || '1st',
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
    const allowedFields = ['name', 'email', 'section', 'year_level', 'college'];
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

// GET /api/accounts/csv-template - Download CSV template
router.get('/csv-template', (req, res) => {
  const csvTemplate = 'Name,Section,College,ID Number,Email,Year Level,Semester\n' +
                     'John Doe,BSIT-4A,College of Computer Studies,2020-12345,john.doe@student.edu,4,1st Semester\n' +
                     'Jane Smith,BSCS-3B,CCS,2021-67890,jane.smith@student.edu,3,1st Semester\n' +
                     'Mike Johnson,BSENG-2A,College of Engineering,2022-11111,mike.johnson@student.edu,2,1st Semester\n' +
                     'Sarah Wilson,BSBA-1A,Business Administration,2023-22222,sarah.wilson@student.edu,1,1st Semester\n' +
                     'Alex Brown,BSN-2B,Nursing College,2022-33333,alex.brown@student.edu,2,1st Semester';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_template.csv"');
  res.send(csvTemplate);
});

module.exports = router;