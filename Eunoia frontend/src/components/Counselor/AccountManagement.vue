<template>
  <div class="account-management-bg">
    <transition name="card-fade-slide">
      <div class="account-management-container">
        <!-- College View -->
        <div v-if="!selectedCollege" class="account-table-wrapper">
          <div class="account-header">
            <div class="header-actions">
              <h2>Account Management</h2>
              <div class="action-buttons">
                <input 
                  type="file" 
                  ref="fileInput" 
                  accept=".csv" 
                  style="display:none" 
                  @change="handleFileUpload"
                />
                <button class="upload-btn" @click="showUploadModal = true">
                  <i class="fas fa-upload"></i> Upload CSV
                </button>
                <button class="template-btn" @click="downloadTemplate">
                  <i class="fas fa-download"></i> Download Template
                </button>
              </div>
              <span class="format-text">Format: Name, Section, Department, ID Number, Email, Year Level</span>
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
              <tr v-for="(dept, idx) in departments" :key="dept.name">
                <td>{{ dept.name }}</td>
                <td>{{ dept.users }}</td>
                <td>
                  <button class="view-btn" @click="viewCollegeUsers(dept.name)">View</button>
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
                <th>Name</th>
                <th>Section</th>
                <th>ID Number</th>
                <th>Email</th>
                <th>Year Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <transition-group name="row-fade-slide" tag="tbody">
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.section }}</td>
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.yearLevel }}</td>
                <td class="actions-cell">
                  <button class="edit-btn" title="Edit User">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="delete-btn" title="Delete User">
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
            <label for="semester-select">Select Semester:</label>
            <select id="semester-select" v-model="selectedSemester">
              <option :value="null" disabled>Select a semester</option>
              <option v-for="sem in semesters" :key="sem" :value="sem">{{ sem }}</option>
            </select>
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
          <p class="format-text">Format: Name, Section, Department, ID Number, Email, Year Level</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showUploadModal = false">Cancel</button>
          <button class="submit-btn" @click="confirmUpload" :disabled="!uploadedFile || !selectedSemester">Upload</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccountManagement',
  data() {
    return {
      selectedCollege: null,
      searchQuery: '',
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      },
      departments: [
        { name: 'CCS', users: 5 },
        { name: 'CN', users: 3 },
        { name: 'COE', users: 3 },
        { name: 'CBA', users: 2 },
        { name: 'CAS', users: 2 }
      ],
      users: [
        // CCS Students (5 total)
        { name: 'Mike Johnson', section: 'BSIT1A', id: 'ST12347', email: 'mike.johnson@example.com', college: 'CCS', yearLevel: '1st Year' },
        { name: 'Sarah Williams', section: 'BSCS3A', id: 'ST12348', email: 'sarah.williams@example.com', college: 'CCS', yearLevel: '3rd Year' },
        { name: 'Kevin Wong', section: 'BSIT3A', id: 'ST12353', email: 'kevin.wong@example.com', college: 'CCS', yearLevel: '3rd Year' },
        { name: 'Emily Chen', section: 'BSCS4A', id: 'ST12360', email: 'emily.chen@example.com', college: 'CCS', yearLevel: '4th Year' },
        { name: 'David Park', section: 'BSIT4A', id: 'ST12361', email: 'david.park@example.com', college: 'CCS', yearLevel: '4th Year' },
        
        // CN Students (3 total)
        { name: 'Lisa Wang', section: 'BSN3A', id: 'ST12365', email: 'lisa.wang@example.com', college: 'CN', yearLevel: '3rd Year' },
        { name: 'Michael Torres', section: 'BSN4A', id: 'ST12366', email: 'michael.torres@example.com', college: 'CN', yearLevel: '4th Year' },
        { name: 'Jessica Martin', section: 'BSCS2B', id: 'ST12354', email: 'jessica.martin@example.com', college: 'CN', yearLevel: '2nd Year' },
        
        // COE Students (3 total)
        { name: 'Amanda Davis', section: 'BSCE2A', id: 'ST12369', email: 'amanda.davis@example.com', college: 'COE', yearLevel: '2nd Year' },
        { name: 'Robert Brown', section: 'BSCE3B', id: 'ST12351', email: 'robert.brown@example.com', college: 'COE', yearLevel: '3rd Year' },
        { name: 'Maria Rodriguez', section: 'BSCE4A', id: 'ST12362', email: 'maria.rodriguez@example.com', college: 'COE', yearLevel: '4th Year' },
        
        // CBA Students (2 total)
        { name: 'Rachel Green', section: 'BSBA2A', id: 'ST12367', email: 'rachel.green@example.com', college: 'CBA', yearLevel: '2nd Year' },
        { name: 'James Wilson', section: 'BSBA4A', id: 'ST12363', email: 'james.wilson@example.com', college: 'CBA', yearLevel: '4th Year' },
        
        // CAS Students (2 total)
        { name: 'Daniel Kim', section: 'BSPS3A', id: 'ST12368', email: 'daniel.kim@example.com', college: 'CAS', yearLevel: '3rd Year' },
        { name: 'Olivia Lee', section: 'BSPS4A', id: 'ST12364', email: 'olivia.lee@example.com', college: 'CAS', yearLevel: '4th Year' }
      ],
      showUploadModal: false,
      selectedSemester: null,
      semesters: ['1st Semester', '2nd Semester', 'Summer'],
      uploadedFile: null,
      uploadedFileName: ''
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
    viewCollegeUsers(collegeName) {
      this.selectedCollege = collegeName;
      this.searchQuery = '';
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
      const requiredHeaders = ['Name', 'Section', 'Department', 'ID Number', 'Email', 'Year Level'];
      
      // Check if all required headers are present
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        this.showNotification(`Missing headers: ${missingHeaders.join(', ')}`, 'error', 'fas fa-exclamation-circle');
        return;
      }
      
      // Process data rows
      const nameIndex = headers.indexOf('Name');
      const sectionIndex = headers.indexOf('Section');
      const departmentIndex = headers.indexOf('Department');
      const idIndex = headers.indexOf('ID Number');
      const emailIndex = headers.indexOf('Email');
      const yearLevelIndex = headers.indexOf('Year Level');
      
      let newColleges = 0;
      let newUsers = 0;
      let existingDepartments = new Set(this.departments.map(dept => dept.name));
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        // Skip empty lines
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) continue;
        
        const name = values[nameIndex];
        const section = values[sectionIndex];
        const department = values[departmentIndex];
        const id = values[idIndex];
        const email = values[emailIndex];
        const yearLevel = values[yearLevelIndex];
        
        // Skip if any required field is empty
        if (!name || !section || !department || !id || !email || !yearLevel) continue;
        
        // Check if the department exists
        if (!existingDepartments.has(department)) {
          // Add new department
          this.departments.push({ name: department, users: 0 });
          existingDepartments.add(department);
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
            college: department,
            yearLevel
          });
          
          // Update department user count
          const deptIndex = this.departments.findIndex(dept => dept.name === department);
          if (deptIndex !== -1) {
            this.departments[deptIndex].users++;
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
      // Create CSV content
      const headers = 'Name,Section,Department,ID Number,Email,Year Level';
      const exampleRow = 'John Doe,BSIT1A,CCS,2023-10001,john.doe@example.com,1st Year';
      const csvContent = `${headers}\n${exampleRow}`;
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'account_template.csv');
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
    confirmUpload() {
      if (!this.uploadedFile || !this.selectedSemester) {
        this.showNotification('Please select a semester and upload a CSV file.', 'error', 'fas fa-exclamation-circle');
        return;
      }

      // Check if it's a CSV file before processing
      if (this.uploadedFile.type !== 'text/csv' && !this.uploadedFile.name.endsWith('.csv')) {
        this.showNotification('Please upload a valid CSV file', 'error', 'fas fa-exclamation-circle');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        this.processCSV(content); // Use the existing processCSV method
        this.showUploadModal = false;
        this.uploadedFile = null; // Clear uploaded file state
        this.uploadedFileName = ''; // Clear uploaded file name state
        this.selectedSemester = null; // Clear selected semester state
      };
      reader.readAsText(this.uploadedFile);
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
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f9fafb;
  position: relative;
}

.college-header h3 {
  margin: 0;
  color: var(--dark);
  font-size: 18px;
  position: absolute;
  left: 20px;
}

.search-container {
  position: relative;
  width: 400px;
  max-width: 50%;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #78909c;
}

.search-container input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  color: #546e7a;
}

.search-container input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);
}

.back-btn {
  background-color: transparent;
  color: #546e7a;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: absolute;
  right: 20px;
}

.back-btn:hover {
  background-color: #f5f5f5;
  color: var(--primary);
  border-color: var(--primary);
}

.back-btn i {
  font-size: 14px;
}

.account-table {
  width: 100%;
  border-collapse: collapse;
}

.account-table th {
  text-align: left;
  padding: 16px 20px;
  color: #546e7a;
  font-weight: 600;
  background-color: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.account-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  color: #546e7a;
}

.account-table tr:hover {
  background-color: #f9fafb;
}

.view-btn {
  background-color: transparent;
  color: #00b3b0;
  border: 1px solid #00b3b0;
  border-radius: 4px;
  padding: 6px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background-color: #e0f7fa;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  background-color: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  color: var(--primary);
}

.edit-btn:hover {
  background-color: rgba(0, 179, 176, 0.1);
}

.delete-btn {
  color: var(--accent);
}

.delete-btn:hover {
  background-color: rgba(255, 107, 107, 0.1);
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
  padding: 18px 25px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4em;
  color: #333;
}

.close-modal {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #888;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-modal:hover {
  color: #555;
}

.modal-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  color: #333;
  background-color: #fff;
  appearance: none; /* Remove default select arrow */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M7%2010l5%205%205-5H7z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 15px top 50%;
  background-size: 12px;
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
  padding: 18px 25px;
  border-top: 1px solid #eee;
  background-color: #f5f7fa;
}

.modal-footer button {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #555;
  border: none;
  margin-right: 10px;
}

.cancel-btn:hover {
  background-color: #d0d0d0;
}

.submit-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
}

.submit-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-btn:disabled {
  background-color: #a0c8f5;
  cursor: not-allowed;
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
</style>