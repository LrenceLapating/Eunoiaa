const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { SessionManager, verifyStudentSession, verifyCounselorSession } = require('../middleware/sessionManager');
const EmailService = require('../services/emailService');

const router = express.Router();
const sessionManager = new SessionManager();
const emailService = new EmailService();

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

    // Set session cookie (HTTP-only for security)
    res.cookie('sessionToken', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

    // Set session cookie
    res.cookie('sessionToken', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    let user = null;
    let userType = null;

    // Check if email exists in students table
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('email', email)
      .eq('status', 'active');

    if (studentError) {
      console.error('Database error checking students:', studentError);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    if (students && students.length > 0) {
      user = students[0];
      userType = 'student';
    } else {
      // Check if email exists in counselors table
      const { data: counselors, error: counselorError } = await supabase
        .from('counselors')
        .select('id, name, email')
        .eq('email', email)
        .eq('is_active', true);

      if (counselorError) {
        console.error('Database error checking counselors:', counselorError);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error' 
        });
      }

      if (counselors && counselors.length > 0) {
        user = counselors[0];
        userType = 'counselor';
      }
    }

    // If no user found, return success message for security (don't reveal if email exists)
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If the email exists in our system, a password reset email has been sent.' 
      });
    }

    // Generate random temporary password
    const temporaryPassword = emailService.generateRandomPassword();

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Update user's password in database
    const tableName = userType === 'student' ? 'students' : 'counselors';
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ password_hash: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update password' 
      });
    }

    // Find or create user in Supabase Auth and update metadata
    try {
      // First, try to find the user by email in Supabase Auth
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      let authUser = null;
      if (!listError && authUsers?.users) {
        authUser = authUsers.users.find(u => u.email === user.email);
      }

      if (!authUser) {
        // Create user in Supabase Auth if they don't exist
        console.log(`Creating Supabase Auth user for ${user.email}`);
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            temporary_password: temporaryPassword,
            reset_timestamp: new Date().toISOString(),
            user_type: userType,
            name: user.name,
            database_id: user.id
          }
        });

        if (createError) {
          console.error('Failed to create Supabase Auth user:', createError);
        } else {
          console.log('✅ Created Supabase Auth user with temporary password metadata');
          authUser = newAuthUser.user;
        }
      } else {
        // Update existing user's metadata
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          {
            user_metadata: {
              temporary_password: temporaryPassword,
              reset_timestamp: new Date().toISOString(),
              user_type: userType,
              name: user.name,
              database_id: user.id
            }
          }
        );

        if (metadataError) {
          console.error('Failed to update user metadata:', metadataError);
        } else {
          console.log('✅ Updated Supabase Auth user metadata with temporary password');
        }
      }
    } catch (metadataUpdateError) {
      console.error('Error managing Supabase Auth user:', metadataUpdateError);
      // Continue with email sending even if metadata update fails
    }

    // Send forgot password email
    const emailResult = await emailService.sendForgotPasswordEmail(
      {
        email: user.email,
        name: user.name,
        userType: userType
      },
      temporaryPassword
    );

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send password reset email' 
      });
    }

    console.log(`✅ Password reset successful for ${userType}: ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully. Please check your email for the temporary password.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
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
    res.clearCookie('sessionToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router };