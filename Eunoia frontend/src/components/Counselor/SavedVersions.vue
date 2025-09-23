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
          
          <div class="version-actions">
            <button class="preview-button" @click.stop="previewVersion(version)">
              <i class="fas fa-search"></i> Preview
            </button>
            <button class="view-button" @click.stop="viewVersion(version)">
              <i class="fas fa-download"></i> Use
            </button>
          </div>
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
          title: 'Comprehensive Assessment',
          description: 'Complete 84-item assessment for detailed analysis',
          items: '84',
          type: 'complete',
          lastModified: '2023-05-15'
        },
        {
          id: 2,
          title: 'Brief Assessment',
          description: 'Quick 42-item assessment for regular monitoring',
          items: '42',
          type: 'brief',
          lastModified: '2023-06-10'
        }
      ]
    };
  },
  methods: {
    previewVersion(version) {
      // Preview version functionality
      this.$emit('preview-version', version);
    },
    viewVersion(version) {
      // Apply selected version
      this.$emit('select-version', version);
    },

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

.version-actions {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
}

.preview-button {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.preview-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
}

.view-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.view-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.preview-button i,
.view-button i {
  margin-right: 4px;
}





@media (max-width: 768px) {
  .versions-grid {
    grid-template-columns: 1fr;
  }
}
</style>