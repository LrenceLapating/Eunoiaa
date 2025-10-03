<template>
  <div>
    <!-- Header -->
    <header id="header">
        <div class="container header-container">
            <div class="logo">
                <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="logo-svg">
                <h1>EUNOIA</h1>
            </div>
            
            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" @click="toggleMobileMenu" :class="{ active: mobileMenuOpen }">
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            <!-- Desktop Navigation -->
            <nav class="desktop-nav">
                <ul>
                    <li><a href="#features">Features</a></li>
                    <li><a href="#how-it-works">How It Works</a></li>
                    <li><a href="#training">Training</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
            
            <!-- Mobile Navigation -->
            <nav class="mobile-nav" :class="{ active: mobileMenuOpen }">
                <ul>
                    <li><a href="#features" @click="scrollToSection('features')">Features</a></li>
                    <li><a href="#how-it-works" @click="scrollToSection('how-it-works')">How It Works</a></li>
                    <li><a href="#training" @click="scrollToSection('training')">Training</a></li>
                    <li><a href="#about" @click="scrollToSection('about')">About</a></li>
                    <li><a href="#contact" @click="scrollToSection('contact')">Contact</a></li>
                    <li><a @click="navigateToLogin(); closeMobileMenu()" class="mobile-login-btn">Login</a></li>
                </ul>
            </nav>
            
            <a @click="navigateToLogin" class="cta-button desktop-login">Login</a>
        </div>
        
        <!-- Mobile Menu Overlay -->
        <div class="mobile-overlay" :class="{ active: mobileMenuOpen }" @click="closeMobileMenu"></div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="animated-background">
            <div class="shape shape1"></div>
            <div class="shape shape2"></div>
            <div class="shape shape3"></div>
            <div class="shape shape4"></div>
            <div class="shape shape5"></div>
            <div class="shape shape6"></div>
        </div>
        <div class="container hero-content">
            <div class="hero-text fade-in">
                <h2>An AI-Powered System for <span class="text-primary">Psychological Well-Being</span> Assessment</h2>
                <p>EUNOIA streamlines psychological well-being evaluation using the validated Ryff Scale, providing real-time insights and personalized feedback for educational institutions.</p>
                <div class="hero-buttons">
                    <a @click="navigateToLogin" class="cta-button">Start Assessment</a>
                    <a href="#features" class="cta-button-outline">Explore Features</a>
                </div>
               
            </div>
            <div class="hero-graphic fade-in">
                <div class="dimensions-container">
                    <div class="dimension-circle">
                        <div class="dimension dimension-1">
                            <div class="dimension-icon">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="dimension-label">Self-Acceptance</div>
                        </div>
                        <div class="dimension dimension-2">
                            <div class="dimension-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="dimension-label">Positive Relations with Others</div>
                        </div>
                        <div class="dimension dimension-3">
                            <div class="dimension-icon">
                                <i class="fas fa-brain"></i>
                            </div>
                            <div class="dimension-label">Autonomy</div>
                        </div>
                        <div class="dimension dimension-4">
                            <div class="dimension-icon">
                                <i class="fas fa-globe"></i>
                            </div>
                            <div class="dimension-label">Environmental Mastery</div>
                        </div>
                        <div class="dimension dimension-5">
                            <div class="dimension-icon">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <div class="dimension-label">Purpose in Life</div>
                        </div>
                        <div class="dimension dimension-6">
                            <div class="dimension-icon">
                                <i class="fas fa-seedling"></i>
                            </div>
                            <div class="dimension-label">Personal Growth</div>
                        </div>
                        <div class="dimension-center">
                            <div class="dimension-center-text">Ryff Scale</div>
                        </div>
                        <div class="pulse-circle"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Assessment Types Section -->
    <section id="assessment" class="assessment-section">
        <div class="container">
            <div class="section-title">
                <h3>Choose Your Assessment</h3>
                <p>EUNOIA offers multiple versions of the validated Ryff Scale to meet different needs</p>
            </div>
            <div class="assessment-cards">
                <div class="assessment-card fade-in">
                    <div class="assessment-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h4>42-Item Assessment</h4>
                    <p>Standard version with 7 items per dimension. Balances depth and completion time.</p>
                    <div class="assessment-meta">
                        <div class="meta-item"><i class="fas fa-clock"></i> 15-20 min</div>
                        <div class="meta-item"><i class="fas fa-chart-bar"></i> Detailed Results</div>
                    </div>
                    <a @click="navigateToLogin" class="cta-button">Start Assessment</a>
                </div>

                <div class="assessment-card fade-in">
                    <div class="assessment-icon">
                        <i class="fas fa-microscope"></i>
                    </div>
                    <h4>84-Item Assessment</h4>
                    <p>Complete version with 14 items per dimension. Highest reliability and detail.</p>
                    <div class="assessment-meta">
                        <div class="meta-item"><i class="fas fa-clock"></i> 30-40 min</div>
                        <div class="meta-item"><i class="fas fa-chart-bar"></i> In-Depth Analysis</div>
                    </div>
                    <a @click="navigateToLogin" class="cta-button">Start Assessment</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
        <div class="features-bg">
            <div class="bg-shape bg-shape1"></div>
            <div class="bg-shape bg-shape2"></div>
            <div class="bg-shape bg-shape3"></div>
        </div>
        <div class="container">
            <div class="section-title">
                <h3 class="reveal-text">Key Features</h3>
                <p class="reveal-text">EUNOIA transforms psychological well-being assessment through automation and AI-powered analysis</p>
            </div>
            <div class="features-grid">
                <div class="feature-card tilt-card fade-in">
                    <div class="feature-icon pulse-animation">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <h4>Ryff Scale Assessment</h4>
                    <p>Validated psychological well-being evaluation using the Ryff Scale with multiple versions (42 and 84 items) to suit different needs.</p>
                    <p class="feature-detail">Measures six dimensions of psychological well-being with scientific validity</p>
                </div>
                <div class="feature-card tilt-card fade-in">
                    <div class="feature-icon pulse-animation">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <h4>Automated Scoring</h4>
                    <p>Instant calculation of results across all six Ryff dimensions, eliminating manual scoring errors and saving valuable time.</p>
                    <p class="feature-detail">Reduces assessment processing time from hours to seconds</p>
                </div>
                <div class="feature-card tilt-card fade-in">
                    <div class="feature-icon pulse-animation">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h4>Comprehensive Dashboards</h4>
                    <p>Visual representation of well-being data for individuals and groups, with filtering options by demographics and time periods.</p>
                    <p class="feature-detail">Intuitive visualization of complex psychological data patterns</p>
                </div>
                <div class="feature-card tilt-card fade-in">
                    <div class="feature-icon pulse-animation">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <h4>Privacy Controls</h4>
                    <p>Role-based access system ensuring that sensitive psychological data is only accessible to authorized personnel.</p>
                    <p class="feature-detail">Protects confidential information with secure authentication</p>
                </div>
                <div class="feature-card tilt-card fade-in">
                    <div class="feature-icon pulse-animation">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h4>Personalized Insights</h4>
                    <p>Tailored feedback and recommendations based on individual assessment results to support psychological well-being improvement.</p>
                    <p class="feature-detail">Actionable guidance for each dimension of well-being</p>
                </div>
                <div class="feature-card tilt-card fade-in">
                    <div class="feature-icon pulse-animation">
                        <i class="fas fa-file-export"></i>
                    </div>
                    <h4>Data Export</h4>
                    <p>Export assessment results and reports in multiple formats for integration with other systems or for offline analysis.</p>
                    <p class="feature-detail">Compatible with common data formats for research and reporting</p>
                </div>
            </div>
        </div>
    </section>

    <!-- User Roles Section -->
    <section class="user-roles-section">
        <div class="container">
            <div class="section-title">
                <h3>Tailored for Every User</h3>
                <p>EUNOIA provides specialized experiences for different roles in your institution</p>
            </div>
            <div class="roles-container">
                <div class="role-card slide-in-left">
                    <div class="role-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <h4>For Students</h4>
                    <ul class="role-features">
                        <li><i class="fas fa-check"></i> Adaptive questionnaires to reduce fatigue</li>
                        <li><i class="fas fa-check"></i> Personalized well-being insights</li>
                        <li><i class="fas fa-check"></i> Progress tracking over time</li>
                        <li><i class="fas fa-check"></i> Actionable recommendations</li>
                    </ul>
                    <a @click="navigateToLogin" class="cta-button">Student Login</a>
                </div>

                <div class="role-card slide-in-right">
                    <div class="role-icon">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <h4>For Counselors</h4>
                    <ul class="role-features">
                        <li><i class="fas fa-check"></i> Automated scoring and analysis</li>
                        <li><i class="fas fa-check"></i> Risk detection alerts</li>
                        <li><i class="fas fa-check"></i> Demographic trend analysis</li>
                        <li><i class="fas fa-check"></i> Intervention planning tools</li>
                    </ul>
                    <a @click="navigateToLogin" class="cta-button">Counselor Login</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Data Visualization Section -->
    <section class="data-visualization">
        <div class="container">
            <div class="section-title">
                <h3>Data-Driven Insights</h3>
                <p>Powerful visualization tools to understand psychological well-being patterns</p>
            </div>
            <div class="dashboard-preview">
                <div class="dashboard-tabs">
                    <div class="dashboard-tab active" data-tab="individual">Individual</div>
                    <div class="dashboard-tab" data-tab="group">Group</div>
                    <div class="dashboard-tab" data-tab="trends">Trends</div>
                </div>
                <div class="dashboard-content">
                    <div class="dashboard-panel active" id="individual-panel">
                        <div class="dashboard-image">
                            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Individual Dashboard">
                            <div class="overlay-text">
                                <h4>Individual Assessment Dashboard</h4>
                                <p>Detailed breakdown of each Ryff dimension with personalized recommendations</p>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-panel" id="group-panel">
                        <div class="dashboard-image">
                            <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Group Dashboard">
                            <div class="overlay-text">
                                <h4>Group Analysis Dashboard</h4>
                                <p>Compare cohorts and identify trends across demographics using CoDA</p>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-panel" id="trends-panel">
                        <div class="dashboard-image">
                            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Trends Dashboard">
                            <div class="overlay-text">
                                <h4>Longitudinal Trends Dashboard</h4>
                                <p>Track well-being changes over time with predictive analytics</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works" id="how-it-works">
        <div class="container">
            <div class="section-title">
                <h3>How EUNOIA Works</h3>
                <p>A simple process that transforms psychological assessment in your institution</p>
            </div>
            <div class="steps-container">
                <div class="step fade-in">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h4>Assessment Initiation</h4>
                        <p>Counselors or HR personnel initiate assessments for individuals or groups, selecting the appropriate Ryff Scale version (42 and 84 items).</p>
                       
                    </div>
                </div>
                <div class="step fade-in">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h4>Adaptive Questionnaire</h4>
                        <p>Participants complete the digital assessment with progress tracking and adaptive features that minimize survey fatigue while maintaining validity.</p>
                  
                    </div>
                </div>
                <div class="step fade-in">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h4>Automated Analysis</h4>
                        <p>EUNOIA processes responses using advanced algorithms and Compositional Data Analysis (CoDA) to generate nuanced well-being profiles.</p>
                      
                    </div>
                </div>
                <div class="step fade-in">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h4>Professional Review</h4>
                        <p>Counselors review AI-generated insights and recommendations before they're shared with participants, ensuring professional oversight.</p>
                       
                    </div>
                </div>
                <div class="step fade-in">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        <h4>Personalized Feedback</h4>
                        <p>Participants receive tailored feedback on their psychological well-being across all six Ryff dimensions with actionable recommendations.</p>
                       
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Research Section -->
    <section class="research-section">
        <div class="container">
            <div class="section-title">
                <h3>Research-Based Approach</h3>
                <p>EUNOIA is built on Carol Ryff's validated six-dimensional model of psychological well-being</p>
            </div>
            <div class="research-content">
                <div class="research-text slide-in-left">
                    <h4>The Ryff Scale</h4>
                    <p>The Ryff Scales of Psychological Well-Being is a theoretically grounded instrument that specifically focuses on measuring multiple facets of psychological well-being. These facets include the six distinct dimensions of autonomy, environmental mastery, personal growth, positive relations with others, purpose in life, and self-acceptance.</p>
                    <p>EUNOIA transforms traditional assessment methods through automation, AI-powered interpretation, and user-centered design while maintaining the psychometric integrity of the original scale.</p>
                    <div class="research-stats">
                        <div class="research-stat">
                            <div class="stat-number">0.86-0.93</div>
                            <div class="stat-label">Internal Consistency (Cronbach's α)</div>
                        </div>
                        <div class="research-stat">
                            <div class="stat-number">6</div>
                            <div class="stat-label">Well-being Dimensions</div>
                        </div>
                    </div>
                </div>
                <div class="research-image slide-in-right">
                    <div class="ryff-wheel-container">
                        <div class="ryff-wheel">
                            <div class="ryff-center">
                                <div class="center-content">
                                    <span>Ryff Scale</span>
                                    <div class="center-glow"></div>
                                </div>
                            </div>
                            <div class="ryff-orbit"></div>
                            <div class="ryff-dimensions">
                                <div class="ryff-dimension ryff-dimension-1" style="--angle: 0deg; --color: #00b3b0;">
                                    <div class="dimension-bubble">
                                        <div class="dimension-icon">
                                            <i class="fas fa-user"></i>
                                        </div>
                                        <div class="dimension-name">Self-Acceptance</div>
                                    </div>
                                </div>
                                <div class="ryff-dimension ryff-dimension-2" style="--angle: 60deg; --color: #3498db;">
                                    <div class="dimension-bubble">
                                        <div class="dimension-icon">
                                            <i class="fas fa-users"></i>
                                        </div>
                                        <div class="dimension-name">Positive Relations with Others</div>
                                    </div>
                                </div>
                                <div class="ryff-dimension ryff-dimension-3" style="--angle: 120deg; --color: #9b59b6;">
                                    <div class="dimension-bubble">
                                        <div class="dimension-icon">
                                            <i class="fas fa-brain"></i>
                                        </div>
                                        <div class="dimension-name">Autonomy</div>
                                    </div>
                                </div>
                                <div class="ryff-dimension ryff-dimension-4" style="--angle: 180deg; --color: #f1c40f;">
                                    <div class="dimension-bubble">
                                        <div class="dimension-icon">
                                            <i class="fas fa-globe"></i>
                                        </div>
                                        <div class="dimension-name">Environmental Mastery</div>
                                    </div>
                                </div>
                                <div class="ryff-dimension ryff-dimension-5" style="--angle: 240deg; --color: #e74c3c;">
                                    <div class="dimension-bubble">
                                        <div class="dimension-icon">
                                            <i class="fas fa-bullseye"></i>
                                        </div>
                                        <div class="dimension-name">Purpose in Life</div>
                                    </div>
                                </div>
                                <div class="ryff-dimension ryff-dimension-6" style="--angle: 300deg; --color: #2ecc71;">
                                    <div class="dimension-bubble">
                                        <div class="dimension-icon">
                                            <i class="fas fa-seedling"></i>
                                        </div>
                                        <div class="dimension-name">Personal Growth</div>
                                    </div>
                                </div>
                            </div>
                            <div class="connecting-lines">
                                <div class="line line-1"></div>
                                <div class="line line-2"></div>
                                <div class="line line-3"></div>
                                <div class="line line-4"></div>
                                <div class="line line-5"></div>
                                <div class="line line-6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Training Section -->
    <section id="training" class="training-section">
        <div class="container">
            <div class="section-title">
                <h3>Training & Professional Development</h3>
                <p>Enhance your institution's capacity to support psychological well-being</p>
            </div>
            <div class="training-content">
                <div class="training-tabs">
                    <div class="training-tab active" data-training="counselors">
                        <i class="fas fa-user-md"></i>
                        <span>For Counselors</span>
                    </div>

                </div>
                
                <div class="training-panels">
                    <div class="training-panel active" id="counselors-panel">
                        <div class="training-panel-content">
                            <h4>Counselor Training Program</h4>
                            <p>Our comprehensive training program equips counselors with the skills to effectively use EUNOIA for psychological well-being assessment and intervention planning.</p>
                            
                            <div class="training-modules">
                                <div class="training-module">
                                    <div class="module-icon">
                                        <i class="fas fa-chart-pie"></i>
                                    </div>
                                    <div class="module-content">
                                        <h5>Compositional Data Analysis</h5>
                                        <p>Learn to interpret CoDA-based results and understand the nuanced relationships between Ryff dimensions.</p>
                                        <div class="module-meta">
                                            <span><i class="fas fa-clock"></i> 4 hours</span>
                                            <span><i class="fas fa-certificate"></i> Certificate</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="training-module">
                                    <div class="module-icon">
                                        <i class="fas fa-user-shield"></i>
                                    </div>
                                    <div class="module-content">
                                        <h5>Risk Detection & Intervention</h5>
                                        <p>Develop skills to identify at-risk individuals and create effective intervention strategies based on assessment data.</p>
                                        <div class="module-meta">
                                            <span><i class="fas fa-clock"></i> 6 hours</span>
                                            <span><i class="fas fa-certificate"></i> Certificate</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="training-module">
                                    <div class="module-icon">
                                        <i class="fas fa-laptop-code"></i>
                                    </div>
                                    <div class="module-content">
                                        <h5>Dashboard Mastery</h5>
                                        <p>Master the EUNOIA dashboard to analyze individual and group trends, generate reports, and track interventions.</p>
                                        <div class="module-meta">
                                            <span><i class="fas fa-clock"></i> 3 hours</span>
                                            <span><i class="fas fa-certificate"></i> Certificate</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <a @click="navigateToLogin" class="cta-button">Register for Training</a>
                        </div>
                    </div>
                    

                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about" id="about">
        <div class="container">
            <div class="about-content">
                <div class="about-image scale-in">
                    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80" alt="Team working on EUNOIA">
                </div>
                <div class="about-text fade-in">
                    <h3>About EUNOIA</h3>
                    <p>EUNOIA (An AI-Powered System for Psychological Well-Being Assessment Using the Ryff Scale) was developed by a team of researchers and developers from the University of the Immaculate Conception to address the growing need for efficient, accurate, and scalable psychological well-being assessment in educational settings.</p>
                    <p>Built on Carol Ryff's validated six-dimensional model of psychological well-being, EUNOIA transforms traditional assessment methods through automation, AI-powered interpretation, and user-centered design.</p>
                    <p>Our mission is to make psychological well-being assessment more accessible, actionable, and integrated into educational support systems, ultimately contributing to healthier, more resilient academic communities.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Developer Team Section -->
    <section id="team" class="team-section">
        <div class="container">
            <div class="section-title">
                <h3>Developer Team</h3>
                <p>Meet the talented developers behind EUNOIA</p>
            </div>
            <div class="team-grid">
                <div class="team-member fade-in">
                    <div class="member-image">
                        <img src="@/assets/lemuel.png" alt="Team Member 1">
                    </div>
                    <div class="member-info">
                        <h4>Lemuel Bayson</h4>
                        <p>Lead Developer</p>
                    </div>
                </div>
                <div class="team-member fade-in">
                    <div class="member-image">
                        <img src="@/assets/Lapating.png" alt="Team Member 2">
                    </div>
                    <div class="member-info">
                        <h4>Marc Laurence Lapating</h4>
                        <p>Frontend Developer</p>
                    </div>
                </div>
                <div class="team-member fade-in">
                    <div class="member-image">
                        <img src="@/assets/Dosdos.png" alt="Team Member 3">
                    </div>
                    <div class="member-info">
                        <h4>Josiephous Pierre Dosdos</h4>
                        <p>Backend Developer</p>
                    </div>
                </div>
                <div class="team-member fade-in">
                    <div class="member-image">
                        <img src="@/assets/Batoy.png" alt="Team Member 4">
                    </div>
                    <div class="member-info">
                        <h4>Reuben Rex Batoy</h4>
                        <p>UI/UX Designer</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
        <div class="cta-particles">
            <div class="particle particle1"></div>
            <div class="particle particle2"></div>
            <div class="particle particle3"></div>
            <div class="particle particle4"></div>
            <div class="particle particle5"></div>
            <div class="particle particle6"></div>
            <div class="particle particle7"></div>
            <div class="particle particle8"></div>
        </div>
        <div class="container">
            <h3 class="glowing-text">Ready to Transform Psychological Well-being Assessment?</h3>
            <p>Join educational institutions already using EUNOIA to support student and employee psychological well-being with data-driven insights.</p>
            <div class="cta-buttons">
                <a @click="navigateToLogin" class="cta-button-white animated-button">Start Assessment</a>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section">
        <div class="container">
            <div class="section-title">
                <h3>Get In Touch</h3>
                <p>Have questions about EUNOIA? Reach out to our team for more information</p>
            </div>
            <div class="contact-container">
                <div class="contact-info fade-in">
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <h4>Our Location</h4>
                        <p>Bangkerohan Father Selga St, Davao City<br>Philippines 8000</p>
                    </div>
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <h4>Email Us</h4>
                        <p>eunoia.uic2025@gmail.com</p>
                    </div>
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-phone-alt"></i>
                        </div>
                        <h4>Call Us</h4>
                        <p>09913046352</p>
                    </div>
                </div>
                <div class="contact-form fade-in">
                    <form>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="name">Your Name</label>
                                <input type="text" id="name" placeholder="Enter your name">
                            </div>
                            <div class="form-group">
                                <label for="email">Your Email</label>
                                <input type="email" id="email" placeholder="Enter your email">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="subject">Subject</label>
                            <input type="text" id="subject" placeholder="Enter subject">
                        </div>
                        <div class="form-group">
                            <label for="message">Message</label>
                            <textarea id="message" rows="5" placeholder="Enter your message"></textarea>
                        </div>
                        <button type="submit" class="cta-button">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-column">
                    <h4>EUNOIA</h4>
                    <p>An AI-Powered System for Psychological Well-Being Assessment Using the Ryff Scale</p>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                    </div>
                </div>
                <div class="footer-column">
                    <h4>Product</h4>
                    <ul>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#how-it-works">How It Works</a></li>
                        <li><a href="#training">Training</a></li>
                        <li><a href="#about">About</a></li>
                    </ul>
                </div>
               
                <div class="footer-column">
                    <h4>Contact</h4>
                    <ul>
                        <li><a href="mailto:info@eunoia-wellbeing.com">eunoia.uic2025@gmail.com</a></li>
                        <li><a href="tel:+6382123456">09913046352</a></li>
                        <li><a href="https://maps.google.com/?q=Father+Selga+St,+Davao+City">Bangkerohan Father Selga St, Davao City
Philippines 8000</a></li>
                    </ul>
                </div>
            </div>
            <div class="copyright">
                <p>&copy; {{ new Date().getFullYear() }} EUNOIA. All rights reserved. University of the Immaculate Conception</p>
            </div>
        </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
  data() {
    return {
      parallaxElements: [],
      mobileMenuOpen: false
    };
  },
  mounted() {
    // Header scroll effect
    window.addEventListener('scroll', this.handleScroll);
    
    // Initial visibility check
    setTimeout(this.checkVisibility, 100);
    
    // Animate stat bars
    this.initStatBars();
    
    // Hover effects for dimensions
    this.initDimensionHoverEffects();
    
    // Initialize counter animations
    this.initCounters();
    
    // Initialize dashboard tabs
    this.initDashboardTabs();
    
    // Initialize training tabs
    this.initTrainingTabs();
    
    // Initialize tilt effect
    this.initTiltEffect();
    
    // Initialize parallax effect
    this.initParallaxEffect();
    
    // Initialize particle animation
    this.initParticles();
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('mousemove', this.handleMouseMove);
  },
  methods: {
    handleScroll() {
      const header = document.getElementById('header');
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      this.checkVisibility();
      this.updateParallax();
    },
    checkVisibility() {
      const fadeElements = document.querySelectorAll('.fade-in');
      const scaleElements = document.querySelectorAll('.scale-in');
      const slideLeftElements = document.querySelectorAll('.slide-in-left');
      const slideRightElements = document.querySelectorAll('.slide-in-right');
      const stepElements = document.querySelectorAll('.step');
      const contactElements = document.querySelectorAll('.contact-card, .contact-form');
      
      const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
          rect.bottom >= 0
        );
      };
      
      fadeElements.forEach(element => {
        if (isInViewport(element)) {
          element.classList.add('visible');
        }
      });
      
      scaleElements.forEach(element => {
        if (isInViewport(element)) {
          element.classList.add('visible');
        }
      });
      
      slideLeftElements.forEach(element => {
        if (isInViewport(element)) {
          element.classList.add('visible');
        }
      });
      
      slideRightElements.forEach(element => {
        if (isInViewport(element)) {
          element.classList.add('visible');
        }
      });
      
      stepElements.forEach(element => {
        if (isInViewport(element)) {
          element.classList.add('visible');
        }
      });
      
      contactElements.forEach(element => {
        if (isInViewport(element)) {
          element.classList.add('visible');
        }
      });
    },
    scrollToSection(event, targetId) {
      event.preventDefault();
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    },
    initStatBars() {
      const statFills = document.querySelectorAll('.stat-fill');
      
      // Store original widths
      statFills.forEach(fill => {
        const width = getComputedStyle(fill).width;
        fill.setAttribute('data-width', width);
        fill.style.width = '0';
      });
      
      // Trigger stat bar animation when in viewport
      const heroGraphic = document.querySelector('.hero-graphic');
      if (heroGraphic) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateStatBars();
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });
        
        observer.observe(heroGraphic);
      }
    },
    animateStatBars() {
      const statFills = document.querySelectorAll('.stat-fill');
      
      statFills.forEach(fill => {
        const targetWidth = fill.getAttribute('data-width') || fill.style.width;
        fill.style.width = '0';
        
        setTimeout(() => {
          fill.style.width = targetWidth;
        }, 500);
      });
    },
    initDimensionHoverEffects() {
      const dimensions = document.querySelectorAll('.dimension');
      dimensions.forEach(dimension => {
        dimension.addEventListener('mouseenter', function() {
          const index = this.classList[1].split('-')[1];
          const statFill = document.querySelector(`.stat-fill-${index}`);
          if (statFill) {
            statFill.style.opacity = '0.8';
            statFill.style.transform = 'scaleX(1.05)';
          }
        });
        
        dimension.addEventListener('mouseleave', function() {
          const index = this.classList[1].split('-')[1];
          const statFill = document.querySelector(`.stat-fill-${index}`);
          if (statFill) {
            statFill.style.opacity = '1';
            statFill.style.transform = 'scaleX(1)';
          }
        });
      });
    },
    initCounters() {
      const counters = document.querySelectorAll('.counter');
      const speed = 200;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.getAttribute('data-target'));
            let count = 0;
            
            const updateCount = () => {
              const increment = target / speed;
              
              if (count < target) {
                count += increment;
                counter.innerText = Math.ceil(count);
                setTimeout(updateCount, 1);
              } else {
                counter.innerText = target;
              }
            };
            
            updateCount();
            observer.unobserve(counter);
          }
        });
      }, { threshold: 0.5 });
      
      counters.forEach(counter => {
        observer.observe(counter);
      });
    },
    initDashboardTabs() {
      const tabs = document.querySelectorAll('.dashboard-tab');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          tabs.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          tab.classList.add('active');
          
          // Get tab data attribute
          const tabId = tab.getAttribute('data-tab');
          
          // Hide all panels
          const panels = document.querySelectorAll('.dashboard-panel');
          panels.forEach(panel => panel.classList.remove('active'));
          
          // Show selected panel
          const selectedPanel = document.getElementById(`${tabId}-panel`);
          if (selectedPanel) {
            selectedPanel.classList.add('active');
          }
        });
      });
    },
    initTrainingTabs() {
      const trainingTabs = document.querySelectorAll('.training-tab');
      
      trainingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          trainingTabs.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          tab.classList.add('active');
          
          // Get tab data attribute
          const trainingId = tab.getAttribute('data-training');
          
          // Hide all panels
          const trainingPanels = document.querySelectorAll('.training-panel');
          trainingPanels.forEach(panel => panel.classList.remove('active'));
          
          // Show selected panel
          const selectedPanel = document.getElementById(`${trainingId}-panel`);
          if (selectedPanel) {
            selectedPanel.classList.add('active');
          }
        });
      });
    },
    initTiltEffect() {
      const tiltCards = document.querySelectorAll('.tilt-card');
      
      tiltCards.forEach(card => {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateX = (y - centerY) / 20;
          const rotateY = (centerX - x) / 20;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
      });
    },
    initParallaxEffect() {
      this.parallaxElements = document.querySelectorAll('.shape, .bg-shape, .particle');
      window.addEventListener('mousemove', this.handleMouseMove);
      this.updateParallax();
    },
    handleMouseMove(e) {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;
      
      this.parallaxElements.forEach(element => {
        const speed = element.classList.contains('shape') ? 20 : 10;
        const x = (0.5 - mouseX) * speed;
        const y = (0.5 - mouseY) * speed;
        
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
    },
    updateParallax() {
      const scrollY = window.scrollY;
      
      this.parallaxElements.forEach(element => {
        const speed = element.classList.contains('shape') ? 0.05 : 0.02;
        const yOffset = scrollY * speed;
        
        const currentTransform = element.style.transform || '';
        if (currentTransform.includes('translate')) {
          element.style.transform = currentTransform.replace(/translateY\([^)]+\)/, `translateY(${yOffset}px)`);
        } else {
          element.style.transform += ` translateY(${yOffset}px)`;
        }
      });
    },
    initParticles() {
      const particles = document.querySelectorAll('.particle');
      
      particles.forEach((particle, index) => {
        const delay = index * 2;
        particle.style.animationDelay = `${delay}s`;
        
        // Randomize starting positions
        const randomX = Math.random() * 100;
        particle.style.left = `${randomX}%`;
      });
    },
    navigateToLogin() {
      this.$router.push('/login');
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      // Prevent body scroll when menu is open
      if (this.mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
    closeMobileMenu() {
        this.mobileMenuOpen = false;
        document.body.style.overflow = '';
      },
      scrollToSection(sectionId) {
        this.closeMobileMenu();
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 300);
      }
     }
   }
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

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
    --border-radius: 8px;
    --shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    
    /* Dimension colors */
    --dim-1: #00b3b0;
    --dim-2: #3498db;
    --dim-3: #9b59b6;
    --dim-4: #f1c40f;
    --dim-5: #e74c3c;
    --dim-6: #2ecc71;
}

.text-primary {
    color: var(--primary);
}

/* Floating Shapes */
.floating-shapes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
}

.shape {
    position: absolute;
    opacity: 0.1;
    z-index: 0;
}

.shape1 {
    top: 20%;
    left: 10%;
    width: 80px;
    height: 80px;
    background-color: var(--primary);
    border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
    animation: floatAnimation 14s ease-in-out infinite;
}

.shape2 {
    top: 60%;
    left: 15%;
    width: 60px;
    height: 60px;
    background-color: var(--secondary);
    border-radius: 38% 62% 63% 37% / 41% 44% 56% 59%;
    animation: floatAnimation 16s ease-in-out infinite 2s;
}

.shape3 {
    top: 30%;
    right: 15%;
    width: 70px;
    height: 70px;
    background-color: var(--accent);
    border-radius: 59% 41% 38% 62% / 50% 45% 55% 50%;
    animation: floatAnimation 12s ease-in-out infinite 1s;
}

.shape4 {
    top: 70%;
    right: 10%;
    width: 50px;
    height: 50px;
    background-color: var(--dim-3);
    border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%;
    animation: floatAnimation 18s ease-in-out infinite 3s;
}

@keyframes floatAnimation {
    0% {
        transform: translate(0, 0) rotate(0);
    }
    25% {
        transform: translate(10px, -15px) rotate(5deg);
    }
    50% {
        transform: translate(0, 10px) rotate(0);
    }
    75% {
        transform: translate(-10px, -5px) rotate(-5deg);
    }
    100% {
        transform: translate(0, 0) rotate(0);
    }
}

/* Hero Stats */
.hero-stats {
    display: flex;
    margin-top: 30px;
    gap: 30px;
}

.stat-item {
    text-align: center;
}

.wide-stat {
    width: 100%;
    max-width: 600px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: var(--border-radius);
    padding: 15px 20px;
    border-left: 4px solid var(--primary);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    text-align: left;
}

.stat-highlight {
    font-size: 18px;
    line-height: 1.5;
    color: var(--dark);
    font-weight: 500;
}

.stat-highlight .counter {
    font-weight: 700;
    color: var(--primary);
    font-size: 22px;
}

.stat-number {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 5px;
    position: relative;
}

.stat-number::after {
    content: "+";
    font-size: 20px;
    position: absolute;
    top: 0;
    right: -15px;
}

.stat-label {
    font-size: 14px;
    color: var(--text);
}

/* Hero Buttons */
.hero-buttons {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
}

.cta-button-outline {
    background-color: transparent;
    color: var(--primary);
    padding: 10px 20px;
    border-radius: 30px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s;
    border: 2px solid var(--primary);
    cursor: pointer;
    display: inline-block;
    font-size: 15px;
}

.cta-button-outline:hover {
    background-color: rgba(0, 179, 176, 0.1);
    transform: translateY(-2px);
}

/* Assessment Section */
.assessment-section {
    padding: 100px 0;
    background-color: var(--light);
}

.assessment-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 50px;
}

.assessment-card {
    background-color: var(--light);
    border-radius: var(--border-radius);
    padding: 30px;
    box-shadow: var(--shadow);
    transition: all 0.3s;
    text-align: center;
    position: relative;
    overflow: hidden;
    border-top: 4px solid var(--primary);
}

.assessment-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.assessment-icon {
    width: 70px;
    height: 70px;
    background-color: rgba(0, 179, 176, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.assessment-icon i {
    font-size: 30px;
    color: var(--primary);
}

.assessment-card h4 {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 15px;
    color: var(--dark);
}

.assessment-card p {
    color: var(--text);
    line-height: 1.6;
    margin-bottom: 20px;
}

.assessment-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
    font-size: 14px;
    color: var(--text-light);
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.meta-item i {
    color: var(--primary);
}

/* User Roles Section */
.user-roles-section {
    padding: 100px 0;
    background-color: var(--gray);
}

.roles-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 50px;
}

.role-card {
    background-color: var(--light);
    border-radius: var(--border-radius);
    padding: 30px;
    box-shadow: var(--shadow);
    transition: all 0.3s;
    text-align: center;
    height: 100%;
}

.role-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.role-icon {
    width: 80px;
    height: 80px;
    background-color: rgba(0, 179, 176, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.role-icon i {
    font-size: 36px;
    color: var(--primary);
}

.role-card h4 {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--dark);
}

.role-features {
    list-style: none;
    text-align: left;
    margin-bottom: 30px;
}

.role-features li {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.role-features li i {
    color: var(--primary);
    font-size: 14px;
}

/* Dimensions Graphic */
.hero-graphic {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 500px;
}

.dimensions-container {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
}

.dimension-circle {
    position: relative;
    width: 380px;
    height: 380px;
    margin: 0 auto;
}

.dimension {
    position: absolute;
    width: 80px;
    height: 80px;
    background-color: white;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    z-index: 2;
}

.dimension:hover {
    transform: scale(1.1);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.dimension-1 {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    border: 3px solid var(--dim-1);
    animation: float 4s ease-in-out infinite;
}

.dimension-2 {
    top: 20%;
    right: 0;
    border: 3px solid var(--dim-2);
    animation: float 5s ease-in-out infinite 0.5s;
}

.dimension-3 {
    bottom: 20%;
    right: 0;
    border: 3px solid var(--dim-3);
    animation: float 4.5s ease-in-out infinite 1s;
}

.dimension-4 {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    border: 3px solid var(--dim-4);
    animation: float 5.5s ease-in-out infinite 1.5s;
}

.dimension-5 {
    bottom: 20%;
    left: 0;
    border: 3px solid var(--dim-5);
    animation: float 5s ease-in-out infinite 2s;
}

.dimension-6 {
    top: 20%;
    left: 0;
    border: 3px solid var(--dim-6);
    animation: float 4.5s ease-in-out infinite 2.5s;
}

.dimension-icon {
    font-size: 24px;
    margin-bottom: 5px;
    color: var(--primary);
}

.dimension-1 .dimension-icon {
    color: var(--dim-1);
}

.dimension-2 .dimension-icon {
    color: var(--dim-2);
}

.dimension-3 .dimension-icon {
    color: var(--dim-3);
}

.dimension-4 .dimension-icon {
    color: var(--dim-4);
}

.dimension-5 .dimension-icon {
    color: var(--dim-5);
}

.dimension-6 .dimension-icon {
    color: var(--dim-6);
}

.dimension-label {
    font-size: 10px;
    font-weight: 600;
    text-align: center;
    color: var(--dark);
}

.dimension-center {
    position: absolute;
    width: 100px;
    height: 100px;
    background-color: var(--primary);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    box-shadow: 0 5px 15px rgba(0, 179, 176, 0.3);
    z-index: 2;
    border: 3px solid white;
}

.dimension-center-text {
    font-size: 14px;
    text-align: center;
}

.dimension-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    animation: spin 60s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.pulse-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: var(--primary);
    opacity: 0.6;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.6;
    }
    50% {
        transform: scale(1.2);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 0.6;
    }
}

@keyframes float {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-5px);
    }
    100% {
        transform: translateY(0);
    }
}

.dimension-stats {
    margin-top: 30px;
}

.stat-bar {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.stat-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
}

.stat-track {
    flex: 2;
    height: 8px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    overflow: hidden;
    margin: 0 15px;
}

.stat-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1.5s ease-out, opacity 0.3s, transform 0.3s;
}

.stat-fill-1 {
    background-color: var(--dim-1);
    width: 78%;
}

.stat-fill-2 {
    background-color: var(--dim-2);
    width: 65%;
}

.stat-fill-3 {
    background-color: var(--dim-3);
    width: 82%;
}

.stat-value {
    flex: 0 0 40px;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
}

/* Feature Cards */
.feature-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.feature-detail {
    font-size: 14px;
    color: var(--primary);
    margin-top: 10px;
    font-weight: 500;
    border-top: 1px solid rgba(0, 179, 176, 0.2);
    padding-top: 10px;
}

/* Dashboard Tabs */
.data-visualization {
    padding: 100px 0;
    background-color: var(--gray);
}

.dashboard-preview {
    margin-top: 50px;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    background-color: white;
}

.dashboard-tabs {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dashboard-tab {
    padding: 15px 30px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.dashboard-tab.active {
    color: var(--primary);
}

.dashboard-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--primary);
}

.dashboard-content {
    position: relative;
    height: 500px;
}

.dashboard-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    visibility: hidden;
    transition: all 0.5s ease;
}

.dashboard-panel.active {
    opacity: 1;
    visibility: visible;
}

.dashboard-image {
    width: 100%;
    height: 100%;
    position: relative;
}

.dashboard-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.overlay-text {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 30px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    color: white;
}

.overlay-text h4 {
    font-size: 24px;
    margin-bottom: 10px;
    color: white;
}

.overlay-text p {
    margin: 0;
    opacity: 0.9;
}

/* Step Icons */
.step {
    position: relative;
}
/*
.step-icon {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 60px;
    height: 60px;
    background-color: rgba(0, 179, 176, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 24px;
    opacity: 0.8;
}
*/
/* Research Section */
.research-section {
    padding: 100px 0;
    background-color: var(--light);
}

.research-content {
    display: flex;
    align-items: center;
    gap: 60px;
    margin-top: 50px;
}

.research-text {
    flex: 1;
}

.research-text h4 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--dark);
}

.research-text p {
    color: var(--text);
    line-height: 1.8;
    margin-bottom: 20px;
}

.research-stats {
    display: flex;
    gap: 30px;
    margin-top: 30px;
}

.research-stat {
    text-align: center;
}

.research-stat .stat-number {
    font-size: 32px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 5px;
}

.research-stat .stat-label {
    font-size: 14px;
    color: var(--text);
}

.research-image {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.ryff-wheel-container {
    position: relative;
    width: 400px;
    height: 400px;
    margin: 0 auto;
    perspective: 1000px;
}

.ryff-wheel {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    transform-style: preserve-3d;
    animation: wheel-rotate 60s linear infinite;
}

@keyframes wheel-rotate {
    0% {
        transform: rotateY(0deg);
    }
    100% {
        transform: rotateY(360deg);
    }
}

.ryff-center {
    position: absolute;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #00b3b0 0%, #008b89 100%);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    text-align: center;
    padding: 10px;
    box-shadow: 0 5px 15px rgba(0, 179, 176, 0.3);
    z-index: 10;
    border: 3px solid rgba(255, 255, 255, 0.8);
}

.ryff-orbit {
    position: absolute;
    width: 300px;
    height: 300px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px dashed rgba(0, 179, 176, 0.3);
    animation: spin 60s linear infinite;
}

.ryff-dimensions {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.ryff-dimension {
    position: absolute;
    width: 80px;
    height: 80px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(150px) rotate(calc(-1 * var(--angle)));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 5;
    transition: all 0.3s ease;
}

.ryff-dimension:hover {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(150px) rotate(calc(-1 * var(--angle))) scale(1.1);
}

.dimension-bubble {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border: 3px solid var(--color);
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
}

.dimension-bubble::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: radial-gradient(circle at center, var(--color) 0%, transparent 70%);
    opacity: 0.1;
    z-index: -1;
}

.dimension-bubble:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 0 10px var(--color);
    transform: scale(1.05);
}

.dimension-icon {
    font-size: 24px;
    margin-bottom: 5px;
    color: var(--color);
    transition: all 0.3s ease;
}

.dimension-name {
    font-size: 10px;
    font-weight: 600;
    text-align: center;
    color: var(--dark);
    max-width: 90%;
    transition: all 0.3s ease;
}

.ryff-dimension:hover .dimension-icon {
    transform: scale(1.2);
}

.connecting-lines {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
}

.line {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150px;
    height: 1px;
    background-color: rgba(0, 179, 176, 0.2);
    transform-origin: 0 0;
}

.line-1 {
    transform: rotate(0deg);
}

.line-2 {
    transform: rotate(60deg);
}

.line-3 {
    transform: rotate(120deg);
}

.line-4 {
    transform: rotate(180deg);
}

.line-5 {
    transform: rotate(240deg);
}

.line-6 {
    transform: rotate(300deg);
}

.center-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.center-content span {
    font-size: 18px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 3;
}

.center-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
    animation: pulse-glow 2s infinite alternate;
    z-index: 1;
}

@keyframes pulse-glow {
    0% {
        opacity: 0.3;
        transform: scale(0.8);
    }
    100% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

@media (max-width: 992px) {
    .ryff-wheel-container {
        width: 350px;
        height: 350px;
        margin: 40px auto 0;
    }
    
    .ryff-dimension {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(130px) rotate(calc(-1 * var(--angle)));
    }
    
    .ryff-dimension:hover {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(130px) rotate(calc(-1 * var(--angle))) scale(1.1);
    }
    
    .dimension-bubble {
        width: 70px;
        height: 70px;
    }
    
    .dimension-icon {
        font-size: 20px;
    }
    
    .dimension-name {
        font-size: 9px;
    }
    
    .ryff-orbit {
        width: 260px;
        height: 260px;
    }
    
    .line {
        width: 130px;
    }
}

@media (max-width: 768px) {
    .ryff-wheel-container {
        width: 300px;
        height: 300px;
        margin: 20px auto 0;
    }
    
    .ryff-dimension {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(110px) rotate(calc(-1 * var(--angle)));
    }
    
    .ryff-dimension:hover {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(110px) rotate(calc(-1 * var(--angle))) scale(1.1);
    }
    
    .dimension-bubble {
        width: 60px;
        height: 60px;
    }
    
    .dimension-icon {
        font-size: 18px;
    }
    
    .dimension-name {
        font-size: 8px;
    }
    
    .ryff-center {
        width: 90px;
        height: 90px;
    }
    
    .center-content span {
        font-size: 16px;
    }
    
    .ryff-orbit {
        width: 220px;
        height: 220px;
    }
    
    .line {
        width: 110px;
    }
}

@media (max-width: 480px) {
    .ryff-wheel-container {
        transform: scale(0.8);
        margin: 0 auto;
    }
}

/* Animation Classes */
.fade-in {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
}

.fade-in.visible {
    opacity: 1;
    transform: translateY(0);
}

.scale-in {
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.8s ease;
}

.scale-in.visible {
    opacity: 1;
    transform: scale(1);
}

.slide-in-left {
    opacity: 0;
    transform: translateX(-50px);
    transition: all 0.6s ease;
}

.slide-in-left.visible {
    opacity: 1;
    transform: translateX(0);
}

.slide-in-right {
    opacity: 0;
    transform: translateX(50px);
    transition: all 0.6s ease;
}

.slide-in-right.visible {
    opacity: 1;
    transform: translateX(0);
}

/* Training Section */
.training-section {
    padding: 100px 0;
    background-color: var(--gray);
}

.training-content {
    margin-top: 50px;
}

.training-tabs {
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
    gap: 10px;
}

.training-tab {
    padding: 15px 25px;
    background-color: white;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.training-tab.active {
    background-color: var(--primary);
    color: white;
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 179, 176, 0.2);
}

.training-tab i {
    font-size: 18px;
}

.training-panels {
    position: relative;
    min-height: 400px;
}

.training-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    opacity: 0;
    visibility: hidden;
    transition: all 0.5s ease;
    transform: translateY(20px);
}

.training-panel.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.training-panel-content {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 40px;
    box-shadow: var(--shadow);
}

.training-panel-content h4 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 15px;
    color: var(--dark);
}

.training-panel-content > p {
    color: var(--text);
    margin-bottom: 30px;
    font-size: 16px;
    line-height: 1.6;
}

.training-modules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.training-module {
    display: flex;
    gap: 15px;
    padding: 20px;
    border-radius: var(--border-radius);
    background-color: var(--gray);
    transition: all 0.3s ease;
}

.training-module:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.module-icon {
    width: 50px;
    height: 50px;
    min-width: 50px;
    background-color: rgba(0, 179, 176, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 20px;
}

.module-content h5 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--dark);
}

.module-content p {
    font-size: 14px;
    color: var(--text);
    margin-bottom: 15px;
    line-height: 1.5;
}

.module-meta {
    display: flex;
    gap: 15px;
    font-size: 13px;
    color: var(--text-light);
}

.module-meta span {
    display: flex;
    align-items: center;
    gap: 5px;
}

.module-meta i {
    color: var(--primary);
}

.training-panel .cta-button {
    margin: 0 auto;
    display: block;
    width: fit-content;
}

@media (max-width: 768px) {
    .training-tabs {
        flex-direction: column;
    }
    
    .training-tab {
        width: 100%;
        justify-content: center;
    }
    
    .training-modules {
        grid-template-columns: 1fr;
    }
    
    .training-panel-content {
        padding: 25px;
    }
}

.hero {
    position: relative;
    padding: 120px 0 80px;
    background-color: var(--light);
    overflow: hidden;
    z-index: 1;
    background: linear-gradient(135deg, #f7f9fa 0%, #e6f7f7 50%, #d9f2f2 100%);
}

.animated-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -1;
}

.shape {
    position: absolute;
    opacity: 0.4;
    z-index: 0;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    filter: blur(2px);
}

.shape1 {
    top: 10%;
    left: 5%;
    width: 120px;
    height: 120px;
    background: linear-gradient(45deg, var(--primary), #4ecdc4);
    animation: float-slow 15s ease-in-out infinite alternate, spin 25s linear infinite;
}

.shape2 {
    top: 60%;
    left: 10%;
    width: 80px;
    height: 80px;
    background: linear-gradient(45deg, var(--secondary), #f8e9a1);
    animation: float-slow 20s ease-in-out infinite alternate-reverse, spin 30s linear infinite reverse;
}

.shape3 {
    top: 20%;
    right: 10%;
    width: 150px;
    height: 150px;
    background: linear-gradient(45deg, var(--dim-3), #bb8fce);
    animation: float-slow 18s ease-in-out infinite alternate, spin 35s linear infinite;
}

.shape4 {
    bottom: 15%;
    right: 5%;
    width: 100px;
    height: 100px;
    background: linear-gradient(45deg, var(--dim-4), #f9e79f);
    animation: float-slow 22s ease-in-out infinite alternate-reverse, spin 28s linear infinite reverse;
}

.shape5 {
    top: 40%;
    left: 30%;
    width: 60px;
    height: 60px;
    background: linear-gradient(45deg, var(--dim-5), #f1948a);
    animation: float-slow 25s ease-in-out infinite alternate, spin 40s linear infinite;
}

.shape6 {
    bottom: 30%;
    right: 30%;
    width: 70px;
    height: 70px;
    background: linear-gradient(45deg, var(--dim-6), #7dcea0);
    animation: float-slow 17s ease-in-out infinite alternate-reverse, spin 32s linear infinite reverse;
}

@keyframes float-slow {
    0% {
        transform: translate(0, 0);
    }
    100% {
        transform: translate(20px, -20px);
    }
}

@keyframes spin {
    0% {
        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    }
    25% {
        border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    }
    50% {
        border-radius: 30% 70% 70% 30% / 70% 70% 30% 30%;
    }
    75% {
        border-radius: 70% 30% 30% 70% / 30% 30% 70% 70%;
    }
    100% {
        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    }
}

.pulse-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 179, 176, 0.2) 0%, rgba(0, 179, 176, 0) 70%);
    z-index: 1;
    animation: pulse 2s infinite ease-out;
}

@keyframes pulse {
    0% {
        transform: scale(0.8);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.2);
        opacity: 0;
    }
    100% {
        transform: scale(0.8);
        opacity: 0.8;
    }
}

/* Contact Section */
.contact-section {
    padding: 100px 0;
    background-color: var(--light);
    position: relative;
    overflow: hidden;
}

.contact-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 40px;
    margin-top: 50px;
}

.contact-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.contact-card {
    background-color: var(--gray);
    border-radius: var(--border-radius);
    padding: 25px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.contact-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow);
    background-color: white;
}

.contact-icon {
    width: 50px;
    height: 50px;
    background-color: rgba(0, 179, 176, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 20px;
    margin-bottom: 15px;
}

.contact-card h4 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--dark);
}

.contact-card p {
    color: var(--text);
    line-height: 1.6;
    margin: 0;
}

.contact-form {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 40px;
    box-shadow: var(--shadow);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--dark);
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius);
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
}

.form-group textarea {
    resize: vertical;
}

.contact-form .cta-button {
    width: 100%;
    margin-top: 10px;
}

@media (max-width: 992px) {
    .contact-container {
        grid-template-columns: 1fr;
    }
    
    .contact-info {
        flex-direction: row;
        flex-wrap: wrap;
    }
    
    .contact-card {
        flex: 1 1 calc(33.333% - 20px);
        min-width: 250px;
    }
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
        gap: 0;
    }
    
    .contact-info {
        flex-direction: column;
    }
    
    .contact-card {
        width: 100%;
    }
    
    .contact-form {
        padding: 25px;
    }
}

.features-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -1;
}

.bg-shape {
    position: absolute;
    opacity: 0.4;
    z-index: 0;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    filter: blur(2px);
}

.bg-shape1 {
    top: 10%;
    left: 5%;
    width: 120px;
    height: 120px;
    background: linear-gradient(45deg, var(--primary), #4ecdc4);
    animation: float-slow 15s ease-in-out infinite alternate, spin 25s linear infinite;
}

.bg-shape2 {
    top: 60%;
    left: 10%;
    width: 80px;
    height: 80px;
    background: linear-gradient(45deg, var(--secondary), #f8e9a1);
    animation: float-slow 20s ease-in-out infinite alternate-reverse, spin 30s linear infinite reverse;
}

.bg-shape3 {
    top: 20%;
    right: 10%;
    width: 150px;
    height: 150px;
    background: linear-gradient(45deg, var(--dim-3), #bb8fce);
    animation: float-slow 18s ease-in-out infinite alternate, spin 35s linear infinite;
}

.features {
    padding: 100px 0;
    background-color: var(--light);
    position: relative;
    overflow: hidden;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 50px;
}

.feature-card {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 30px;
    box-shadow: var(--shadow);
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.feature-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(0, 179, 176, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
    z-index: -1;
    transform: translateY(100%);
    transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.feature-card:hover::before {
    transform: translateY(0);
}

.tilt-card {
    transform-style: preserve-3d;
    perspective: 1000px;
}

.tilt-card:hover {
    transform: translateY(-10px) rotateX(5deg) rotateY(5deg);
}

.feature-icon {
    width: 70px;
    height: 70px;
    background-color: rgba(0, 179, 176, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
}

.feature-icon i {
    font-size: 30px;
    color: var(--primary);
    position: relative;
    z-index: 2;
}

.pulse-animation::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(0, 179, 176, 0.3) 0%, rgba(0, 179, 176, 0) 70%);
    border-radius: 50%;
    z-index: 1;
    animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
    0% {
        transform: scale(0.8);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.5);
        opacity: 0;
    }
    100% {
        transform: scale(0.8);
        opacity: 0.8;
    }
}

.reveal-text {
    position: relative;
    overflow: hidden;
}

.reveal-text::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--light);
    animation: text-reveal 1.5s cubic-bezier(0.77, 0, 0.18, 1) forwards;
}

@keyframes text-reveal {
    0% {
        width: 100%;
    }
    100% {
        width: 0;
    }
}

.cta {
    padding: 100px 0;
    background: linear-gradient(135deg, #00b3b0 0%, #008b89 100%);
    color: white;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.cta-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    pointer-events: none;
}

.particle1 {
    width: 15px;
    height: 15px;
    top: 20%;
    left: 10%;
    animation: float-particle 20s infinite linear;
}

.particle2 {
    width: 10px;
    height: 10px;
    top: 40%;
    left: 25%;
    animation: float-particle 15s infinite linear;
}

.particle3 {
    width: 20px;
    height: 20px;
    top: 70%;
    left: 15%;
    animation: float-particle 25s infinite linear;
}

.particle4 {
    width: 8px;
    height: 8px;
    top: 30%;
    left: 80%;
    animation: float-particle 18s infinite linear;
}

.particle5 {
    width: 12px;
    height: 12px;
    top: 60%;
    left: 70%;
    animation: float-particle 22s infinite linear;
}

.particle6 {
    width: 18px;
    height: 18px;
    top: 80%;
    left: 85%;
    animation: float-particle 24s infinite linear;
}

.particle7 {
    width: 6px;
    height: 6px;
    top: 15%;
    left: 50%;
    animation: float-particle 16s infinite linear;
}

.particle8 {
    width: 14px;
    height: 14px;
    top: 85%;
    left: 40%;
    animation: float-particle 21s infinite linear;
}

@keyframes float-particle {
    0% {
        transform: translateY(0) translateX(0);
        opacity: 0;
    }
    10% {
        opacity: 1;
    }
    90% {
        opacity: 1;
    }
    100% {
        transform: translateY(-500px) translateX(100px);
        opacity: 0;
    }
}

.glowing-text {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    animation: glow 2s infinite alternate;
}

@keyframes glow {
    from {
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    }
    to {
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    }
}

.animated-button {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.animated-button:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.5s;
}

.animated-button:hover:before {
    left: 100%;
}

/* Mobile Navigation Styles */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid var(--primary);
  border-radius: 8px;
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.mobile-menu-toggle:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.mobile-menu-toggle span {
  width: 100%;
  height: 3px;
  background-color: var(--primary);
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-toggle.active {
  background: var(--primary);
  border-color: var(--primary);
  transform: scale(1.05);
}

.mobile-menu-toggle.active span {
  background-color: white;
}

.mobile-menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(7px, 7px);
}

.mobile-menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  right: -100%;
  width: 280px;
  max-width: 80vw;
  height: 100vh;
  background: white;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: right 0.3s ease;
  padding-top: 80px;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  border-left: 3px solid var(--primary);
}

.mobile-nav.active {
  right: 0;
}

.mobile-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-nav ul li {
  border-bottom: 1px solid #f0f0f0;
  width: 100%;
  display: block;
}

.mobile-nav ul li a {
  display: block;
  padding: 18px 25px;
  text-decoration: none;
  color: var(--text);
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 16px;
  line-height: 1.4;
  box-sizing: border-box;
  white-space: nowrap;
  border-left: 3px solid transparent;
}

.mobile-nav ul li a:hover {
  background-color: rgba(0, 179, 176, 0.05);
  color: var(--primary);
  border-left-color: var(--primary);
  padding-left: 22px;
}

.mobile-login-btn {
  background: var(--primary) !important;
  color: white !important;
  margin: 15px 20px 25px 20px !important;
  border-radius: 25px !important;
  text-align: center !important;
  font-weight: 600 !important;
  padding: 12px 20px !important;
  font-size: 14px !important;
  box-shadow: 0 3px 12px rgba(0, 179, 176, 0.3) !important;
  transition: all 0.3s ease !important;
}

.mobile-login-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 5px 18px rgba(0, 179, 176, 0.4) !important;
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-overlay.active {
  opacity: 1;
  visibility: visible;
}

.desktop-nav {
  display: block;
}

.desktop-login {
  display: inline-block;
}

/* Desktop Logo Styles */
.logo-svg {
  height: 100px;
  width: 60px;
  margin-right: 10px;
}

/* Comprehensive Mobile Responsive Styles */
@media (max-width: 768px) {
  /* Header Mobile Styles */
  .mobile-menu-toggle {
    display: flex;
  }
  
  .mobile-nav {
    display: block;
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .desktop-nav {
    display: none;
  }
  
  .desktop-login {
    display: none;
  }
  
  .header-container {
    padding: 10px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .logo h1 {
    font-size: 20px;
    text-align: center;
  }

  .logo-svg {
    height: 48px;
    width: 48px;
    margin-right: 8px;
  }

  .mobile-menu-toggle {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  /* Hero Section Mobile */
  .hero {
    padding: 100px 0 60px;
    text-align: center;
  }
  
  .hero-content {
    flex-direction: column;
    gap: 40px;
  }
  
  .hero-text {
    order: 2;
  }
  
  .hero-graphic {
    order: 1;
  }
  
  .hero-text h2 {
    font-size: 28px;
    line-height: 1.3;
    margin-bottom: 20px;
  }
  
  .hero-text p {
    font-size: 16px;
    margin-bottom: 30px;
  }
  
  .hero-buttons {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
  
  .hero-buttons .cta-button,
  .hero-buttons .cta-button-outline {
    width: 100%;
    max-width: 280px;
    text-align: center;
  }
  
  .hero-stats {
    margin-top: 40px;
  }
  
  .stat-item.wide-stat {
    padding: 20px;
  }
  
  .stat-highlight {
    font-size: 16px;
    line-height: 1.5;
  }
  
  /* Dimensions Container Mobile */
  .dimensions-container {
    transform: scale(0.8);
    margin: 20px 0;
  }
  
  /* Assessment Section Mobile */
  .assessment-section {
    padding: 60px 0;
  }
  
  .assessment-cards {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 30px;
  }
  
  .assessment-card {
    padding: 25px 20px;
  }
  
  .assessment-card h4 {
    font-size: 20px;
  }
  
  .assessment-meta {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  /* Features Section Mobile */
  .features {
    padding: 60px 0;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 30px;
  }
  
  .feature-card {
    padding: 25px 20px;
  }
  
  .feature-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }
  
  .feature-icon i {
    font-size: 24px;
  }
  
  .feature-card h4 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .feature-card p {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  .feature-detail {
    font-size: 13px;
  }
  
  /* User Roles Section Mobile */
  .user-roles-section {
    padding: 60px 0;
  }
  
  .roles-container {
    flex-direction: column;
    gap: 20px;
    margin-top: 30px;
  }
  
  .role-card {
    padding: 25px 20px;
    text-align: center;
  }
  
  .role-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 15px;
  }
  
  .role-icon i {
    font-size: 24px;
  }
  
  .role-card h4 {
    font-size: 20px;
    margin-bottom: 15px;
  }
  
  .role-features {
    text-align: left;
    margin-bottom: 20px;
  }
  
  .role-features li {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  /* Data Visualization Mobile */
  .data-visualization {
    padding: 60px 0;
  }
  
  .dashboard-tabs {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .dashboard-tab {
    width: 100%;
    text-align: center;
    padding: 12px 20px;
  }
  
  .dashboard-image img {
    height: 200px;
    object-fit: cover;
  }
  
  .overlay-text h4 {
    font-size: 18px;
  }
  
  .overlay-text p {
    font-size: 14px;
  }
  
  /* How It Works Mobile */
  .how-it-works {
    padding: 60px 0;
  }
  
  .steps-container {
    gap: 30px;
    margin-top: 30px;
  }
  
  .step {
    flex-direction: column;
    text-align: center;
    padding: 25px 20px;
  }
  
  .step-number {
    position: relative;
    margin-bottom: 20px;
  }
  
  .step-content {
    margin-left: 0;
  }
  
  .step-content h4 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .step-content p {
    font-size: 14px;
  }
  
  .step-icon {
    margin-top: 15px;
  }
  
  .step-icon i {
    font-size: 24px;
  }
  
  /* Research Section Mobile */
  .research-section {
    padding: 60px 0;
  }
  
  .research-content {
    flex-direction: column;
    gap: 30px;
    margin-top: 30px;
  }
  
  .research-text h4 {
    font-size: 24px;
  }
  
  .research-text p {
    font-size: 15px;
    margin-bottom: 15px;
  }
  
  .research-stats {
    flex-direction: column;
    gap: 20px;
    margin-top: 20px;
  }
  
  .research-stat {
    text-align: center;
  }
  
  .stat-number {
    font-size: 32px;
  }
  
  .stat-label {
    font-size: 14px;
  }
  
  /* Training Section Mobile */
  .training-section {
    padding: 60px 0;
  }
  
  .training-tabs {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .training-tab {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
  }
  
  .training-modules {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .training-module {
    padding: 15px;
  }
  
  .module-icon {
    width: 40px;
    height: 40px;
    min-width: 40px;
    font-size: 16px;
  }
  
  .module-content h5 {
    font-size: 16px;
    margin-bottom: 8px;
  }
  
  .module-content p {
    font-size: 13px;
    margin-bottom: 10px;
  }
  
  .training-panel-content {
    padding: 25px 20px;
  }
  
  .training-panel-content h4 {
    font-size: 22px;
  }
  
  /* About Section Mobile */
  .about {
    padding: 60px 0;
  }
  
  .about-content {
    flex-direction: column;
    gap: 30px;
    margin-top: 30px;
  }
  
  .about-text h3 {
    font-size: 28px;
    margin-bottom: 15px;
  }
  
  .about-text p {
    font-size: 15px;
    margin-bottom: 15px;
  }
  
  /* CTA Section Mobile */
  .cta {
    padding: 60px 0;
  }
  
  .cta h3 {
    font-size: 28px;
    margin-bottom: 15px;
  }
  
  .cta p {
    font-size: 16px;
    margin-bottom: 25px;
  }
  
  /* Contact Section Mobile */
  .contact-section {
    padding: 60px 0;
  }
  
  .contact-container {
    grid-template-columns: 1fr;
    gap: 30px;
    margin-top: 30px;
  }
  
  .contact-info {
    flex-direction: column;
    gap: 15px;
  }
  
  .contact-card {
    padding: 20px;
  }
  
  .contact-form {
    padding: 25px 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group input,
  .form-group textarea {
    padding: 12px;
    font-size: 14px;
  }
  
  /* Footer Mobile */
  footer {
    padding: 60px 0 20px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }
  
  .footer-column {
    text-align: center;
  }
  
  .footer-column h4 {
    font-size: 16px;
    margin-bottom: 15px;
  }
  
  .footer-column ul li {
    margin-bottom: 8px;
  }
  
  .footer-column ul li a {
    font-size: 14px;
  }
  
  .social-links {
    justify-content: center;
    margin-top: 15px;
  }
  
  .copyright {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .copyright p {
    font-size: 13px;
  }
  
  /* General Mobile Optimizations */
  .container {
    padding: 0 15px;
  }
  
  .section-title h3 {
    font-size: 28px;
    margin-bottom: 15px;
  }
  
  .section-title p {
    font-size: 16px;
  }
  
  .cta-button,
  .cta-button-outline,
  .cta-button-white {
    padding: 12px 24px;
    font-size: 14px;
    border-radius: 25px;
  }
  
  /* Hide complex animations on mobile for better performance */
  .shape,
  .bg-shape,
  .particle {
    display: none;
  }
  
  .animated-background,
  .features-bg,
  .cta-particles {
    display: none;
  }
}

@media (max-width: 480px) {
  /* Extra small mobile devices */
  .hero-text h2 {
    font-size: 24px;
  }
  
  .hero-text p {
    font-size: 15px;
  }
  
  .dimensions-container {
    transform: scale(0.7);
  }
  
  .section-title h3 {
    font-size: 24px;
  }
  
  .section-title p {
    font-size: 15px;
  }
  
  .assessment-card,
  .feature-card,
  .role-card {
    padding: 20px 15px;
  }
  
  .contact-form,
  .training-panel-content {
    padding: 20px 15px;
  }
  
  .container {
    padding: 0 10px;
  }
}

/* Team Section Styles */
.team-section {
    padding: 100px 0;
    background-color: var(--light);
    position: relative;
    overflow: hidden;
}

.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
    margin-top: 50px;
}

.team-member {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 30px;
    box-shadow: var(--shadow);
    text-align: center;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
}

.team-member:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.member-image {
    width: 120px;
    height: 120px;
    margin: 0 auto 20px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid var(--primary);
    transition: all 0.3s ease;
}

.team-member:hover .member-image {
    transform: scale(1.05);
    border-color: var(--secondary);
}

.member-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.3s ease;
}

.member-info h4 {
    font-size: 20px;
    font-weight: 600;
    color: var(--dark);
    margin-bottom: 8px;
}

.member-info p {
    font-size: 14px;
    color: var(--primary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Team Section Mobile Styles */
@media (max-width: 768px) {
    .team-section {
        padding: 60px 0;
    }
    
    .team-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 25px;
        margin-top: 30px;
    }
    
    .team-member {
        padding: 25px 20px;
    }
    
    .member-image {
        width: 100px;
        height: 100px;
        margin-bottom: 15px;
    }
    
    .member-info h4 {
        font-size: 18px;
        margin-bottom: 6px;
    }
    
    .member-info p {
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    .team-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }
    
    .team-member {
        padding: 20px 15px;
    }
    
    .member-image {
        width: 80px;
        height: 80px;
        margin-bottom: 12px;
    }
    
    .member-info h4 {
        font-size: 16px;
        margin-bottom: 5px;
    }
    
    .member-info p {
        font-size: 12px;
    }
}

/* Add this style to the <style> section of the component */
.cta-button, .cta-button-white, .cta-button-outline {
  cursor: pointer;
}
</style>