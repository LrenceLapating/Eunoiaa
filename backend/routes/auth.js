const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { SessionManager, verifyStudentSession, verifyCounselorSession } = require('../middleware/sessionManager');

const router = express.Router();
const sessionManager = new SessionManager();

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

    // Create session in database
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const sessionData = await sessionManager.createSession(
      student.id,
      'student',
      ipAddress,
      userAgent
    );

    // Log login activity
    await sessionManager.logActivity(
      student.id,
      'student',
      'login',
      { method: 'password', id_number: student.id_number },
      ipAddress,
      userAgent
    );

    // Set session cookie (HTTP-only for security)
    res.cookie('sessionToken', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      sessionId: sessionData.sessionId,
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

// Add counselor login endpoint
router.post('/counselor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find counselor by email
    const { data: counselors, error } = await supabase
      .from('counselors')
      .select('*')
      .eq('email', email)
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!counselors || counselors.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const counselor = counselors[0];

    // Check password
    const passwordValid = await bcrypt.compare(password, counselor.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session in database
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const sessionData = await sessionManager.createSession(
      counselor.id,
      'counselor',
      ipAddress,
      userAgent
    );

    // Log login activity
    await sessionManager.logActivity(
      counselor.id,
      'counselor',
      'login',
      { method: 'password', email: counselor.email },
      ipAddress,
      userAgent
    );

    // Set session cookie
    res.cookie('sessionToken', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      sessionId: sessionData.sessionId,
      counselor: {
        id: counselor.id,
        name: counselor.name,
        email: counselor.email,
        college: counselor.college,
        role: counselor.role
      }
    });

  } catch (error) {
    console.error('Counselor login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student profile (protected route)
router.get('/student/profile', verifyStudentSession, async (req, res) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, name, email, id_number, college, section, year_level, created_at')
      .eq('id', req.user.id)
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

// Get counselor profile (protected route)
router.get('/counselor/profile', verifyCounselorSession, async (req, res) => {
  try {
    const { data: counselor, error } = await supabase
      .from('counselors')
      .select('id, name, email, college, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    res.json({ counselor });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // Get session token from cookie or header
    let sessionToken = req.cookies?.sessionToken;
    
    if (!sessionToken) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.replace('Bearer ', '');
      }
    }

    if (sessionToken) {
      // Validate session to get user info for logging
      const session = await sessionManager.validateSession(sessionToken);
      
      if (session) {
        // Log logout activity
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        await sessionManager.logActivity(
          session.user_id,
          session.user_type,
          'logout',
          { method: 'manual' },
          ipAddress,
          userAgent
        );
      }

      // Deactivate session
      await sessionManager.deactivateSession(sessionToken);
    }

    // Clear session cookie
    res.clearCookie('sessionToken');
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router };