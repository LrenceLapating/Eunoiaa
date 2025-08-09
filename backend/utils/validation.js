const validator = require('validator');

/**
 * Validate student data from CSV row
 * @param {Object} row - CSV row data
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} - Validation result with isValid flag and errors array
 */
const validateStudentData = (row, rowNumber) => {
  const errors = [];
  const requiredFields = ['Name', 'Section', 'College', 'ID Number', 'Email', 'Year Level'];
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
    }
  }
  
  // Validate email format
  if (row['Email'] && !validator.isEmail(row['Email'].toString().trim())) {
    errors.push(`Row ${rowNumber}: Invalid email format '${row['Email']}'`);
  }
  
  // Validate year level (should be 1-6)
  if (row['Year Level']) {
    const yearLevel = parseInt(row['Year Level']);
    if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 6) {
      errors.push(`Row ${rowNumber}: Year Level must be between 1 and 6, got '${row['Year Level']}'`);
    }
  }
  
  // Validate ID Number format (basic check for non-empty and reasonable length)
  if (row['ID Number']) {
    const idNumber = row['ID Number'].toString().trim();
    if (idNumber.length < 4 || idNumber.length > 20) {
      errors.push(`Row ${rowNumber}: ID Number must be between 4 and 20 characters, got '${idNumber}'`);
    }
  }
  
  // Validate name (should contain only letters, spaces, and common punctuation)
  if (row['Name']) {
    const name = row['Name'].toString().trim();
    if (!/^[a-zA-Z\s\-\.,']+$/.test(name)) {
      errors.push(`Row ${rowNumber}: Name contains invalid characters '${name}'`);
    }
    if (name.length < 2 || name.length > 100) {
      errors.push(`Row ${rowNumber}: Name must be between 2 and 100 characters, got '${name}'`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Sanitize and format student data for database insertion
 * @param {Object} row - CSV row data
 * @returns {Object} - Sanitized student data
 */
const sanitizeStudentData = (row) => {
  // Extract data from CSV columns
  const section = row['Section'].toString().trim();
  const college = row['College'].toString().trim();
  const semester = row['Semester'] ? row['Semester'].toString().trim() : '1st Semester';
  
  // Use the College column directly from CSV
  // This allows for automatic creation of new colleges from CSV data
  let finalCollege = college;
  
  // If college is empty, try to extract from section as fallback
  if (!finalCollege || finalCollege.length < 2) {
    const sectionLower = section.toLowerCase();
    
    if (sectionLower.includes('bsit') || sectionLower.includes('bscs') || 
        sectionLower.includes('it') || sectionLower.includes('cs')) {
      finalCollege = 'CCS';
    } else if (sectionLower.includes('bseng') || sectionLower.includes('eng')) {
      finalCollege = 'COE';
    } else if (sectionLower.includes('bsba') || sectionLower.includes('bsm') || 
               sectionLower.includes('ba') || sectionLower.includes('mgt')) {
      finalCollege = 'CBA';
    } else if (sectionLower.includes('bsed') || sectionLower.includes('beed') || 
               sectionLower.includes('ed')) {
      finalCollege = 'COE';
    } else {
      finalCollege = 'Unknown';
    }
  }
  
  return {
    name: validator.escape(row['Name'].toString().trim()),
    email: validator.normalizeEmail(row['Email'].toString().trim()),
    section: validator.escape(section),
    id_number: validator.escape(row['ID Number'].toString().trim()),
    year_level: parseInt(row['Year Level']),
    college: finalCollege,
    semester: semester,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * Validate update data for student records
 * @param {Object} data - Update data
 * @returns {Object} - Validation result
 */
const validateUpdateData = (data) => {
  const errors = [];
  
  if (data.email && !validator.isEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.year_level) {
    const yearLevel = parseInt(data.year_level);
    if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 6) {
      errors.push('Year Level must be between 1 and 6');
    }
  }
  
  if (data.name) {
    const name = data.name.toString().trim();
    if (!/^[a-zA-Z\s\-\.,']+$/.test(name)) {
      errors.push('Name contains invalid characters');
    }
    if (name.length < 2 || name.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  validateStudentData,
  sanitizeStudentData,
  validateUpdateData
};