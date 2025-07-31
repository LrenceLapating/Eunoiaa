<template>
  <div class="simple-chart-container">
    <canvas ref="chartCanvas"></canvas>
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
      colors: ryffDimensions.map(dim => getDimensionColor(dim))
    };
  },
  mounted() {
    // Always use student data from props (from AccountManagement via CounselorDashboard)
    this.calculateScores(this.studentData || []);
  },
  watch: {
    // Watch for changes in student data and recalculate scores
    studentData: {
      handler(newData) {
        this.calculateScores(newData || []);
      },
      deep: true
    }
  },
  methods: {

    
    // Calculate average scores by college from student data
    calculateScores(students) {
      // Initialize scores object with empty arrays for each college
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
      
      // Group scores by college
      students.forEach(student => {
        if (scores[student.college]) {
          for (const subscale in student.subscales) {
            scores[student.college][subscale].push(student.subscales[subscale]);
          }
        }
      });
      
      // Calculate averages
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
      this.createChart();
    },
    
    // Calculate average of an array of numbers
    calculateAverage(arr) {
      if (!arr || arr.length === 0) return 0;
      const sum = arr.reduce((total, val) => total + val, 0);
      return sum / arr.length;
    },
    
    createChart() {
      const ctx = this.$refs.chartCanvas.getContext('2d');
      
      // Prepare data for Chart.js
      const datasets = this.subscales.map((subscale, index) => {
        return {
          label: subscale,
          data: this.colleges.map(college => this.scores[college] ? this.scores[college][index] : 0),
          backgroundColor: this.colors[index],
          borderColor: this.colors[index].replace('0.7', '1'),
          borderWidth: 1
        };
      });
      
      // Create the chart
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
</style>