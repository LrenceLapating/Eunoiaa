<template>
  <div class="yearly-trend-container">
    <!-- At-Risk Students by College Card -->
    <div class="trend-card at-risk-card">
      <!-- At-Risk Header -->
      <div class="card-header">
        <div class="card-title">
          <div class="card-icon at-risk-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h3>At-Risk Students by College</h3>
            <p>Track at-risk students by college and dimension</p>
          </div>
        </div>
        <div class="card-filters">
          <select v-model="selectedDimension" class="filter-select">
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

      <!-- At-Risk Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading at-risk data...</p>
      </div>

      <!-- At-Risk Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="fetchTrendData" class="retry-btn">Retry</button>
      </div>

      <!-- At-Risk Content -->
      <div v-else class="card-content">
        <!-- Summary Section -->
        <div class="section-summary" v-if="atRiskData.summary">
          <span class="highlight-text">{{ atRiskData.summary.highestRiskCollege }}</span>
          <span class="summary-label">highest risk</span>
        </div>

        <!-- Chart Container -->
        <div class="chart-container" v-if="!loading && !error && isMounted && atRiskData.trends.length > 0">
          <canvas ref="atRiskChart" width="400" height="200"></canvas>
        </div>

        <!-- No Data State -->
        <div v-else-if="!loading && !error && atRiskData.trends.length === 0" class="no-data-state">
          <div class="no-data-icon">📊</div>
          <p>No at-risk data available for the selected filters</p>
        </div>
      </div>
    </div>

    <!-- Overall Risk Count by Years Card -->
    <div class="trend-card overall-risk-card">
      <!-- Overall Risk Header -->
      <div class="card-header">
        <div class="card-title">
          <div class="card-icon overall-risk-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div>
            <h3>Overall Risk Count by Years</h3>
            <p>Track at-risk students over time</p>
          </div>
        </div>
        <div class="card-filters">
          <select v-model="selectedCollegeForTrend" class="filter-select">
            <option v-for="college in availableColleges" :key="college.code" :value="college.code">
              {{ college.code === 'all' ? college.fullName : college.code }}
            </option>
          </select>
        </div>
      </div>

      <!-- Overall Risk Loading State -->
      <div v-if="overallRiskLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading trend data...</p>
      </div>

      <!-- Overall Risk Error State -->
      <div v-else-if="overallRiskError" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ overallRiskError }}</p>
        <button @click="fetchOverallRiskData" class="retry-btn">Retry</button>
      </div>

      <!-- Overall Risk Content -->
      <div v-else class="card-content">
        <!-- Overall Risk Chart -->
        <div class="chart-container" v-if="!overallRiskLoading && !overallRiskError && isMounted && overallRiskData && overallRiskData.length > 0">
          <canvas ref="overallRiskChart" width="400" height="200"></canvas>
        </div>

        <!-- No Data State for Overall Risk -->
        <div v-else-if="!overallRiskLoading && !overallRiskError && (!overallRiskData || overallRiskData.length === 0)" class="no-data-state">
          <div class="no-data-icon">📈</div>
          <p>No data available for the selected college</p>
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
      selectedDimension: 'autonomy',
      selectedYear: new Date().getFullYear(),
      availableYears: [],
      atRiskData: {
        trends: [],
        summary: null
      },
      atRiskChart: null,
      isMounted: false,
      abortController: null,
      // New data properties for overall risk section
      selectedCollegeForTrend: 'all',
      availableColleges: [],
      overallRiskData: [],
      overallRiskChart: null,
      overallRiskLoading: false,
      overallRiskError: null
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
    },
    selectedCollegeForTrend() {
      this.fetchOverallRiskData();
    }
  },
  async mounted() {
    console.log('Component mounted at', new Date().toISOString());
    await this.fetchAvailableYears();
    await this.fetchAvailableColleges();
    this.initialLoad = false;
    this.isMounted = true;
    await this.fetchTrendData();
    await this.fetchOverallRiskData();
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
    if (this.overallRiskChart) {
        this.overallRiskChart.destroy();
        console.log('overallRiskChart destroyed');
      }
  },
  methods: {
    // Get full college name from code
    getCollegeFullName(collegeCode) {
      const college = this.availableColleges.find(c => c.code === collegeCode);
      return college ? college.fullName : collegeCode;
    },
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
        const atRiskResponse = await axios.get(apiUrl('yearly-trends/at-risk'), {
          params: {
            dimension: this.selectedDimension,
            year: this.selectedYear
          },
          signal: this.abortController.signal
        });
        console.log('Data fetched successfully');

        if (atRiskResponse.data.success) {
          this.atRiskData = atRiskResponse.data.data;
          console.log('atRiskData set:', this.atRiskData);
          console.log('atRiskData.trends length:', this.atRiskData?.trends?.length);
          console.log('Full response data:', atRiskResponse.data);
        } else {
          console.error('API response not successful:', atRiskResponse.data);
          this.error = 'Failed to load at-risk data';
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
          console.error('Error details:', error.message, error.stack);
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
    },
    createAtRiskChart() {
      console.log('createAtRiskChart started at', new Date().toISOString());
      console.log('isMounted:', this.isMounted);
      console.log('atRiskData:', this.atRiskData);
      console.log('atRiskData.trends:', this.atRiskData?.trends);
      console.log('Canvas ref exists:', !!this.$refs.atRiskChart);
      
      if (!this.isMounted) {
        console.log('Not mounted, exiting createAtRiskChart');
        return;
      }
      
      if (this.atRiskChart) {
        this.atRiskChart.destroy();
        console.log('Existing atRiskChart destroyed');
      }

      if (!this.$refs.atRiskChart) {
        console.error('At-risk chart canvas ref not found');
        return;
      }
      
      if (!this.atRiskData || !Array.isArray(this.atRiskData.trends) || this.atRiskData.trends.length === 0) {
        console.warn('No valid at-risk data available for chart');
        console.log('atRiskData structure:', this.atRiskData);
        console.log('trends array:', this.atRiskData?.trends);
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
    async onFilterChange() {
      console.log('Filter changed, fetching new data...');
      await this.fetchTrendData();
    },
    formatDimensionLabel(dimension) {
      const labels = {
        autonomy: 'Autonomy',
        environmental_mastery: 'Environmental Mastery',
        personal_growth: 'Personal Growth',
        positive_relations: 'Positive Relations',
        purpose_in_life: 'Purpose in Life',
        self_acceptance: 'Self Acceptance'
      };
      return labels[dimension] || dimension;
    },
    // Fetch available colleges with assessment records
    async fetchAvailableColleges() {
      try {
        const response = await fetch(apiUrl('yearly-trends/colleges-with-assessments'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Use colleges that have actual assessment records
          this.availableColleges = data.colleges || [
            { name: 'all', code: 'all', fullName: 'All Colleges', totalUsers: 0 }
          ];
        } else {
          console.error('Failed to fetch colleges with assessments:', response.statusText);
          this.availableColleges = [{ name: 'all', code: 'all', fullName: 'All Colleges', totalUsers: 0 }];
        }
      } catch (error) {
        console.error('Error fetching colleges with assessments:', error);
        this.availableColleges = [{ name: 'all', code: 'all', fullName: 'All Colleges', totalUsers: 0 }];
      }
    },
    // Fetch overall risk data by years with optional college filter
    async fetchOverallRiskData() {
      try {
        this.overallRiskLoading = true;
        this.overallRiskError = null;
        
        // Build query parameters
        const params = new URLSearchParams();
        
        // Add college filter if not "all"
        if (this.selectedCollegeForTrend && this.selectedCollegeForTrend !== 'all') {
          params.append('college', this.selectedCollegeForTrend);
        }

        const response = await fetch(apiUrl(`yearly-trends/overall-risk?${params.toString()}`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // The API returns data in the format: [{ year, atRiskCount, totalCount }]
            this.overallRiskData = data.data;
            
            console.log('Overall risk data loaded:', this.overallRiskData);
            
            // Create the chart after a short delay to ensure DOM is ready
            this.$nextTick(() => {
              setTimeout(() => {
                this.createOverallRiskChart();
              }, 100);
            });
          } else {
            this.overallRiskError = 'No data available';
            this.overallRiskData = [];
          }
        } else {
          console.error('Failed to fetch overall risk data:', response.statusText);
          this.overallRiskError = 'Failed to load data';
        }
      } catch (error) {
        console.error('Error fetching overall risk data:', error);
        this.overallRiskError = 'Failed to load data';
      } finally {
        this.overallRiskLoading = false;
      }
    },
    createOverallRiskChart() {
      console.log('Attempting to create overall risk chart...');
      console.log('isMounted:', this.isMounted);
      console.log('overallRiskData:', this.overallRiskData);
      console.log('$refs.overallRiskChart:', this.$refs.overallRiskChart);
      
      if (!this.isMounted || !this.$refs.overallRiskChart) {
        console.warn('Cannot create overall risk chart: component not mounted or ref not available');
        return;
      }

      if (!this.overallRiskData || this.overallRiskData.length === 0) {
        console.warn('Cannot create overall risk chart: no data available');
        return;
      }

      if (this.overallRiskChart) {
        this.overallRiskChart.destroy();
      }

      try {
        const ctx = this.$refs.overallRiskChart.getContext('2d');
        
        // Generate years from 2024 to 2029 for x-axis
        const minYears = [2024, 2025, 2026, 2027, 2028, 2029];
        
        // Get years from data
        const dataYears = this.overallRiskData.map(item => item.year);
        
        // Combine and ensure we have at least 5 years
        const allYears = [...new Set([...minYears, ...dataYears])].sort((a, b) => a - b);
        
        // Create counts array matching the years
        const counts = allYears.map(year => {
          const dataItem = this.overallRiskData.find(item => item.year === year);
          return dataItem ? dataItem.atRiskCount : 0;
        });

        console.log('Chart data - Years:', allYears, 'Counts:', counts);

        this.overallRiskChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: allYears,
            datasets: [
              {
                label: 'At-Risk Students',
                data: counts,
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return null;
                  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                  gradient.addColorStop(0, 'rgba(54, 162, 235, 0.3)');
                  gradient.addColorStop(1, 'rgba(54, 162, 235, 0.1)');
                  return gradient;
                },
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
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
            plugins: {
              title: {
                display: true,
                text: `Overall Risk Count by Years${this.selectedCollegeForTrend !== 'all' ? ` - ${this.getCollegeFullName(this.selectedCollegeForTrend)}` : ''}`,
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
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Year',
                  font: {
                    size: 12,
                    weight: 'bold'
                  },
                  color: '#2c3e50'
                },
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
                  color: 'rgba(54, 162, 235, 0.1)',
                  lineWidth: 1
                },
                ticks: {
                  font: {
                    size: 11
                  },
                  color: '#666',
                  beginAtZero: true,
                  stepSize: 1
                },
                min: 0,
                suggestedMax: 5
              }
            }
          }
        });
        console.log('overallRiskChart created');
      } catch (error) {
        console.error('Error creating overall risk chart:', error);
      }
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Responsive design for smaller screens */
@media (max-width: 1200px) {
  .yearly-trend-container {
    grid-template-columns: 1fr;
  }
}

/* Card Styling */
.trend-card {
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.4),
    0 4px 12px rgba(118, 75, 162, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.at-risk-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.overall-risk-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

.card-header p {
  margin: 0;
  font-size: 14px;
  color: #ffffff;
  opacity: 0.9;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.card-filters {
  display: flex;
  gap: 10px;
  align-items: center;
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

/* Card Content */
.card-content {
  padding: 20px;
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

/* Section Summary */
.section-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.highlight-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.summary-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.chart-container {
  padding: 20px;
  height: 300px;
  position: relative;
}

.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-state p {
  margin: 0;
  font-size: 16px;
  color: #999;

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
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    text-align: center;
  }
  
  .card-filters {
    justify-content: center;
  }
  
  .chart-container {
    height: 250px;
    padding: 15px;
  }
  
  .card-content {
    padding: 15px;
  }
}
</style>