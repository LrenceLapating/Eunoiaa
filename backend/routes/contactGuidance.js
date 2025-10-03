const express = require('express');
const { verifyStudentSession } = require('../middleware/sessionManager');
const EmailService = require('../services/emailService');

const router = express.Router();
const emailService = new EmailService();

/**
 * POST /api/student/contact-guidance
 * Send contact guidance email from student to counselor
 */
router.post('/contact-guidance', verifyStudentSession, async (req, res) => {
  try {
    const { to, from, fromName, subject, message } = req.body;

    // Validate required fields
    if (!to || !from || !fromName || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: to, from, fromName, subject, message'
      });
    }

    // Validate subject and message length
    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Subject must be 200 characters or less'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message must be 2000 characters or less'
      });
    }

    // Validate recipient email (must be the counselor)
    if (to !== 'gparas@uic.edu.ph') {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient email'
      });
    }

    // Verify that the student is sending from their own email
    const studentId = req.user.id;
    const { supabase } = require('../config/database');
    
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('email, name')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(403).json({
        success: false,
        error: 'Unable to verify student identity'
      });
    }

    // Verify the from email matches the student's email
    if (from !== student.email) {
      return res.status(403).json({
        success: false,
        error: 'You can only send emails from your registered email address'
      });
    }

    // Send the email using the email service
    const result = await emailService.sendContactGuidanceEmail({
      to,
      from,
      fromName,
      subject,
      message
    });

    if (result.success) {
      // Log the contact guidance activity
      const logger = require('../config/logger');
      logger.info('Contact guidance email sent', {
        studentId: studentId,
        studentEmail: from,
        studentName: fromName,
        counselorEmail: to,
        subject: subject,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Contact guidance endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;