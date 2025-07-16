<template>
  <div class="simple-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'SimpleRyffChart',
  data() {
    return {
      chart: null,
      colleges: ['CCS', 'CN', 'CBA', 'COE', 'CAS'],
      subscales: [
        'Autonomy', 
        'Self-Acceptance', 
        'Personal Growth', 
        'Purpose in Life', 
        'Environmental Mastery', 
        'Positive Relations'
      ],
      scores: {
        CCS: [4.1, 3.8, 4.0, 3.9, 3.9, 3.6],
        CN: [3.9, 4.1, 3.8, 4.2, 3.9, 3.9],
        CBA: [4.0, 3.9, 4.0, 3.8, 4.1, 3.9],
        COE: [3.7, 3.6, 3.8, 3.7, 3.8, 3.5],
        CAS: [4.1, 4.0, 4.2, 4.0, 4.1, 3.8]
      },
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
    this.createChart();
  },
  methods: {
    createChart() {
      const ctx = this.$refs.chartCanvas.getContext('2d');
      
      // Prepare data for Chart.js
      const datasets = this.subscales.map((subscale, index) => {
        return {
          label: subscale,
          data: this.colleges.map(college => this.scores[college][index]),
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