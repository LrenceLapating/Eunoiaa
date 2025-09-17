<template>
  <div class="yearly-trend-container">
    <!-- Trend Analysis Header -->
    <div class="trend-analysis-header">
      <div class="main-section-title">
        <div class="section-icon trend-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div>
          <h3>Yearly Trend Analysis</h3>
          <p>Track at-risk students and improvement trends by college</p>
        </div>
      </div>
      <div class="trend-filters">
        <select v-model="selectedDimension" class="filter-select">
          <option value="overall">Overall</option>
          <option value="autonomy">Autonomy</option>
          <option value="environmental_mastery">Environmental Mastery</option>
          <option value="personal_growth">Personal Growth</option>
          <option value="positive_relations">Positive Relations</option>
          <option value="purpose_in_life">Purpose in Life</option>
          <option value="self_acceptance">Self Acceptance</option>
        </select>
        <select v-model="selectedYear" class="filter-select">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading trend analysis...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="fetchTrendData" class="retry-btn">Retry</button>
    </div>

    <!-- Trend Analysis Content -->
    <div v-else class="trend-analysis-content">
      <!-- At-Risk Students Section -->
      <div class="section at-risk-section">
        <div class="section-header">
          <div class="section-title">
            <div class="section-icon risk-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h3>At-Risk Students by College</h3>
              <p>{{ formatDimensionLabel(selectedDimension) }} - {{ selectedYear }}</p>
            </div>
          </div>
          <div class="section-summary" v-if="atRiskData.summary">
            <span class="highlight-text">{{ atRiskData.summary.highestRiskCollege }}</span>
            <span class="summary-label">highest risk</span>
          </div>
        </div>

        <!-- At-Risk Chart -->
        <div class="chart-container" v-if="!loading && !error && isMounted && atRiskData.trends.length > 0">
          <canvas ref="atRiskChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Improvement Trends Section -->
      <div class="section improvement-section">
        <div class="section-header">
          <div class="section-title">
            <div class="section-icon improvement-icon">
              <i class="fas fa-arrow-trend-up"></i>
            </div>
            <div>
              <h3>Improvement Trends by College</h3>
              <p>{{ formatDimensionLabel(selectedDimension) }} - {{ selectedYear }}</p>
            </div>
          </div>
          <div class="section-summary" v-if="improvementData.summary">
            <span class="highlight-text">{{ improvementData.summary.mostImprovedCollege }}</span>
            <span class="summary-label">most improved</span>
          </div>
        </div>

        <!-- Improvement Chart -->
        <div class="chart-container" v-if="!loading && !error && isMounted && improvementData.trends.length > 0">
          <canvas ref="improvementChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import { apiUrl } from '@/utils/apiUtils';

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
  name: 'YearlyTrendAnalysis',
  data() {
    return {
      loading: true,
      error: null,
      initialLoad: true,
      selectedDimension: 'overall',
      selectedYear: new Date().getFullYear(),
      availableYears: [],
      atRiskData: {
        trends: [],
        summary: null
      },
      improvementData: {
        trends: [],
        summary: null
      },
      atRiskChart: null,
      improvementChart: null,
      isMounted: false,
      abortController: null
    };
  },
  watch: {
    selectedDimension() {
      this.onFilterChange();
    },
    selectedYear() {
      if (this.initialLoad) {
        return;
      }
      this.onFilterChange();
    }
  },
  async mounted() {
    console.log('Component mounted at', new Date().toISOString());
    await this.fetchAvailableYears();
    this.initialLoad = false;
    this.isMounted = true;
    await this.fetchTrendData();
  },
  beforeUnmount() {
    console.log('Component beforeUnmount at', new Date().toISOString());
    this.isMounted = false;
    if (this.abortController) {
      this.abortController.abort();
      console.log('AbortController aborted');
    }
    if (this.atRiskChart) {
      this.atRiskChart.destroy();
      console.log('atRiskChart destroyed');
    }
    if (this.improvementChart) {
      this.improvementChart.destroy();
      console.log('improvementChart destroyed');
    }
  },
  methods: {
    async fetchAvailableYears() {
      try {
        const response = await axios.get(apiUrl('yearly-trends/available-years'));
        if (response.data.success) {
          this.availableYears = response.data.data.years;
          if (this.availableYears.length > 0) {
            this.selectedYear = this.availableYears[0]; // Most recent year
          }
        }
      } catch (error) {
        console.error('Error fetching available years:', error);
        // Fallback to current year
        this.availableYears = [new Date().getFullYear()];
        this.selectedYear = this.availableYears[0];
      }
    },
    async fetchTrendData() {
      console.log('fetchTrendData started at', new Date().toISOString());
      if (this.abortController) {
        this.abortController.abort();
        console.log('Previous abortController aborted');
      }
      this.abortController = new AbortController();
      this.loading = true;
      this.error = null;
      
      try {
        console.log('Fetching data for dimension:', this.selectedDimension, 'year:', this.selectedYear);
        const [atRiskResponse, improvementResponse] = await Promise.all([
          axios.get(apiUrl('yearly-trends/at-risk'), {
            params: {
              dimension: this.selectedDimension,
              year: this.selectedYear
            },
            signal: this.abortController.signal
          }),
          axios.get(apiUrl('yearly-trends/improvement'), {
            params: {
              dimension: this.selectedDimension,
              year: this.selectedYear
            },
            signal: this.abortController.signal
          })
        ]);
        console.log('Data fetched successfully');

        if (atRiskResponse.data.success) {
          this.atRiskData = atRiskResponse.data.data;
          console.log('atRiskData set:', this.atRiskData);
        }
        
        if (improvementResponse.data.success) {
          this.improvementData = improvementResponse.data.data;
          console.log('improvementData set:', this.improvementData);
        }

        this.loading = false;
        setTimeout(() => {
          if (this.isMounted) {
            console.log('Scheduling chart creation');
            this.$nextTick(() => {
              this.createCharts();
            });
          } else {
            console.log('Component not mounted, skipping chart creation');
          }
        }, 0);
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching trend data:', error);
          this.error = 'Failed to load trend analysis data. Please try again.';
        } else {
          console.log('Fetch aborted');
        }
      } finally {
        this.abortController = null;
        if (this.loading) this.loading = false;
        console.log('fetchTrendData completed at', new Date().toISOString());
      }
    },
    createCharts() {
      this.createAtRiskChart();
      this.createImprovementChart();

      // Set up MutationObserver for atRiskChart
      if (this.atRiskChart && this.$refs.atRiskChart) {
        const atRiskObserver = new MutationObserver(() => {
          if (!document.contains(this.$refs.atRiskChart)) {
            this.atRiskChart.destroy();
            this.atRiskChart = null;
            atRiskObserver.disconnect();
            console.log('atRiskChart destroyed due to canvas removal');
          }
        });
        atRiskObserver.observe(document.body, { childList: true, subtree: true });
      }

      // Set up MutationObserver for improvementChart
      if (this.improvementChart && this.$refs.improvementChart) {
        const improvementObserver = new MutationObserver(() => {
          if (!document.contains(this.$refs.improvementChart)) {
            this.improvementChart.destroy();
            this.improvementChart = null;
            improvementObserver.disconnect();
            console.log('improvementChart destroyed due to canvas removal');
          }
        });
        improvementObserver.observe(document.body, { childList: true, subtree: true });
      }
    },
    createAtRiskChart() {
      console.log('createAtRiskChart started at', new Date().toISOString());
      if (!this.isMounted) {
        console.log('Not mounted, exiting createAtRiskChart');
        return;
      }
      if (this.atRiskChart) {
        this.atRiskChart.destroy();
        console.log('Existing atRiskChart destroyed');
      }

      console.log('Creating at-risk chart...');
      console.log('Canvas ref:', this.$refs.atRiskChart);
      console.log('At-risk data:', this.atRiskData);

      if (!this.$refs.atRiskChart) {
        console.error('At-risk chart canvas ref not found');
        return;
      }
      
      if (!Array.isArray(this.atRiskData.trends) || this.atRiskData.trends.length === 0) {
        console.warn('No valid at-risk data available for chart');
        return;
      }

      try {
        let ctx = null;
        if (this.$refs.atRiskChart && typeof this.$refs.atRiskChart.getContext === 'function') {
          ctx = this.$refs.atRiskChart.getContext('2d');
          console.log('Got 2D context for at-risk chart');
        }
        if (!ctx) {
          console.error('Failed to get 2D context for at-risk chart');
          return;
        }
        const colleges = this.atRiskData.trends.map(item => item.college);
        const atRiskCounts = this.atRiskData.trends.map(item => item.atRiskCount);
        const atRiskPercentages = this.atRiskData.trends.map(item => item.atRiskPercentage);
        console.log('Prepared data for at-risk chart');

      if (!this.isMounted || !document.contains(this.$refs.atRiskChart)) {
      console.error('Component unmounted or canvas not in DOM for at-risk chart');
      return;
    }
    try {
      this.atRiskChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: colleges,
          datasets: [
            {
              label: 'At-Risk Count',
              data: atRiskCounts,
              backgroundColor: colleges.map((_, index) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, `rgba(220, 53, 69, 0.9)`);
                gradient.addColorStop(1, `rgba(220, 53, 69, 0.6)`);
                return gradient;
              }),
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
              shadowOffsetX: 3,
              shadowOffsetY: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(220, 53, 69, 0.3)',
              yAxisID: 'y'
            },
            {
              label: 'At-Risk Percentage',
              data: atRiskPercentages,
              type: 'line',
              borderColor: 'rgba(255, 193, 7, 1)',
              backgroundColor: 'rgba(255, 193, 7, 0.2)',
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: 'rgba(255, 193, 7, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          hover: {
            animationDuration: 300
          },
          plugins: {
            title: {
              display: true,
              text: `At-Risk Students by College (${this.selectedYear})`,
              font: {
                size: 16,
                weight: 'bold'
              },
              color: '#2c3e50'
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)',
                lineWidth: 1
              },
              ticks: {
                font: {
                  size: 11,
                  weight: '500'
                },
                color: '#666'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Number of Students',
                font: {
                  size: 12,
                  weight: 'bold'
                },
                color: '#2c3e50'
              },
              grid: {
                color: 'rgba(220, 53, 69, 0.1)',
                lineWidth: 1
              },
              ticks: {
                font: {
                  size: 11
                },
                color: '#666'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Percentage (%)',
                font: {
                  size: 12,
                  weight: 'bold'
                },
                color: '#2c3e50'
              },
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                font: {
                  size: 11
                },
                color: '#666'
              }
            }
          }
        }
      });
      console.log('atRiskChart created');
    } catch (chartError) {
      console.error('Error creating atRiskChart:', chartError);
    }
      } catch (error) {
        console.error('Error creating at-risk chart:', error);
      }
    },
    createImprovementChart() {
      if (!this.isMounted) return;
      if (this.improvementChart) {
        this.improvementChart.destroy();
      }

      // Debug logging
      console.log('Creating improvement chart...');
      console.log('Canvas ref:', this.$refs.improvementChart);
      console.log('Improvement data:', this.improvementData);

      // Check if canvas ref exists and data is available
      if (!this.$refs.improvementChart) {
        console.error('Improvement chart canvas ref not found');
        return;
      }
      
      if (!Array.isArray(this.improvementData.trends) || this.improvementData.trends.length === 0) {
        console.warn('No valid improvement data available for chart');
        return;
      }

      try {
        let ctx = null;
        if (this.$refs.improvementChart && typeof this.$refs.improvementChart.getContext === 'function') {
          ctx = this.$refs.improvementChart.getContext('2d');
        }
        if (!ctx) {
          console.error('Failed to get 2D context for improvement chart');
          return;
        }
        const colleges = this.improvementData.trends.map(item => item.college);
        const improvements = this.improvementData.trends.map(item => item.improvement);
        const improvementPercentages = this.improvementData.trends.map(item => item.improvementPercentage);

      // Color coding: green for positive, red for negative with gradients
      const backgroundColors = improvements.map(value => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        if (value > 0) {
          gradient.addColorStop(0, 'rgba(40, 167, 69, 0.9)');
          gradient.addColorStop(1, 'rgba(40, 167, 69, 0.6)');
        } else {
          gradient.addColorStop(0, 'rgba(220, 53, 69, 0.9)');
          gradient.addColorStop(1, 'rgba(220, 53, 69, 0.6)');
        }
        return gradient;
      });
      const borderColors = improvements.map(value => 
        value > 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
      );
      const shadowColors = improvements.map(value => 
        value > 0 ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'
      );

      if (!this.isMounted || !document.contains(this.$refs.improvementChart)) {
          console.error('Component unmounted or canvas not in DOM for improvement chart');
          return;
        }
        try {
          this.improvementChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: colleges,
              datasets: [
                {
                  label: 'Score Improvement',
                  data: improvements,
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 3,
                  borderRadius: 8,
                  borderSkipped: false,
                  shadowOffsetX: 3,
                  shadowOffsetY: 3,
                  shadowBlur: 10,
                  shadowColor: shadowColors,
                  yAxisID: 'y',
                  hoverBackgroundColor: improvements.map(value => 
                    value > 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                  ),
                  hoverBorderWidth: 4
                },
                {
                  label: 'Improvement Percentage',
                  data: improvementPercentages,
                  type: 'line',
                  backgroundColor: 'rgba(255, 193, 7, 0.3)',
                  borderColor: 'rgba(255, 193, 7, 1)',
                  borderWidth: 4,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: 'rgba(255, 193, 7, 1)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 3,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointHoverBackgroundColor: 'rgba(255, 193, 7, 1)',
                  pointHoverBorderColor: '#fff',
                  pointHoverBorderWidth: 4,
                  yAxisID: 'y1'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          hover: {
            animationDuration: 300
          },
          plugins: {
            title: {
              display: true,
              text: `Score Improvement by College (${this.selectedYear} vs ${this.selectedYear - 1})`,
              font: {
                size: 16,
                weight: 'bold'
              },
              color: '#2c3e50'
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(40, 167, 69, 1)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)',
                lineWidth: 1
              },
              ticks: {
                font: {
                  size: 11,
                  weight: '500'
                },
                color: '#666'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Score Points',
                font: {
                  size: 12,
                  weight: 'bold'
                },
                color: '#2c3e50'
              },
              grid: {
                color: 'rgba(40, 167, 69, 0.1)',
                lineWidth: 1
              },
              ticks: {
                font: {
                  size: 11
                },
                color: '#666'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Percentage (%)',
                font: {
                  size: 12,
                  weight: 'bold'
                },
                color: '#2c3e50'
              },
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                font: {
                  size: 11
                },
                color: '#666'
              }
            }
          }
        }
      });
      console.log('improvementChart created');
    } catch (chartError) {
      console.error('Error creating improvementChart:', chartError);
    }
      } catch (error) {
        console.error('Error creating improvement chart:', error);
      }
    },
    async onFilterChange() {
      console.log('Filter changed, fetching new data...');
      await this.fetchTrendData();
    },
    formatDimensionLabel(dimension) {
      const labels = {
        overall: 'Overall',
        autonomy: 'Autonomy',
        environmental_mastery: 'Environmental Mastery',
        personal_growth: 'Personal Growth',
        positive_relations: 'Positive Relations',
        purpose_in_life: 'Purpose in Life',
        self_acceptance: 'Self Acceptance'
      };
      return labels[dimension] || dimension;
    }
  },
  onErrorCaptured(error, instance, info) {
    console.error('Captured error in YearlyTrendAnalysis:', error, info);
    return false;
  }
};
</script>

<style scoped>
/* Main Container */
.yearly-trend-container {
  margin-bottom: 20px;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 25px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Header Styling - matches existing sections */
.trend-analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 5px;
}

.main-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  width: 100%;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.trend-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.section-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

.section-title p {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
  opacity: 0.9;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 100%;
  letter-spacing: 0.5px;
}

.trend-filters {
  display: flex;
  gap: 15px;
  align-items: center;
}

.trend-filters label {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.filter-select {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  color: var(--text-light);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 24px;
  margin-bottom: 12px;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 12px;
}

.retry-btn:hover {
  background: var(--primary-dark);
}

/* Content Layout */
.trend-analysis-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Section Styling - matches Risk Alerts and College Overview */
.section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.4),
    0 4px 12px rgba(118, 75, 162, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  margin-bottom: 24px;
  position: relative;
}

.section-header:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 12px 35px rgba(102, 126, 234, 0.5),
    0 6px 16px rgba(118, 75, 162, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.risk-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.improvement-icon {
  background: linear-gradient(135deg, #26de81 0%, #20bf6b 100%);
}

.section-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.highlight-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

.summary-label {
  font-size: 14px;
  color: #ffffff;
  margin: 0;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
}

/* Chart Container Styling */
.chart-container {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  height: 420px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  margin-top: 20px;
}

.chart-container:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 6px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.chart-container canvas {
  width: 100% !important;
  height: 350px !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .trend-analysis-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .trend-filters {
    justify-content: center;
  }
  
  .trend-analysis-content {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .chart-container {
    padding: 20px;
  }
  
  .chart-container canvas {
    height: 250px !important;
  }
  
  .section-title h3 {
    font-size: 16px;
  }
  
  .section-title p {
    font-size: 12px;
  }
}
</style>