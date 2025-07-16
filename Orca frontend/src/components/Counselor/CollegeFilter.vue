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
        
        <div class="year-sections">
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
                  <div class="program-column">
                    <div class="program-title">BSIT</div>
                    <div class="section-option" v-for="section in programs.BSIT" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSCS</div>
                    <div class="section-option" v-for="section in programs.BSCS" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSDA</div>
                    <div class="section-option" v-for="section in programs.BSDA" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSIS</div>
                    <div class="section-option" v-for="section in programs.BSIS" :key="section.id">
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
                  <div class="program-column">
                    <div class="program-title">BSIT</div>
                    <div class="section-option" v-for="section in programs.BSIT2" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSCS</div>
                    <div class="section-option" v-for="section in programs.BSCS2" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSDA</div>
                    <div class="section-option" v-for="section in programs.BSDA2" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSIS</div>
                    <div class="section-option" v-for="section in programs.BSIS2" :key="section.id">
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
                  <div class="program-column">
                    <div class="program-title">BSIT</div>
                    <div class="section-option" v-for="section in programs.BSIT3" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSCS</div>
                    <div class="section-option" v-for="section in programs.BSCS3" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSDA</div>
                    <div class="section-option" v-for="section in programs.BSDA3" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSIS</div>
                    <div class="section-option" v-for="section in programs.BSIS3" :key="section.id">
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
                  <div class="program-column">
                    <div class="program-title">BSIT</div>
                    <div class="section-option" v-for="section in programs.BSIT4" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSCS</div>
                    <div class="section-option" v-for="section in programs.BSCS4" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSDA</div>
                    <div class="section-option" v-for="section in programs.BSDA4" :key="section.id">
                      <input type="checkbox" :id="section.id" v-model="section.selected">
                      <label :for="section.id">{{ section.name }}</label>
                    </div>
                  </div>
                  
                  <div class="program-column">
                    <div class="program-title">BSIS</div>
                    <div class="section-option" v-for="section in programs.BSIS4" :key="section.id">
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
      firstYearOpen: true,
      secondYearOpen: false,
      thirdYearOpen: false,
      fourthYearOpen: true,
      programs: {
        BSIT: [
          { id: 'bsit-1a', name: 'BSIT-1A', selected: true },
          { id: 'bsit-1b', name: 'BSIT-1B', selected: true }
        ],
        BSCS: [
          { id: 'bscs-1a', name: 'BSCS-1A', selected: true },
          { id: 'bscs-1b', name: 'BSCS-1B', selected: true }
        ],
        BSDA: [
          { id: 'bsda-1a', name: 'BSDA-1A', selected: true },
          { id: 'bsda-1b', name: 'BSDA-1B', selected: true }
        ],
        BSIS: [
          { id: 'bsis-1a', name: 'BSIS-1A', selected: true },
          { id: 'bsis-1b', name: 'BSIS-1B', selected: true }
        ],
        // 2nd year sections
        BSIT2: [
          { id: 'bsit-2a', name: 'BSIT-2A', selected: true },
          { id: 'bsit-2b', name: 'BSIT-2B', selected: true }
        ],
        BSCS2: [
          { id: 'bscs-2a', name: 'BSCS-2A', selected: true },
          { id: 'bscs-2b', name: 'BSCS-2B', selected: true }
        ],
        BSDA2: [
          { id: 'bsda-2a', name: 'BSDA-2A', selected: true },
          { id: 'bsda-2b', name: 'BSDA-2B', selected: true }
        ],
        BSIS2: [
          { id: 'bsis-2a', name: 'BSIS-2A', selected: true },
          { id: 'bsis-2b', name: 'BSIS-2B', selected: true }
        ],
        // 3rd year sections
        BSIT3: [
          { id: 'bsit-3a', name: 'BSIT-3A', selected: true },
          { id: 'bsit-3b', name: 'BSIT-3B', selected: true }
        ],
        BSCS3: [
          { id: 'bscs-3a', name: 'BSCS-3A', selected: true },
          { id: 'bscs-3b', name: 'BSCS-3B', selected: true }
        ],
        BSDA3: [
          { id: 'bsda-3a', name: 'BSDA-3A', selected: true },
          { id: 'bsda-3b', name: 'BSDA-3B', selected: true }
        ],
        BSIS3: [
          { id: 'bsis-3a', name: 'BSIS-3A', selected: true },
          { id: 'bsis-3b', name: 'BSIS-3B', selected: true }
        ],
        // 4th year sections
        BSIT4: [
          { id: 'bsit-4a', name: 'BSIT-4A', selected: true },
          { id: 'bsit-4b', name: 'BSIT-4B', selected: true }
        ],
        BSCS4: [
          { id: 'bscs-4a', name: 'BSCS-4A', selected: true },
          { id: 'bscs-4b', name: 'BSCS-4B', selected: true }
        ],
        BSDA4: [
          { id: 'bsda-4a', name: 'BSDA-4A', selected: true },
          { id: 'bsda-4b', name: 'BSDA-4B', selected: true }
        ],
        BSIS4: [
          { id: 'bsis-4a', name: 'BSIS-4A', selected: true },
          { id: 'bsis-4b', name: 'BSIS-4B', selected: true }
        ]
      }
    };
  },
  computed: {
    hasSelectedSections() {
      return this.getSelectedSections('first').length > 0 || 
             this.getSelectedSections('second').length > 0 ||
             this.getSelectedSections('third').length > 0 ||
             this.getSelectedSections('fourth').length > 0;
    }
  },
  methods: {
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
      
      const summary = {
        department: this.collegeName,
        customized: true,
        yearCounts: yearCounts,
        totalSections: yearCounts.first + yearCounts.second + yearCounts.third + yearCounts.fourth,
        totalStudents: this.calculateTotalStudents()
      };
      
      this.$emit('apply-filters', summary);
      this.close();
    },
    calculateTotalStudents() {
      // In a real implementation, this would calculate the actual number of students
      // For now, let's assume each section has 35 students on average
      const totalSections = 
        this.getSelectedSections('first').length + 
        this.getSelectedSections('second').length + 
        this.getSelectedSections('third').length + 
        this.getSelectedSections('fourth').length;
      
      return totalSections * 35;
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