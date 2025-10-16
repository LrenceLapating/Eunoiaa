const { supabase } = require('../config/database');

class EmailService {
  constructor() {
    this.temporaryPassword = 'L3mb4y';
  }

  /**
   * Send temporary password email to new student
   * @param {Object} studentData - Student information
   * @param {string} studentData.email - Student email
   * @param {string} studentData.name - Student name
   * @param {string} studentData.id_number - Student ID number
   * @returns {Promise<Object>} Result of email sending
   */
  async sendTemporaryPasswordEmail(studentData) {
    try {
      const { email, name, id_number } = studentData;

      if (!email || !name || !id_number) {
        throw new Error('Missing required student data for email');
      }

      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error checking existing users:', listError);
        return {
          success: false,
          error: `Failed to check existing users: ${listError.message}`
        };
      }

      // Find existing user by email
      const existingUser = existingUsers.users.find(user => user.email === email);
      let authUser;

      if (existingUser) {
        // User exists, use existing user
        console.log(`📧 User already exists for ${email}, using existing user`);
        authUser = { user: existingUser };
        
        // Update user metadata if needed
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              name: name,
              id_number: id_number,
              role: 'student'
            }
          }
        );
        
        if (updateError) {
          console.warn('Warning: Could not update user metadata:', updateError);
        }
      } else {
        // Create new user in Supabase Auth with temporary password
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: this.temporaryPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: name,
            id_number: id_number,
            role: 'student'
          }
        });

        if (authError) {
          console.error('Supabase Auth error:', authError);
          return {
            success: false,
            error: `Failed to create auth user: ${authError.message}`
          };
        }
        
        authUser = newUser;
        console.log(`✨ New user created for ${email}`);
      }

      // Send magic link email (this will actually send the email using your configured SendGrid SMTP)
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          data: {
            name: name,
            id_number: id_number,
            temporary_password: this.temporaryPassword
          }
        }
      });

      if (magicLinkError) {
        console.error('Magic link error:', magicLinkError);
        return {
          success: false,
          error: `Failed to send magic link: ${magicLinkError.message}`
        };
      }

      console.log(`✅ Email sent successfully to ${email} for student ${name} (${id_number})`);
      
      return {
        success: true,
        message: `Temporary password email sent to ${email}`,
        temporaryPassword: this.temporaryPassword,
        authUserId: authUser.user.id
      };

    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: `Email service failed: ${error.message}`
      };
    }
  }

  /**
   * Get the temporary password (for reference)
   * @returns {string} The temporary password
   */
  getTemporaryPassword() {
    return this.temporaryPassword;
  }

  /**
   * Validate if a password is the temporary password
   * @param {string} password - Password to validate
   * @returns {boolean} True if it's the temporary password
   */
  isTemporaryPassword(password) {
    return password === this.temporaryPassword;
  }

  /**
   * Generate a random temporary password
   * @returns {string} Random temporary password
   */
  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Send forgot password email with temporary password
   * @param {Object} userData - User information
   * @param {string} userData.email - User email
   * @param {string} userData.name - User name
   * @param {string} userData.userType - User type (student or counselor)
   * @param {string} temporaryPassword - Generated temporary password
   * @returns {Promise<Object>} Result of email sending
   */
  async sendForgotPasswordEmail(userData, temporaryPassword) {
    try {
      const { email, name, userType } = userData;

      if (!email || !name || !userType || !temporaryPassword) {
        throw new Error('Missing required data for forgot password email');
      }

      console.log('🔍 Sending reset password email to:', email);
      console.log('🔑 Temporary password stored in user metadata:', temporaryPassword);

      // Use Supabase Auth reset password function
      // The temporary password is now stored in user metadata and will be accessible in the email template
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`
      });

      if (resetError) {
        console.error('Supabase reset password error:', resetError);
        return {
          success: false,
          error: `Failed to send reset password email: ${resetError.message}`
        };
      }

      console.log(`✅ Forgot password email sent successfully to ${email} for ${userType} ${name}`);
      
      return {
        success: true,
        message: `Password reset email sent to ${email}`,
        temporaryPassword: temporaryPassword
      };

    } catch (error) {
      console.error('Forgot password email service error:', error);
      return {
        success: false,
        error: `Forgot password email service failed: ${error.message}`
      };
    }
  }

  /**
   * Send contact guidance email from student to counselor
   * @param {Object} emailData - Email information
   * @param {string} emailData.to - Counselor email (gparas@uic.edu.ph)
   * @param {string} emailData.from - Student email
   * @param {string} emailData.fromName - Student name
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.message - Email message
   * @returns {Promise<Object>} Result of email sending
   */
  async sendContactGuidanceEmail(emailData) {
    try {
      const { to, from, fromName, subject, message } = emailData;

      if (!to || !from || !fromName || !subject || !message) {
        throw new Error('Missing required email data');
      }

      // Validate recipient email (must be the counselor)
      if (to !== 'gparas@uic.edu.ph') {
        throw new Error('Invalid recipient email');
      }

      // Create formatted email content
      const emailContent = `
From: ${fromName} (${from})
Subject: ${subject}

Message:
${message}

---
This message was sent through the EUNOIA Contact Guidance system.
Student: ${fromName}
Email: ${from}
Sent at: ${new Date().toLocaleString()}
      `.trim();

      // Use Supabase Auth to send email (leveraging existing email configuration)
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: to,
        options: {
          data: {
            type: 'contact_guidance',
            from_student: from,
            from_name: fromName,
            subject: subject,
            message: message,
            email_content: emailContent
          }
        }
      });

      if (emailError) {
        console.error('Contact guidance email error:', emailError);
        return {
          success: false,
          error: `Failed to send contact guidance email: ${emailError.message}`
        };
      }

      console.log(`✅ Contact guidance email sent successfully from ${from} (${fromName}) to ${to}`);
      
      return {
        success: true,
        message: `Contact guidance email sent successfully to ${to}`
      };

    } catch (error) {
      console.error('Contact guidance email service error:', error);
      return {
        success: false,
        error: `Contact guidance email service failed: ${error.message}`
      };
    }
  }
}

module.exports = EmailService;