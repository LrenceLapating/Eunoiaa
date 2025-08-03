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

// GET /api/accounts/colleges - Get all colleges with student counts
router.get('/colleges', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('college')
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

// GET /api/accounts/colleges/:collegeName/sections - Get sections data for a specific college
router.get('/colleges/:collegeName/sections', async (req, res) => {
  try {
    const { collegeName } = req.params;
    
    // Get all students for the specified college
    const { data, error } = await supabase
      .from('students')
      .select('section, year_level')
      .eq('college', collegeName)
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

// GET /api/accounts/students - Get students with filtering and pagination
router.get('/students', async (req, res) => {
  try {
    const { college, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
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

// POST /api/accounts/upload-csv - Upload and process CSV file
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const { semester } = req.body;
    if (!semester) {
      return res.status(400).json({ error: 'Semester is required' });
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
              const sanitizedData = sanitizeStudentData(row, semester);
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

    // Move existing students to history before inserting new data
    try {
      const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('*');
      
      if (fetchError) {
        console.error('Error fetching existing students:', fetchError);
      } else if (existingStudents && existingStudents.length > 0) {
        // Prepare history records
        const historyRecords = existingStudents.map(student => ({
          original_student_id: student.id,
          name: student.name,
          email: student.email,
          section: student.section,
          department: student.department,
          id_number: student.id_number,
          year_level: student.year_level,
          college: student.college,
          semester: student.semester,
          status: student.status,
          created_at: student.created_at,
          updated_at: student.updated_at,
          archived_at: new Date().toISOString()
        }));

        // Insert into history table
        const { error: historyError } = await supabase
          .from('students_history')
          .insert(historyRecords);
        
        if (historyError) {
          console.error('Error moving data to history:', historyError);
          // Continue with the process even if history fails
        } else {
          console.log(`Moved ${existingStudents.length} students to history`);
        }

        // Clear existing students table
        const { error: deleteError } = await supabase
          .from('students')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error('Error clearing students table:', deleteError);
        }
      }
    } catch (historyError) {
      console.error('History operation failed:', historyError);
      // Continue with the upload process
    }

    // Insert new students into database
    let insertedCount = 0;
    for (const student of students) {
      try {
        const { error } = await supabase
          .from('students')
          .insert(student);
        
        if (error) {
          console.error('Error inserting student:', error);
          errors.push(`Failed to insert student: ${student.name}`);
        } else {
          insertedCount++;
        }
      } catch (error) {
        console.error('Database error:', error);
        errors.push(`Database error for student: ${student.name}`);
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({ 
        message: 'CSV processed with some errors',
        studentsProcessed: students.length,
        studentsInserted: insertedCount,
        semester: semester,
        errors: errors
      });
    }

    res.json({
      message: 'CSV uploaded and processed successfully',
      studentsProcessed: students.length,
      studentsInserted: insertedCount,
      semester: semester
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// PUT /api/accounts/students/:id - Update student information
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate update data
    const allowedFields = ['name', 'email', 'section', 'department', 'year_level', 'college'];
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
      .eq('id', id)
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
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// GET /api/accounts/csv-template - Download CSV template
router.get('/csv-template', (req, res) => {
  const csvTemplate = 'Name,Section,College,ID Number,Email,Year Level\n' +
                     'John Doe,BSIT-4A,CCS,2020-12345,john.doe@student.edu,4\n' +
                     'Jane Smith,BSCS-3B,CCS,2021-67890,jane.smith@student.edu,3\n' +
                     'Mike Johnson,BSENG-2A,COE,2022-11111,mike.johnson@student.edu,2';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_template.csv"');
  res.send(csvTemplate);
});

module.exports = router;