// Temporary script to analyze question numbers by dimension
const { ryff84ItemQuestionnaire } = require('./Eunoia frontend/src/assets/ryff84ItemQuestionnaire.js');
const { ryff42ItemQuestionnaire } = require('./Eunoia frontend/src/assets/ryff42ItemQuestionnaire.js');

function analyzeQuestionNumbers(questionnaire, name) {
  console.log(`\n=== ${name} ===`);
  
  const dimensionQuestions = {};
  
  questionnaire.items.forEach(item => {
    if (!dimensionQuestions[item.dimension]) {
      dimensionQuestions[item.dimension] = [];
    }
    dimensionQuestions[item.dimension].push(item.id);
  });
  
  // Sort question numbers for each dimension
  Object.keys(dimensionQuestions).forEach(dimension => {
    dimensionQuestions[dimension].sort((a, b) => a - b);
  });
  
  // Display in the requested order
  const dimensionOrder = [
    'autonomy',
    'environmentalMastery', 
    'personalGrowth',
    'positiveRelations',
    'purposeInLife',
    'selfAcceptance'
  ];
  
  dimensionOrder.forEach(dimension => {
    if (dimensionQuestions[dimension]) {
      console.log(`${dimension}: ${dimensionQuestions[dimension].join(', ')}`);
    }
  });
  
  return dimensionQuestions;
}

// Analyze both questionnaires
const q84Numbers = analyzeQuestionNumbers(ryff84ItemQuestionnaire, '84-Item Questionnaire');
const q42Numbers = analyzeQuestionNumbers(ryff42ItemQuestionnaire, '42-Item Questionnaire');

console.log('\n=== Summary ===');
console.log('84-item Autonomy questions:', q84Numbers.autonomy);
console.log('42-item Autonomy questions:', q42Numbers.autonomy);