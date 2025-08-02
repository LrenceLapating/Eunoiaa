const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const router = express.Router();

// Student login endpoint
router.post('/student/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find student by ID number or email
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .or(`id_number.eq.${username},email.eq.${username}`);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!students || students.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const student = students[0];

    // Check password (for now, default password is 'student123')
    const defaultPassword = 'student123';
    let passwordValid = false;

    if (student.password_hash) {
      // If student has a custom password, check it
      passwordValid = await bcrypt.compare(password, student.password_hash);
    } else {
      // Use default password
      passwordValid = password === defaultPassword;
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: student.id,
        id_number: student.id_number,
        email: student.email,
        name: student.name,
        college: student.college,
        role: 'student'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        id_number: student.id_number,
        college: student.college,
        section: student.section,
        year_level: student.year_level
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change student password endpoint
router.post('/student/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find student
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .or(`id_number.eq.${username},email.eq.${username}`);

    if (error || !students || students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];

    // Verify current password
    const defaultPassword = 'student123';
    let currentPasswordValid = false;

    if (student.password_hash) {
      currentPasswordValid = await bcrypt.compare(currentPassword, student.password_hash);
    } else {
      currentPasswordValid = currentPassword === defaultPassword;
    }

    if (!currentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify student JWT token
const verifyStudentToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Student role required.' });
    }
    req.student = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Get student profile (protected route)
router.get('/student/profile', verifyStudentToken, async (req, res) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, name, email, id_number, college, section, year_level, created_at')
      .eq('id', req.student.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, verifyStudentToken };