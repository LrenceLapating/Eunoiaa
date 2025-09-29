<template>
  <div class="dashboard-container">
    <!-- Mobile Navigation Toggle -->
    <button class="mobile-nav-toggle" @click="toggleMobileNav" v-if="isMobile">
      <i class="fas fa-bars"></i>
    </button>
    
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ active: mobileNavOpen }" @click="closeMobileNav" v-if="isMobile"></div>
    
    <!-- Left Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': mobileNavOpen }">
      <div class="logo-container">
        <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="logo-svg">
        <div class="logo-text">
          <h1>EUNOIA</h1>
          <p>Student Portal</p>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <h3>Student Menu</h3>
        <ul>
          <li :class="{ active: currentView === 'assessment' }">
            <a @click="currentView = 'assessment'; closeMobileNav()" class="menu-item">
              <div class="menu-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <span>Assessment</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'ai-interventions' }">
            <a @click="currentView = 'ai-interventions'; closeMobileNav()" class="menu-item">
              <div class="menu-icon">
                <i class="fas fa-comments"></i>
              </div>
              <span>Guidance Feedback</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'settings' }">
            <a @click="currentView = 'settings'; closeMobileNav()" class="menu-item">
              <div class="menu-icon">
                <i class="fas fa-cog"></i>
              </div>
              <span>Settings</span>
            </a>
          </li>
          <li class="logout-item">
            <a @click="logout(); closeMobileNav()" class="menu-item" :class="{ 'logging-out': isLoggingOut }">
              <div class="menu-icon logout-icon">
                <i v-if="!isLoggingOut" class="fas fa-sign-out-alt"></i>
                <i v-else class="fas fa-spinner fa-spin"></i>
              </div>
              <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Navigation Bar -->
      <header class="top-nav">
        <div class="page-title">
          <h1>{{ getPageTitle }}</h1>
          <p>{{ getPageSubtitle }}</p>
        </div>
        <div class="nav-actions">
          <div class="user-profile">
            <div class="user-avatar" @click="currentView = 'settings'" title="Go to Settings">
              <i class="fas fa-user-circle"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="content-container">
        <!-- Assessment View -->
        <div v-if="currentView === 'assessment'" class="assessment-view">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <div class="welcome-content">
              <h1 class="welcome-title">Welcome to Your Well-being Journey</h1>
              <p class="welcome-subtitle">Take control of your mental health with our comprehensive psychological assessment</p>
            </div>
            <div class="welcome-illustration">
              <div class="floating-elements">
                <div class="element element-1" title="Autonomy"><i class="fas fa-user-shield"></i></div>
                <div class="element element-2" title="Environmental Mastery"><i class="fas fa-cogs"></i></div>
                <div class="element element-3" title="Personal Growth"><i class="fas fa-seedling"></i></div>
                <div class="element element-4" title="Positive Relations"><i class="fas fa-users"></i></div>
                <div class="element element-5" title="Purpose in Life"><i class="fas fa-compass"></i></div>
                <div class="element element-6" title="Self-Acceptance"><i class="fas fa-heart"></i></div>
              </div>
            </div>
          </div>

          <!-- Assessment Type Selector -->
          <div v-if="hasAssignedAssessments" class="assessment-type-selector">
            <div class="selector-header">
              <h3>Choose Assessment Type</h3>
              <p>Select the type of assessment you want to view and complete</p>
            </div>
            <div class="type-buttons">
              <button 
                class="type-button" 
                :class="{ 'active': selectedAssessmentType === 'ryff_42' }"
                @click="selectAssessmentType('ryff_42')"
                :disabled="!hasAssessmentType('ryff_42')"
              >
                <div class="type-icon">
                  <i class="fas fa-clipboard-list"></i>
                </div>
                <div class="type-info">
                  <h4>42-Item Assessment</h4>
                  <p>Quick comprehensive evaluation (15-20 min)</p>
                  <span class="type-status" v-if="hasAssessmentType('ryff_42')">Available</span>
                  <span class="type-status unavailable" v-else>Not Assigned</span>
                </div>
              </button>
              <button 
                class="type-button" 
                :class="{ 'active': selectedAssessmentType === 'ryff_84' }"
                @click="selectAssessmentType('ryff_84')"
                :disabled="!hasAssessmentType('ryff_84')"
              >
                <div class="type-icon">
                  <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="type-info">
                  <h4>84-Item Assessment</h4>
                  <p>Detailed comprehensive evaluation (25-30 min)</p>
                  <span class="type-status" v-if="hasAssessmentType('ryff_84')">Available</span>
                  <span class="type-status unavailable" v-else>Not Assigned</span>
                </div>
              </button>
            </div>
          </div>

          <!-- No Assessment State -->
          <div v-if="!hasAssignedAssessments" class="no-assessment-state">
            <div class="no-assessment-card">
              <div class="no-assessment-icon">
                <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="no-assessment-logo">
              </div>
              <h3>No Assessment Yet</h3>
              <p>You don't have any assessments assigned at the moment. Your counselor will send you assessments when they're ready.</p>
              <div class="no-assessment-actions">
                <button class="contact-counselor-btn">
                  <i class="fas fa-envelope"></i>
                  Contact Counselor
                </button>
              </div>
            </div>
          </div>

          <!-- Assessment Cards Grid (when assessments are available) -->
          <div v-if="hasAssignedAssessments && filteredAssessments.length > 0" class="assessment-grid">
            <!-- Main Assessment Card -->
            <div class="main-assessment-card">
              <div class="card-header">
                <div class="assessment-icon">
                <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="assessment-logo">
              </div>
                <div class="assessment-info">
                  <h3>{{ getAssessmentTitle }}</h3>
                  <p class="assessment-type">{{ getAssessmentDescription }}</p>
                  <div class="assessment-meta">
                    <span class="duration"><i class="fas fa-clock"></i> {{ getEstimatedDuration }}</span>
                  </div>
                </div>

              </div>
              
              <div class="card-body">
                <div class="assessment-description">
                  <p>{{ getCustomMessage }}</p>
                </div>
                
                <div class="progress-section">
                  <div class="progress-header">
                    <span class="progress-label">Completion Progress</span>
                    <span class="progress-value">0%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: 0%"></div>
                    <div class="progress-glow"></div>
                  </div>
                </div>
                
                <div class="dimensions-preview">
                  <h4>Assessment Dimensions</h4>
                  <div class="dimensions-grid">
                    <div class="dimension-item">
                      <i class="fas fa-user-check"></i>
                      <span>Autonomy</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-globe"></i>
                      <span>Environmental Mastery</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-seedling"></i>
                      <span>Personal Growth</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-users"></i>
                      <span>Positive Relations with Others</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-bullseye"></i>
                      <span>Purpose in Life</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-heart"></i>
                      <span>Self-Acceptance</span>
                    </div>
                  </div>
                </div>
                
                <div class="action-section">
                  <button class="primary-action-btn" @click="startAssessment">
                    <i class="fas fa-play"></i>
                    Begin Assessment
                  </button>
                  <button class="secondary-action-btn">
                    <i class="fas fa-info-circle"></i>
                    Learn More
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Quick Stats Card -->
            <div class="stats-card">
              <div class="stats-header">
                <h4>Your Progress</h4>
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">0</div>
                  <div class="stat-label">Assessments Completed</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">1</div>
                  <div class="stat-label">Pending Assessment</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">6</div>
                  <div class="stat-label">Dimensions to Explore</div>
                </div>
              </div>
            </div>
            
            <!-- Tips Card -->
            <div class="tips-card">
              <div class="tips-header">
                <h4>Assessment Tips</h4>
                <i class="fas fa-lightbulb"></i>
              </div>
              <div class="tips-content">
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Answer honestly for accurate results</span>
                </div>
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Take your time, no rush</span>
                </div>
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Find a quiet, comfortable space</span>
                </div>
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Your responses are confidential</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assessment Taking View -->
        <AssessmentTaking 
          v-if="currentView === 'taking-assessment'"
          :assessment-type="currentAssessment?.type"
          :assigned-assessment-id="currentAssessment?.assignedAssessmentId"
          @assessment-complete="onAssessmentComplete"
          @return-to-dashboard="onReturnToDashboard"
        />

        <!-- Assessment Complete View -->
        <AssessmentComplete 
          v-if="currentView === 'assessment-complete'"
          :assessment-type="currentAssessment?.type || '42'"
          :time-taken-minutes="completionData?.timeTakenMinutes"
          :time-taken-seconds="completionData?.timeTakenSeconds"
          :assigned-assessment-id="currentAssessment?.assignedAssessmentId"
          @return-to-dashboard="onReturnToDashboard"
        />

        <!-- Guidance Feedback View -->
        <div v-if="currentView === 'ai-interventions'" class="guidance-feedback-view">
          <!-- Loading State -->
          <div v-if="loadingInterventions" class="loading-state">
            <div class="loading-card">
              <div class="loading-spinner">
                <div class="spinner-ring">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
              <h3>Loading Your Guidance</h3>
              <p>Retrieving your personalized recommendations...</p>
            </div>
          </div>

          <!-- No Interventions State -->
          <div v-else-if="!hasCompletedAnyAssessment" class="empty-state">
            <div class="empty-card">
              <div class="empty-illustration">
                <div class="empty-icon">
                  <i class="fas fa-comments"></i>
                </div>
                <div class="empty-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div class="empty-content">
                <h3>No Guidance Available Yet</h3>
                <p>Your counselor hasn't sent any personalized recommendations yet. Complete your psychological assessment to receive tailored guidance for your well-being journey.</p>
                <button class="cta-button" @click="currentView = 'assessment'">
                  <i class="fas fa-clipboard-list"></i>
                  <span>Take Assessment</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Professional Guidance Content -->
          <div v-else class="guidance-content">
            <!-- Summary Header -->
            <div class="guidance-header">
              <div class="header-info">
                <h2>Your Personalized Guidance</h2>
                <p>Professional recommendations tailored to your well-being assessment</p>
              </div>
            </div>

            <!-- Assessment Type Navigation -->
            <div class="assessment-type-nav">
              <button 
                class="nav-button" 
                :class="{ active: selectedInterventionType === '84-item' }"
                @click="selectedInterventionType = '84-item'"
                :disabled="aiInterventions84.length === 0"
              >
                <i class="fas fa-chart-line"></i>
                84-Item Assessment
                <span class="count-badge" v-if="aiInterventions84.length > 0">({{ aiInterventions84.length }})</span>
              </button>
              <button 
                class="nav-button" 
                :class="{ active: selectedInterventionType === '42-item' }"
                @click="selectedInterventionType = '42-item'"
                :disabled="aiInterventions42.length === 0"
              >
                <i class="fas fa-clipboard-list"></i>
                42-Item Assessment
                <span class="count-badge" v-if="aiInterventions42.length > 0">({{ aiInterventions42.length }})</span>
              </button>
              <button 
                class="nav-button" 
                :class="{ active: selectedInterventionType === 'history' }"
                @click="selectedInterventionType = 'history'; fetchHistoricalInterventions()"
              >
                <i class="fas fa-history"></i>
                History
                <span class="count-badge" v-if="historicalInterventions42.length + historicalInterventions84.length + counselorHistoricalInterventions42.length + counselorHistoricalInterventions84.length > 0">({{ historicalInterventions42.length + historicalInterventions84.length + counselorHistoricalInterventions42.length + counselorHistoricalInterventions84.length }})</span>
              </button>
            </div>

            <!-- 84-Item Assessment Interventions -->
            <div v-if="aiInterventions84.length > 0 && selectedInterventionType === '84-item'" class="assessment-section">
              <div class="assessment-type-header">
                <h3><i class="fas fa-chart-line"></i> Comprehensive Assessment (84-Item) Guidance</h3>
                <p>Detailed interventions based on your comprehensive psychological well-being assessment</p>
              </div>
              
              <div class="professional-interventions">
                <div 
                  v-for="intervention in aiInterventions84" 
                  :key="intervention.id"
                  class="professional-intervention-card"
                  :class="{ 'reviewed': intervention.is_read }"
                >
                  <!-- Student Header -->
                  <div class="intervention-header">
                    <div class="student-info">
                      <div class="student-avatar">
                        <i class="fas fa-user-graduate"></i>
                      </div>
                      <div class="student-details">
                        <h3>{{ studentProfile.name || 'Student' }}</h3>
                        <p>{{ studentProfile.id_number || 'ID: N/A' }} • {{ studentProfile.college || 'College' }} • {{ formatDate(intervention.created_at) }}</p>
                      </div>
                    </div>
                    <div class="intervention-meta">
                      <div class="overall-score">
                        <span class="score-label">Overall Score</span>
                        <span class="score-value" :class="getRiskLevelClass(intervention.risk_level)">{{ getRiskLevelScore(intervention.risk_level, intervention) }}</span>
                      </div>
                      <div class="status-badge" :class="intervention.is_read ? 'reviewed' : 'new'">
                        <i class="fas" :class="intervention.is_read ? 'fa-check-circle' : 'fa-circle'"></i>
                        {{ intervention.is_read ? 'Reviewed' : 'New' }}
                      </div>
                    </div>
                  </div>

                  <!-- Overall Strategy Section -->
                  <div class="strategy-section">
                    <div class="section-header">
                      <i class="fas fa-lightbulb"></i>
                      <h4>Overall Mental Health Strategy</h4>
                    </div>
                    <div class="strategy-content">
                      <p>{{ intervention.overall_strategy || 'No overall strategy available.' }}</p>
                    </div>
                  </div>

                  <!-- Dimension Interventions Section -->
                  <div class="dimensions-section" v-if="intervention.dimension_interventions && Object.keys(parseDimensionInterventions(intervention.dimension_interventions)).length > 0">
                    <div class="section-header">
                      <i class="fas fa-chart-bar"></i>
                      <h4>Dimension Scores & Targeted Interventions</h4>
                    </div>
                    <div class="dimensions-grid">
                      <div 
                        v-for="(interventionText, dimension) in parseDimensionInterventions(intervention.dimension_interventions)" 
                        :key="dimension"
                        class="dimension-card"
                      >
                        <div class="dimension-header">
                          <h5>{{ formatDimensionName(dimension) }}</h5>
                          <div class="dimension-score" :class="getDimensionScoreClass(intervention.dimension_scores, dimension, intervention)">
                            {{ getDimensionScore(intervention.dimension_scores, dimension) }}
                          </div>
                        </div>
                        <div class="dimension-content">
                          <p>{{ interventionText || 'No specific intervention provided.' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Plan Section -->
                  <div class="action-plan-section" v-if="intervention.action_plan && parseActionPlan(intervention.action_plan).length > 0">
                    <div class="section-header">
                      <i class="fas fa-tasks"></i>
                      <h4>Recommended Action Plan</h4>
                    </div>
                    <div class="action-plan-content">
                      <ul class="action-list">
                        <li v-for="(action, index) in parseActionPlan(intervention.action_plan)" :key="index" class="action-item">
                          <div class="action-checkbox">
                            <i class="fas fa-circle"></i>
                          </div>
                          <span>{{ action }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Card Footer -->
                  <div class="intervention-footer">
                    <div class="counselor-info">
                      <div class="counselor-avatar">
                        <i class="fas fa-user-md"></i>
                      </div>
                      <div class="counselor-details">
                        <span class="counselor-label">Guidance provided by</span>
                        <span class="counselor-name">Your Counselor</span>
                      </div>
                    </div>
                    <button 
                      v-if="!intervention.is_read" 
                      @click="markAsRead(intervention.id)"
                      class="mark-read-btn"
                    >
                      <i class="fas fa-check"></i>
                      Mark as Reviewed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 42-Item Assessment Interventions -->
            <div v-if="aiInterventions42.length > 0 && selectedInterventionType === '42-item'" class="assessment-section">
              <div class="assessment-type-header">
                <h3><i class="fas fa-chart-pie"></i> Quick Assessment (42-Item) Guidance</h3>
                <p>Focused interventions based on your quick psychological well-being assessment</p>
              </div>
              
              <div class="professional-interventions">
                <div 
                  v-for="intervention in aiInterventions42" 
                  :key="intervention.id"
                  class="professional-intervention-card"
                  :class="{ 'reviewed': intervention.is_read }"
                >
                  <!-- Student Header -->
                  <div class="intervention-header">
                    <div class="student-info">
                      <div class="student-avatar">
                        <i class="fas fa-user-graduate"></i>
                      </div>
                      <div class="student-details">
                        <h3>{{ studentProfile.name || 'Student' }}</h3>
                        <p>{{ studentProfile.id_number || 'ID: N/A' }} • {{ studentProfile.college || 'College' }} • {{ formatDate(intervention.created_at) }}</p>
                      </div>
                    </div>
                    <div class="intervention-meta">
                      <div class="overall-score">
                        <span class="score-label">Overall Score</span>
                        <span class="score-value" :class="getRiskLevelClass(intervention.risk_level)">{{ getRiskLevelScore(intervention.risk_level, intervention) }}</span>
                      </div>
                      <div class="status-badge" :class="intervention.is_read ? 'reviewed' : 'new'">
                        <i class="fas" :class="intervention.is_read ? 'fa-check-circle' : 'fa-circle'"></i>
                        {{ intervention.is_read ? 'Reviewed' : 'New' }}
                      </div>
                    </div>
                  </div>

                  <!-- Overall Strategy Section -->
                  <div class="strategy-section">
                    <div class="section-header">
                      <i class="fas fa-lightbulb"></i>
                      <h4>Overall Mental Health Strategy</h4>
                    </div>
                    <div class="strategy-content">
                      <p>{{ intervention.overall_strategy || 'No overall strategy available.' }}</p>
                    </div>
                  </div>

                  <!-- Dimension Interventions Section -->
                  <div class="dimensions-section" v-if="intervention.dimension_interventions && Object.keys(parseDimensionInterventions(intervention.dimension_interventions)).length > 0">
                    <div class="section-header">
                      <i class="fas fa-chart-bar"></i>
                      <h4>Dimension Scores & Targeted Interventions</h4>
                    </div>
                    <div class="dimensions-grid">
                      <div 
                        v-for="(interventionText, dimension) in parseDimensionInterventions(intervention.dimension_interventions)" 
                        :key="dimension"
                        class="dimension-card"
                      >
                        <div class="dimension-header">
                          <h5>{{ formatDimensionName(dimension) }}</h5>
                          <div class="dimension-score" :class="getDimensionScoreClass(intervention.dimension_scores, dimension, intervention)">
                            {{ getDimensionScore(intervention.dimension_scores, dimension) }}
                          </div>
                        </div>
                        <div class="dimension-content">
                          <p>{{ interventionText || 'No specific intervention provided.' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Plan Section -->
                  <div class="action-plan-section" v-if="intervention.action_plan && parseActionPlan(intervention.action_plan).length > 0">
                    <div class="section-header">
                      <i class="fas fa-tasks"></i>
                      <h4>Recommended Action Plan</h4>
                    </div>
                    <div class="action-plan-content">
                      <ul class="action-list">
                        <li v-for="(action, index) in parseActionPlan(intervention.action_plan)" :key="index" class="action-item">
                          <div class="action-checkbox">
                            <i class="fas fa-circle"></i>
                          </div>
                          <span>{{ action }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Card Footer -->
                  <div class="intervention-footer">
                    <div class="counselor-info">
                      <div class="counselor-avatar">
                        <i class="fas fa-user-md"></i>
                      </div>
                      <div class="counselor-details">
                      </div>
                    </div>
                    <button 
                      v-if="!intervention.is_read" 
                      @click="markAsRead(intervention.id)"
                      class="mark-read-btn"
                    >
                      <i class="fas fa-check"></i>
                      Mark as Reviewed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- History Section -->
            <div v-if="selectedInterventionType === 'history'" class="assessment-section">
              <div class="assessment-type-header">
                <h3><i class="fas fa-history"></i> Assessment History</h3>
                <p>View your past assessment results and interventions</p>
              </div>

              <!-- Loading State -->
              <div v-if="loadingHistory" class="loading-state">
                <div class="loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading historical interventions...</p>
              </div>

              <!-- History Table -->
              <div v-else class="history-table-container">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Assessment Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Counselor 84-Item Interventions -->
                    <tr v-for="intervention in counselorHistoricalInterventions84" :key="'counselor-84-' + intervention.id">
                      <td>{{ formatDate(intervention.original_created_at || intervention.created_at) }}</td>
                      <td>{{ intervention.assessment_name || intervention.intervention_title || '84 Items, 2025-2026 2nd Semester - CN' }}</td>
                      <td>
                        <button 
                          @click="openInterventionModal(intervention, '84-item')" 
                          class="view-details-btn"
                        >
                          <i class="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                    
                    <!-- Counselor 42-Item Interventions -->
                    <tr v-for="intervention in counselorHistoricalInterventions42" :key="'counselor-42-' + intervention.id">
                      <td>{{ formatDate(intervention.original_created_at || intervention.created_at) }}</td>
                      <td>{{ intervention.assessment_name || intervention.intervention_title || '42 Items, 2025-2026 2nd Semester - CN' }}</td>
                      <td>
                        <button 
                          @click="openInterventionModal(intervention, '42-item')" 
                          class="view-details-btn"
                        >
                          <i class="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>

                    <!-- AI 84-Item Interventions -->
                    <tr v-for="intervention in historicalInterventions84" :key="'ai-84-' + intervention.id">
                      <td>{{ formatDate(intervention.created_at) }}</td>
                      <td>{{ '84 Items, 2025-2026 2nd Semester - AI' }}</td>
                      <td>
                        <button 
                          @click="openInterventionModal(intervention, '84-item')" 
                          class="view-details-btn"
                        >
                          <i class="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>

                    <!-- AI 42-Item Interventions -->
                    <tr v-for="intervention in historicalInterventions42" :key="'ai-42-' + intervention.id">
                      <td>{{ formatDate(intervention.created_at) }}</td>
                      <td>{{ '42 Items, 2025-2026 2nd Semester - AI' }}</td>
                      <td>
                        <button 
                          @click="openInterventionModal(intervention, '42-item')" 
                          class="view-details-btn"
                        >
                          <i class="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>

                    <!-- Empty State -->
                    <tr v-if="!counselorHistoricalInterventions84.length && !counselorHistoricalInterventions42.length && !historicalInterventions84.length && !historicalInterventions42.length">
                      <td colspan="3" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No assessment history found</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Intervention Details Modal -->
              <div v-if="showInterventionModal" class="modal-overlay" @click="closeInterventionModal">
                <div class="intervention-modal" @click.stop>
                  <div class="modal-header">
                    <h3>
                      <i class="fas fa-clipboard-list"></i>
                      {{ selectedIntervention.intervention_title || 'Intervention Details' }}
                    </h3>
                    <button @click="closeInterventionModal" class="close-btn">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div class="modal-content">
                    <!-- Intervention Header Info -->
                    <div class="intervention-info">
                      <div class="info-row">
                        <span class="label">Assessment Type:</span>
                        <span class="value">{{ selectedInterventionType }}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Date:</span>
                        <span class="value">{{ formatDate(selectedIntervention.original_created_at || selectedIntervention.created_at) }}</span>
                      </div>
                      <div class="info-row" v-if="selectedIntervention.risk_level">
                        <span class="label">Risk Level:</span>
                        <span class="value risk-level" :class="selectedIntervention.risk_level">
                          {{ selectedIntervention.risk_level.toUpperCase() }} RISK
                        </span>
                      </div>
                    </div>

                    <!-- Overall Strategy -->
                    <div v-if="selectedIntervention.overall_strategy" class="modal-section">
                      <h4><i class="fas fa-lightbulb"></i> Overall Mental Health Strategy</h4>
                      <div class="strategy-content" v-html="formatInterventionText(selectedIntervention.overall_strategy)"></div>
                    </div>

                    <!-- Dimension Interventions -->
                    <div v-if="selectedIntervention.dimension_interventions && Object.keys(selectedIntervention.dimension_interventions).length > 0" class="modal-section">
                      <h4><i class="fas fa-chart-bar"></i> Dimension & Targeted Interventions</h4>
                      <div class="dimensions-grid">
                        <div 
                          v-for="(dimensionData, dimensionName) in selectedIntervention.dimension_interventions" 
                          :key="dimensionName"
                          class="dimension-card"
                        >
                          <div class="dimension-header">
                            <h5>{{ formatDimensionName(dimensionName) }}</h5>
                            <span class="dimension-score" v-if="dimensionData.score !== undefined">
                              Score: {{ dimensionData.score }}
                            </span>
                          </div>
                          <div class="dimension-content" v-html="formatInterventionText(dimensionData.intervention || dimensionData)"></div>
                        </div>
                      </div>
                    </div>

                    <!-- Action Plan -->
                    <div v-if="selectedIntervention.action_plan && selectedIntervention.action_plan.length > 0" class="modal-section">
                      <h4><i class="fas fa-tasks"></i> Self Assessment & Action Plan</h4>
                      <ul class="action-plan-list">
                        <li v-for="(action, index) in parseActionPlan(selectedIntervention.action_plan)" :key="index" class="action-item">
                          <div class="action-checkbox">
                            <i class="fas fa-circle"></i>
                          </div>
                          <span>{{ action }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- Counselor Info -->
                    <div v-if="selectedIntervention.counselors" class="modal-section">
                      <h4><i class="fas fa-user-md"></i> Counselor Information</h4>
                      <p>Created by: {{ selectedIntervention.counselors.name }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Interventions Message -->
            <div v-if="aiInterventions42.length === 0 && aiInterventions84.length === 0" class="no-interventions">
              <div class="no-interventions-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <h3>No AI Interventions Available</h3>
              <p>Complete an assessment to receive personalized guidance and recommendations.</p>
            </div>
          </div>
        </div>

        <!-- Settings View -->
        <div v-if="currentView === 'settings'" class="settings-view">
          <!-- Profile Information Section -->
          <section class="profile-info-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
              </div>
              <div class="profile-details">
                <h2>{{ studentProfile.name || 'Loading...' }}</h2>
                <p class="student-id">Student ID: {{ studentProfile.id_number || 'N/A' }}</p>
                <div class="academic-info">
                  <span class="college-badge">{{ studentProfile.college || 'N/A' }}</span>
                  <span class="section-badge">{{ studentProfile.section || 'N/A' }}</span>
                  <span class="year-badge">Year {{ studentProfile.year_level || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Account Settings Section -->
          <section class="settings-card">
            <div class="settings-header">
              <h3><i class="fas fa-cog"></i> Account Settings</h3>
              <p>Manage your account preferences and security</p>
            </div>
            
            <div class="settings-form">
              <!-- Personal Information -->
              <div class="settings-section">
                <h4>Personal Information</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label for="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      v-model="userSettings.name" 
                      :placeholder="studentProfile.name || 'Your full name'"
                      readonly
                    >
                    <small class="form-note">Contact your administrator to update your name</small>
                  </div>
                  <div class="form-group">
                    <label for="student-id">Student ID</label>
                    <input 
                      type="text" 
                      id="student-id" 
                      :value="studentProfile.id_number" 
                      readonly
                    >
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="college">College</label>
                    <input 
                      type="text" 
                      id="college" 
                      :value="studentProfile.college" 
                      readonly
                    >
                  </div>
                  <div class="form-group">
                    <label for="section">Section</label>
                    <input 
                      type="text" 
                      id="section" 
                      :value="studentProfile.section" 
                      readonly
                    >
                  </div>
                </div>
              </div>

              <!-- Account Security -->
              <div class="settings-section">
                <h4>Account Security</h4>
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    v-model="userSettings.email" 
                    :placeholder="studentProfile.email || 'Your email address'"
                  >
                </div>
                <div class="form-group">
                  <label for="current-password">Current Password</label>
                  <div class="password-input-container">
                    <input 
                      :type="showCurrentPassword ? 'text' : 'password'" 
                      id="current-password" 
                      v-model="userSettings.currentPassword" 
                      placeholder="Enter current password"
                    >
                    <button 
                      type="button" 
                      class="password-toggle-btn" 
                      @click="showCurrentPassword = !showCurrentPassword"
                      :title="showCurrentPassword ? 'Hide password' : 'Show password'"
                    >
                      <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="new-password">New Password</label>
                  <div class="password-input-container">
                    <input 
                      :type="showNewPassword ? 'text' : 'password'" 
                      id="new-password" 
                      v-model="userSettings.newPassword" 
                      placeholder="Enter new password"
                    >
                    <button 
                      type="button" 
                      class="password-toggle-btn" 
                      @click="showNewPassword = !showNewPassword"
                      :title="showNewPassword ? 'Hide password' : 'Show password'"
                    >
                      <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="confirm-password">Confirm New Password</label>
                  <div class="password-input-container">
                    <input 
                      :type="showConfirmPassword ? 'text' : 'password'" 
                      id="confirm-password" 
                      v-model="userSettings.confirmPassword" 
                      placeholder="Confirm new password"
                    >
                    <button 
                      type="button" 
                      class="password-toggle-btn" 
                      @click="showConfirmPassword = !showConfirmPassword"
                      :title="showConfirmPassword ? 'Hide password' : 'Show password'"
                    >
                      <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>
              </div>



              <div class="settings-actions">
                <button class="save-btn" @click="saveSettings" :disabled="isLoading">
                  <i class="fas fa-save"></i>
                  {{ isLoading ? 'Saving...' : 'Save Changes' }}
                </button>
                <button class="cancel-btn" @click="resetSettings">
                  <i class="fas fa-undo"></i>
                  Reset
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import authService from '@/services/authService'
import AssessmentTaking from './AssessmentTaking.vue'
import AssessmentComplete from './AssessmentComplete.vue'
import { apiUrl } from '../../utils/apiUtils.js'

export default {
  name: 'StudentDashboard',
  components: {
    AssessmentTaking,
    AssessmentComplete
  },
  data() {
    return {
      currentView: 'assessment', // 'assessment', 'ai-interventions', 'settings', 'taking-assessment', 'assessment-complete'
      isLoading: false,
      isLoggingOut: false,
      hasAssignedAssessments: false,
      assignedAssessments: [],
      selectedAssessmentType: 'ryff_42', // Default to 42-item
      selectedInterventionType: '84-item', // Default to 84-item interventions
      currentAssessment: null,
      completionData: null, // Store timing data from assessment completion
      loadingInterventions: false,
      aiInterventions42: [],
      aiInterventions84: [],
      // Historical interventions data
      historicalInterventions42: [],
      historicalInterventions84: [],
      // Counselor intervention history data
      counselorHistoricalInterventions42: [],
      counselorHistoricalInterventions84: [],
      loadingHistory: false,
      // Modal for intervention details
      showInterventionModal: false,
      selectedIntervention: null,
      modalInterventionType: '',
      // Mobile navigation
      mobileNavOpen: false,
      isMobile: false,
      // Student status monitoring
      statusCheckInterval: null,
      isStudentActive: true,
      studentProfile: {
        name: '',
        email: '',
        id_number: '',
        college: '',
        section: '',
        year_level: ''
      },
      userSettings: {
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      originalSettings: {},
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      
    };
  },
  computed: {
    filteredAssessments() {
      return this.assignedAssessments.filter(assessment => 
        assessment.bulk_assessment?.assessment_type === this.selectedAssessmentType
      );
    },
    getAssessmentTitle() {
      const filtered = this.filteredAssessments;
      if (filtered.length > 0) {
        return filtered[0].bulk_assessment?.assessment_name || 'Ryff Psychological Well-being Scale';
      }
      return 'Ryff Psychological Well-being Scale';
    },
    getAssessmentDescription() {
      const itemCount = this.selectedAssessmentType === 'ryff_84' ? '84' : '42';
      return `${itemCount}-Item Comprehensive Assessment`;
    },
    getEstimatedDuration() {
      return this.selectedAssessmentType === 'ryff_84' ? '25-30 minutes' : '15-20 minutes';
    },
    getCustomMessage() {
      const filtered = this.filteredAssessments;
      if (filtered.length > 0) {
        const customMessage = filtered[0].bulk_assessment?.custom_message;
        if (customMessage && customMessage.trim()) {
          return customMessage;
        }
      }
      return 'Evaluate your psychological well-being across six key dimensions: autonomy, environmental mastery, personal growth, positive relations with others, purpose in life, and self-acceptance.';
    },
    getPageTitle() {
      switch (this.currentView) {
        case 'assessment':
          return 'Assessment Dashboard';
        case 'ai-interventions':
          return 'Guidance Feedback';
        case 'settings':
          return 'Settings';
        default:
          return 'Dashboard';
      }
    },
    getPageSubtitle() {
      switch (this.currentView) {
        case 'assessment':
          return 'Complete your psychological well-being assessment';
        case 'ai-interventions':
          return 'View personalized guidance and recommendations from your counselor';
        case 'settings':
          return 'Manage your account settings';
        default:
          return '';
      }
    },
    hasCompletedAnyAssessment() {
      // If there are no assigned assessments, it means the student has completed them
      // OR if there are interventions available, it means assessments were completed
      return !this.hasAssignedAssessments || 
             (this.aiInterventions42.length > 0 || this.aiInterventions84.length > 0);
    }
  },
  async mounted() {
    await this.fetchStudentProfile();
    await this.fetchAssignedAssessments();
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    
    // Start monitoring student status every 2 seconds
    this.startStatusMonitoring();
  },
  
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    // Clear status monitoring interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  },
  watch: {
    currentView(newView) {
      if (newView === 'ai-interventions') {
        this.fetchAIInterventions();
      }
    }
  },
  methods: {
    // Mobile Navigation Methods
    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
      if (!this.isMobile) {
        this.mobileNavOpen = false;
      }
    },
    
    toggleMobileNav() {
      this.mobileNavOpen = !this.mobileNavOpen;
    },
    
    closeMobileNav() {
      this.mobileNavOpen = false;
    },
    
    // Student Status Monitoring Methods
    startStatusMonitoring() {
      // Check student status every 30 seconds to prevent rate limiting
      this.statusCheckInterval = setInterval(() => {
        this.checkStudentStatus();
      }, 30000); // Changed from 2000ms (2s) to 30000ms (30s)
    },
    
    async checkStudentStatus() {
      try {
        const response = await fetch(apiUrl('accounts/student-status'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          const currentStatus = result.data.status;
          
          // If student was active but now inactive, clear assessments immediately
          if (this.isStudentActive && currentStatus === 'inactive') {
            console.log('Student deactivated - clearing assessments');
            this.clearAssessmentsOnDeactivation();
          }
          
          this.isStudentActive = currentStatus === 'active';
        }
      } catch (error) {
        console.error('Error checking student status:', error);
      }
    },
    
    clearAssessmentsOnDeactivation() {
      // Immediately clear all assessment data
      this.assignedAssessments = [];
      this.hasAssignedAssessments = false;
      this.currentAssessment = null;
      
      // If currently taking an assessment, redirect to main view
      if (this.currentView === 'taking-assessment') {
        this.currentView = 'assessment';
      }
      
      // Stop status monitoring since student is deactivated
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
        this.statusCheckInterval = null;
      }
      
      console.log('All assessments cleared due to student deactivation');
    },
    
    async fetchStudentProfile() {
      try {
        const result = await authService.getCurrentUserProfile();
        
        if (result.success) {
          this.studentProfile = result.user;
          
          // Pre-populate settings with profile data
          this.userSettings.name = result.user.name;
          this.userSettings.email = result.user.email;
          
          // Store original settings for reset functionality
          this.originalSettings = { ...this.userSettings };
        } else {
          console.error('Failed to fetch student profile');
        }
      } catch (error) {
        console.error('Error fetching student profile:', error);
      }
    },
    
    async fetchAssignedAssessments() {
      try {
        console.log('Fetching assigned assessments...');
        
        // First check if student is still active
        const statusResponse = await fetch(apiUrl('accounts/student-status'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const statusResult = await statusResponse.json();
        
        if (statusResult.success && statusResult.data.status === 'inactive') {
          console.log('Student is inactive - not fetching assessments');
          this.assignedAssessments = [];
          this.hasAssignedAssessments = false;
          this.isStudentActive = false;
          return;
        }
        
        const response = await fetch(apiUrl('student-assessments/assigned'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.assignedAssessments = result.data;
          this.hasAssignedAssessments = result.data.length > 0;
          console.log('Assigned assessments loaded:', result.data.length, 'assessments found');
          console.log('Assessment details:', result.data);
        } else {
          console.error('Failed to fetch assigned assessments:', result.message);
          this.hasAssignedAssessments = false;
        }
      } catch (error) {
        console.error('Error fetching assigned assessments:', error);
        this.hasAssignedAssessments = false;
      }
    },
    
    // Assessment Type Selection Methods
    selectAssessmentType(type) {
      this.selectedAssessmentType = type;
    },
    
    hasAssessmentType(type) {
      return this.assignedAssessments.some(assessment => 
        assessment.bulk_assessment?.assessment_type === type
      );
    },
    
    startAssessment() {
      if (this.filteredAssessments.length > 0) {
        // Navigate to the first assigned assessment of the selected type
        const firstAssessment = this.filteredAssessments[0];
        console.log('Starting assessment:', firstAssessment);
        console.log('First assessment ID:', firstAssessment.id);
        
        // Determine assessment type from the bulk assessment
        const bulkAssessmentType = firstAssessment.bulk_assessment?.assessment_type || 'ryff_42';
        let assessmentType = '42'; // default
        
        if (bulkAssessmentType === 'ryff_84') {
          assessmentType = '84';
        } else if (bulkAssessmentType === 'ryff_42') {
          assessmentType = '42';
        }
        
        console.log('Bulk assessment type:', bulkAssessmentType, 'Parsed type:', assessmentType);
        
        // Set current assessment data and switch to taking view
        this.currentAssessment = {
          type: assessmentType,
          assignedAssessmentId: firstAssessment.id,
          assessmentData: firstAssessment
        };
        
        console.log('Current assessment set to:', this.currentAssessment);
        this.currentView = 'taking-assessment';
      } else {
        alert('No assessments available to start.');
      }
    },
    
    async saveSettings() {
      // Check if password change is being attempted
      const isPasswordChange = this.userSettings.newPassword || this.userSettings.confirmPassword || this.userSettings.currentPassword;
      
      if (isPasswordChange) {
        // Validate password change
        if (!this.userSettings.currentPassword) {
          alert('Please enter your current password');
          return;
        }
        
        if (!this.userSettings.newPassword) {
          alert('Please enter a new password');
          return;
        }
        
        if (this.userSettings.newPassword !== this.userSettings.confirmPassword) {
          alert('New passwords do not match');
          return;
        }
        
        if (this.userSettings.newPassword.length < 6) {
          alert('New password must be at least 6 characters long');
          return;
        }

        // Attempt to change password
        this.isLoading = true;
        
        try {
          const result = await authService.changeStudentPassword(
            this.studentProfile.id_number || this.studentProfile.email,
            this.userSettings.currentPassword,
            this.userSettings.newPassword
          );
          
          if (result.success) {
            // Clear password fields
            this.userSettings.currentPassword = '';
            this.userSettings.newPassword = '';
            this.userSettings.confirmPassword = '';
            
            alert('Password changed successfully!');
          } else {
            alert(result.error || 'Failed to change password');
          }
        } catch (error) {
          console.error('Error changing password:', error);
          alert('Failed to change password. Please try again.');
        } finally {
          this.isLoading = false;
        }
      } else {
        // No password change, just show message
        alert('No changes to save');
      }
    },
    
    resetSettings() {
      this.userSettings = { ...this.originalSettings };
      this.userSettings.currentPassword = '';
      this.userSettings.newPassword = '';
      this.userSettings.confirmPassword = '';
    },
    async onAssessmentComplete(completionData) {
      // Handle assessment completion
      console.log('Assessment completed:', completionData);
      // Store completion data including timing information
      this.completionData = completionData;
      this.currentView = 'assessment-complete';
      
      // Immediately remove the completed assessment from the UI for better UX
      if (completionData.assignedAssessmentId) {
        this.assignedAssessments = this.assignedAssessments.filter(
          assessment => assessment.id !== completionData.assignedAssessmentId
        );
        this.hasAssignedAssessments = this.assignedAssessments.length > 0;
        console.log('Immediately removed completed assessment from UI');
      }
      
      // Refresh from server with retry logic to ensure consistency
      await this.refreshAssessmentsWithRetry();
    },

    async refreshAssessmentsWithRetry(maxRetries = 3) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Refreshing assessments (attempt ${attempt}/${maxRetries})`);
          
          // Wait longer on each retry to allow database operations to complete
          const delay = attempt * 1500; // 1.5s, 3s, 4.5s
          await new Promise(resolve => setTimeout(resolve, delay));
          
          await this.fetchAssignedAssessments();
          console.log(`Assessment refresh successful on attempt ${attempt}`);
          break;
        } catch (error) {
          console.error(`Assessment refresh failed on attempt ${attempt}:`, error);
          if (attempt === maxRetries) {
            console.error('All refresh attempts failed');
          }
        }
      }
    },

    async onReturnToDashboard() {
      // Return to main assessment dashboard
      this.currentView = 'assessment';
      this.currentAssessment = null;
      // Refresh assigned assessments with retry logic
      await this.refreshAssessmentsWithRetry();
    },

    async logout() {
      this.isLoggingOut = true;
      
      // Animation before logout
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('.main-content');
      
      if (sidebar && mainContent) {
        sidebar.classList.add('slide-out-left');
        mainContent.classList.add('fade-out');
        
        setTimeout(async () => {
          await authService.logout();
          this.isLoggingOut = false;
        }, 500); // Wait for animation to complete
      } else {
        // Fallback if elements not found
        await authService.logout();
        this.isLoggingOut = false;
      }
    },

    async fetchAIInterventions() {
      try {
        this.loadingInterventions = true;
        console.log('Fetching AI interventions...');
        
        const response = await fetch(apiUrl('student-interventions'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Handle the new grouped response structure
          this.aiInterventions42 = result.data.ryff_42 || [];
          this.aiInterventions84 = result.data.ryff_84 || [];
          
          // Set default intervention type based on available data
          if (this.aiInterventions84.length > 0) {
            this.selectedInterventionType = '84-item';
          } else if (this.aiInterventions42.length > 0) {
            this.selectedInterventionType = '42-item';
          }
          
          console.log('AI interventions loaded:', this.aiInterventions42.length, '42-item interventions and', this.aiInterventions84.length, '84-item interventions found');
        } else {
          console.error('Failed to fetch AI interventions:', result.message);
          this.aiInterventions42 = [];
          this.aiInterventions84 = [];
        }
      } catch (error) {
        console.error('Error fetching AI interventions:', error);
        this.aiInterventions42 = [];
        this.aiInterventions84 = [];
      } finally {
        this.loadingInterventions = false;
      }
    },

    async fetchHistoricalInterventions() {
      try {
        this.loadingHistory = true;
        console.log('Fetching historical interventions...');
        
        // Fetch counselor intervention history using student-accessible endpoint
        const response = await fetch(apiUrl('student-interventions/history'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Filter and group historical interventions by assessment type
          const historicalData = result.data || [];
          
          // Separate AI and counselor interventions based on some criteria
          // For now, we'll treat all historical interventions as counselor interventions
          this.counselorHistoricalInterventions42 = historicalData.filter(intervention => 
            intervention.assessment_type === 'ryff_42'
          ).sort((a, b) => new Date(b.deactivated_at || b.created_at) - new Date(a.deactivated_at || a.created_at));
          
          this.counselorHistoricalInterventions84 = historicalData.filter(intervention => 
            intervention.assessment_type === 'ryff_84'
          ).sort((a, b) => new Date(b.deactivated_at || b.created_at) - new Date(a.deactivated_at || a.created_at));
          
          // For now, set AI historical interventions to empty arrays
          // since AI interventions don't have a separate history mechanism yet
          this.historicalInterventions42 = [];
          this.historicalInterventions84 = [];
          
          console.log('Counselor historical interventions loaded:', this.counselorHistoricalInterventions42.length, '42-item and', this.counselorHistoricalInterventions84.length, '84-item counselor historical interventions found');
        } else {
          console.error('Failed to fetch historical interventions:', result.message);
          this.historicalInterventions42 = [];
          this.historicalInterventions84 = [];
          this.counselorHistoricalInterventions42 = [];
          this.counselorHistoricalInterventions84 = [];
        }
      } catch (error) {
        console.error('Error fetching historical interventions:', error);
        this.historicalInterventions42 = [];
        this.historicalInterventions84 = [];
        this.counselorHistoricalInterventions42 = [];
        this.counselorHistoricalInterventions84 = [];
      } finally {
        this.loadingHistory = false;
      }
    },

    async markAsRead(interventionId) {
      try {
        const response = await fetch(apiUrl(`student-interventions/${interventionId}/read`), {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Update the local intervention as read in both arrays
          const intervention42 = this.aiInterventions42.find(i => i.id === interventionId);
          const intervention84 = this.aiInterventions84.find(i => i.id === interventionId);
          
          if (intervention42) {
            intervention42.is_read = true;
          }
          if (intervention84) {
            intervention84.is_read = true;
          }
        } else {
          console.error('Failed to mark intervention as read:', result.message);
        }
      } catch (error) {
        console.error('Error marking intervention as read:', error);
      }
    },

    getRiskLevelText(riskLevel) {
      switch (riskLevel) {
        case 'high':
          return 'High Priority';
        case 'moderate':
          return 'Moderate Priority';
        case 'low':
          return 'Low Priority';
        default:
          return 'General';
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatInterventionText(text) {
      if (!text) return '';
      
      // Convert markdown-style formatting to HTML
      let formatted = text
        // Convert headers
        .replace(/^# (.*$)/gm, '<h1 class="intervention-h1">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="intervention-h2">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="intervention-h3">$1</h3>')
        // Convert bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert numbered lists
        .replace(/^(\d+\.)\s(.*)$/gm, '<div class="list-item"><span class="list-number">$1</span> $2</div>')
        // Convert line breaks
        .replace(/\n\n/g, '</p><p class="intervention-paragraph">')
        .replace(/\n/g, '<br>')
        // Convert horizontal rules
        .replace(/^---$/gm, '<hr class="intervention-divider">');
      
      // Wrap in paragraph tags if not already wrapped
      if (!formatted.startsWith('<h1') && !formatted.startsWith('<h2') && !formatted.startsWith('<div')) {
        formatted = '<p class="intervention-paragraph">' + formatted + '</p>';
      }
      
      return formatted;
    },

    getRiskLevelClass(riskLevel) {
      return {
        'low': 'score-low',
        'moderate': 'score-moderate',
        'high': 'score-high'
      }[riskLevel] || 'score-unknown';
    },

    getRiskLevelScore(riskLevel, intervention = null) {
      // Check if we have intervention data with overall_score
      if (intervention && intervention.overall_score) {
        const assessmentType = intervention.assessment_type || 'ryff_42';
        const maxScore = assessmentType === 'ryff_84' ? 504 : 252;
        return `${intervention.overall_score}/${maxScore}`;
      }
      
      // Fallback to static values for 42-item assessments
      return {
        'low': '120/252',
        'moderate': '150/252',
        'high': '180/252'
      }[riskLevel] || 'N/A';
    },

    parseDimensionInterventions(dimensionInterventions) {
      try {
        if (typeof dimensionInterventions === 'string') {
          return JSON.parse(dimensionInterventions);
        }
        return dimensionInterventions || {};
      } catch (error) {
        console.error('Error parsing dimension interventions:', error);
        return {};
      }
    },

    formatDimensionName(dimension) {
      const dimensionNames = {
        'autonomy': 'Autonomy',
        'environmental_mastery': 'Environmental Mastery',
        'personal_growth': 'Personal Growth',
        'positive_relations': 'Positive Relations',
        'purpose_in_life': 'Purpose in Life',
        'self_acceptance': 'Self Acceptance'
      };
      return dimensionNames[dimension] || dimension.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    getDimensionRiskClass(score) {
      if (!score) return 'score-unknown';
      const numScore = parseInt(score);
      if (numScore >= 30) return 'score-high';
      if (numScore >= 20) return 'score-moderate';
      return 'score-low';
    },

    parseActionPlan(actionPlan) {
      try {
        if (typeof actionPlan === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(actionPlan);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            // If not JSON, split by common delimiters
            return actionPlan.split(/\n|\.|;/).filter(item => item.trim().length > 0).map(item => item.trim());
          }
        }
        if (Array.isArray(actionPlan)) return actionPlan;
        return [];
      } catch (error) {
        console.error('Error parsing action plan:', error);
        return [];
      }
    },

    getDimensionScore(dimensionScores, dimension) {
      if (!dimensionScores || typeof dimensionScores !== 'object') {
        return 'N/A';
      }
      return dimensionScores[dimension] || 'N/A';
    },

    getDimensionScoreClass(dimensionScores, dimension, intervention = null) {
      const score = this.getDimensionScore(dimensionScores, dimension);
      if (score === 'N/A') return 'score-unknown';
      
      const numScore = parseInt(score);
      
      // Determine assessment type and use appropriate thresholds
      const assessmentType = intervention?.assessment_type || 'ryff_42';
      
      if (assessmentType === 'ryff_84') {
        // 84-item thresholds: ≤36 = At Risk, 37-59 = Moderate, ≥60 = Healthy
        if (numScore >= 60) return 'score-high';   // Healthy (green)
        if (numScore >= 37) return 'score-moderate'; // Moderate (yellow)
        return 'score-low';  // At Risk (red)
      } else {
        // 42-item thresholds: ≤18 = At Risk, 19-30 = Moderate, ≥31 = Healthy  
        if (numScore >= 31) return 'score-high';   // Healthy (green)
        if (numScore >= 19) return 'score-moderate'; // Moderate (yellow)
        return 'score-low';  // At Risk (red)
      }
    },

    // Modal Methods
    openInterventionModal(intervention, type) {
      // Ensure we have valid intervention data
      if (!intervention) {
        console.error('No intervention data provided');
        return;
      }
      
      // Close any existing modal first
      this.showInterventionModal = false;
      
      // Use nextTick to ensure DOM updates properly
      this.$nextTick(() => {
        this.selectedIntervention = intervention;
        // Store the type only for the modal display; avoid changing nav state
        this.modalInterventionType = type;
        this.showInterventionModal = true;
        
        // Force reactivity update
        this.$forceUpdate();
      });
    },

    closeInterventionModal() {
      this.showInterventionModal = false;
      
      // Use nextTick to ensure proper cleanup
      this.$nextTick(() => {
        this.selectedIntervention = null;
        this.modalInterventionType = '';
      });
    },

    getAssessmentName(intervention) {
      if (intervention.intervention_title) {
        return intervention.intervention_title;
      }
      
      // Determine assessment type based on intervention data
      const isAI = !intervention.counselors;
      const is84Item = intervention.assessment_type === 'ryff_84' || 
                      (intervention.dimension_interventions && 
                       Object.keys(intervention.dimension_interventions).length > 6);
      
      const itemCount = is84Item ? '84' : '42';
      const source = isAI ? 'AI' : 'CN';
      
      return `${itemCount} Items, 2025-2026 2nd Semester - ${source}`;
    }
  }
}
</script>

<style scoped>
/* Dashboard Layout */
:root {
  --primary: #00b3b0;
  --primary-dark: #008b89;
  --primary-light: #b2ebf2;
  --secondary: #4a6572;
  --accent: #ff6b6b;
  --dark: #1a2e35;
  --text: #333333;
  --text-light: #6b7280;
  --gray: #f3f4f6;
  --light: #ffffff;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  background-color: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
  padding: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  overflow-y: auto;
  transition: all 0.3s ease;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar.slide-out-left {
  transform: translateX(-100%);
  box-shadow: none;
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 25px 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
  position: relative;
  animation: fadeIn 0.8s ease-out;
}

.logo-container::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #00b3b0 0%, #008b89 100%);
  transition: width 0.3s ease;
}

.sidebar:hover .logo-container::after {
  width: 100px;
}

.logo-container img {
  width: 35px;
  height: 35px;
  margin-right: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 179, 176, 0.2);
  transition: transform 0.3s ease;
}

.sidebar:hover .logo-container img {
  transform: rotate(5deg);
}

.logo-text h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #00b3b0;
  letter-spacing: 0.5px;
}

.logo-text p {
  font-size: 12px;
  margin: 0;
  color: var(--text-light);
  opacity: 0.8;
}

.sidebar-menu {
  flex: 1;
  padding: 10px 0;
}

.sidebar-menu h3 {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-light);
  padding: 0 25px;
  margin-bottom: 15px;
  font-weight: 500;
  letter-spacing: 1px;
}

.sidebar-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  margin-bottom: 2px;
  position: relative;
  animation: slideInLeft 0.5s ease-out;
  animation-fill-mode: both;
}

.sidebar-menu li:nth-child(1) { animation-delay: 0.1s; }
.sidebar-menu li:nth-child(2) { animation-delay: 0.2s; }
.sidebar-menu li:nth-child(3) { animation-delay: 0.3s; }

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 25px;
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  cursor: pointer;
  position: relative;
}

.menu-item:hover {
  background-color: rgba(0, 179, 176, 0.04);
  color: #00b3b0;
}

.sidebar-menu li.active .menu-item {
  background-color: rgba(0, 179, 176, 0.08);
  color: #00b3b0;
  border-left: 3px solid #00b3b0;
  font-weight: 500;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-light);
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon,
.sidebar-menu li.active .menu-icon {
  color: #00b3b0;
  transform: translateY(-1px);
}

.logout-item {
  margin-top: auto;
  padding-bottom: 20px;
}

.logout-icon {
  color: #ff6b6b;
}

.logout-item .menu-item {
  color: var(--text);
}

.logout-item .menu-item:hover {
  background-color: rgba(255, 107, 107, 0.08);
  color: #ff6b6b;
  border-left: 3px solid #ff6b6b;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  transition: opacity 0.5s ease, margin-left 0.5s ease;
}

.main-content.fade-out {
  opacity: 0;
}

.top-nav {
  background: white;
  padding: 20px 30px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  animation: fadeInDown 0.5s ease-out;
  position: fixed;
  top: 0;
  right: 0;
  left: 260px; /* Match the sidebar width */
  z-index: 99;
}

.page-title h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: var(--dark);
  transition: all 0.3s ease;
}

.page-title p {
  font-size: 14px;
  color: var(--text-light);
  margin: 5px 0 0 0;
  transition: all 0.3s ease;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.user-profile:hover {
  transform: scale(1.05);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00b3b0 0%, #008b89 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0, 179, 176, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-avatar:hover {
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.4);
  transform: translateY(-2px);
}

.content-container {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  margin-top: 70px; /* Add margin to prevent overlay with the fixed header */
}

/* Assessment View */
.assessment-view {
  animation: fadeInUp 0.6s ease-out;
  padding: 0;
}

/* Welcome Section */
.welcome-section {
  background: #00b3b0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  border: 1px solid #00a09d;
}

.welcome-content {
  flex: 1;
  z-index: 2;
  position: relative;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.welcome-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

.welcome-illustration {
  position: relative;
  width: 240px;
  height: 120px;
}

.floating-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.element {
  position: absolute;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.element:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.element-1 {
  top: 10px;
  left: 5px;
  animation: float 3s ease-in-out infinite;
}

.element-2 {
  top: 10px;
  left: 70px;
  animation: float 3s ease-in-out infinite 0.5s;
}

.element-3 {
  top: 10px;
  right: 70px;
  animation: float 3s ease-in-out infinite 1s;
}

.element-4 {
  top: 10px;
  right: 5px;
  animation: float 3s ease-in-out infinite 1.5s;
}

.element-5 {
  bottom: 10px;
  left: 35px;
  animation: float 3s ease-in-out infinite 2s;
}

.element-6 {
  bottom: 10px;
  right: 35px;
  animation: float 3s ease-in-out infinite 2.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Assessment Type Selector */
.assessment-type-selector {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.selector-header {
  text-align: center;
  margin-bottom: 20px;
}

.selector-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 8px 0;
}

.selector-header p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.type-button {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.type-button:hover:not(:disabled) {
  border-color: #00b3b0;
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.15);
  transform: translateY(-2px);
}

.type-button.active {
  border-color: #00b3b0;
  background: #f0fffe;
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.2);
}

.type-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.type-icon {
  width: 48px;
  height: 48px;
  background: #00b3b0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.type-button:disabled .type-icon {
  background: #94a3b8;
}

.type-info {
  flex: 1;
}

.type-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 4px 0;
}

.type-info p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 8px 0;
}

.type-status {
  font-size: 12px;
  font-weight: 500;
  color: #00b3b0;
  background: #f0fffe;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.type-status.unavailable {
  color: #94a3b8;
  background: #f1f5f9;
}

/* Assessment Grid */
.assessment-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;
}

/* Main Assessment Card */
.main-assessment-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.card-header {
  padding: 20px;
  background: #f8fffe;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.assessment-icon {
  width: 48px;
  height: 48px;
  background: #00b3b0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  padding: 6px;
}

.assessment-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.assessment-info {
  flex: 1;
}

.assessment-info h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #1a2e35;
}

.assessment-type {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.assessment-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #64748b;
}

.assessment-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}



.card-body {
  padding: 20px;
}

.assessment-description {
  margin-bottom: 30px;
}

.assessment-description p {
  font-size: 16px;
  line-height: 1.6;
  color: #475569;
  margin: 0;
}

.progress-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.progress-value {
  font-size: 14px;
  font-weight: 700;
  color: #00b3b0;
}

.progress-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #00b3b0;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dimensions-preview {
  margin-bottom: 20px;
}

.dimensions-preview h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
}

.dimension-item i {
  color: #00b3b0;
  font-size: 14px;
}

.action-section {
  display: flex;
  gap: 12px;
}

.primary-action-btn {
  flex: 1;
  background: #00b3b0;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-action-btn:hover {
  background: #00a09d;
}

.secondary-action-btn {
  padding: 12px 20px;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.secondary-action-btn:hover {
  border-color: #00b3b0;
  color: #00b3b0;
}

/* Stats Card */
.stats-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 16px;
}

.stats-header {
  padding: 16px 20px;
  background: #1e293b;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.stats-header i {
  font-size: 18px;
  opacity: 0.8;
}

.stats-content {
  padding: 16px;
}

.stat-item {
  text-align: center;
  margin-bottom: 16px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #00b3b0;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tips Card */
.tips-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.tips-header {
  padding: 16px 20px;
  background: #f59e0b;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.tips-header i {
  font-size: 18px;
  opacity: 0.8;
}

.tips-content {
  padding: 16px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #475569;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item i {
  color: #10b981;
  font-size: 16px;
  flex-shrink: 0;
}

/* No Assessment State */
.no-assessment-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 32px 20px;
}

.no-assessment-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px dashed #e2e8f0;
}

.no-assessment-icon {
  margin-bottom: 20px;
}

.no-assessment-logo {
  width: 64px;
  height: 64px;
  opacity: 0.6;
}

.no-assessment-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.no-assessment-card p {
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.no-assessment-actions {
  display: flex;
  justify-content: center;
}

.contact-counselor-btn {
  background: #00b3b0;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-counselor-btn:hover {
  background: #00a09d;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .assessment-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .welcome-illustration {
    width: 100px;
    height: 60px;
  }
  
  .no-assessment-card {
    padding: 24px 16px;
  }
  
  .no-assessment-logo {
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 768px) {
  .dimensions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-section {
    flex-direction: column;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .welcome-subtitle {
    font-size: 14px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .card-body {
    padding: 16px;
  }
}

/* Settings View */
.settings-view {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
  animation: fadeInUp 0.6s ease-out;
}

/* Profile Information Card */
.profile-info-card {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 16px;
  padding: 30px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 179, 176, 0.2);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  font-size: 64px;
  color: rgba(255, 255, 255, 0.9);
}

.profile-details h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.student-id {
  margin: 0 0 15px 0;
  font-size: 16px;
  opacity: 0.9;
}

.academic-info {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.college-badge, .section-badge, .year-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

/* Settings Card */
.settings-card {
  background: var(--light);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
  border: 1px solid #f0f0f0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.settings-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.settings-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f5f5f5;
}

.settings-header h3 {
  color: var(--dark);
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-header p {
  margin: 0;
  color: var(--text-light);
  font-size: 14px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Settings Sections */
.settings-section {
  padding: 20px;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #e8eaed;
}

.settings-section h4 {
  margin: 0 0 20px 0;
  color: var(--dark);
  font-size: 18px;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: var(--light);
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 179, 176, 0.1);
}

.form-group input[readonly] {
  background: #f8f9fa;
  color: var(--text-light);
  cursor: not-allowed;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  padding-right: 50px !important;
  flex: 1;
}

.password-toggle-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  font-size: 16px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.password-toggle-btn:hover {
  color: var(--primary);
  background: rgba(0, 179, 176, 0.1);
}

.password-toggle-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.2);
}

.form-note {
  font-size: 12px;
  color: var(--text-light);
  font-style: italic;
}

/* Preference Items */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e8eaed;
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info {
  flex: 1;
}

.preference-info label {
  font-weight: 600;
  color: var(--text);
  font-size: 15px;
  margin-bottom: 4px;
}

.preference-info small {
  color: var(--text-light);
  font-size: 13px;
  display: block;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 54px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 28px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + label {
  background-color: var(--primary);
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

/* Settings Actions */
.settings-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f5f5f5;
}

.save-btn, .cancel-btn {
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.save-btn {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  transition: left 0.7s ease;
  z-index: -1;
}

.save-btn:hover::before {
  left: 100%;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.3);
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.save-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 179, 176, 0.3);
}

.cancel-btn {
  background: #f8f9fa;
  color: var(--text);
  border: 2px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Guidance Feedback View Styles */
.guidance-feedback-view {
  min-height: 100vh;
  background: #f8fafc;
  padding: 30px;
  animation: fadeInUp 0.6s ease-out;
}

.guidance-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Guidance Header */
.guidance-header {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-info h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--dark);
  margin: 0 0 8px 0;
}

.header-info p {
  font-size: 16px;
  color: var(--text-light);
  margin: 0;
}

.summary-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  min-width: 100px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary);
  display: block;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
  margin-top: 8px;
  display: block;
}

/* Professional Intervention Cards */
.assessment-section {
  margin-bottom: 2rem;
}

/* Assessment Type Navigation */
.assessment-type-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
}

.nav-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  color: #6c757d;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.nav-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-1px);
}

.nav-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
  color: #adb5bd;
}

.count-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.nav-button.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

.assessment-type-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
  margin-bottom: 0;
}

.assessment-type-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.assessment-type-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.assessment-section .professional-interventions {
  border-radius: 0 0 12px 12px;
  border: 1px solid #e1e5e9;
  border-top: none;
  padding: 1rem;
}

.professional-interventions {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.professional-intervention-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.professional-intervention-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.professional-intervention-card.reviewed {
  opacity: 0.9;
  background: #fafbfc;
}

.professional-intervention-card.historical {
  border-left: 4px solid #6c757d;
  background: #f8f9fa;
}

.professional-intervention-card.historical .intervention-header {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

/* Intervention Header */
.intervention-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.student-avatar {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.student-avatar i {
  font-size: 24px;
  color: white;
}

.student-details h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: white;
}

.student-details p {
  font-size: 14px;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.intervention-meta {
  display: flex;
  align-items: center;
  gap: 20px;
}

.overall-score {
  text-align: center;
}

.score-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: 4px;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
  display: block;
}

.score-value.score-high {
  color: #28a745;
}

.score-value.score-moderate {
  color: #feca57;
}

.score-value.score-low {
  color: #ff6b6b;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.status-badge.new {
  background: rgba(255, 193, 7, 0.9);
  color: #333;
}

.status-badge.reviewed {
  background: rgba(40, 167, 69, 0.9);
  color: white;
}

.status-badge.historical {
  background: rgba(108, 117, 125, 0.9);
  color: white;
}

/* History Section Specific Styles */
.history-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.history-group {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.history-group-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px 25px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-group-header h4 {
  margin: 0;
  color: #495057;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-group-header .count-badge {
  background: #6c757d;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.historical-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
}

.historical-badge i {
  font-size: 16px;
}

/* Content Sections */
.strategy-section,
.dimensions-section,
.action-plan-section {
  padding: 25px 30px;
  border-bottom: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-header i {
  font-size: 20px;
  color: var(--primary);
}

.section-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.strategy-content p {
  font-size: 16px;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid var(--primary);
}

/* Dimensions Grid */
.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.dimension-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.dimension-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dimension-header h5 {
  font-size: 16px;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.dimension-score {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.dimension-score.score-high {
  background: #28a745;
}

.dimension-score.score-moderate {
  background: #feca57;
}

.dimension-score.score-low {
  background: #ff6b6b;
}

.dimension-score.score-unknown {
  background: #6c757d;
}

.dimension-content p {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
  margin: 0;
}

/* Action Plan */
.action-plan-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.action-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.action-item:last-child {
  border-bottom: none;
}

.action-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.action-checkbox i {
  font-size: 10px;
  color: white;
}

.action-item span {
  font-size: 15px;
  color: var(--text);
  line-height: 1.5;
}

/* Intervention Footer */
.intervention-footer {
  padding: 25px 30px;
  background: #fafbfc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.counselor-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.counselor-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.counselor-avatar i {
  font-size: 18px;
  color: white;
}

.counselor-details {
  display: flex;
  flex-direction: column;
}

.counselor-label {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 2px;
}

.counselor-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.mark-reviewed-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.mark-reviewed-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.3);
}

.reviewed-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
}

.reviewed-indicator i {
  font-size: 16px;
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 40px 20px;
}

.loading-card {
  background: white;
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  max-width: 400px;
  width: 100%;
}

.loading-spinner {
  margin-bottom: 30px;
}

.loading-card h3 {
  font-size: 24px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 12px;
}

.loading-card p {
  font-size: 16px;
  color: var(--text-light);
  line-height: 1.5;
  margin: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.empty-card {
  background: white;
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  max-width: 500px;
  width: 100%;
  animation: fadeInUp 0.8s ease-out;
}

.empty-illustration {
  margin-bottom: 40px;
  position: relative;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
  position: relative;
}

.empty-icon i {
  font-size: 48px;
  color: white;
}

.empty-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.empty-dots span {
  width: 8px;
  height: 8px;
  background: #cbd5e0;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.empty-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.empty-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.empty-content h3 {
  font-size: 28px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 16px;
}

.empty-content p {
  font-size: 16px;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 32px;
}

.cta-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-item {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 20px;
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--dark);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
  margin-top: 4px;
}

/* Interventions Grid */
.interventions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 30px;
}

.intervention-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.intervention-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
}

.intervention-card.read {
  opacity: 0.8;
  background: #f8fafc;
}

/* Card Priority Indicator */
.priority-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  border-radius: 20px 20px 0 0;
}

.priority-indicator.high {
  background: linear-gradient(90deg, #ff6b6b, #ee5a52);
}

.priority-indicator.moderate {
  background: linear-gradient(90deg, #feca57, #ff9ff3);
}

.priority-indicator.low {
  background: linear-gradient(90deg, #48dbfb, #0abde3);
}

/* Card Content */
.card-content {
  padding: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.risk-badge.high {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.25);
}

.risk-badge.moderate {
  background: linear-gradient(135deg, #feca57, #ff9ff3);
  color: white;
  box-shadow: 0 4px 15px rgba(254, 202, 87, 0.25);
}

.risk-badge.low {
  background: linear-gradient(135deg, #48dbfb, #0abde3);
  color: white;
  box-shadow: 0 4px 15px rgba(72, 219, 251, 0.25);
}

.risk-badge i {
  font-size: 12px;
}

.intervention-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--dark);
  margin: 0;
  line-height: 1.3;
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.intervention-date {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  position: relative;
}

.status-indicator.unread {
  background: #f59e0b;
  animation: pulse 2s infinite;
}

.intervention-content {
  font-size: 16px;
  color: var(--text);
  line-height: 1.7;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid var(--primary);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.recommendation-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
}

.recommendation-type i {
  font-size: 16px;
  color: var(--primary);
}

.card-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  border: none;
  text-decoration: none;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.completed-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 25px;
}

.completed-indicator i {
  font-size: 16px;
}

/* Intervention Text Formatting Styles */
.intervention-text .intervention-h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--dark);
  margin: 25px 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 3px solid var(--primary);
}

.intervention-text .intervention-h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--dark);
  margin: 20px 0 12px 0;
  padding-left: 15px;
  border-left: 4px solid var(--primary);
  background: rgba(0, 179, 176, 0.05);
  padding: 10px 15px;
  border-radius: 0 8px 8px 0;
}

.intervention-text .intervention-h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--secondary);
  margin: 15px 0 10px 0;
  padding-left: 10px;
  border-left: 3px solid var(--accent);
}

.intervention-text .intervention-paragraph {
  font-size: 15px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 15px;
}

.intervention-text .list-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(0, 179, 176, 0.03);
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

.intervention-text .list-number {
  font-weight: 600;
  color: var(--primary);
  margin-right: 10px;
  min-width: 25px;
}

.intervention-text .intervention-divider {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), transparent);
  margin: 25px 0;
  border-radius: 1px;
}

.intervention-text strong {
  font-weight: 600;
  color: var(--dark);
}

.intervention-text em {
  font-style: italic;
  color: var(--secondary);
}

.intervention-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.counselor-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-light);
}

.counselor-info i {
  color: var(--primary);
}

.mark-read-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mark-read-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.read-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--success);
  font-weight: 500;
}

.read-status i {
  color: var(--success);
}

/* Additional Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design for AI Interventions */
@media (max-width: 768px) {
  /* Guidance Feedback View Mobile Styles */
  .guidance-feedback-view {
    padding: 15px;
    min-height: auto;
  }
  
  .guidance-content {
    max-width: 100%;
    margin: 0;
  }
  
  /* Guidance Header Mobile */
  .guidance-header {
    padding: 20px 15px;
    margin-bottom: 20px;
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .header-info h2 {
    font-size: 22px;
    margin-bottom: 8px;
  }
  
  .header-info p {
    font-size: 14px;
  }
  
  .summary-stats {
    flex-direction: row;
    justify-content: space-around;
    gap: 10px;
    width: 100%;
  }
  
  .stat-item {
    padding: 15px 10px;
    min-width: 80px;
    flex: 1;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  /* Professional Intervention Cards Mobile */
  .professional-intervention-card {
    margin-bottom: 20px;
    border-radius: 12px;
  }
  
  .intervention-header {
    padding: 20px 15px;
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .student-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .student-avatar {
    width: 40px;
    height: 40px;
  }
  
  .student-avatar i {
    font-size: 20px;
  }
  
  .student-details h3 {
    font-size: 18px;
  }
  
  .student-details p {
    font-size: 13px;
  }
  
  .intervention-meta {
    gap: 15px;
    justify-content: center;
  }
  
  .score-value {
    font-size: 20px;
  }
  
  /* Intervention Content Mobile */
  .intervention-content {
    padding: 20px 15px;
  }
  
  .dimension-section {
    margin-bottom: 20px;
  }
  
  .dimension-header h4 {
    font-size: 16px;
  }
  
  .dimension-score {
    font-size: 18px;
  }
  
  .dimension-description {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .recommendations-section h4 {
    font-size: 16px;
  }
  
  .recommendation-item {
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .recommendation-title {
    font-size: 15px;
  }
  
  .recommendation-description {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .action-steps {
    margin-top: 15px;
  }
  
  .action-steps h5 {
    font-size: 14px;
  }
  
  .action-steps ul {
    padding-left: 20px;
  }
  
  .action-steps li {
    font-size: 13px;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  /* Intervention Footer Mobile */
  .intervention-footer {
    padding: 15px;
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .counselor-info {
    justify-content: center;
    gap: 10px;
  }
  
  .counselor-details {
    text-align: center;
  }
  
  .counselor-label {
    font-size: 12px;
  }
  
  .counselor-name {
    font-size: 14px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .mark-reviewed-btn {
    padding: 12px 20px;
    font-size: 14px;
    width: 100%;
    max-width: 200px;
  }
  
  .reviewed-indicator {
    justify-content: center;
    font-size: 14px;
  }
  
  /* Loading and Empty States Mobile */
  .loading-card, .empty-card {
    padding: 30px 20px;
    margin: 20px 0;
  }
  
  .loading-card h3, .empty-card h3 {
    font-size: 20px;
  }
  
  .loading-card p, .empty-card p {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .cta-button {
    padding: 12px 24px;
    font-size: 14px;
  }
  
  /* Legacy styles for backward compatibility */
  .interventions-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .card-meta {
    align-items: flex-start;
    width: 100%;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .header-text h1 {
    font-size: 28px;
  }
  
  .header-text p {
    font-size: 16px;
  }
  
  .interventions-container {
    padding: 0 20px;
  }
  
  .card-content {
    padding: 20px;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Mobile Navigation Toggle */
.mobile-nav-toggle {
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.3);
  transition: all 0.3s ease;
}

.mobile-nav-toggle:hover {
  background: var(--primary-dark);
  transform: scale(1.05);
}

.mobile-nav-toggle i {
  font-size: 18px;
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mobile-overlay.active {
  opacity: 1;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .content-container {
    padding: 25px;
  }
  
  .assessment-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .welcome-section {
    padding: 20px;
  }
  
  .welcome-title {
    font-size: 22px;
  }
  
  .welcome-subtitle {
    font-size: 15px;
  }
}

@media (max-width: 900px) {
  .sidebar {
    width: 240px;
  }
  
  .main-content {
    margin-left: 240px;
  }
  
  .top-nav {
    left: 240px;
  }
  
  .page-title h1 {
    font-size: 24px;
  }
  
  .page-title p {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .mobile-nav-toggle {
    display: block;
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
    z-index: 100;
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .top-nav {
    left: 0;
    padding: 15px 20px 15px 70px;
  }
  
  .content-container {
    padding: 20px 15px;
    margin-top: 60px;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 20px;
  }
  
  .welcome-illustration {
    width: 100px;
    height: 60px;
  }
  
  .assessment-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }
  
  .assessment-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .assessment-info h3 {
    font-size: 18px;
  }
  
  .assessment-meta {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .progress-section {
    padding: 12px;
  }
  
  .dimensions-preview {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .action-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .primary-action, .secondary-action {
    width: 100%;
    justify-content: center;
  }
  
  .stats-card, .tips-card {
    padding: 16px;
  }
  
  .no-assessment-card {
    padding: 20px;
    text-align: center;
  }
  
  .no-assessment-icon {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
  
  .no-assessment-logo {
    width: 80px;
    height: 80px;
  }
}

@media (max-width: 768px) {
  .settings-view {
    gap: 20px;
    padding: 0 10px;
  }
  
  .profile-info-card {
    padding: 20px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .profile-avatar {
    font-size: 48px;
  }
  
  .academic-info {
    justify-content: center;
  }
  
  .settings-card {
    padding: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .settings-actions {
    flex-direction: column;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 600px) {
  .mobile-nav-toggle {
    top: 15px;
    left: 15px;
    padding: 10px;
  }
  
  .top-nav {
    padding: 12px 15px 12px 60px;
  }
  
  .page-title h1 {
    font-size: 20px;
  }
  
  .page-title p {
    font-size: 12px;
  }
  
  .content-container {
    padding: 15px 10px;
    margin-top: 55px;
  }
  
  .welcome-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .welcome-subtitle {
    font-size: 14px;
  }
  
  .welcome-illustration {
    width: 80px;
    height: 50px;
  }
  
  .element {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .assessment-grid {
    gap: 12px;
  }
  
  .card-header {
    padding: 12px;
  }
  
  .assessment-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .assessment-info h3 {
    font-size: 16px;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.intervention-modal {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #00b3b0 0%, #00a8a5 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 24px;
}

.intervention-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  font-weight: 600;
  color: #374151;
}

.info-row .value {
  color: #6b7280;
}

.risk-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-level.low {
  background-color: #fee2e2;
  color: #dc2626;
}

.risk-level.moderate {
  background-color: #fef3c7;
  color: #d97706;
}

.risk-level.high {
  background-color: #dcfce7;
  color: #16a34a;
}

.modal-section {
  margin-bottom: 24px;
}

.modal-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.strategy-content {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  line-height: 1.6;
  color: #374151;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.dimension-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #00b3b0;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dimension-header h5 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.dimension-score {
  background: #00b3b0;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.dimension-content {
  color: #6b7280;
  line-height: 1.5;
}

.action-plan-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.action-checkbox {
  color: #00b3b0;
  margin-top: 2px;
}

.action-item span {
  color: #374151;
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* History Table Styles */
.history-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  background: linear-gradient(135deg, #00b3b0 0%, #00a8a5 100%);
  color: white;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
}

.history-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.history-table tr:hover {
  background-color: #f8fafc;
}

.view-details-btn {
  background: linear-gradient(135deg, #00b3b0 0%, #00a8a5 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.view-details-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.3);
}

.empty-state, .no-history-message, .loading-message {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-state i, .no-history-message i, .loading-message i {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.loading-spinner i {
  color: #00b3b0;
}

@media (max-width: 768px) {
  .intervention-modal {
    width: 95%;
    margin: 20px;
  }
  
  .modal-content {
    padding: 16px;
  }
  
  .dimensions-grid {
    grid-template-columns: 1fr;
  }
  
  .history-table {
    font-size: 14px;
  }
  
  .history-table th,
  .history-table td {
    padding: 12px 8px;
  }
}
  
  .assessment-type {
    font-size: 12px;
  }
  
  .assessment-meta {
    font-size: 11px;
  }
  
  .card-body {
    padding: 12px;
  }
  
  .assessment-description p {
    font-size: 14px;
  }
  
  .progress-section {
    padding: 10px;
    margin-bottom: 16px;
  }
  
  .dimensions-preview h4 {
    font-size: 14px;
  }
  
  .dimensions-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  
  .dimension-item {
    padding: 8px;
    font-size: 12px;
  }
  
  .primary-action-btn, .secondary-action-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .stats-card, .tips-card {
    padding: 12px;
  }
  
  .stats-header, .tips-header {
    padding: 12px 16px;
  }
  
  .stats-header h4, .tips-header h4 {
    font-size: 14px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  .no-assessment-card {
    padding: 16px;
  }
  
  .no-assessment-card h3 {
    font-size: 18px;
  }
  
  .no-assessment-card p {
    font-size: 14px;
  }
  
  .no-assessment-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .no-assessment-logo {
    width: 60px;
    height: 60px;
  }
  
  .contact-counselor-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  /* Settings responsive */
  .settings-view {
    padding: 0 5px;
  }
  
  .profile-info-card, .settings-card {
    padding: 16px;
  }
  
  .profile-details h2 {
    font-size: 20px;
  }
  
  .settings-header h3 {
    font-size: 18px;
  }
  
  .settings-section h4 {
    font-size: 14px;
  }
  
  .form-group input {
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .save-btn, .cancel-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  /* AI Interventions responsive */
  .interventions-grid {
    gap: 16px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .intervention-title {
    font-size: 18px;
  }
  
  .intervention-content {
    font-size: 14px;
    padding: 16px;
  }
  
  .action-btn {
    padding: 10px 16px;
    font-size: 13px;
  }

@media (max-width: 480px) {
  .sidebar {
    width: 100vw;
  }
  
  .welcome-section {
    padding: 12px;
  }
  
  .welcome-title {
    font-size: 18px;
  }
  
  .welcome-subtitle {
    font-size: 13px;
  }
  
  .assessment-type-selector {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .type-buttons {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .type-button {
    padding: 16px;
  }
  
  .type-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .type-info h4 {
    font-size: 15px;
  }
  
  .type-info p {
    font-size: 13px;
  }
  
  .assessment-grid {
    gap: 10px;
  }
  
  .card-header, .card-body {
    padding: 10px;
  }
  
  .assessment-info h3 {
    font-size: 15px;
  }
  
  .dimensions-grid {
    gap: 4px;
  }
  
  .dimension-item {
    padding: 6px;
    font-size: 11px;
  }
  
  .primary-action-btn, .secondary-action-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .no-assessment-card {
    padding: 12px;
  }
  
  .no-assessment-card h3 {
    font-size: 16px;
  }
  
  .no-assessment-card p {
    font-size: 13px;
  }
}
</style>