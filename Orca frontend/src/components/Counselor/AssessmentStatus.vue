<template>
  <div class="status-bg">
    <transition name="card-fade-slide">
      <div class="status-monitor-container">
        <div class="status-header">
          <div class="upload-section">
            <button class="upload-btn">
              <i class="fas fa-upload"></i> Upload CSV
            </button>
            <button class="template-btn">
              <i class="fas fa-download"></i> Download Template
            </button>
            <span class="format-text">Format: Name, Section, Department, ID Number, Email</span>
          </div>
        </div>
        <div class="status-table-wrapper">
          <table class="status-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Total Users</th>
                <th>Action</th>
              </tr>
            </thead>
            <transition-group name="row-fade-slide" tag="tbody">
              <tr v-for="(dept, idx) in departments" :key="dept.name">
                <td>{{ dept.name }}</td>
                <td>{{ dept.users }}</td>
                <td>
                  <button class="view-btn">View</button>
                </td>
              </tr>
            </transition-group>
          </table>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'AssessmentStatus',
  data() {
    return {
      departments: [
        { name: 'CCS', users: 5 },
        { name: 'CN', users: 1 },
        { name: 'COE', users: 2 },
        { name: 'CBA', users: 2 },
        { name: 'CAS', users: 2 }
      ]
    }
  }
}
</script>

<style scoped>
.status-bg {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.status-monitor-container {
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

.status-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fff;
}

.upload-section {
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

.status-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.status-table {
  width: 100%;
  border-collapse: collapse;
}

.status-table th {
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

.status-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  color: #546e7a;
}

.status-table tr:hover {
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
</style> 