<template>
  <div class="simple-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'SimpleRyffChart',
  props: {
    // Add props to receive student data from parent component
    studentData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      chart: null,
      colleges: ['CCS', 'CN', 'CBA', 'COE', 'CAS'],
      subscales: [
        'Autonomy', 
        'Environmental Mastery', 
        'Personal Growth', 
        'Positive Relations', 
        'Purpose in Life', 
        'Self-Acceptance'
      ],
      // This will be calculated from actual student data
      scores: {},
      colors: [
        'rgba(244, 67, 54, 0.7)',
        'rgba(33, 150, 243, 0.7)',
        'rgba(26, 46, 53, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(255, 152, 0, 0.7)',
        'rgba(233, 30, 99, 0.7)'
      ]
    };
  },
  mounted() {
    // If student data is provided via props, use it
    if (this.studentData && this.studentData.length > 0) {
      this.calculateScores(this.studentData);
    } else {
      // Otherwise, fetch sample student data
      this.fetchStudentData();
    }
  },
  methods: {
    // Fetch sample student data - in a real app, this would be an API call
    fetchStudentData() {
      // Sample student data - same as in the dashboard
      const students = [
        {
          id: 'ST12347',
          name: 'Mike Johnson',
          college: 'CCS',
          section: 'BSIT1A',
          subscales: {
            autonomy: 2.4,
            environmentalMastery: 5.0, // definitely not at risk
            personalGrowth: 3.5,
            positiveRelations: 3.1,
            purposeInLife: 3.4,
            selfAcceptance: 2.9
          }
        },
        {
          id: 'ST12348',
          name: 'Sarah Williams',
          college: 'CCS',
          section: 'BSCS3A',
          subscales: {
            autonomy: 2.0,
            environmentalMastery: 5.0, // definitely not at risk
            personalGrowth: 3.0,
            positiveRelations: 2.0,
            purposeInLife: 2.6,
            selfAcceptance: 2.9
          }
        },
        {
          id: 'ST12353',
          name: 'Kevin Wong',
          college: 'CCS',
          section: 'BSIT3A',
          subscales: {
            autonomy: 2.4,
            environmentalMastery: 2.0, // only CCS student at risk for EM
            personalGrowth: 2.9,
            positiveRelations: 2.5,
            purposeInLife: 2.5,
            selfAcceptance: 2.4
          }
        },
        {
          id: 'ST12351',
          name: 'Robert Brown',
          college: 'COE',
          section: 'BSCE3B',
          subscales: {
            autonomy: 2.3,
            environmentalMastery: 3.5,
            personalGrowth: 3.4,
            positiveRelations: 3.3,
            purposeInLife: 2.3,
            selfAcceptance: 3.4
          }
        },
        {
          id: 'ST12355',
          name: 'Sophia Garcia',
          college: 'CAS',
          section: 'BSPS2B',
          subscales: {
            autonomy: 2.2,
            environmentalMastery: 3.4,
            personalGrowth: 2.4,
            positiveRelations: 3.4,
            purposeInLife: 3.2,
            selfAcceptance: 3.4
          }
        },
        {
          id: 'ST12356',
          name: 'Alex Thompson',
          college: 'CBA',
          section: 'BSBA3A',
          subscales: {
            autonomy: 3.3,
            environmentalMastery: 2.2,
            personalGrowth: 3.2,
            positiveRelations: 3.4,
            purposeInLife: 3.3,
            selfAcceptance: 2.3
          }
        },
        {
          id: 'ST12354',
          name: 'Jessica Martin',
          college: 'CN',
          section: 'BSCS2B',
          subscales: {
            autonomy: 3.5,
            environmentalMastery: 2.3,
            personalGrowth: 3.5,
            positiveRelations: 2.4,
            purposeInLife: 3.6,
            selfAcceptance: 2.2
          }
        }
      ];
      
      this.calculateScores(students);
    },
    
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