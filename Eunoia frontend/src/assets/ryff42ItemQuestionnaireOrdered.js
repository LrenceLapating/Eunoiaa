// Ryff Scales of Psychological Well-Being - 42-Item Version (Ordered by Dimensions)
// This is a temporary version for testing purposes that groups questions by dimension

import { ryff42ItemQuestionnaire } from './ryff42ItemQuestionnaire.js';

// Define the order of dimensions as requested
const dimensionOrder = [
  'autonomy',
  'environmentalMastery', 
  'personalGrowth',
  'positiveRelations',
  'purposeInLife',
  'selfAcceptance'
];

// Dimension display names
const dimensionNames = {
  autonomy: 'Autonomy',
  environmentalMastery: 'Environmental Mastery',
  personalGrowth: 'Personal Growth', 
  positiveRelations: 'Positive Relations with Others',
  purposeInLife: 'Purpose in Life',
  selfAcceptance: 'Self-Acceptance'
};

// Group items by dimension
const itemsByDimension = {};
ryff42ItemQuestionnaire.items.forEach(item => {
  if (!itemsByDimension[item.dimension]) {
    itemsByDimension[item.dimension] = [];
  }
  itemsByDimension[item.dimension].push(item);
});

// Sort items within each dimension by their original ID
Object.keys(itemsByDimension).forEach(dimension => {
  itemsByDimension[dimension].sort((a, b) => a.id - b.id);
});

// Create ordered items array
const orderedItems = [];
dimensionOrder.forEach(dimension => {
  if (itemsByDimension[dimension]) {
    itemsByDimension[dimension].forEach((item, index) => {
      orderedItems.push({
        ...item,
        dimensionName: dimensionNames[dimension],
        dimensionItemNumber: index + 1,
        totalItemsInDimension: itemsByDimension[dimension].length,
        originalQuestionNumber: item.id // Keep the original question number for display
      });
    });
  }
});

// Create the ordered questionnaire object
export const ryff42ItemQuestionnaireOrdered = {
  ...ryff42ItemQuestionnaire,
  items: orderedItems,
  
  // Add method to get dimension info for display
  getDimensionInfo(itemIndex) {
    const item = this.items[itemIndex];
    if (!item) return null;
    
    return {
      dimensionName: item.dimensionName,
      dimensionItemNumber: item.dimensionItemNumber,
      totalItemsInDimension: item.totalItemsInDimension,
      originalId: item.id
    };
  }
};

export default ryff42ItemQuestionnaireOrdered;