<template>
  <div class="simple-chart-container">
    <canvas 
      v-if="studentData && studentData.length > 0" 
      ref="chartCanvas"
    ></canvas>
    <div v-else class="no-data-message">
      <p>No student data available for chart display</p>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';
import {
  ryffDimensions,
  formatDimensionName,
  getDimensionColor,
  calculateCollegeStats
} from './RyffScoringUtils';

export default {
  name: 'SimpleRyffChart',
  props: {
    studentData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      chart: null,
      colleges: ['CCS', 'CN', 'CBA', 'COE', 'CAS'],
      subscales: ryffDimensions.map(formatDimensionName),
      scores: {},
      colors: ryffDimensions.map(dim => getDimensionColor(dim)),
      _isDestroyed: false,
      isCreatingChart: false
    };
  },
  async mounted() {
    await this.$nextTick();
    // Add a small delay to ensure DOM is fully ready
    setTimeout(async () => {
      if (this.$refs.chartCanvas && !this._isDestroyed) {
        await this.calculateScores(this.studentData || []);
      }
    }, 300);
  },
  watch: {
    studentData: {
      async handler(newData) {
        if (this._isDestroyed || this.isCreatingChart) return;
        
        // Add delay to ensure any pending operations complete
        setTimeout(async () => {
          if (this.$refs.chartCanvas && !this._isDestroyed && !this.isCreatingChart) {
            await this.calculateScores(newData || []);
          }
        }, 150);
      },
      deep: true
    }
  },
  beforeUnmount() {
    this._isDestroyed = true;
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (error) {
        console.warn('Error destroying chart:', error);
      }
      this.chart = null;
    }
  },
  methods: {
    async calculateScores(students) {
      const scores = {};
      this.colleges.forEach(college => {
        scores[college] = {
          autonomy: [],
          environmentalMastery: [],
          personalGrowth: [],
          positiveRelations: [],
          purposeInLife: [],
          selfAcceptance: []
        };
      });
      
      students.forEach(student => {
        if (scores[student.college] && student.subscales) {
          for (const subscale in student.subscales) {
            if (student.subscales[subscale] !== null && student.subscales[subscale] !== undefined) {
              scores[student.college][subscale].push(student.subscales[subscale]);
            }
          }
        }
      });
      
      const averages = {};
      this.colleges.forEach(college => {
        averages[college] = [
          this.calculateAverage(scores[college].autonomy),
          this.calculateAverage(scores[college].environmentalMastery),
          this.calculateAverage(scores[college].personalGrowth),
          this.calculateAverage(scores[college].positiveRelations),
          this.calculateAverage(scores[college].purposeInLife),
          this.calculateAverage(scores[college].selfAcceptance)
        ];
      });
      
      this.scores = averages;
      await this.createChart();
    },
    
    calculateAverage(arr) {
      if (!arr || arr.length === 0) return 0;
      const sum = arr.reduce((total, val) => total + val, 0);
      return sum / arr.length;
    },
    
    async createChart() {
      // Check if component is being destroyed or already creating
      if (this._isDestroyed || this.isCreatingChart) return;
      
      this.isCreatingChart = true;
      
      try {
        if (this.chart) {
          try {
            this.chart.destroy();
          } catch (error) {
            console.warn('Error destroying existing chart:', error);
          }
          this.chart = null;
        }
        
        await this.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Double check component state and canvas availability
        if (this._isDestroyed || !this.$refs.chartCanvas) {
          console.warn('Chart canvas not available or component destroyed');
          return;
        }
        
        const canvas = this.$refs.chartCanvas;
        if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
          console.warn('Canvas has no dimensions or is not available');
          return;
        }
        
        // Verify canvas is still attached to DOM
        if (!canvas.isConnected) {
          console.warn('Canvas is not connected to DOM');
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Canvas context not available');
          return;
        }
        
        // Additional safety checks for canvas context
        try {
          // Test if context is functional
          ctx.save();
          ctx.restore();
          
          // Final check if component is still mounted
          if (this._isDestroyed) {
            console.warn('Component is being destroyed');
            return;
          }
        } catch (error) {
          console.warn('Canvas context not ready:', error);
          return;
        }
      
        const datasets = this.subscales.map((subscale, index) => {
          return {
            label: subscale,
            data: this.colleges.map(college => this.scores[college] ? this.scores[college][index] : 0),
            backgroundColor: this.colors[index],
            borderColor: this.colors[index].replace('0.7', '1'),
            borderWidth: 1
          };
        });
        
        try {
          this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: this.colleges,
              datasets: datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    title: function(tooltipItems) {
                      return tooltipItems[0].dataset.label + ' - ' + tooltipItems[0].label;
                    },
                    label: function(context) {
                      return 'Score: ' + context.raw.toFixed(1);
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 5,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('Failed to create chart:', error);
          this.chart = null;
        }
      } catch (error) {
        console.error('Error in createChart:', error);
      } finally {
        this.isCreatingChart = false;
      }
    }
  }
};
</script>

<style scoped>
.simple-chart-container {
  width: 100%;
  height: 400px;
  position: relative;
}

.no-data-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-style: italic;
}
</style>