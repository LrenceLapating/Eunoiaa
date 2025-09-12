<template>
  <div class="filter-modal" v-if="isVisible" @click.self="close">
    <transition name="modal">
      <div class="filter-content" v-if="isVisible">
        <div class="filter-header">
          <h3>Filter {{ collegeName }} College</h3>
          <button class="close-button" @click="close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <p class="filter-description">Optionally select specific years and sections to target</p>
        
        <!-- Loading indicator -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading sections...</p>
        </div>
        
        <!-- No sections message -->
        <div v-else-if="Object.keys(programs).length === 0" class="no-sections-container">
          <i class="fas fa-info-circle"></i>
          <p class="no-sections-text">No sections available for this college.</p>
        </div>
        
        <div v-else class="year-sections">
          <!-- 1st Year -->
          <div class="year-container">
            <div class="year-header" @click="toggleYear('first')">
              <span class="year-title">1st Year</span>
              <div class="year-actions">
                <span class="section-count" v-if="firstYearOpen">{{ getSelectedCount('first') }} selected</span>
                <i :class="['fas', firstYearOpen ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
              </div>
            </div>
            
            <transition name="collapse">
              <div class="sections-container" v-if="firstYearOpen">
                <div class="sections-grid">
                  <div class="program-column" v-for="(sections, programName) in firstYearPrograms" :key="programName">
                    <div class="program-title">{{ programName }}</div>
                    <div class="section-option" v-for="section in sections" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                </div>
                
                <div class="select-actions">
                  <button class="select-action-btn" @click="selectAllYear('first')">Select All</button>
                  <button class="select-action-btn" @click="deselectAllYear('first')">Deselect All</button>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- 2nd Year -->
          <div class="year-container">
            <div class="year-header" @click="toggleYear('second')">
              <span class="year-title">2nd Year</span>
              <div class="year-actions">
                <span class="section-count" v-if="secondYearOpen">{{ getSelectedCount('second') }} selected</span>
                <i :class="['fas', secondYearOpen ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
              </div>
            </div>
            
            <transition name="collapse">
              <div class="sections-container" v-if="secondYearOpen">
                <div class="sections-grid">
                  <div class="program-column" v-for="(sections, programName) in secondYearPrograms" :key="programName">
                    <div class="program-title">{{ programName }}</div>
                    <div class="section-option" v-for="section in sections" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                </div>
                
                <div class="select-actions">
                  <button class="select-action-btn" @click="selectAllYear('second')">Select All</button>
                  <button class="select-action-btn" @click="deselectAllYear('second')">Deselect All</button>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- 3rd Year -->
          <div class="year-container">
            <div class="year-header" @click="toggleYear('third')">
              <span class="year-title">3rd Year</span>
              <div class="year-actions">
                <span class="section-count" v-if="thirdYearOpen">{{ getSelectedCount('third') }} selected</span>
                <i :class="['fas', thirdYearOpen ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
              </div>
            </div>
            
            <transition name="collapse">
              <div class="sections-container" v-if="thirdYearOpen">
                <div class="sections-grid">
                  <div class="program-column" v-for="(sections, programName) in thirdYearPrograms" :key="programName">
                    <div class="program-title">{{ programName }}</div>
                    <div class="section-option" v-for="section in sections" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                </div>
                
                <div class="select-actions">
                  <button class="select-action-btn" @click="selectAllYear('third')">Select All</button>
                  <button class="select-action-btn" @click="deselectAllYear('third')">Deselect All</button>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- 4th Year -->
          <div class="year-container">
            <div class="year-header" @click="toggleYear('fourth')">
              <span class="year-title">4th Year</span>
              <div class="year-actions">
                <span class="section-count" v-if="fourthYearOpen">{{ getSelectedCount('fourth') }} selected</span>
                <i :class="['fas', fourthYearOpen ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
              </div>
            </div>
            
            <transition name="collapse">
              <div class="sections-container" v-if="fourthYearOpen">
                <div class="sections-grid">
                  <div class="program-column" v-for="(sections, programName) in fourthYearPrograms" :key="programName">
                    <div class="program-title">{{ programName }}</div>
                    <div class="section-option" v-for="section in sections" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                </div>
                
                <div class="select-actions">
                  <button class="select-action-btn" @click="selectAllYear('fourth')">Select All</button>
                  <button class="select-action-btn" @click="deselectAllYear('fourth')">Deselect All</button>
                </div>
              </div>
            </transition>
          </div>
        </div>
        
        <!-- Selected Sections Summary -->
        <transition name="fade">
          <div class="selected-sections" v-if="hasSelectedSections">
            <div class="selected-label">Selected:</div>
            
            <div class="selected-groups">
              <transition-group name="tag-list" tag="div" class="year-group" v-if="getSelectedSections('first').length > 0">
                <div key="first-year-label" class="year-label">1st Year:</div>
                <div key="first-year-tags" class="selected-tags">
                  <div class="selected-tag" v-for="section in getSelectedSections('first')" :key="section.id" @click="toggleSection(section)">
                    {{ section.name }}
                    <i class="fas fa-times-circle tag-remove"></i>
                  </div>
                </div>
              </transition-group>
              
              <transition-group name="tag-list" tag="div" class="year-group" v-if="getSelectedSections('second').length > 0">
                <div key="second-year-label" class="year-label">2nd Year:</div>
                <div key="second-year-tags" class="selected-tags">
                  <div class="selected-tag" v-for="section in getSelectedSections('second')" :key="section.id" @click="toggleSection(section)">
                    {{ section.name }}
                    <i class="fas fa-times-circle tag-remove"></i>
                  </div>
                </div>
              </transition-group>

              <transition-group name="tag-list" tag="div" class="year-group" v-if="getSelectedSections('third').length > 0">
                <div key="third-year-label" class="year-label">3rd Year:</div>
                <div key="third-year-tags" class="selected-tags">
                  <div class="selected-tag" v-for="section in getSelectedSections('third')" :key="section.id" @click="toggleSection(section)">
                    {{ section.name }}
                    <i class="fas fa-times-circle tag-remove"></i>
                  </div>
                </div>
              </transition-group>
              
              <transition-group name="tag-list" tag="div" class="year-group" v-if="getSelectedSections('fourth').length > 0">
                <div key="fourth-year-label" class="year-label">4th Year:</div>
                <div key="fourth-year-tags" class="selected-tags">
                  <div class="selected-tag" v-for="section in getSelectedSections('fourth')" :key="section.id" @click="toggleSection(section)">
                    {{ section.name }}
                    <i class="fas fa-times-circle tag-remove"></i>
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        </transition>
        
        <!-- Action Buttons -->
        <div class="filter-actions">
          <button class="clear-filters-btn" @click="clearAllFilters">Clear Filters</button>
          <button class="apply-filters-btn" @click="applyFilters">Apply Filters</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'CollegeFilter',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    collegeName: {
      type: String,
      required: true
    },
    departmentData: {
      type: Object,
      default: () => ({})
    },
    existingFilters: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // API configuration - uses environment variable for production
      apiBaseUrl: process.env.VUE_APP_API_URL || 'http://localhost:3000',
      firstYearOpen: true,
      secondYearOpen: false,
      thirdYearOpen: false,
      fourthYearOpen: true,
      // Programs will be populated dynamically from backend
      programs: {},
      sectionsData: null, // Store original sections data
      loading: false
    };
  },
  computed: {
    hasSelectedSections() {
      return this.getSelectedSections('first').length > 0 || 
             this.getSelectedSections('second').length > 0 ||
             this.getSelectedSections('third').length > 0 ||
             this.getSelectedSections('fourth').length > 0;
    },
    
    // Get unique program names for each year level
    firstYearPrograms() {
      const programs = {};
      Object.keys(this.programs).forEach(programKey => {
        if (!programKey.includes('2') && !programKey.includes('3') && !programKey.includes('4')) {
          const programName = programKey;
          programs[programName] = this.programs[programKey];
        }
      });
      return programs;
    },
    
    secondYearPrograms() {
      const programs = {};
      Object.keys(this.programs).forEach(programKey => {
        if (programKey.includes('2')) {
          const programName = programKey.replace('2', '');
          programs[programName] = this.programs[programKey];
        }
      });
      return programs;
    },
    
    thirdYearPrograms() {
      const programs = {};
      Object.keys(this.programs).forEach(programKey => {
        if (programKey.includes('3')) {
          const programName = programKey.replace('3', '');
          programs[programName] = this.programs[programKey];
        }
      });
      return programs;
    },
    
    fourthYearPrograms() {
      const programs = {};
      Object.keys(this.programs).forEach(programKey => {
        if (programKey.includes('4')) {
          const programName = programKey.replace('4', '');
          programs[programName] = this.programs[programKey];
        }
      });
      return programs;
    }
  },
  watch: {
    // Watch for changes in collegeName to load sections dynamically
    collegeName: {
      handler(newCollegeName) {
        if (newCollegeName) {
          this.loadCollegeSections(newCollegeName);
        }
      },
      immediate: true
    }
  },
  methods: {
    async loadCollegeSections(collegeName) {
      this.loading = true;
      try {
        // Fetch sections and year levels for the specific college
        const response = await fetch(`${this.apiBaseUrl}/api/accounts/colleges/${encodeURIComponent(collegeName)}/sections`);
        if (!response.ok) {
          throw new Error('Failed to fetch college sections');
        }
        
        const sectionsData = await response.json();
        
        // Store the original sections data
        this.sectionsData = sectionsData;
        
        // Transform the data to match the expected format
        this.programs = this.transformSectionsData(sectionsData);
        
        // Apply existing filters if they exist
        if (this.existingFilters) {
          this.applyExistingFilters();
        }
      } catch (error) {
        console.error('Error loading college sections:', error);
        // Fallback to empty programs if API fails
        this.programs = {};
      } finally {
        this.loading = false;
      }
    },
    
    transformSectionsData(sectionsData) {
      // Transform backend data to the expected format
      // Expected backend format: { programs: [{ name: 'BSIT', yearLevels: [{ year: 1, sections: [{ id: 'bsit-1a', name: 'BSIT-1A' }] }] }] }
      const transformedPrograms = {};
      
      if (sectionsData && sectionsData.programs) {
        sectionsData.programs.forEach(program => {
          program.yearLevels.forEach(yearLevel => {
            const suffix = yearLevel.year === 1 ? '' : yearLevel.year.toString();
            const programKey = program.name + suffix;
            
            transformedPrograms[programKey] = yearLevel.sections.map(section => ({
              id: section.id,
              name: section.name,
              studentCount: section.studentCount || 0, // Preserve student count
              selected: true // Default to selected
            }));
          });
        });
      }
      
      return transformedPrograms;
    },
    
    applyExistingFilters() {
      // Apply existing filters if provided
      if (this.existingFilters && this.existingFilters.selectedSections) {
        // Reset all selections first
        Object.keys(this.programs).forEach(program => {
          this.programs[program].forEach(section => {
            section.selected = false;
          });
        });
        
        // Apply existing selections
        this.existingFilters.selectedSections.forEach(sectionId => {
          Object.keys(this.programs).forEach(program => {
            const section = this.programs[program].find(s => s.id === sectionId);
            if (section) {
              section.selected = true;
            }
          });
        });
      }
    },
    
    toggleYear(year) {
      switch(year) {
        case 'first':
          this.firstYearOpen = !this.firstYearOpen;
          break;
        case 'second':
          this.secondYearOpen = !this.secondYearOpen;
          break;
        case 'third':
          this.thirdYearOpen = !this.thirdYearOpen;
          break;
        case 'fourth':
          this.fourthYearOpen = !this.fourthYearOpen;
          break;
      }
    },
    deselectAllYear(year) {
      const suffix = year === 'first' ? '' : 
                     year === 'second' ? '2' : 
                     year === 'third' ? '3' : '4';
      
      Object.keys(this.programs).forEach(program => {
        if ((suffix === '' && !program.includes('2') && !program.includes('3') && !program.includes('4')) || 
            (suffix !== '' && program.includes(suffix))) {
          this.programs[program].forEach(section => {
            section.selected = false;
          });
        }
      });
    },
    selectAllYear(year) {
      const suffix = year === 'first' ? '' : 
                     year === 'second' ? '2' : 
                     year === 'third' ? '3' : '4';
      
      Object.keys(this.programs).forEach(program => {
        if ((suffix === '' && !program.includes('2') && !program.includes('3') && !program.includes('4')) || 
            (suffix !== '' && program.includes(suffix))) {
          this.programs[program].forEach(section => {
            section.selected = true;
          });
        }
      });
    },
    getSelectedCount(year) {
      return this.getSelectedSections(year).length;
    },
    getSelectedSections(year) {
      const suffix = year === 'first' ? '' : 
                     year === 'second' ? '2' : 
                     year === 'third' ? '3' : '4';
      
      const selectedSections = [];
      
      Object.keys(this.programs).forEach(program => {
        if ((suffix === '' && !program.includes('2') && !program.includes('3') && !program.includes('4')) || 
            (suffix !== '' && program.includes(suffix))) {
          this.programs[program].forEach(section => {
            if (section.selected) {
              selectedSections.push(section);
            }
          });
        }
      });
      
      return selectedSections;
    },
    toggleSection(section) {
      section.selected = !section.selected;
    },
    clearAllFilters() {
      Object.keys(this.programs).forEach(program => {
        this.programs[program].forEach(section => {
          section.selected = false;
        });
      });
    },
    applyFilters() {
      const yearCounts = {
        first: this.getSelectedSections('first').length,
        second: this.getSelectedSections('second').length,
        third: this.getSelectedSections('third').length,
        fourth: this.getSelectedSections('fourth').length
      };
      
      // Collect all selected section IDs
      const selectedSections = [];
      Object.keys(this.programs).forEach(program => {
        this.programs[program].forEach(section => {
          if (section.selected) {
            selectedSections.push(section.id);
          }
        });
      });
      
      const summary = {
        college: this.collegeName,
        customized: true,
        yearCounts: yearCounts,
        totalSections: yearCounts.first + yearCounts.second + yearCounts.third + yearCounts.fourth,
        totalStudents: this.calculateTotalStudents(),
        selectedSections: selectedSections,
        programs: this.sectionsData?.programs || []
      };
      
      this.$emit('apply-filters', summary);
      this.close();
    },
    calculateTotalStudents() {
      // Calculate actual student count from selected sections
      let totalStudents = 0;
      
      Object.keys(this.programs).forEach(program => {
        this.programs[program].forEach(section => {
          if (section.selected) {
            totalStudents += section.studentCount || 0;
          }
        });
      });
      
      return totalStudents;
    },
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.filter-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal animation */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s;
}
.modal-enter-from, .modal-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.filter-content {
  background-color: white;
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.filter-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 5;
}

.filter-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text);
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: var(--dark);
  transform: rotate(90deg);
}

.filter-description {
  color: var(--text-light);
  font-size: 14px;
  margin: 0;
  padding: 0 20px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.year-sections {
  padding: 0;
}

.year-container {
  border-bottom: 1px solid #f0f0f0;
}

.year-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.year-header:hover {
  background-color: #f9f9f9;
}

.year-title {
  font-weight: 500;
  color: var(--dark);
}

.year-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-count {
  font-size: 12px;
  color: var(--text-light);
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
}

/* Collapse animation */
.collapse-enter-active, .collapse-leave-active {
  transition: all 0.3s;
  overflow: hidden;
}
.collapse-enter-from, .collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.sections-container {
  padding: 0 20px 15px;
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 10px;
}

.program-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.program-title {
  font-weight: 500;
  color: var(--dark);
  margin-bottom: 5px;
}

.section-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary);
}

.section-option label {
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
}

.select-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.select-action-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.select-action-btn:hover {
  background-color: #f0f7ff;
}

/* Fade animation */
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.selected-sections {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.selected-label {
  font-weight: 500;
  color: var(--dark);
  margin-bottom: 10px;
}

.selected-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.year-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.year-label {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* Tag list animations */
.tag-list-enter-active, .tag-list-leave-active {
  transition: all 0.4s;
}
.tag-list-enter-from, .tag-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.tag-list-move {
  transition: transform 0.4s;
}

.selected-tag {
  background-color: var(--primary);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-tag:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.tag-remove {
  font-size: 10px;
  opacity: 0.8;
}

.selected-tag:hover .tag-remove {
  opacity: 1;
}

/* Loading and empty states */
.loading-container, .no-sections-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text, .no-sections-text {
  color: var(--text-light);
  font-size: 14px;
  margin: 0;
}

.no-sections-container i {
  font-size: 24px;
  color: var(--text-light);
  margin-bottom: 10px;
}

.filter-actions {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 5;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
}

.clear-filters-btn {
  background-color: white;
  border: 1px solid #e0e0e0;
  color: var(--text);
  padding: 10px 15px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.apply-filters-btn {
  background-color: var(--primary);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
}

.apply-filters-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 179, 176, 0.2);
}

@media (max-width: 600px) {
  .filter-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .sections-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>