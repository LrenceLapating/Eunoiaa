// Ryff Scales of Psychological Well-Being - 84-Item Version (ORDERED BY DIMENSIONS)
// This is a TEMPORARY version for testing purposes - questions are grouped by dimension

import { ryff84ItemQuestionnaire } from './ryff84ItemQuestionnaire.js'

// Function to create ordered questionnaire grouped by dimensions
function createOrderedQuestionnaire() {
  const originalItems = ryff84ItemQuestionnaire.items
  
  // Group items by dimension
  const dimensionGroups = {
    autonomy: [],
    environmentalMastery: [],
    personalGrowth: [],
    positiveRelations: [],
    purposeInLife: [],
    selfAcceptance: []
  }
  
  // Sort items into their respective dimensions
  originalItems.forEach(item => {
    if (dimensionGroups[item.dimension]) {
      dimensionGroups[item.dimension].push(item)
    }
  })
  
  // Sort each dimension group by original ID to maintain consistency
  Object.keys(dimensionGroups).forEach(dimension => {
    dimensionGroups[dimension].sort((a, b) => a.id - b.id)
  })
  
  // Create ordered items array with dimension info
  const orderedItems = []
  let questionIndex = 1
  
  // Define dimension order and display names
  const dimensionOrder = [
    { key: 'autonomy', name: 'Autonomy' },
    { key: 'environmentalMastery', name: 'Environmental Mastery' },
    { key: 'personalGrowth', name: 'Personal Growth' },
    { key: 'positiveRelations', name: 'Positive Relations with Others' },
    { key: 'purposeInLife', name: 'Purpose in Life' },
    { key: 'selfAcceptance', name: 'Self-Acceptance' }
  ]
  
  // Build ordered items with dimension metadata
  dimensionOrder.forEach(({ key, name }) => {
    const items = dimensionGroups[key]
    items.forEach((item, index) => {
      orderedItems.push({
        ...item,
        questionIndex: questionIndex++,
        dimensionName: name,
        dimensionItemNumber: index + 1,
        totalItemsInDimension: items.length,
        originalQuestionNumber: item.id // Keep the original question number for display
      })
    })
  })
  
  return {
    ...ryff84ItemQuestionnaire,
    items: orderedItems,
    isOrdered: true,
    dimensionOrder: dimensionOrder
  }
}

export const ryff84ItemQuestionnaireOrdered = createOrderedQuestionnaire()
export default ryff84ItemQuestionnaireOrdered