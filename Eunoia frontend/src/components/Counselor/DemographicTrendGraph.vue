<template>
  <div class="demographic-trend-section">
    <div class="section-header">
      <div class="section-title">
        <div class="section-icon demographic-icon">
          <i class="fas fa-users"></i>
        </div>
        <div>
          <h3>Demographic Risk Analysis</h3>
          <p>Mental health risk levels and at-risk dimensions by gender across 6 psychological dimensions</p>
        </div>
      </div>
      

      
      <!-- Info Text -->
      <div class="info-text">
        <p>Comparing at-risk student counts between male and female students across 6 psychological well-being dimensions</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Loading demographic data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <p>{{ error }}</p>
      <button @click="fetchDemographicData" class="retry-btn">
        <i class="fas fa-redo"></i>
        Retry
      </button>
    </div>

    <!-- Chart Container -->
    <div v-else class="chart-container">
      <!-- Chart Legend -->
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-color male-students"></div>
          <span>Male At-Risk Students</span>
        </div>
        <div class="legend-item">
          <div class="legend-color female-students"></div>
          <span>Female At-Risk Students</span>
        </div>
      </div>

      <!-- Chart.js Implementation -->
      <div class="chart-container-wrapper" v-if="!loading && !error && isMounted && filteredChartData && filteredChartData.length > 0">
        <canvas ref="demographicChart" width="400" height="300"></canvas>
        
        <!-- Year Label Below Chart -->
        <div class="year-labels">
          <span class="year-label center-year">2025-2030</span>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else-if="!loading && !error && (!filteredChartData || filteredChartData.length === 0)" class="no-data-state">
        <div class="no-data-icon">📊</div>
        <p>No demographic data available for the selected filters</p>
      </div>
    </div>

    <!-- Tooltip -->
    <div 
      v-if="tooltip.show" 
      class="chart-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-title">{{ tooltip.title }}</div>
      <div class="tooltip-content">{{ tooltip.content }}</div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { apiUrl } from '../../utils/apiUtils';

Chart.register(...registerables);

// Custom plugin to prevent updates and drawing on null context
const nullContextPlugin = {
  id: 'nullContextCheck',
  beforeUpdate: (chart) => {
    if (!chart.ctx || !chart.canvas) {
      console.warn('Skipping update: invalid chart context or canvas');
      return false;
    }
  },
  beforeDraw: (chart) => {
    if (!chart.ctx || !chart.ctx.save) {
      console.warn('Skipping draw: invalid chart context');
      return false;
    }
  }
};

Chart.register(nullContextPlugin);

export default {
  name: 'DemographicTrendGraph',
  data() {
    return {
      loading: true,
      error: null,
      chartData: [],
      summary: {
        mostAtRiskGender: '',
        mostAtRiskPercentage: 0,
        topAtRiskDimension: '',
        topDimensionCount: 0,
        totalAtRiskStudents: 0,
        overallRiskPercentage: 0
      },
      tooltip: {
        show: false,
        x: 0,
        y: 0,
        title: '',
        content: ''
      },
      // Chart.js specific properties
      demographicChart: null,
      isMounted: false
    };
  },
  computed: {
    yAxisTicks() {
      if (this.chartData.length === 0) return [0, 1, 2, 3, 4, 5];
      
      // For male vs female comparison, we need to consider both gender counts
      const maxCount = Math.max(...this.chartData.map(d => 
        Math.max(
          this.getGenderAtRiskCount(d, 'Male'),
          this.getGenderAtRiskCount(d, 'Female')
        )
      ));
      
      console.log('📊 Max count for y-axis:', maxCount);
      
      const tickCount = 5;
      const step = Math.max(1, Math.ceil(maxCount / tickCount)); // Ensure minimum step of 1
      const ticks = [];
      
      // Start from 0 and go up to create proper ascending Y-axis
      for (let i = 0; i <= tickCount; i++) {
        ticks.push(i * step);
      }
      
      console.log('📊 Y-axis ticks:', ticks);
      return ticks;
    },
    
    maxValue() {
      return Math.max(...this.yAxisTicks);
    },
    
    filteredChartData() {
      // Only show years that have actual data (either male or female at-risk students)
      return this.chartData.filter(yearData => {
        const maleCount = this.getGenderAtRiskCount(yearData, 'Male');
        const femaleCount = this.getGenderAtRiskCount(yearData, 'Female');
        return maleCount > 0 || femaleCount > 0;
      });
    }
  },
  
  mounted() {
    this.isMounted = true;
    this.fetchDemographicData();
  },

  beforeUnmount() {
    this.isMounted = false;
    if (this.demographicChart) {
      this.demographicChart.destroy();
      this.demographicChart = null;
    }
  },
  
  methods: {
    // Check if data should be reset based on current year
    shouldResetData() {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth(); // 0-based (0 = January)
      
      // If it's 2030 or later, and we're in the academic year start period (July onwards)
      if (currentYear >= 2030 && currentMonth >= 6) { // July = month 6
        console.log('📊 Auto-reset triggered: Current year is 2030 or later');
        return true;
      }
      
      return false;
    },

    async fetchDemographicData() {
      this.loading = true;
      this.error = null;
      
      // Check if data should be reset
      if (this.shouldResetData()) {
        console.log('📊 Resetting data due to year 2030+ detection');
        this.chartData = [];
        this.summary = {
          mostAtRiskGender: '',
          mostAtRiskPercentage: 0,
          topAtRiskDimension: '',
          topDimensionCount: 0,
          totalAtRiskStudents: 0,
          overallRiskPercentage: 0
        };
        this.loading = false;
        return;
      }
      
      try {
        const response = await fetch(apiUrl(`demographic-trends/gender-trends?gender=all`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          this.chartData = result.data.trends;
          this.summary = result.data.summary;
          console.log('📊 Demographic data loaded:', result.data);
          console.log('📊 Chart data:', this.chartData);
          console.log('📊 First year data structure:', this.chartData[0]);
          
          // Log each year's data in detail
          this.chartData.forEach((yearData, index) => {
            console.log(`📊 Year ${index} (${yearData.schoolYear}):`, {
              schoolYear: yearData.schoolYear,
              year: yearData.year,
              riskAnalysis: yearData.riskAnalysis,
              maleAtRisk: yearData.riskAnalysis?.byGender?.Male?.atRisk || 0,
              femaleAtRisk: yearData.riskAnalysis?.byGender?.Female?.atRisk || 0,
              maleAtRiskDimensions: yearData.riskAnalysis?.atRiskDimensions?.byGender?.Male || {},
              femaleAtRiskDimensions: yearData.riskAnalysis?.atRiskDimensions?.byGender?.Female || {}
            });
          });

          // Create Chart.js chart after data is loaded
          this.$nextTick(() => {
            setTimeout(() => {
              this.createDemographicChart();
            }, 100);
          });
        } else {
          throw new Error(result.message || 'Failed to fetch demographic data');
        }
        
      } catch (error) {
        console.error('Error fetching demographic data:', error);
        this.error = error.message || 'Failed to load demographic data';
      } finally {
        this.loading = false;
      }
    },

    createDemographicChart() {
      // Destroy existing chart if it exists
      if (this.demographicChart) {
        this.demographicChart.destroy();
        this.demographicChart = null;
      }

      // Check if component is still mounted and has data
      if (!this.isMounted || !this.filteredChartData || this.filteredChartData.length === 0) {
        console.log('Cannot create chart: component unmounted or no data');
        return;
      }

      try {
        let ctx = null;
        if (this.$refs.demographicChart && typeof this.$refs.demographicChart.getContext === 'function') {
          ctx = this.$refs.demographicChart.getContext('2d');
          console.log('Got 2D context for demographic chart');
        }
        if (!ctx) {
          console.error('Failed to get 2D context for demographic chart');
          return;
        }

        // Define the 6 dimensions for the X-axis
        const dimensions = [
          { key: 'autonomy', label: 'Autonomy' },
          { key: 'environmental_mastery', label: 'Environmental Mastery' },
          { key: 'personal_growth', label: 'Personal Growth' },
          { key: 'positive_relations', label: 'Positive Relations' },
          { key: 'purpose_in_life', label: 'Purpose in Life' },
          { key: 'self_acceptance', label: 'Self-Acceptance' }
        ];
        
        const labels = dimensions.map(dim => dim.label);
        
        // Calculate male and female counts for each dimension
         const maleData = dimensions.map(dim => this.getDimensionAtRiskCount(dim.key, 'Male'));
         const femaleData = dimensions.map(dim => this.getDimensionAtRiskCount(dim.key, 'Female'));
        
        console.log('📊 Dimension labels:', labels);
        console.log('📊 Male data by dimension:', maleData);
        console.log('📊 Female data by dimension:', femaleData);

        if (!this.isMounted || !document.contains(this.$refs.demographicChart)) {
          console.error('Component unmounted or canvas not in DOM for demographic chart');
          return;
        }

        this.demographicChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Male At-Risk Students',
                data: maleData,
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return 'rgba(102, 126, 234, 0.8)';
                  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                  gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
                  gradient.addColorStop(1, 'rgba(118, 75, 162, 0.7)');
                  return gradient;
                },
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
              },
              {
                label: 'Female At-Risk Students',
                data: femaleData,
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return 'rgba(240, 147, 251, 0.8)';
                  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                  gradient.addColorStop(0, 'rgba(240, 147, 251, 0.9)');
                  gradient.addColorStop(1, 'rgba(245, 87, 108, 0.7)');
                  return gradient;
                },
                borderColor: 'rgba(240, 147, 251, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: true,  // Changed from false to true
              mode: 'point'     // Changed from 'index' to 'point'
            },
            plugins: {
              legend: {
                display: false // We use custom legend
              },
              tooltip: {
                enabled: false, // We use custom tooltip
                external: (context) => {
                  this.handleChartTooltip(context);
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: '#546e7a',
                  font: {
                    size: 10,
                    weight: '600'
                  },
                  maxRotation: 45, // Allow rotation for better fit
                  minRotation: 0,
                  align: 'center',
                  padding: 8,
                  maxTicksLimit: 6, // Ensure all 6 dimensions are shown
                  autoSkip: false // Don't skip any labels
                },
                categoryPercentage: 0.8, // Reduce to give more space for labels
                barPercentage: 0.7
              },
              y: {
                beginAtZero: true,
                min: 0,
                max: Math.max(5, Math.max(...maleData, ...femaleData) + 1), // Minimum range 0-5, auto-scale if data exceeds
                grid: {
                  color: 'rgba(0,0,0,0.05)',
                  lineWidth: 1
                },
                ticks: {
                  color: '#546e7a',
                  font: {
                    size: 12,
                    weight: '500'
                  },
                  stepSize: 1,
                  callback: function(value) {
                    return Number.isInteger(value) ? value : ''; // Only show integer values
                  }
                }
              }
            },
            animation: {
              duration: 800,
              easing: 'easeOutQuart'
            },
            onHover: (event, elements) => {
              if (elements.length > 0) {
                const element = elements[0];
                const datasetIndex = element.datasetIndex;
                const dataIndex = element.index;
                const dimension = labels[dataIndex];
                const gender = datasetIndex === 0 ? 'Male' : 'Female';
                const count = datasetIndex === 0 ? maleData[dataIndex] : femaleData[dataIndex];
                
                this.tooltip.show = true;
                this.tooltip.x = event.native.clientX;
                this.tooltip.y = event.native.clientY;
                this.tooltip.title = `${dimension} - ${gender} At-Risk Students`;
                this.tooltip.content = `${count} ${gender.toLowerCase()} students with at-risk dimensions`;
              } else {
                this.tooltip.show = false;
              }
            }
          }
        });

        console.log('Demographic chart created successfully');
      } catch (error) {
        console.error('Error creating demographic chart:', error);
      }
    },

    handleChartTooltip(context) {
      // Custom tooltip handling if needed
      const { chart, tooltip } = context;
      
      if (tooltip.opacity === 0) {
        this.tooltip.show = false;
        return;
      }

      // Handle tooltip display for dimension-based chart
      if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
        const dataPoint = tooltip.dataPoints[0];
        
        // Define the 6 dimensions for reference
        const dimensions = [
          { key: 'autonomy', label: 'Autonomy' },
          { key: 'environmental_mastery', label: 'Environmental Mastery' },
          { key: 'personal_growth', label: 'Personal Growth' },
          { key: 'positive_relations', label: 'Positive Relations' },
          { key: 'purpose_in_life', label: 'Purpose in Life' },
          { key: 'self_acceptance', label: 'Self-Acceptance' }
        ];
        
        const dimension = dimensions[dataPoint.dataIndex];
        const gender = dataPoint.datasetIndex === 0 ? 'Male' : 'Female';
        const count = this.getDimensionAtRiskCount(dimension.key, gender);
        
        this.tooltip.show = true;
        this.tooltip.x = tooltip.caretX;
        this.tooltip.y = tooltip.caretY;
        this.tooltip.title = `${dimension.label} - ${gender} At-Risk Students`;
        this.tooltip.content = `${count} ${gender.toLowerCase()} students at risk in ${dimension.label.toLowerCase()}`;
      }
    },
    
    getBarHeight(value) {
      if (this.maxValue === 0) return 0;
      const height = (value / this.maxValue) * 100;
      console.log(`📊 Bar height calculation: value=${value}, maxValue=${this.maxValue}, height=${height}%`);
      // Much more prominent scaling: minimum 30% height for visibility when value > 0, and scale up significantly
      if (value > 0) {
        return Math.max(height * 2, 30); // Scale up by 200% and ensure minimum 30%
      }
      return 0;
    },
    
    getGenderAtRiskCount(yearData, gender) {
      console.log(`📊 Getting ${gender} at-risk count for:`, yearData);
      
      if (!yearData || !yearData.riskAnalysis || !yearData.riskAnalysis.byGender) {
        console.log(`📊 Missing data structure for ${gender}`);
        return 0;
      }
      
      const genderData = yearData.riskAnalysis.byGender[gender];
      console.log(`📊 ${gender} gender data:`, genderData);
      
      if (!genderData) {
        console.log(`📊 No data for ${gender}`);
        return 0;
      }
      
      // ONLY count students who are truly at-risk (not moderate or healthy)
      const atRiskCount = genderData.atRisk || 0;
      console.log(`📊 ${gender} at-risk count (ONLY at-risk):`, atRiskCount);
      return atRiskCount;
    },

    // NEW METHOD: Get count of students at-risk for a specific dimension and gender
    getDimensionAtRiskCount(dimensionKey, gender) {
      console.log(`📊 Getting ${gender} at-risk count for dimension: ${dimensionKey}`);
      
      // FIXED: Get data from the most recent year with data instead of aggregating across all years
      let mostRecentCount = 0;
      let mostRecentYear = null;
      
      // Find the most recent year with actual data
      for (let i = this.chartData.length - 1; i >= 0; i--) {
        const yearData = this.chartData[i];
        if (yearData && yearData.riskAnalysis && yearData.riskAnalysis.atRiskDimensions && 
            yearData.riskAnalysis.atRiskDimensions.byGender && 
            yearData.riskAnalysis.atRiskDimensions.byGender[gender]) {
          
          const dimensionCount = yearData.riskAnalysis.atRiskDimensions.byGender[gender][dimensionKey] || 0;
          if (dimensionCount > 0 || mostRecentYear === null) {
            mostRecentCount = dimensionCount;
            mostRecentYear = yearData.schoolYear;
            console.log(`📊 Using data from ${mostRecentYear}: ${gender} ${dimensionKey} = ${dimensionCount}`);
            break;
          }
        }
      }
      
      console.log(`📊 Most recent ${gender} at-risk for ${dimensionKey}: ${mostRecentCount} (from ${mostRecentYear})`);
      return mostRecentCount;
    },
    
    getPercentageBarHeight(percentage) {
      // For percentage bars, use 100% as max
      return Math.max(percentage, 2); // Minimum 2% height for visibility
    },

    // Get the range of school years from the data
    getSchoolYearsRange() {
      // Return the updated range as requested
      return '2025–2026 to 2029–2030';
    },

    // Get list of individual school years for timeline display
    getSchoolYearsList() {
      // Return the updated school years as requested
      return [
        '2025–2026',
        '2026–2027', 
        '2027–2028',
        '2028–2029',
        '2029–2030'
      ];
    },
    
    getRiskCount(yearData, riskLevel) {
      if (!yearData.riskAnalysis) return 0;
      
      // If a specific gender is selected, get data from that gender
      if (this.selectedGender !== 'all' && yearData.riskAnalysis.byGender) {
        const genderData = yearData.riskAnalysis.byGender[this.selectedGender];
        if (!genderData) return 0;
        
        switch (riskLevel) {
          case 'atRisk':
            return genderData.atRisk || 0;
          case 'moderate':
            return genderData.moderate || 0;
          case 'healthy':
            return genderData.healthy || 0;
          default:
            return 0;
        }
      }
      
      // For 'all' genders, sum up all gender data
      if (yearData.riskAnalysis.byGender) {
        let total = 0;
        Object.values(yearData.riskAnalysis.byGender).forEach(genderData => {
          switch (riskLevel) {
            case 'atRisk':
              total += genderData.atRisk || 0;
              break;
            case 'moderate':
              total += genderData.moderate || 0;
              break;
            case 'healthy':
              total += genderData.healthy || 0;
              break;
          }
        });
        return total;
      }
      
      // Fallback to old structure if it exists
      switch (riskLevel) {
        case 'atRisk':
          return yearData.riskAnalysis.atRiskCount || 0;
        case 'moderate':
          return yearData.riskAnalysis.moderateCount || 0;
        case 'healthy':
          return yearData.riskAnalysis.healthyCount || 0;
        default:
          return 0;
      }
    },
    
    getGenderRiskPercentage(yearData, gender) {
      if (!yearData.riskAnalysis || !yearData.riskAnalysis.byGender) return 0;
      
      const genderData = yearData.riskAnalysis.byGender[gender];
      if (!genderData) return 0;
      
      return Math.round(parseFloat(genderData.riskPercentage) || 0);
    },
    
    showTooltip(event, yearData, type) {
      const rect = event.target.getBoundingClientRect();
      this.tooltip.x = rect.left + rect.width / 2;
      this.tooltip.y = rect.top - 10;
      
      switch (type) {
        case 'male-at-risk':
          this.tooltip.title = `${yearData.schoolYear} - Male At-Risk Students`;
          this.tooltip.content = `${this.getGenderAtRiskCount(yearData, 'Male')} male students with at-risk dimensions`;
          break;
        case 'female-at-risk':
          this.tooltip.title = `${yearData.schoolYear} - Female At-Risk Students`;
          this.tooltip.content = `${this.getGenderAtRiskCount(yearData, 'Female')} female students with at-risk dimensions`;
          break;
      }
      
      this.tooltip.show = true;
    },
    
    hideTooltip() {
      this.tooltip.show = false;
    }
  }
};
</script>

<style scoped>
.demographic-trend-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.section-icon.demographic-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
  font-size: 18px;
}

.section-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0;
}

.section-title p {
  font-size: 14px;
  color: #546e7a;
  margin: 4px 0 0 0;
}

.year-labels {
    display: flex;
    justify-content: center;
    margin-top: 8px;
    padding: 0 20px;
  }

  .year-label {
    font-size: 10px;
    color: #6B7280;
    font-weight: 500;
  }

  .center-year {
    text-align: center;
  }

  .school-years-info-card {
    margin: 16px 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  }

  .academic-years-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
  }

  .header-icon i {
    font-size: 20px;
    color: white;
  }

  .header-content h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: white;
  }

  .years-range {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .years-timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .timeline-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
  }

  .timeline-item:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 6px;
    right: -50%;
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    z-index: 1;
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    margin-bottom: 8px;
    position: relative;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .timeline-year {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    text-align: center;
    line-height: 1.2;
  }

  .school-years-info {
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 6px;
    border-left: 3px solid #8B5CF6;
  }

  .school-years-info small {
    color: #6B7280;
    font-weight: 500;
  }

  .school-years-info i {
    margin-right: 6px;
    color: #8B5CF6;
  }

  .info-text {
  text-align: center;
  margin-bottom: 16px;
}

.info-text p {
  font-size: 14px;
  color: #546e7a;
  margin: 0;
  font-style: italic;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gender-filter {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #1a2e35;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gender-filter:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  font-size: 32px;
  color: #667eea;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 32px;
  color: #f44336;
  margin-bottom: 16px;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #5a67d8;
}

.chart-container {
  position: relative;
}

.chart-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.chart-container-wrapper {
  min-height: 400px; /* Ensure adequate space for chart and all 6 dimension labels */
  padding: 20px;
  position: relative;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #546e7a;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.at-risk-students {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.legend-color.moderate-risk-students {
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

.legend-color.healthy-students {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

.legend-color.male-students {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.legend-color.female-students {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.gender-breakdown {
  display: flex;
  gap: 16px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid #e0e0e0;
}

.chart-container-wrapper {
  position: relative;
  height: 350px;
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.chart-container-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}

.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #64748b;
  text-align: center;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-data-state p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1a2e35;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #546e7a;
  margin-top: 4px;
  font-weight: 500;
}

.stat-description {
  font-size: 11px;
  color: #78909c;
  margin-top: 2px;
  font-weight: 400;
}

.chart-tooltip {
  position: fixed;
  background: rgba(26, 46, 53, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1000;
  transform: translateX(-50%) translateY(-100%);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-content {
  font-size: 12px;
  opacity: 0.9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .chart-legend {
    gap: 16px;
  }
  
  .gender-breakdown {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #e0e0e0;
    padding-top: 8px;
  }
  
  .demographic-chart {
    height: 350px; /* Increased height for better label visibility */
    padding: 15px;
  }
  
  .chart-container-wrapper {
    min-height: 350px; /* Ensure adequate space for chart and labels */
    padding: 20px;
  }
  
  .bar {
    width: 14px;
  }
  
  .year-label {
    font-size: 11px;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .stat-number {
    font-size: 20px;
  }
}
</style>