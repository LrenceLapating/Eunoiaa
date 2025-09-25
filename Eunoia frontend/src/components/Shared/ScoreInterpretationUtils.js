// Utility for detailed score interpretations
// This is a safe, standalone utility that doesn't modify existing functionality

import { getCollegeDimensionRiskLevel, formatDimensionName } from './RyffScoringUtils';

/**
 * Get detailed score interpretation text for college reports
 * @param {number} score - The dimension score
 * @param {string} dimensionKey - The dimension key (e.g., 'autonomy', 'environmental_mastery')
 * @param {string} assessmentType - The assessment type ('ryff_42' or 'ryff_84')
 * @returns {string} Detailed interpretation text
 */
export const getDetailedScoreInterpretation = (score, dimensionKey, assessmentType = 'ryff_42') => {
  // Get risk level using the existing safe utility
  const riskLevel = getCollegeDimensionRiskLevel(score, assessmentType);
  
  // Detailed interpretations for each dimension and risk level
  const interpretations = {
    'autonomy': {
      'Healthy': 'Most students in this college demonstrate a strong sense of independence and self-direction. They are generally able to resist social pressures and make decisions based on their own values and standards. On average, their behavior is regulated from within, and they rely less on external validation or approval from others.',
      'Moderate': 'Students in this college show a balanced level of autonomy. While they are often capable of making independent decisions, they may still be influenced by social expectations or others\' opinions. On average, they strive to maintain personal standards but sometimes seek validation from peers or authority figures.',
      'At Risk': 'Most students in this college may struggle with independence and self-direction. They often look to others for guidance and may have difficulty making decisions without external input. On average, they are more susceptible to social pressures and may compromise their values to fit in or gain approval.'
    },
    'environmental_mastery': {
      'Healthy': 'Most students in this college demonstrate strong environmental mastery skills. They are effective at managing daily responsibilities and can navigate complex situations with confidence. On average, they feel in control of their surroundings and are able to create environments that suit their needs and values.',
      'Moderate': 'Students in this college show moderate environmental mastery. While they can handle most daily tasks, they may occasionally feel overwhelmed by complex situations or responsibilities. On average, they are working to improve their ability to manage their environment and may benefit from additional support in certain areas.',
      'At Risk': 'Most students in this college may struggle with environmental mastery. They often feel overwhelmed by daily responsibilities and may have difficulty managing complex situations. On average, they may feel that external circumstances control their lives rather than feeling in control of their environment.'
    },
    'personal_growth': {
      'Healthy': 'Most students in this college demonstrate a strong commitment to personal growth and development. They are open to new experiences and actively seek opportunities to learn and improve themselves. On average, they view challenges as opportunities for growth and maintain a sense of curiosity about life.',
      'Moderate': 'Students in this college show some interest in personal growth but may not consistently pursue development opportunities. They are sometimes open to new experiences but may also resist change. On average, they recognize the importance of growth but may need encouragement to step outside their comfort zones.',
      'At Risk': 'Most students in this college may show limited interest in personal growth and development. They may resist new experiences or feel stuck in their current situation. On average, they may feel that they have reached their potential or may be afraid of change and new challenges.'
    },
    'positive_relations': {
      'Healthy': 'Most students in this college excel at building and maintaining positive relationships with others. They demonstrate empathy, trust, and strong communication skills in their interactions. On average, they have satisfying relationships and are able to give and receive emotional support effectively.',
      'Moderate': 'Students in this college show some ability to maintain positive relationships but may find it challenging to engage in deeper emotional connections. While they value social interaction, they may sometimes hold back emotionally or avoid vulnerability. On average, relationships may be somewhat superficial or inconsistent.',
      'At Risk': 'Most students in this college have difficulty building or sustaining trusting and meaningful relationships. They may feel emotionally disconnected or isolated in their interactions. On average, they show lower levels of warmth, openness, or willingness to compromise, which can impact their social connections.'
    },
    'purpose_in_life': {
      'Healthy': 'Most students in this college demonstrate a strong sense of purpose and direction in life. They have clear goals and derive meaning from their past and present experiences. On average, their beliefs and values provide guidance, giving their lives a coherent and motivating structure.',
      'Moderate': 'Students in this college show some awareness of purpose and direction, but may also experience periods of uncertainty or lack of clarity. They often set short-term goals but may struggle to connect them with a deeper sense of meaning. On average, their sense of purpose is present but may need strengthening.',
      'At Risk': 'Most students in this college appear to lack clear goals or a strong sense of meaning in life. They may feel disconnected from both their past experiences and future aspirations. On average, the group shows lower motivation and direction, which can contribute to a sense of aimlessness or confusion about life\'s purpose.'
    },
    'purposeInLife': {
      'Healthy': 'Most students in this college demonstrate a strong sense of purpose and direction in life. They have clear goals and derive meaning from their past and present experiences. On average, their beliefs and values provide guidance, giving their lives a coherent and motivating structure.',
      'Moderate': 'Students in this college show some awareness of purpose and direction, but may also experience periods of uncertainty or lack of clarity. They often set short-term goals but may struggle to connect them with a deeper sense of meaning. On average, their sense of purpose is present but may need strengthening.',
      'At Risk': 'Most students in this college appear to lack clear goals or a strong sense of meaning in life. They may feel disconnected from both their past experiences and future aspirations. On average, the group shows lower motivation and direction, which can contribute to a sense of aimlessness or confusion about life\'s purpose.'
    },
    'self_acceptance': {
      'Healthy': 'Most students in this college demonstrate a positive and accepting attitude toward themselves. They are aware of both strengths and shortcomings and reflect on their life experiences with appreciation and self-respect. On average, they show psychological maturity and inner confidence.',
      'Moderate': 'Students in this college show partial self-acceptance. While they acknowledge certain strengths, they may also experience recurring doubts or dissatisfaction with aspects of themselves or their past. On average, they are working toward greater self-understanding but have not yet achieved full self-acceptance.',
      'At Risk': 'Most students in this college express dissatisfaction with themselves and their life experiences. They may feel regretful about past events or critical of personal traits. On average, there is a stronger desire to be different, reflecting challenges with self-worth and acceptance.'
    },
    'selfAcceptance': {
      'Healthy': 'Most students in this college demonstrate a positive and accepting attitude toward themselves. They are aware of both strengths and shortcomings and reflect on their life experiences with appreciation and self-respect. On average, they show psychological maturity and inner confidence.',
      'Moderate': 'Students in this college show partial self-acceptance. While they acknowledge certain strengths, they may also experience recurring doubts or dissatisfaction with aspects of themselves or their past. On average, they are working toward greater self-understanding but have not yet achieved full self-acceptance.',
      'At Risk': 'Most students in this college express dissatisfaction with themselves and their life experiences. They may feel regretful about past events or critical of personal traits. On average, there is a stronger desire to be different, reflecting challenges with self-worth and acceptance.'
    }
  };

  // Get the interpretation for this dimension and risk level
  const dimensionInterpretations = interpretations[dimensionKey];
  if (dimensionInterpretations && dimensionInterpretations[riskLevel]) {
    return dimensionInterpretations[riskLevel];
  }

  // Fallback to basic interpretation if no specific interpretation found
  const dimensionName = formatDimensionName(dimensionKey);
  if (riskLevel === 'Healthy') {
    return `Students in this college show excellent levels of ${dimensionName.toLowerCase()}. They demonstrate strong capabilities in this psychological well-being dimension.`;
  } else if (riskLevel === 'Moderate') {
    return `Students in this college show moderate levels of ${dimensionName.toLowerCase()}. There are opportunities for growth in this area.`;
  } else {
    return `Students in this college may need additional support in ${dimensionName.toLowerCase()}. Consider targeted interventions for this dimension.`;
  }
};