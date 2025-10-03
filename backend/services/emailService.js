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
}

module.exports = EmailService;