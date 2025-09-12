<template>
  <div class="account-management-bg">
    <transition name="card-fade-slide">
      <div class="account-management-container">
        <!-- College View -->
        <div v-if="!selectedCollege" class="account-table-wrapper">
          <div class="account-header">
            <div class="header-actions">
              <div class="action-buttons">
                <input 
                  type="file" 
                  ref="fileInput" 
                  accept=".csv" 
                  style="display:none" 
                  @change="handleFileUpload"
                />
                <button class="add-student-btn" @click="openAddStudentModal">
                  <i class="fas fa-user-plus"></i> Add Student
                </button>
                <button class="upload-btn" @click="showUploadModal = true">
                  <i class="fas fa-upload"></i> Upload CSV
                </button>
                <button class="template-btn" @click="downloadTemplate">
                  <i class="fas fa-download"></i> Download Template
                </button>
              </div>
              <span class="format-text">Format: Name, Section, College, ID Number, Email, Year Level, Semester (optional)</span>
            </div>
          </div>
          
          <!-- Notification -->
          <div v-if="notification.show" :class="['notification', notification.type]">
            <i :class="notification.icon"></i>
            <span>{{ notification.message }}</span>
            <button class="close-notification" @click="notification.show = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <table class="account-table">
            <thead>
              <tr>
                <th>College Name</th>
                <th>Total Users</th>
                <th>Action</th>
              </tr>
            </thead>
            <transition-group name="row-fade-slide" tag="tbody">
              <tr v-for="(college, idx) in colleges" :key="college.name">
                <td>{{ college.name }}</td>
                <td>{{ college.users }}</td>
                <td>
                  <button class="view-btn" @click="viewCollegeUsers(college.name)">View</button>
                </td>
              </tr>
            </transition-group>
          </table>
        </div>

        <!-- User List View -->
        <div v-else class="account-table-wrapper">
          <div class="college-header">
            <h3>College: {{ selectedCollege }}</h3>
            <div class="search-container">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Search by name, ID number or email..." v-model="searchQuery">
            </div>
            <button class="back-btn" @click="selectedCollege = null">
              <i class="fas fa-arrow-left"></i> Back
            </button>
          </div>
          
          <table class="account-table users-table">
            <thead>
              <tr>
                <th>ID Number</th>
                <th>Name</th>
                <th>Year Level</th>
                <th>Section</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <transition-group name="row-fade-slide" tag="tbody">
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.yearLevel }}</td>
                <td>{{ user.section }}</td>
                <td>{{ user.email }}</td>
                <td class="actions-cell">
                  <button class="edit-btn" title="Edit User" @click="editStudent(user)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="delete-btn" title="Delete User" @click="deleteStudent(user)">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            </transition-group>
          </table>
        </div>
      </div>
    </transition>

    <!-- Upload CSV Modal -->
    <div v-if="showUploadModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Upload Student Accounts CSV</h3>
          <button class="close-modal" @click="showUploadModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <div class="checkbox-container">
              <label for="deactivate-checkbox" class="checkbox-label">Deactivate Previous Students</label>
              <input type="checkbox" v-model="deactivatePrevious" class="deactivate-checkbox" id="deactivate-checkbox">
            </div>
            <p class="checkbox-description">Check this to deactivate students from the previous list who are not in the new upload. They will become ineligible for bulk assessments but their history will be retained.</p>
          </div>
          <div 
            class="drop-area"
            @dragover.prevent="dragOverHandler"
            @dragleave.prevent="dragLeaveHandler"
            @drop.prevent="dropHandler"
            @click="triggerFileInput"
          >
            <input 
              type="file" 
              ref="modalFileInput" 
              accept=".csv" 
              style="display:none" 
              @change="handleModalFileUpload"
            />
            <p>Drag & Drop your CSV file here, or click to select</p>
            <p class="file-name" v-if="uploadedFileName">{{ uploadedFileName }}</p>
          </div>
          <p class="format-text">Format: Name, Section, College, ID Number, Email, Year Level, Semester (optional)</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showUploadModal = false">Cancel</button>
          <button class="submit-btn" @click="confirmUpload" :disabled="!uploadedFile">Upload</button>
        </div>
      </div>
    </div>

    <!-- Upload Loading Modal -->
    <div v-if="showUploadLoadingModal" class="modal-overlay">
      <div class="modal-content upload-loading-modal">
        <div class="modal-body">
          <div v-if="uploadLoadingState === 'loading'" class="loading-content">
            <div class="spinner-container">
              <i class="fas fa-spinner fa-spin loading-spinner"></i>
            </div>
            <h3>Uploading CSV File...</h3>
            <p>Please wait while we process your file.</p>
          </div>
          <div v-else-if="uploadLoadingState === 'success'" class="success-content">
            <div class="success-icon-container">
              <i class="fas fa-check-circle success-icon"></i>
            </div>
            <h3>Upload Successful!</h3>
            <p>{{ uploadResultMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Student Modal -->
    <div v-if="showAddStudentModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Student</h3>
          <button class="close-modal" @click="closeAddStudentModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addStudent">
            <div class="form-row">
              <div class="form-group">
                <label for="student-name">Full Name *</label>
                <input 
                  type="text" 
                  id="student-name" 
                  v-model="studentForm.name" 
                  required 
                  placeholder="Enter student's full name"
                >
              </div>
              <div class="form-group">
                <label for="student-id">ID Number *</label>
                <input 
                  type="text" 
                  id="student-id" 
                  v-model="studentForm.id_number" 
                  required 
                  placeholder="Enter student ID number"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="student-email">Email *</label>
                <input 
                  type="email" 
                  id="student-email" 
                  v-model="studentForm.email" 
                  required 
                  placeholder="Enter email address"
                >
              </div>
              <div class="form-group">
                <label for="student-section">Section *</label>
                <input 
                  type="text" 
                  id="student-section" 
                  v-model="studentForm.section" 
                  required 
                  placeholder="Enter section (e.g., CS-1A)"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="student-college">College *</label>
                <select id="student-college" v-model="studentForm.college" required>
                  <option value="">Select College</option>
                  <option v-for="college in colleges" :key="college.name" :value="college.name">
                    {{ college.name }}
                  </option>
                  <option value="other">Other (specify below)</option>
                </select>
                <input 
                  v-if="studentForm.college === 'other'" 
                  type="text" 
                  v-model="studentForm.customCollege" 
                  placeholder="Enter college name"
                  class="custom-college-input"
                >
              </div>
              <div class="form-group">
                <label for="student-year">Year Level *</label>
                <select id="student-year" v-model="studentForm.year_level" required>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                  <option value="6">6th Year</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="student-semester">Semester</label>
              <select id="student-semester" v-model="studentForm.semester">
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddStudentModal">Cancel</button>
          <button class="submit-btn" @click="addStudent">Add Student</button>
        </div>
      </div>
    </div>

    <!-- Edit Student Modal -->
    <div v-if="showEditStudentModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Student</h3>
          <button class="close-modal" @click="closeEditStudentModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateStudent">
            <div class="form-row">
              <div class="form-group">
                <label for="edit-student-name">Full Name *</label>
                <input 
                  type="text" 
                  id="edit-student-name" 
                  v-model="studentForm.name" 
                  required 
                  placeholder="Enter student's full name"
                >
              </div>
              <div class="form-group">
                <label for="edit-student-id">ID Number *</label>
                <input 
                  type="text" 
                  id="edit-student-id" 
                  v-model="studentForm.id_number" 
                  required 
                  placeholder="Enter student ID number"
                  :disabled="true"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-student-email">Email *</label>
                <input 
                  type="email" 
                  id="edit-student-email" 
                  v-model="studentForm.email" 
                  required 
                  placeholder="Enter email address"
                >
              </div>
              <div class="form-group">
                <label for="edit-student-section">Section *</label>
                <input 
                  type="text" 
                  id="edit-student-section" 
                  v-model="studentForm.section" 
                  required 
                  placeholder="Enter section (e.g., CS-1A)"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-student-college">College *</label>
                <select id="edit-student-college" v-model="studentForm.college" required>
                  <option value="">Select College</option>
                  <option v-for="college in colleges" :key="college.name" :value="college.name">
                    {{ college.name }}
                  </option>
                  <option value="other">Other (specify below)</option>
                </select>
                <input 
                  v-if="studentForm.college === 'other'" 
                  type="text" 
                  v-model="studentForm.customCollege" 
                  placeholder="Enter college name"
                  class="custom-college-input"
                >
              </div>
              <div class="form-group">
                <label for="edit-student-year">Year Level *</label>
                <select id="edit-student-year" v-model="studentForm.year_level" required>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                  <option value="6">6th Year</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="edit-student-semester">Semester</label>
              <select id="edit-student-semester" v-model="studentForm.semester">
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEditStudentModal">Cancel</button>
          <button class="submit-btn" @click="updateStudent">Update Student</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay">
      <div class="modal-content delete-modal">
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-modal" @click="showDeleteConfirmModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Are you sure you want to delete this student?</p>
            <div class="student-info" v-if="currentStudent">
              <strong>{{ currentStudent.name }}</strong><br>
              ID: {{ currentStudent.id }}<br>
              Email: {{ currentStudent.email }}
            </div>
            <p class="warning-text">This action cannot be undone. The student's assessment history will be preserved but they will be marked as inactive.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showDeleteConfirmModal = false">Cancel</button>
          <button class="delete-confirm-btn" @click="confirmDeleteStudent">Delete Student</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiUrl } from '../../utils/apiUtils.js';

export default {
  name: 'AccountManagement',
  async mounted() {
    // Load initial data from backend
    await this.loadCollegesFromBackend();
  },
  data() {
    return {
      // API configuration - uses environment variable for production

      selectedCollege: null,
      searchQuery: '',
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      },
      colleges: [], // Will be populated from backend API
      users: [], // Will be populated from backend API
      showUploadModal: false,
      showUploadLoadingModal: false,
      uploadLoadingState: 'loading', // 'loading' or 'success'
      uploadResultMessage: '',
      deactivatePrevious: false,
      uploadedFile: null,
      uploadedFileName: '',
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      showAddStudentModal: false,
      showEditStudentModal: false,
      showDeleteConfirmModal: false,
      editingStudentId: null,
      studentToDelete: null,
      studentForm: {
        name: '',
        email: '',
        section: '',
        college: '',
        id_number: '',
        year_level: '',
        semester: '1st Semester',
        customCollege: ''
      }
    }
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery) {
        return this.users.filter(user => user.college === this.selectedCollege);
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.users.filter(user => {
        return (
          (user.name.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.section.toLowerCase().includes(query))
          && user.college === this.selectedCollege
        );
      });
    }
  },
  methods: {
    async viewCollegeUsers(collegeName) {
      this.selectedCollege = collegeName;
      this.searchQuery = '';
      // Load students for the selected college from backend
      await this.loadStudentsFromBackend(collegeName, this.searchQuery);
    },
    
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Check if it's a CSV file
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        this.showNotification('Please upload a valid CSV file', 'error', 'fas fa-exclamation-circle');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        this.processCSV(content);
      };
      reader.readAsText(file);
      
      // Reset the file input so the same file can be uploaded again if needed
      event.target.value = '';
    },
    
    processCSV(csvContent) {
      // Split the CSV content into lines
      const lines = csvContent.split('\n');
      if (lines.length < 2) {
        this.showNotification('The CSV file is empty or invalid', 'error', 'fas fa-exclamation-circle');
        return;
      }
      
      // Get header row and check format
      const headers = lines[0].split(',').map(header => header.trim());
      const requiredHeaders = ['Name', 'Section', 'College', 'ID Number', 'Email', 'Year Level'];
      const optionalHeaders = ['Semester'];
      
      // Check if all required headers are present
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        this.showNotification(`Missing headers: ${missingHeaders.join(', ')}`, 'error', 'fas fa-exclamation-circle');
        return;
      }
      
      // Process data rows
      const nameIndex = headers.indexOf('Name');
      const sectionIndex = headers.indexOf('Section');
      const collegeIndex = headers.indexOf('College');
      const idIndex = headers.indexOf('ID Number');
      const emailIndex = headers.indexOf('Email');
      const yearLevelIndex = headers.indexOf('Year Level');
      
      let newColleges = 0;
      let newUsers = 0;
      let existingColleges = new Set(this.colleges.map(college => college.name));
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        // Skip empty lines
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) continue;
        
        const name = values[nameIndex];
        const section = values[sectionIndex];
        const college = values[collegeIndex];
        const id = values[idIndex];
        const email = values[emailIndex];
        const yearLevel = values[yearLevelIndex];
        
        // Skip if any required field is empty
        if (!name || !section || !college || !id || !email || !yearLevel) continue;
        
        // Check if the college exists
        if (!existingColleges.has(college)) {
          // Add new college
          this.colleges.push({ name: college, users: 0 });
          existingColleges.add(college);
          newColleges++;
        }
        
        // Check if the user already exists
        const userExists = this.users.some(user => user.id === id);
        if (!userExists) {
          // Add new user
          this.users.push({
            name,
            section,
            id,
            email,
            college: college, // Use college column instead of department
            yearLevel
          });
          
          // Update college user count
          const collegeIndex = this.colleges.findIndex(college_item => college_item.name === college);
          if (collegeIndex !== -1) {
            this.colleges[collegeIndex].users++;
          }
          
          newUsers++;
        };
      }
      
      // Emit updated student data to parent
      this.emitStudentData();
      
      // Show success notification
      let message = '';
      if (newColleges > 0 && newUsers > 0) {
        message = `Added ${newColleges} new colleges and ${newUsers} new users`;
      } else if (newColleges > 0) {
        message = `Added ${newColleges} new colleges`;
      } else if (newUsers > 0) {
        message = `Added ${newUsers} new users`;
      } else {
        message = 'No new data was added';
      }
      
      this.showNotification(message, newUsers > 0 ? 'success' : 'info', 
                          newUsers > 0 ? 'fas fa-check-circle' : 'fas fa-info-circle');
    },
    
    downloadTemplate() {
      // Download Excel template from backend API
      const link = document.createElement('a');
      link.href = apiUrl('accounts/csv-template');
      link.download = 'student_template.xlsx';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    showNotification(message, type = 'success', icon = 'fas fa-check-circle') {
      this.notification = {
        show: true,
        message,
        type,
        icon
      };
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.notification.show = false;
      }, 5000);
    },
    
    // Modal related methods
    dragOverHandler(event) {
      event.currentTarget.classList.add('drag-over');
    },
    dragLeaveHandler(event) {
      event.currentTarget.classList.remove('drag-over');
    },
    dropHandler(event) {
      event.currentTarget.classList.remove('drag-over');
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.uploadedFile = files[0];
        this.uploadedFileName = files[0].name;
      }
    },
    triggerFileInput() {
      this.$refs.modalFileInput.click();
    },
    handleModalFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.uploadedFile = file;
        this.uploadedFileName = file.name;
      }
    },
    async confirmUpload() {
      if (!this.uploadedFile) {
        this.showNotification('Please upload a CSV file.', 'error', 'fas fa-exclamation-circle');
        return;
      }

      // Check if it's a CSV file before processing
      if (this.uploadedFile.type !== 'text/csv' && !this.uploadedFile.name.endsWith('.csv')) {
        this.showNotification('Please upload a valid CSV file', 'error', 'fas fa-exclamation-circle');
        return;
      }
      
      // Close upload modal immediately and show loading modal
      this.showUploadModal = false;
      this.showUploadLoadingModal = true;
      this.uploadLoadingState = 'loading';
      
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('csvFile', this.uploadedFile);
        formData.append('deactivatePrevious', this.deactivatePrevious);
        
        // Send to backend API
        const response = await fetch(apiUrl('accounts/upload-csv'), {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Success - refresh data from backend
          await this.loadCollegesFromBackend();
          
          // If currently viewing a specific college, refresh the student list too
          if (this.selectedCollege) {
            await this.loadStudentsFromBackend(this.selectedCollege, this.searchQuery);
          }
          
          let message = `${result.studentsProcessed} students processed. ` +
                       `${result.studentsInserted} new students added, ${result.studentsUpdated} students updated.`;
          
          // Include deactivation info if applicable
          if (result.studentsDeactivated !== undefined) {
            message += ` ${result.studentsDeactivated} previous students deactivated.`;
            // Emit event to notify other components about deactivation
            this.$emit('students-deactivated', {
              deactivatedCount: result.studentsDeactivated,
              timestamp: new Date().toISOString()
            });
          }
          
          // Show success state in loading modal
          this.uploadLoadingState = 'success';
          this.uploadResultMessage = message;
          
          // Close loading modal after showing success for 3 seconds
          setTimeout(() => {
            this.showUploadLoadingModal = false;
            this.uploadedFile = null;
            this.uploadedFileName = '';
          }, 3000);
        } else {
          // Handle validation errors
          let errorMessage;
          if (result.errors && result.errors.length > 0) {
            errorMessage = `Upload failed: ${result.errors.slice(0, 3).join(', ')}`;
          } else {
            errorMessage = result.error || 'Upload failed';
          }
          
          // Close loading modal and show error notification
          this.showUploadLoadingModal = false;
          this.showNotification(errorMessage, 'error', 'fas fa-exclamation-circle');
          this.uploadedFile = null;
          this.uploadedFileName = '';
        }
      } catch (error) {
        console.error('Upload error:', error);
        
        // Close loading modal and show error notification
        this.showUploadLoadingModal = false;
        this.showNotification('Network error. Please check if the backend server is running.', 'error', 'fas fa-exclamation-circle');
        this.uploadedFile = null;
        this.uploadedFileName = '';
      }
      
      // Reset deactivate option
      this.deactivatePrevious = false;
    },
    
    // Load colleges data from backend
    async loadCollegesFromBackend() {
      try {
        const response = await fetch(apiUrl('accounts/colleges'));
        if (response.ok) {
          const data = await response.json();
          this.colleges = data.colleges.map(college => ({
            name: college.name,
            users: college.totalUsers
          }));
        } else {
          console.error('Failed to load colleges from backend');
        }
      } catch (error) {
        console.error('Error loading colleges:', error);
      }
    },
    
    // Load students data from backend
    async loadStudentsFromBackend(college = 'all', search = '') {
      try {
        const params = new URLSearchParams({
          college: college,
          search: search,
          page: 1,
          limit: 100
        });
        
        const response = await fetch(apiUrl(`accounts/students?${params}`));
        if (response.ok) {
          const data = await response.json();
          this.users = data.students.map(student => ({
            id: student.id_number,
            name: student.name,
            college: student.college,
            section: student.section,
            email: student.email,
            yearLevel: student.year_level
          }));
          this.emitStudentData();
        } else {
          console.error('Failed to load students from backend');
        }
      } catch (error) {
        console.error('Error loading students:', error);
      }
    },
    
    // Emit student data to parent component
    emitStudentData() {
      // Transform users data to match the format expected by RyffScoring
      const studentsWithAssessmentData = this.users.map(user => ({
        id: user.id,
        name: user.name,
        college: user.college,
        section: user.section,
        email: user.email,
        yearLevel: user.yearLevel,
        submissionDate: '2024-06-08', // Default submission date
        subscales: {
          // Default assessment scores - in real app, these would come from actual assessments
          autonomy: 3.5,
          environmentalMastery: 4.0,
          personalGrowth: 3.8,
          positiveRelations: 3.6,
          purposeInLife: 3.7,
          selfAcceptance: 3.9
        }
      }));
      
      this.$emit('students-updated', studentsWithAssessmentData);
    },

    // Individual student management methods
    openAddStudentModal() {
      this.resetStudentForm();
      this.showAddStudentModal = true;
    },

    closeAddStudentModal() {
      this.showAddStudentModal = false;
      this.resetStudentForm();
    },

    closeEditStudentModal() {
      this.showEditStudentModal = false;
      this.resetStudentForm();
    },

    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false;
      this.studentToDelete = null;
    },

    editStudent(user) {
      this.studentForm = {
        name: user.name,
        email: user.email,
        section: user.section,
        college: user.college,
        id_number: user.id,
        year_level: user.yearLevel,
        semester: user.semester || '1st Semester',
        customCollege: ''
      };
      this.editingStudentId = user.id;
      this.showEditStudentModal = true;
    },

    deleteStudent(user) {
      this.studentToDelete = user;
      this.showDeleteConfirmModal = true;
    },

    addStudent() {
      this.saveStudent();
    },

    updateStudent() {
      this.saveStudent();
    },

    resetStudentForm() {
      this.studentForm = {
        name: '',
        email: '',
        section: '',
        college: '',
        id_number: '',
        year_level: '',
        semester: '1st Semester',
        customCollege: ''
      };
      this.editingStudentId = null;
    },

    async saveStudent() {
      try {
        // Validate form
        if (!this.studentForm.name || !this.studentForm.email || !this.studentForm.id_number || 
            !this.studentForm.college || !this.studentForm.year_level) {
          this.showNotification('Please fill in all required fields', 'error', 'fas fa-exclamation-circle');
          return;
        }

        // Handle custom college
        let collegeName = this.studentForm.college;
        if (this.studentForm.college === 'other' && this.studentForm.customCollege) {
          collegeName = this.studentForm.customCollege.trim();
        }

        // Prepare student data
        const studentData = {
          name: this.studentForm.name.trim(),
          email: this.studentForm.email.trim(),
          section: this.studentForm.section.trim(),
          college: collegeName,
          id_number: this.studentForm.id_number.trim(),
          year_level: this.studentForm.year_level,
          semester: this.studentForm.semester
        };

        let response;
        if (this.editingStudentId) {
          // Update existing student
          response = await fetch(apiUrl(`accounts/students/${this.editingStudentId}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
          });
        } else {
          // Add new student
          response = await fetch(apiUrl('accounts/students'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
          });
        }

        const result = await response.json();

        if (response.ok) {
          // Success - refresh data
          await this.loadCollegesFromBackend();
          if (this.selectedCollege) {
            await this.loadStudentsFromBackend(this.selectedCollege, this.searchQuery);
          }

          const action = this.editingStudentId ? 'updated' : 'added';
          this.showNotification(`Student ${action} successfully!`, 'success', 'fas fa-check-circle');
          
          // Close modal
          this.showAddStudentModal = false;
          this.showEditStudentModal = false;
          this.resetStudentForm();
        } else {
          this.showNotification(result.error || `Failed to ${this.editingStudentId ? 'update' : 'add'} student`, 'error', 'fas fa-exclamation-circle');
        }
      } catch (error) {
        console.error('Error saving student:', error);
        this.showNotification('Network error. Please check if the backend server is running.', 'error', 'fas fa-exclamation-circle');
      }
    },

    async confirmDeleteStudent() {
      try {
        const response = await fetch(apiUrl(`accounts/students/${this.studentToDelete.id}`), {
          method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
          // Success - refresh data
          await this.loadCollegesFromBackend();
          if (this.selectedCollege) {
            await this.loadStudentsFromBackend(this.selectedCollege, this.searchQuery);
          }

          this.showNotification('Student deleted successfully!', 'success', 'fas fa-check-circle');
          
          // Close modal
          this.showDeleteConfirmModal = false;
          this.studentToDelete = null;
        } else {
          this.showNotification(result.error || 'Failed to delete student', 'error', 'fas fa-exclamation-circle');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        this.showNotification('Network error. Please check if the backend server is running.', 'error', 'fas fa-exclamation-circle');
      }
    },

    cancelAddStudent() {
      this.showAddModal = false;
      this.resetStudentForm();
    },

    cancelEditStudent() {
      this.showEditModal = false;
      this.resetStudentForm();
    },

    cancelDelete() {
      this.showDeleteModal = false;
      this.studentToDelete = null;
    }
  }
}
</script>

<style scoped>
.account-management-bg {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.account-management-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
}

.account-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fff;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-actions h2 {
  margin: 0;
  color: var(--dark);
  font-size: 20px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.add-student-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #00b3b0 0%, #00a09d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 179, 176, 0.2);
}

.add-student-btn:hover {
  background: linear-gradient(135deg, #00a09d 0%, #008f8c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.3);
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #00b3b0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background-color: #009491;
}

.template-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  color: #546e7a;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.template-btn:hover {
  background-color: #f5f5f5;
}

.format-text {
  color: #78909c;
  font-size: 14px;
}

/* Notification */
.notification {
  padding: 12px 20px;
  margin: 10px 20px 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease-out;
  position: relative;
}

.notification.success {
  background-color: rgba(76, 175, 80, 0.1);
  color: #388e3c;
  border-left: 4px solid #4caf50;
}

.notification.error {
  background-color: rgba(244, 67, 54, 0.1);
  color: #d32f2f;
  border-left: 4px solid #f44336;
}

.notification.info {
  background-color: rgba(33, 150, 243, 0.1);
  color: #1976d2;
  border-left: 4px solid #2196f3;
}

.notification i {
  font-size: 16px;
}

.close-notification {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  padding: 5px;
}

.close-notification:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.account-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.college-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  border-bottom: 2px solid #e5e7eb;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.college-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  position: absolute;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.college-header h3::before {
  content: '🏫';
  font-size: 18px;
}

.search-container {
  position: relative;
  width: 420px;
  max-width: 50%;
}

.search-container i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 16px;
}

.search-container input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  color: #374151;
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.search-container input:focus {
  outline: none;
  border-color: #00b3b0;
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
  background-color: #fafbfc;
}

.search-container input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.back-btn {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: absolute;
  right: 24px;
}

.back-btn:hover {
  background: linear-gradient(135deg, #00b3b0 0%, #00a09d 100%);
  color: white;
  border-color: #00b3b0;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 179, 176, 0.2);
}

.back-btn i {
  font-size: 14px;
}

.account-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.account-table th {
  text-align: left;
  padding: 18px 20px;
  color: #374151;
  font-weight: 700;
  font-size: 0.9em;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-weight: 500;
}

.account-table tr:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: scale(1.001);
  transition: all 0.2s ease;
}

.account-table tbody tr {
  transition: all 0.2s ease;
}

.account-table tbody tr:nth-child(even) {
  background-color: #fafbfc;
}

.view-btn {
  background: linear-gradient(135deg, #00b3b0 0%, #00a09d 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 179, 176, 0.2);
}

.view-btn:hover {
  background: linear-gradient(135deg, #00a09d 0%, #008f8c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 179, 176, 0.3);
}

.actions-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.edit-btn, .delete-btn {
  background-color: transparent;
  border: 2px solid transparent;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.edit-btn {
  color: #00b3b0;
  border-color: #e0f7fa;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #00b3b0 0%, #00a09d 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 179, 176, 0.2);
}

.delete-btn {
  color: #ef4444;
  border-color: #fef2f2;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
}

/* Animations */
.card-fade-slide-enter-active {
  transition: all 0.3s ease-out;
}

.card-fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.row-fade-slide-enter-active {
  transition: all 0.2s ease-out;
}

.row-fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.row-fade-slide-move {
  transition: transform 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 550px;
  overflow: hidden;
  animation: fadeInScale 0.3s ease-out forwards;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 30px;
  background: linear-gradient(135deg, #00b3b0 0%, #00a09d 100%);
  border-bottom: none;
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5em;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h3::before {
  content: '👤';
  font-size: 1.2em;
}

.close-modal {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.4em;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-modal:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  padding: 30px;
  background-color: #fafbfc;
  min-height: 200px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.95em;
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #fff;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #00b3b0;
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
  background-color: #fafafa;
}

.form-group input::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row .form-group {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

/* Checkbox Styles */
.checkbox-container {
  display: flex;
  align-items: center;
  padding: 12px 15px; /* Adds space inside the container */
  border: 1px solid #e5e7eb; /* Subtle border */
  border-radius: 8px;
  background-color: #f9fafb;
  margin-bottom: 15px;
}

.checkbox-label {
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.deactivate-checkbox {
  width: 16px; /* Match font size */
  height: 16px; /* Match font size */
  cursor: pointer;
  accent-color: #00b3b0;
  margin-left: auto; /* Pushes checkbox to the right */
}

.deactivate-checkbox:focus {
  outline: 2px solid #00b3b0;
  outline-offset: 2px;
}

.checkbox-description {
  margin: 0 0 16px 0;
  font-size: 0.85em;
  color: #6b7280;
  line-height: 1.4;
  font-weight: 400;
}

.drop-area {
  border: 2px dashed #a0a0a0;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  background-color: #f9f9f9;
  color: #666;
}

.drop-area:hover,
.drop-area.drag-over {
  background-color: #e9f5ff;
  border-color: #007bff;
  color: #007bff;
}

.drop-area p {
  margin: 0;
  font-size: 1.1em;
}

.drop-area .file-name {
  margin-top: 10px;
  font-weight: bold;
  color: #333;
}

.format-text {
  margin-top: 20px;
  font-size: 0.9em;
  color: #777;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 30px;
  border-top: 1px solid #e5e7eb;
  background-color: #fff;
}

.modal-footer button {
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  min-width: 100px;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #6b7280;
  border-color: #d1d5db;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
  color: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #00b3b0 0%, #00a09d 100%);
  color: #fff;
  border-color: #00b3b0;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #00a09d 0%, #008f8c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.3);
}

.submit-btn:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.delete-confirm-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border-color: #ef4444;
}

.delete-confirm-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Animations */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .account-management-container {
    padding: 10px;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-bar {
    width: 100%;
    margin-bottom: 10px;
  }

  .upload-btn {
    width: 100%;
  }

  .users-table {
    overflow-x: auto;
  }

  .users-table table {
    min-width: 700px;
  }

  .notification {
    width: 90%;
    left: 5%;
    transform: translateX(0);
  }

  .modal-content {
    width: 95%;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 15px;
  }

  .drop-area {
    padding: 25px;
  }
}

/* Upload Loading Modal Styles */
.upload-loading-modal {
  max-width: 400px;
  text-align: center;
}

.upload-loading-modal .modal-body {
  padding: 40px 30px;
  background-color: #fff;
}

.loading-content,
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner-container {
  margin-bottom: 10px;
}

.loading-spinner {
  font-size: 3rem;
  color: #00b3b0;
  animation: spin 1s linear infinite;
}

.success-icon-container {
  margin-bottom: 10px;
}

.success-icon {
  font-size: 3rem;
  color: #4CAF50;
  animation: successPulse 0.6s ease-out;
}

.upload-loading-modal h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #374151;
  font-weight: 600;
}

.upload-loading-modal p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes successPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

</style>