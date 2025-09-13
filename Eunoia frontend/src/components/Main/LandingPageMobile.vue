<template>
  <div class="mobile-landing">
    <!-- Mobile Hero Section -->
    <section class="mobile-hero">
      <div class="mobile-container">
        <div class="hero-content">
          <div class="logo-section">
            <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="mobile-logo">
            <h1 class="mobile-title">EUNOIA</h1>
            <p class="mobile-subtitle">Psychological Well-being Assessment</p>
          </div>
          
          <div class="mobile-cta">
            <button @click="navigateToLogin" class="mobile-btn-primary">
              <i class="fas fa-user-graduate"></i>
              Student Login
            </button>
            <button @click="navigateToLogin" class="mobile-btn-secondary">
              <i class="fas fa-user-tie"></i>
              Counselor Login
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Features Section -->
    <section class="mobile-features">
      <div class="mobile-container">
        <h2 class="section-title">Key Features</h2>
        
        <div class="feature-cards">
          <div class="mobile-feature-card" v-for="feature in mobileFeatures" :key="feature.id">
            <div class="feature-icon">
              <i :class="feature.icon"></i>
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Ryff Dimensions -->
    <section class="mobile-dimensions">
      <div class="mobile-container">
        <h2 class="section-title">Six Dimensions of Well-being</h2>
        
        <div class="dimensions-grid">
          <div class="mobile-dimension" v-for="dimension in ryffDimensions" :key="dimension.id">
            <div class="dimension-icon" :style="{color: dimension.color}">
              <i :class="dimension.icon"></i>
            </div>
            <h4>{{ dimension.name }}</h4>
            <p>{{ dimension.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Benefits Section -->
    <section class="mobile-benefits">
      <div class="mobile-container">
        <h2 class="section-title">Why Choose EUNOIA?</h2>
        
        <div class="benefits-list">
          <div class="benefit-item" v-for="benefit in benefits" :key="benefit.id">
            <div class="benefit-icon">
              <i :class="benefit.icon"></i>
            </div>
            <div class="benefit-content">
              <h4>{{ benefit.title }}</h4>
              <p>{{ benefit.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Contact Section -->
    <section class="mobile-contact">
      <div class="mobile-container">
        <h2 class="section-title">Get Started</h2>
        <p class="contact-description">Ready to begin your well-being journey?</p>
        
        <div class="contact-actions">
          <button @click="navigateToLogin" class="mobile-btn-primary full-width">
            <i class="fas fa-sign-in-alt"></i>
            Access Platform
          </button>
          
          <div class="contact-info">
            <div class="contact-item">
              <i class="fas fa-envelope"></i>
              <span>support@eunoia.com</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-phone"></i>
              <span>+1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'LandingPageMobile',
  data() {
    return {
      mobileFeatures: [
        {
          id: 1,
          icon: 'fas fa-mobile-alt',
          title: 'Mobile Optimized',
          description: 'Designed specifically for mobile devices with touch-friendly interface'
        },
        {
          id: 2,
          icon: 'fas fa-brain',
          title: 'Adaptive Assessment',
          description: 'Smart questionnaires that adapt to reduce fatigue and improve accuracy'
        },
        {
          id: 3,
          icon: 'fas fa-chart-line',
          title: 'Real-time Insights',
          description: 'Instant feedback and personalized well-being recommendations'
        },
        {
          id: 4,
          icon: 'fas fa-shield-alt',
          title: 'Secure & Private',
          description: 'Your data is protected with enterprise-grade security measures'
        }
      ],
      ryffDimensions: [
        {
          id: 1,
          name: 'Self-Acceptance',
          icon: 'fas fa-heart',
          color: '#00b3b0',
          description: 'Positive attitude toward oneself'
        },
        {
          id: 2,
          name: 'Positive Relations',
          icon: 'fas fa-users',
          color: '#3498db',
          description: 'Quality relationships with others'
        },
        {
          id: 3,
          name: 'Autonomy',
          icon: 'fas fa-brain',
          color: '#9b59b6',
          description: 'Self-determination and independence'
        },
        {
          id: 4,
          name: 'Environmental Mastery',
          icon: 'fas fa-globe',
          color: '#f1c40f',
          description: 'Ability to manage life situations'
        },
        {
          id: 5,
          name: 'Purpose in Life',
          icon: 'fas fa-bullseye',
          color: '#e74c3c',
          description: 'Goals and sense of direction'
        },
        {
          id: 6,
          name: 'Personal Growth',
          icon: 'fas fa-seedling',
          color: '#2ecc71',
          description: 'Continued development and improvement'
        }
      ],
      benefits: [
        {
          id: 1,
          icon: 'fas fa-clock',
          title: 'Quick Assessment',
          description: 'Complete assessments in just 10-15 minutes'
        },
        {
          id: 2,
          icon: 'fas fa-user-md',
          title: 'Expert Validated',
          description: 'Based on scientifically proven Ryff model'
        },
        {
          id: 3,
          icon: 'fas fa-sync-alt',
          title: 'Progress Tracking',
          description: 'Monitor your well-being journey over time'
        },
        {
          id: 4,
          icon: 'fas fa-lightbulb',
          title: 'Actionable Insights',
          description: 'Get personalized recommendations for improvement'
        }
      ]
    }
  },
  methods: {
    navigateToLogin() {
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
/* Mobile-First Design Variables */
:root {
  --primary: #00b3b0;
  --primary-dark: #009491;
  --secondary: #f8c630;
  --accent: #ff6b6b;
  --light: #ffffff;
  --dark: #1a2e35;
  --gray: #f7f9fa;
  --text: #546e7a;
  --text-light: #78909c;
  --border-radius: 12px;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  --spacing: 16px;
}

/* Base Mobile Styles */
.mobile-landing {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: var(--text);
  overflow-x: hidden;
}

.mobile-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing);
}

/* Mobile Hero Section */
.mobile-hero {
  background: linear-gradient(135deg, #f7f9fa 0%, #e6f7f7 50%, #d9f2f2 100%);
  padding: 60px 0 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.logo-section {
  margin-bottom: 40px;
}

.mobile-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.mobile-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.mobile-subtitle {
  font-size: 1.1rem;
  color: var(--text);
  margin: 0 0 32px 0;
  font-weight: 400;
}

.mobile-cta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 280px;
  margin: 0 auto;
}

/* Mobile Buttons */
.mobile-btn-primary,
.mobile-btn-secondary {
  padding: 16px 24px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 56px;
  text-decoration: none;
}

.mobile-btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: var(--shadow);
}

.mobile-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 179, 176, 0.3);
}

.mobile-btn-secondary {
  background: white;
  color: var(--primary);
  border: 2px solid var(--primary);
}

.mobile-btn-secondary:hover {
  background: var(--primary);
  color: white;
}

.full-width {
  width: 100%;
}

/* Section Titles */
.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--dark);
  text-align: center;
  margin: 0 0 32px 0;
  letter-spacing: -0.01em;
}

/* Mobile Features Section */
.mobile-features {
  padding: 60px 0;
  background: white;
}

.feature-cards {
  display: grid;
  gap: 24px;
}

.mobile-feature-card {
  background: var(--gray);
  border-radius: var(--border-radius);
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.mobile-feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  background: white;
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: rgba(0, 179, 176, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--primary);
  font-size: 24px;
}

.mobile-feature-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0 0 12px 0;
}

.mobile-feature-card p {
  color: var(--text);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Mobile Dimensions Section */
.mobile-dimensions {
  padding: 60px 0;
  background: var(--gray);
}

.dimensions-grid {
  display: grid;
  gap: 20px;
}

.mobile-dimension {
  background: white;
  border-radius: var(--border-radius);
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.mobile-dimension:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.dimension-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.mobile-dimension h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0 0 8px 0;
}

.mobile-dimension p {
  color: var(--text);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Mobile Benefits Section */
.mobile-benefits {
  padding: 60px 0;
  background: white;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--gray);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.benefit-item:hover {
  background: white;
  box-shadow: var(--shadow);
}

.benefit-icon {
  width: 48px;
  height: 48px;
  background: rgba(0, 179, 176, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 20px;
  flex-shrink: 0;
}

.benefit-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0 0 8px 0;
}

.benefit-content p {
  color: var(--text);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Mobile Contact Section */
.mobile-contact {
  padding: 60px 0;
  background: var(--primary);
  color: white;
  text-align: center;
}

.mobile-contact .section-title {
  color: white;
}

.contact-description {
  font-size: 1.1rem;
  margin: 0 0 32px 0;
  opacity: 0.9;
}

.contact-actions {
  max-width: 280px;
  margin: 0 auto;
}

.contact-info {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  font-size: 0.95rem;
}

.contact-item i {
  width: 20px;
  text-align: center;
  opacity: 0.8;
}

/* Responsive Adjustments for larger mobile screens */
@media (min-width: 480px) {
  .mobile-container {
    padding: 0 24px;
  }
  
  .mobile-title {
    font-size: 3rem;
  }
  
  .feature-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dimensions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mobile-cta {
    max-width: 320px;
  }
  
  .contact-actions {
    max-width: 320px;
  }
}

@media (min-width: 640px) {
  .dimensions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .contact-info {
    flex-direction: row;
    justify-content: space-around;
  }
}
</style>