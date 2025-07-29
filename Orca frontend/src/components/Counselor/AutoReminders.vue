<template>
  <div class="auto-reminders-container">
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <!-- Configuration Section -->
    <div class="config-section">
      <div class="section-header">
        <i class="fas fa-bell"></i>
        <h2>Auto-Reminders Configuration</h2>
      </div>
      <p class="section-description">Reminders are sent automatically to students who haven't taken their assessment</p>

      <div class="toggle-container">
        <div class="toggle-label">
          <h3>Enable Auto Reminders</h3>
          <p>Turn auto-reminders on or off. Reminders will be sent to students who haven't taken the assessment</p>
        </div>
        <div class="toggle-switch">
          <label class="switch">
            <input type="checkbox" v-model="autoRemindersEnabled">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="config-options" :class="{ 'disabled': !autoRemindersEnabled }">
        <div class="config-row">
          <div class="config-item">
            <div class="config-label">
              <i class="fas fa-clock"></i>
              <span>Time Interval</span>
            </div>
            <div class="select-container">
              <select v-model="timeInterval" :disabled="!autoRemindersEnabled">
                <option value="1">1 day after assignment</option>
                <option value="2">2 days after assignment</option>
                <option value="3">3 days after assignment</option>
                <option value="5">5 days after assignment</option>
                <option value="7">7 days after assignment</option>
                <option value="10">10 days after assignment</option>
              </select>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>

          <div class="config-item">
            <div class="config-label">
              <span>Maximum Reminders</span>
            </div>
            <div class="select-container">
              <select v-model="maxReminders" :disabled="!autoRemindersEnabled">
                <option value="1">1 reminder</option>
                <option value="2">2 reminders</option>
                <option value="3">3 reminders</option>
                <option value="5">5 reminders</option>
                <option value="7">7 reminders</option>
              </select>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>

        <p class="info-text">Reminders are sent automatically to students who haven't taken their assessment yet</p>

        <div class="template-section">
          <div class="template-header">
            <i class="fas fa-envelope"></i>
            <h3>Reminder Template</h3>
          </div>
          <div class="template-container">
            <textarea v-model="reminderTemplate" :disabled="!autoRemindersEnabled" placeholder="Enter reminder message template..."></textarea>
            <p class="template-help">Use [Name] to personalize the message with the recipient's name</p>
          </div>
        </div>

        <div class="actions">
          <button class="save-btn" :disabled="!autoRemindersEnabled" @click="saveConfiguration">
            <i class="fas fa-save"></i> Save Configuration
          </button>
          <button class="test-btn" :disabled="!autoRemindersEnabled" @click="testReminder">
            Test Reminder
          </button>
        </div>
      </div>
    </div>

    <!-- Reminder Log Section -->
    <div class="log-section">
      <div class="section-header">
        <h2>Reminder Log</h2>
        <p class="section-description">View logs of when reminders were sent and to whom</p>
      </div>

      <div class="log-table-container">
        <table class="log-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Email</th>
              <th>Sent At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, index) in reminderLogs" :key="index" class="log-row">
              <td>{{ log.recipient }}</td>
              <td>{{ log.email }}</td>
              <td>{{ log.sentAt }}</td>
              <td>
                <span class="status-badge" :class="log.status.toLowerCase()">
                  {{ log.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Success Toast -->
    <div class="toast" v-if="showToast" :class="{ 'show': showToast }">
      <div class="toast-content">
        <i class="fas fa-check-circle"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AutoReminders',
  data() {
    return {
      error: null,
      autoRemindersEnabled: true,
      timeInterval: '3',
      maxReminders: '3',
      reminderTemplate: 'Hi [Name], you still have a pending well-being assessment. Please complete it as soon as possible. Your insights matter!',
      showToast: false,
      toastMessage: '',
      reminderLogs: [
        {
          recipient: 'John Doe',
          email: 'john@example.com',
          sentAt: '2024-01-15 10:30',
          status: 'Delivered'
        },
        {
          recipient: 'Jane Smith',
          email: 'jane@example.com',
          sentAt: '2024-01-15 10:31',
          status: 'Delivered'
        },
        {
          recipient: 'Mike Johnson',
          email: 'mike@example.com',
          sentAt: '2024-01-15 10:32',
          status: 'Failed'
        },
        {
          recipient: 'Sarah Wilson',
          email: 'sarah@example.com',
          sentAt: '2024-01-15 10:33',
          status: 'Delivered'
        }
      ]
    };
  },
  methods: {
    validateConfiguration() {
      if (!this.reminderTemplate.trim()) {
        this.error = 'Reminder template cannot be empty';
        return false;
      }
      if (!this.reminderTemplate.includes('[Name]')) {
        this.error = 'Reminder template must include [Name] placeholder';
        return false;
      }
      this.error = null;
      return true;
    },
    async saveConfiguration() {
      try {
        if (!this.validateConfiguration()) return;

        // Here you would typically make an API call to save the configuration
        this.showToast = true;
        this.toastMessage = 'Reminder configuration saved successfully!';
        
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      } catch (err) {
        console.error('Error saving configuration:', err);
        this.error = 'Failed to save reminder configuration';
      }
    },
    async testReminder() {
      try {
        if (!this.validateConfiguration()) return;

        // Here you would typically make an API call to send a test reminder
        this.showToast = true;
        this.toastMessage = 'Test reminder sent to your email!';
        
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      } catch (err) {
        console.error('Error sending test reminder:', err);
        this.error = 'Failed to send test reminder';
      }
    }
  }
};
</script>

<style scoped>
.error-message {
  background-color: #fee;
  color: #c00;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-message i {
  font-size: 16px;
}

.auto-reminders-container {
  background-color: #f5f5f5;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
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

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.section-header i {
  font-size: 20px;
  margin-right: 10px;
  color: #00B3B0;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.section-description {
  color: #666;
  margin: 0 0 20px 0;
  font-size: 14px;
}

.config-section, .log-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 25px;
  transition: box-shadow 0.3s ease;
}

.config-section:hover, .log-section:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.toggle-label h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.toggle-label p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #00B3B0;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.config-options {
  padding-top: 20px;
  transition: opacity 0.3s ease;
}

.config-options.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.config-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.config-item {
  flex: 1;
}

.config-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #444;
}

.config-label i {
  margin-right: 8px;
  color: #00B3B0;
}

.select-container {
  position: relative;
}

.select-container select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  appearance: none;
  font-size: 14px;
  color: #333;
  background-color: white;
  cursor: pointer;
}

.select-container i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  pointer-events: none;
}

.info-text {
  margin: 15px 0;
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.template-section {
  margin-top: 25px;
}

.template-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.template-header i {
  margin-right: 8px;
  color: #00B3B0;
}

.template-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.template-container textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.template-container textarea:focus {
  outline: none;
  border-color: #00B3B0;
}

.template-help {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #888;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}

.save-btn, .test-btn {
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn {
  background-color: #00B3B0;
  color: white;
  border: none;
}

.save-btn:hover {
  background-color: #009e9b;
  transform: translateY(-1px);
}

.test-btn {
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
}

.test-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.log-table-container {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th {
  text-align: left;
  padding: 12px 15px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.log-table td {
  padding: 12px 15px;
  font-size: 14px;
  color: #444;
  border-bottom: 1px solid #f0f0f0;
}

.log-row {
  transition: background-color 0.2s;
}

.log-row:hover {
  background-color: #f9f9f9;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.status-badge.delivered {
  background-color: #e6f7f6;
  color: #00B3B0;
}

.status-badge.failed {
  background-color: #ffebee;
  color: #f44336;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: #00B3B0;
  color: white;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1000;
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-content i {
  font-size: 18px;
}

@media (max-width: 768px) {
  .config-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .toggle-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .toggle-switch {
    margin-top: 15px;
  }
}
</style>