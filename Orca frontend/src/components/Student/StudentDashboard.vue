<template>
  <div class="student-dashboard">
    <main class="dashboard-main">
      <!-- Assessment Card -->
      <section class="assessment-card">
        <div class="assessment-header">
          <div>
            <h2>Ryff PWB Assessment (42-item)</h2>
            <div class="due-date">Due by 2023-11-15</div>
          </div>
          <span class="status-badge pending">Pending</span>
        </div>
        <div class="assessment-body">
          <p class="description">
            Comprehensive psychological well-being assessment based on Ryff's six dimensions model (42-item version).
          </p>
          <div class="progress-row">
            <span>Progress</span>
            <span class="progress-percent">0%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 0%"></div>
          </div>
          <div class="actions">
            <button class="start-btn" @click="startAssessment">Start</button>
          </div>
        </div>
      </section>

      <!-- Other Sections -->
      <section class="tips-section card fade-in">
        <div class="section-header">
          <h3>Well-Being Tips</h3>
        </div>
        <div class="tips-grid">
          <div class="tip-card" v-for="tip in tips" :key="tip.title">
            <i :class="tip.icon"></i>
            <div>
              <h4>{{ tip.title }}</h4>
              <p>{{ tip.text }}</p>
            </div>
          </div>
        </div>
      </section>
      <section class="ai-feedback-section card fade-in">
        <div class="section-header">
          <h3>AI Feedback <span class="coming-soon">(Coming Soon)</span></h3>
        </div>
        <div class="ai-placeholder">
          <i class="fas fa-robot"></i>
          <p>Your personalized well-being insights will appear here after your assessment.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  name: 'StudentDashboard',
  data() {
    return {
      tips: [
        { icon: 'fas fa-heartbeat', title: 'Self-Care', text: 'Take time each day to care for your mind and body.' },
        { icon: 'fas fa-users', title: 'Connect', text: 'Reach out to friends and family for support.' },
        { icon: 'fas fa-brain', title: 'Mindfulness', text: 'Practice mindfulness to reduce stress and improve focus.' }
      ]
    }
  },
  methods: {
    startAssessment() {
      alert('Assessment feature coming soon!');
    }
  }
}
</script>

<style scoped>
.student-dashboard {
  font-family: 'Inter', sans-serif;
  background: #f7f9fa;
  min-height: 100vh;
  padding-bottom: 40px;
}
.dashboard-main {
  max-width: 700px;
  margin: 40px auto 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.assessment-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 32px 32px 28px 32px;
  margin-bottom: 0;
  animation: fadeInUp 0.8s;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.assessment-header h2 {
  font-size: 1.35em;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #1a2e35;
}
.due-date {
  font-size: 0.98em;
  color: #78909c;
  margin-top: 2px;
}
.status-badge {
  font-size: 0.95em;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 16px;
  background: #f7f9fa;
  color: #009491;
  border: 1px solid #e0e0e0;
  margin-left: 16px;
  margin-top: 2px;
}
.status-badge.pending {
  color: #009491;
  background: #e0f7fa;
  border: 1px solid #b2ebf2;
}
.assessment-body {
  margin-top: 8px;
}
.description {
  color: #546e7a;
  font-size: 1.08em;
  margin-bottom: 18px;
}
.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1em;
  margin-bottom: 4px;
}
.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: #e0e4ea;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 18px;
}
.progress-bar-fill {
  height: 100%;
  background: #263142;
  border-radius: 6px;
  transition: width 0.5s;
}
.progress-percent {
  font-weight: 600;
  color: #263142;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.start-btn {
  background: #00b3b0;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 32px;
  font-size: 1.08em;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,179,176,0.10);
  transition: background 0.2s, box-shadow 0.2s;
}
.start-btn:hover {
  background: #009491;
  box-shadow: 0 6px 18px rgba(0,179,176,0.18);
}
.card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  padding: 28px 24px 24px 24px;
  margin-bottom: 0;
  animation: fadeInUp 0.8s;
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: 0 8px 32px rgba(0,179,176,0.13);
  transform: translateY(-4px) scale(1.01);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.coming-soon {
  font-size: 0.8em;
  color: var(--accent);
  font-weight: 500;
}
.tips-section {
  margin-top: 0;
}
.tips-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.tip-card {
  background: #e0f7fa;
  border-radius: 10px;
  padding: 16px 20px;
  flex: 1 1 200px;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0,179,176,0.08);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: fadeIn 1.2s;
}
.tip-card:hover {
  transform: translateY(-6px) scale(1.04);
  box-shadow: 0 8px 24px rgba(0,179,176,0.18);
}
.tip-card i {
  font-size: 1.7em;
  color: var(--primary);
  margin-top: 2px;
}
.ai-feedback-section {
  text-align: center;
  margin-top: 0;
}
.ai-placeholder {
  margin-top: 16px;
  color: #78909c;
  font-size: 1.1em;
}
.ai-placeholder i {
  font-size: 2.2em;
  color: var(--primary);
  margin-bottom: 8px;
}
@media (max-width: 900px) {
  .dashboard-main {
    max-width: 98vw;
    padding: 0 2vw;
  }
}
@media (max-width: 600px) {
  .assessment-card, .card {
    padding: 18px 8px 16px 8px;
  }
  .dashboard-main {
    gap: 18px;
  }
  .tips-grid {
    gap: 12px;
  }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: none; }
}
</style> 