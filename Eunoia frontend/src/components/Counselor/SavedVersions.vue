<template>
  <div class="saved-versions-container">
    <div class="versions-header">
      <div class="header-icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <div class="header-text">
        <h2>Saved Versions</h2>
        <p>Select a version of the Ryff assessment</p>
      </div>
    </div>

    <transition-group name="version-list" tag="div" class="versions-grid">
      <div class="version-card" v-for="(version, index) in savedVersions" :key="version.id" 
           @mouseenter="hoveredCard = index" 
           @mouseleave="hoveredCard = null"
           :class="{ 'hovered': hoveredCard === index }"
           @click="viewVersion(version)">
        <div class="version-content">
          <div class="version-badge" :class="'badge-' + version.type">
            {{ version.type }}
          </div>
          <h3>{{ version.title }}</h3>
          <p class="version-description">{{ version.description }}</p>
          <p class="version-scale">Scale: {{ version.items }} items</p>
          
          <button class="view-button" @click.stop="viewVersion(version)">
            <i class="fas fa-eye"></i> View
          </button>
        </div>
      </div>

      <div class="version-card add-version-card" :key="'new'"
           @mouseenter="hoveredCard = 'new'" 
           @mouseleave="hoveredCard = null"
           :class="{ 'hovered': hoveredCard === 'new' }"
           @click="createNewVersion">
        <div class="add-version-content">
          <div class="add-icon">
            <i class="fas fa-plus"></i>
          </div>
          <h3>Create New Version</h3>
          <p>Design a custom assessment template</p>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'SavedVersions',
  data() {
    return {
      hoveredCard: null,
      savedVersions: [
        {
          id: 1,
          title: 'Standard Assessment',
          description: 'Default assessment with standard introduction',
          items: '84',
          type: 'complete',
          lastModified: '2023-05-15'
        },
        {
          id: 2,
          title: 'Quick Check-in (42 items)',
          description: 'Brief assessment for regular monitoring',
          items: '42',
          type: 'brief',
          lastModified: '2023-06-10'
        },
        {
          id: 3,
          title: 'Comprehensive Evaluation',
          description: 'Full-scale detailed assessment',
          items: '84',
          type: 'complete',
          lastModified: '2023-04-22'
        }
      ]
    };
  },
  methods: {
    viewVersion(version) {
      console.log('Viewing version:', version);
      this.$emit('select-version', version);
    },
    createNewVersion() {
      // This would typically navigate to a create form or open a modal
      console.log('Creating new version');
      this.$emit('create-version');
    }
  }
};
</script>

<style scoped>
.saved-versions-container {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 25px;
  margin-bottom: 30px;
  animation: fadeIn 0.3s ease-in-out;
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

.versions-header {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.header-icon {
  width: 40px;
  height: 40px;
  background-color: #f0f7ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 18px;
  margin-right: 15px;
  transition: all 0.3s ease;
}

.saved-versions-container:hover .header-icon {
  transform: rotate(5deg) scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 179, 176, 0.15);
}

.header-text h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--dark);
  margin: 0 0 5px 0;
}

.header-text p {
  font-size: 14px;
  color: var(--text-light);
  margin: 0;
}

.versions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  position: relative;
}

/* Version list animations */
.version-list-enter-active, 
.version-list-leave-active {
  transition: all 0.5s;
}
.version-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.version-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
.version-list-move {
  transition: transform 0.5s;
}

.version-card {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: all 0.2s ease;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.version-card:hover, .version-card.hovered {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  border-color: #d0d0d0;
}

.version-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.version-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-brief {
  background-color: #e6f7ff;
  color: #0088cc;
}

.badge-medium {
  background-color: #fff7e6;
  color: #f5a623;
}

.badge-complete {
  background-color: #f0f7ff;
  color: #5c7cfa;
}

.version-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark);
  margin: 0 0 10px 0;
  padding-right: 60px; /* Space for badge */
}

.version-description {
  color: var(--text);
  font-size: 14px;
  margin: 0 0 15px 0;
  flex-grow: 1;
}

.version-scale {
  font-size: 14px;
  color: var(--text-light);
  margin: 0 0 20px 0;
  font-weight: 500;
}

.view-button {
  align-self: flex-end;
  background-color: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 8px 15px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  z-index: 1;
}

.view-button:hover {
  background-color: var(--primary);
  color: white;
  transform: translateY(-2px);
}



.add-version-card {
  background-color: #f0f7ff;
  border: 1px dashed #c0d7f7;
}

.add-version-card:hover, .add-version-card.hovered {
  background-color: #e6f0ff;
  border-color: var(--primary);
}

.add-version-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.add-icon {
  width: 50px;
  height: 50px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 179, 176, 0.1);
}

.add-version-card:hover .add-icon, .add-version-card.hovered .add-icon {
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 5px 15px rgba(0, 179, 176, 0.2);
}

@media (max-width: 768px) {
  .versions-grid {
    grid-template-columns: 1fr;
  }
}
</style>