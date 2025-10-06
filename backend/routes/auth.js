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

    // Check password (supports default, temporary, and custom passwords)
    const defaultPassword = 'student123';
    const temporaryPassword = 'L3mb4y';
    let passwordValid = false;

    if (student.password_hash) {
      // If student has a custom password, check it
      passwordValid = await bcrypt.compare(password, student.password_hash);
    } else {
      // Use default password or temporary password
      passwordValid = password === defaultPassword || password === temporaryPassword;
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

    // Detect iOS Safari for cookie compatibility
    const userAgentString = req.get('User-Agent') || '';
    const isIOSSafari = /iPad|iPhone|iPod/.test(userAgentString) && /Safari/.test(userAgentString) && !/CriOS|FxiOS/.test(userAgentString);
    
    // Set session cookie with iOS Safari compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    // iOS Safari specific cookie settings
    if (isIOSSafari) {
      // For iOS Safari, use 'lax' sameSite to avoid cookie blocking issues
      cookieOptions.sameSite = 'lax';
    } else {
      // For other browsers, use the original logic
      cookieOptions.sameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
    }
    
    res.cookie('sessionToken', sessionData.sessionToken, cookieOptions);

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

    // Verify current password (supports default, temporary, and custom passwords)
    const defaultPassword = 'student123';
    const temporaryPassword = 'L3mb4y';
    let currentPasswordValid = false;

    if (student.password_hash) {
      currentPasswordValid = await bcrypt.compare(currentPassword, student.password_hash);
    } else {
      currentPasswordValid = currentPassword === defaultPassword || currentPassword === temporaryPassword;
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

    // Detect iOS Safari for cookie compatibility
    const userAgentString = req.get('User-Agent') || '';
    const isIOSSafari = /iPad|iPhone|iPod/.test(userAgentString) && /Safari/.test(userAgentString) && !/CriOS|FxiOS/.test(userAgentString);
    
    // Set session cookie with iOS Safari compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    // iOS Safari specific cookie settings
    if (isIOSSafari) {
      // For iOS Safari, use 'lax' sameSite to avoid cookie blocking issues
      cookieOptions.sameSite = 'lax';
    } else {
      // For other browsers, use the original logic
      cookieOptions.sameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
    }
    
    res.cookie('sessionToken', sessionData.sessionToken, cookieOptions);

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
      return res.status(404).json({ success: false, error: 'Counselor not found' });
    }

    res.json({ success: true, counselor });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update counselor profile (protected route)
router.put('/counselor/profile', verifyCounselorSession, async (req, res) => {
  try {
    const { name, email, college, role, bio } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (college) updateData.college = college;
    if (role) updateData.role = role;
    // Note: bio field doesn't exist in counselors table schema, but keeping for future use
    
    const { data: counselor, error } = await supabase
      .from('counselors')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, name, email, college, role, created_at')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update profile' });
    }

    res.json({ success: true, counselor, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Change counselor password (protected route)
router.post('/counselor/change-password', verifyCounselorSession, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    // Get current counselor data
    const { data: counselor, error: fetchError } = await supabase
      .from('counselors')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, counselor.password_hash);
    if (!passwordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await supabase
      .from('counselors')
      .update({ 
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update password' });
    }

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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

    // Detect iOS Safari for cookie compatibility
    const userAgent = req.get('User-Agent') || '';
    const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
    
    // Clear session cookie with iOS Safari compatibility
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };
    
    // iOS Safari specific cookie settings
    if (isIOSSafari) {
      clearCookieOptions.sameSite = 'lax';
    } else {
      clearCookieOptions.sameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
    }
    
    res.clearCookie('sessionToken', clearCookieOptions);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router };