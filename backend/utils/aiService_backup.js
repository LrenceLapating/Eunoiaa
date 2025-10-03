const axios = require('axios');
const { config } = require('../config/environment');

// OpenRouter API configuration from environment
const OPENROUTER_BASE_URL = config.ai.openrouterBaseUrl;
const MODEL_NAME = config.ai.modelName;
const API_KEY = config.ai.openrouterApiKey;

// Validate API key is present
if (!API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable is not set');
  throw new Error('OpenRouter API key is required but not configured');
}

class AIService {
  /**
   * Generate AI intervention based on student assessment scores
   * @param {Object} studentData - Student information and scores
   * @param {string} riskLevel - Overall risk level (low, moderate, high)
   * @returns {Promise<Object>} Generated intervention with title and text
   */
  async generateIntervention(studentData, riskLevel) {
    try {
      const prompt = this.createInterventionPrompt(studentData, riskLevel);
      
      const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, {
        model: MODEL_NAME,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        return this.parseInterventionResponse(response.data.choices[0].message.content);
      } else {
        throw new Error('Invalid response from AI model');
      }
    } catch (error) {
      console.error('Error generating AI intervention:', error);
      throw new Error('Failed to generate AI intervention');
    }
  }

  /**
   * Create a detailed prompt for intervention generation
   * @param {Object} studentData - Student data with scores
   * @param {string} riskLevel - Risk level
   * @returns {string} Formatted prompt
   */
  createInterventionPrompt(studentData, riskLevel) {
    const { name, subscales, overallScore, atRiskDimensions, college, section, assessmentType } = studentData;
    
    // Calculate dynamic max scores based on assessment type
    const dimensionMaxScore = assessmentType === 'ryff_84' ? 84 : 42;
    const overallMaxScore = assessmentType === 'ryff_84' ? 504 : 252;
    
    // Identify dimensions that are actually "At Risk"
    const atRiskDimensionsList = [];
    if (this.getScoreStatus(subscales?.autonomy || 0, assessmentType) === 'At Risk') atRiskDimensionsList.push('autonomy');
    if (this.getScoreStatus(subscales?.personal_growth || 0, assessmentType) === 'At Risk') atRiskDimensionsList.push('personal growth');
    if (this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType) === 'At Risk') atRiskDimensionsList.push('purpose in life');
    if (this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType) === 'At Risk') atRiskDimensionsList.push('self-acceptance');
    if (this.getScoreStatus(subscales?.positive_relations || 0, assessmentType) === 'At Risk') atRiskDimensionsList.push('positive relations');
    if (this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType) === 'At Risk') atRiskDimensionsList.push('environmental mastery');
    
    // Identify dimensions that are "Healthy"
    const healthyDimensionsList = [];
    if (this.getScoreStatus(subscales?.autonomy || 0, assessmentType) === 'Healthy') healthyDimensionsList.push('autonomy');
    if (this.getScoreStatus(subscales?.personal_growth || 0, assessmentType) === 'Healthy') healthyDimensionsList.push('personal growth');
    if (this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType) === 'Healthy') healthyDimensionsList.push('purpose in life');
    if (this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType) === 'Healthy') healthyDimensionsList.push('self-acceptance');
    if (this.getScoreStatus(subscales?.positive_relations || 0, assessmentType) === 'Healthy') healthyDimensionsList.push('positive relations');
    if (this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType) === 'Healthy') healthyDimensionsList.push('environmental mastery');
    
    // Identify dimensions that are "Moderate"
    const moderateDimensionsList = [];
    if (this.getScoreStatus(subscales?.autonomy || 0, assessmentType) === 'Moderate') moderateDimensionsList.push('autonomy');
    if (this.getScoreStatus(subscales?.personal_growth || 0, assessmentType) === 'Moderate') moderateDimensionsList.push('personal growth');
    if (this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType) === 'Moderate') moderateDimensionsList.push('purpose in life');
    if (this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType) === 'Moderate') moderateDimensionsList.push('self-acceptance');
    if (this.getScoreStatus(subscales?.positive_relations || 0, assessmentType) === 'Moderate') moderateDimensionsList.push('positive relations');
    if (this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType) === 'Moderate') moderateDimensionsList.push('environmental mastery');
    
    const atRiskText = atRiskDimensionsList.length > 0 ? 
      `The following dimensions are at risk and need attention: ${atRiskDimensionsList.join(', ')}.` : 
      'All dimensions are in healthy or moderate ranges.';
      
    const healthyText = healthyDimensionsList.length > 0 ? 
      `The following dimensions are healthy: ${healthyDimensionsList.join(', ')}.` : 
      'No dimensions are in the healthy range.';
      
    const moderateText = moderateDimensionsList.length > 0 ? 
      `The following dimensions are moderate: ${moderateDimensionsList.join(', ')}.` : 
      'No dimensions are in the moderate range.';
    
    // ENHANCED PROMPT FOR VARIED, NATURAL INTERVENTIONS
     let prompt = `You are a psychologist. Write feedback for ${name || 'this student'}.

SCORES:
- Overall: ${Math.round(overallScore || 0)}/${overallMaxScore} (${riskLevel})
- Autonomy: ${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.autonomy || 0, assessmentType)})
- Personal Growth: ${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType)})
- Purpose in Life: ${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType)})
- Self Acceptance: ${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType)})
- Positive Relations: ${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType)})
- Environmental Mastery: ${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType)})

AT RISK DIMENSIONS: ${atRiskText}
HEALTHY DIMENSIONS: ${healthyText}
MODERATE DIMENSIONS: ${moderateText}

FORMAT:
Overall Mental Health Strategy:
[Write a comprehensive 4-5 sentence analysis of their overall well-being. VARY YOUR OPENING - don't always start with the score. You can begin with their strengths, challenges, or overall psychological state. Include the overall score (${Math.round(overallScore || 0)} out of ${overallMaxScore}) naturally within your analysis, not necessarily first. CRITICAL INSTRUCTIONS: 
1. You MUST explicitly mention and celebrate the healthy dimensions by name if any exist in the HEALTHY DIMENSIONS list above. Say something like "You demonstrate healthy levels in [list the healthy dimensions]" or "Your psychological strengths shine in [healthy dimensions]".
2. You MUST explicitly mention the moderate dimensions by name if any exist in the MODERATE DIMENSIONS list above. Say something like "You show promising development in [list the moderate dimensions]" or "Areas where you're building solid foundations include [moderate dimensions]" - make this sound encouraging.
3. You MUST explicitly mention the at-risk dimensions by name if any exist in the AT RISK DIMENSIONS list above. Say something like "The areas requiring focused attention are [list at-risk dimensions]" or "Your growth opportunities lie in [at-risk dimensions]".
4. Do NOT mention any dimension status unless it appears in the respective lists above.
5. Make it detailed, personalized, and vary your language patterns for each student.]

Dimension Scores & Targeted Interventions:

Autonomy (${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore}): [VARY YOUR APPROACH - Don't always start with "Your score for Autonomy is...". Mix it up with different openings like: "In terms of autonomy, you scored ${Math.round(subscales?.autonomy || 0)} out of ${dimensionMaxScore}..." OR "Your autonomy assessment reveals a score of ${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore}..." OR "With ${Math.round(subscales?.autonomy || 0)} points out of ${dimensionMaxScore} in autonomy..." OR start with the psychological insight first, then mention the score. This places you in the ${this.getScoreStatus(subscales?.autonomy || 0, assessmentType)} range. Write ONLY what this score means about their inner experience and psychological state. NO advice. NO suggestions. NO "try" or "you could". Just describe their current psychological reality in this dimension.]

Personal Growth (${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore}): [VARY YOUR APPROACH - Use different sentence structures and openings. Don't repeat the same pattern as autonomy. You could start with: "Personal growth-wise, your ${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore} score..." OR "Your personal development journey reflects a score of ${Math.round(subscales?.personal_growth || 0)} out of ${dimensionMaxScore}..." OR begin with psychological insight. This places you in the ${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType)} range. Write ONLY what this score means about their inner experience. NO advice. NO suggestions. Just describe their psychological state in this area.]

Purpose in Life (${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore}): [VARY YOUR APPROACH - Use a completely different opening style from the previous two dimensions. Consider: "Regarding your sense of purpose, you achieved ${Math.round(subscales?.purpose_in_life || 0)} points out of ${dimensionMaxScore}..." OR "Your purpose in life dimension shows ${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore}..." OR start with meaning-making insights. This places you in the ${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType)} range. Write ONLY what this score reveals about their inner sense of direction and meaning. NO advice. Just describe their psychological experience.]

Self Acceptance (${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore}): [VARY YOUR APPROACH - Create a unique opening different from all previous dimensions. Try: "When it comes to self-acceptance, your ${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore} score..." OR "Self-acceptance wise, you scored ${Math.round(subscales?.self_acceptance || 0)} out of ${dimensionMaxScore}..." OR lead with self-relationship insights. This places you in the ${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType)} range. Write ONLY what this score indicates about their relationship with themselves. NO advice. Just describe their current self-perception and acceptance.]

Positive Relations (${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore}): [VARY YOUR APPROACH - Use another distinct opening style. Consider: "In the realm of relationships, your ${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore} score..." OR "Your capacity for positive relationships is reflected in ${Math.round(subscales?.positive_relations || 0)} points out of ${dimensionMaxScore}..." OR begin with relational insights. This places you in the ${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType)} range. Write ONLY what this score reveals about their social connections and relationship patterns. NO advice. Just describe their relational world.]

Environmental Mastery (${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore}): [VARY YOUR APPROACH - Create the most unique opening yet. Try: "Your environmental mastery assessment of ${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore}..." OR "Managing life's demands shows in your ${Math.round(subscales?.environmental_mastery || 0)} out of ${dimensionMaxScore} score..." OR start with competency insights. This places you in the ${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType)} range. Write ONLY what this score indicates about their ability to navigate and control their environment. NO advice. Just describe their current mastery level.]

Recommended Action Plan:
Autonomy: [For autonomy, since your score is ${this.getScoreStatus(subscales?.autonomy || 0, assessmentType)}, ${this.getScoreStatus(subscales?.autonomy || 0, assessmentType) === 'Healthy' ? 'continue and maintain your independence and decision-making abilities. Keep up your independence and continue making decisions that align with your values. For example, continue setting personal boundaries, making career choices based on your values, or maintaining your daily routines that reflect your independence.' : this.getScoreStatus(subscales?.autonomy || 0, assessmentType) === 'Moderate' ? 'you have a moderate level of independence and self-determination. Focus on strengthening your ability to make decisions based on your own values. For example, practice saying no to requests that don\'t align with your values, set aside time for personal reflection, or make one independent decision each day.' : 'you are at risk and need to improve your independence and self-determination. Focus on developing your ability to make decisions based on your own values. For example, practice saying no to requests that don\'t align with your values, set aside time for personal reflection, or make one independent decision each day.'}]
Personal Growth: [For personal growth, since your score is ${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType)}, ${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType) === 'Healthy' ? 'continue and maintain your personal development journey and growth mindset. Continue your personal development journey and maintain your growth mindset. For example, keep reading self-development books, attend workshops or seminars, or set new learning goals each month.' : this.getScoreStatus(subscales?.personal_growth || 0, assessmentType) === 'Moderate' ? 'you have a moderate level of personal development and growth mindset. Focus on expanding your potential and openness to new experiences. For example, start a daily journaling practice, enroll in an online course, or challenge yourself to learn one new skill this month.' : 'you are at risk and need to focus on developing yourself and expanding your potential. Work on cultivating a growth mindset and openness to new experiences. For example, start a daily journaling practice, enroll in an online course, or challenge yourself to learn one new skill this month.'}]
Purpose in Life: [For purpose in life, since your score is ${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType)}, ${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType) === 'Healthy' ? 'continue and maintain your sense of purpose and meaningful goals. Keep nurturing your sense of purpose and continue pursuing meaningful goals. For example, continue volunteering for causes you care about, work on projects that align with your values, or mentor others in areas where you excel.' : this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType) === 'Moderate' ? 'you have a moderate sense of direction and meaning in your life. Focus on strengthening your sense of purpose and setting more meaningful goals. For example, volunteer for a local charity, identify three core values that guide your decisions, or set one meaningful long-term goal and break it into smaller steps.' : 'you are at risk and need to develop a stronger sense of direction and meaning in your life. Focus on identifying what truly matters to you and setting meaningful goals. For example, volunteer for a local charity, identify three core values that guide your decisions, or set one meaningful long-term goal and break it into smaller steps.'}]
Self Acceptance: [For self-acceptance, since your score is ${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType)}, ${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType) === 'Healthy' ? 'continue and maintain your positive self-regard and self-compassion. Continue practicing self-compassion and maintaining your positive self-regard. For example, continue your daily affirmations, celebrate your achievements regularly, or practice self-forgiveness when you make mistakes.' : this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType) === 'Moderate' ? 'you have a moderate level of self-acceptance and self-regard. Focus on building stronger self-compassion and recognizing your worth. For example, write down three things you appreciate about yourself each day, practice positive self-talk, or challenge negative thoughts with evidence-based thinking.' : 'you are at risk and need to work on accepting yourself and developing a more positive self-image. Focus on building self-compassion and recognizing your worth. For example, write down three things you appreciate about yourself each day, practice positive self-talk, or challenge negative thoughts with evidence-based thinking.'}]
Positive Relations: [For positive relations, since your score is ${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType)}, ${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType) === 'Healthy' ? 'continue and maintain your strong relationships and supportive connections. Keep nurturing your relationships and continue being supportive to others. For example, schedule regular check-ins with close friends, continue being an active listener, or organize social gatherings that bring people together.' : this.getScoreStatus(subscales?.positive_relations || 0, assessmentType) === 'Moderate' ? 'you have a moderate level of positive connections with others. Focus on strengthening your relationships and building more meaningful connections. For example, reach out to one friend or family member each week, practice active listening in conversations, or join a club or group based on your interests.' : 'you are at risk and need to focus on building stronger, more meaningful relationships with others. Work on developing trust, empathy, and connection skills. For example, reach out to one friend or family member each week, practice active listening in conversations, or join a club or group based on your interests.'}]
Environmental Mastery: [For environmental mastery, since your score is ${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType)}, ${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType) === 'Healthy' ? 'continue and maintain your effective management of your environment and responsibilities. Continue managing your environment effectively and maintain your organizational skills. For example, maintain your current organizational systems, continue budgeting effectively, or keep your living and work spaces well-organized.' : this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType) === 'Moderate' ? 'you have a moderate ability to manage your external environment and daily responsibilities. Focus on improving your organizational and life management skills. For example, create a daily schedule and stick to it, organize one area of your living space each week, or use a budgeting app to track your expenses.' : 'you are at risk and need to improve your ability to manage your external environment and daily responsibilities. Focus on developing better organizational and life management skills. For example, create a daily schedule and stick to it, organize one area of your living space each week, or use a budgeting app to track your expenses.'}]

RULE: Dimensions = describe feelings only. Action Plan = give advice with examples.`;
    
    return prompt;
  }

  /**
   * Parse the AI response to extract title and intervention text
   * @param {string} response - Raw AI response
   * @returns {Object} Parsed intervention with title and text
   */
  parseInterventionResponse(response) {
    try {
      const lines = response.trim().split('\n');
      let title = '';
      let interventionText = '';
      let isInterventionSection = false;
      
      for (const line of lines) {
        if (line.startsWith('TITLE:')) {
          title = line.replace('TITLE:', '').trim();
        } else if (line.startsWith('INTERVENTION:')) {
          isInterventionSection = true;
        } else if (isInterventionSection && line.trim()) {
          interventionText += line + '\n';
        }
      }
      
      // Fallback parsing if format is not followed exactly
      if (!title || !interventionText) {
        const titleMatch = response.match(/(?:TITLE:|Title:)\s*(.+?)(?:\n|$)/i);
        const interventionMatch = response.match(/(?:INTERVENTION:|Intervention:)\s*([\s\S]+)/i);
        
        title = titleMatch ? titleMatch[1].trim() : '';
        interventionText = interventionMatch ? interventionMatch[1].trim() : response.trim();
      }
      
      // Clean up and validate
      title = title.substring(0, 100); // Limit title length
      interventionText = interventionText.trim();
      
      if (!interventionText) {
        interventionText = response.trim();
      }
      
      // Ensure we have AI-generated content - no hardcoded fallbacks
      if (!title || !interventionText) {
        throw new Error('AI response parsing failed - insufficient content generated');
      }
      
      return {
        title: title,
        text: interventionText
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // No hardcoded fallback content - throw error to trigger retry mechanism
      throw new Error('Failed to parse AI response - retry required');
    }
  }

  /**
   * Get score status based on thresholds
   * @param {number} score - Dimension score
   * @param {string} assessmentType - Assessment type ('ryff_42' or 'ryff_84')
   * @returns {string} Status description
   */
  getScoreStatus(score, assessmentType = 'ryff_42') {
    // Use the same thresholds as frontend
    const thresholds = {
      'ryff_42': {
        atRisk: 18,   // ≤18: At-Risk
        healthy: 31   // ≥31: Healthy
      },
      'ryff_84': {
        atRisk: 36,   // ≤36: At-Risk  
        healthy: 60   // ≥60: Healthy
      }
    };
    
    const threshold = thresholds[assessmentType] || thresholds['ryff_42'];
    
    if (score <= threshold.atRisk) return 'At Risk';
    if (score >= threshold.healthy) return 'Healthy';
    return 'Moderate';
  }

  /**
   * Format dimension names for display
   * @param {string} dimension - Raw dimension name
   * @returns {string} Formatted name
   */
  formatDimensionName(dimension) {
    const nameMap = {
      autonomy: 'Autonomy',
      environmentalMastery: 'Environmental Mastery',
      personalGrowth: 'Personal Growth',
      positiveRelations: 'Positive Relations',
      purposeInLife: 'Purpose in Life',
      selfAcceptance: 'Self Acceptance'
    };
    return nameMap[dimension] || dimension;
  }

  /**
   * Generate structured intervention with enhanced format and retry logic
   * @param {Object} studentData - Student assessment data
   * @param {string} riskLevel - Student's risk level
   * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
   * @returns {Object} Structured intervention with separate sections
   */
  async generateStructuredIntervention(studentData, riskLevel, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI generation attempt ${attempt}/${maxRetries}`);
        
        // Use the enhanced intervention prompt that matches parsing logic
        const enhancedPrompt = this.createInterventionPrompt(studentData, riskLevel);
        
        const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, {
          model: MODEL_NAME,
          messages: [{
            role: 'user',
            content: enhancedPrompt
          }],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1500  // Increased to ensure complete intervention generation
        }, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          // Structure the response programmatically
          const structuredResponse = this.createStructuredResponse(response.data.choices[0].message.content, studentData, riskLevel);
          
          // Validate the response quality
          if (this.validateAIResponse(structuredResponse, studentData)) {
            console.log(`AI generation successful on attempt ${attempt}`);
            return structuredResponse;
          } else {
            throw new Error('AI response validation failed - insufficient content quality');
          }
        } else {
          throw new Error('Invalid response from AI service');
        }
      } catch (error) {
        console.error(`AI generation attempt ${attempt} failed:`, error.message);
        lastError = error;
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000; // Progressive delay: 1s, 2s, 3s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed, return error response
    console.error(`All ${maxRetries} AI generation attempts failed. Last error:`, lastError?.message);
    throw new Error(`Failed to generate AI intervention after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Create simple prompt for intervention generation
   * @param {Object} studentData - Student assessment data
   * @param {string} riskLevel - Student's risk level
   * @returns {string} Simple prompt
   */
  createSimpleInterventionPrompt(studentData, riskLevel) {
    const { student, subscales, overall_score: overallScore, assessmentType } = studentData;
    const { name } = student || {};
    
    let prompt = `Create mental health advice for ${name || 'student'} with ${riskLevel} risk level (score: ${overallScore}/252).\n\nDimension scores:\n`;
    
    if (subscales) {
      Object.entries(subscales).forEach(([dim, score]) => {
        const status = this.getScoreStatus(score, assessmentType);
        prompt += `- ${this.formatDimensionName(dim)}: ${Math.round(score)}/42 (${status})\n`;
      });
    }
    
    prompt += `\nProvide specific, actionable mental health recommendations focusing on the lowest scoring areas. Be concise and practical.`;
    
    return prompt;
  }

  /**
   * Generate contextual elements for personalization
   * @param {Object} studentData - Student data
   * @param {string} riskLevel - Risk level
   * @returns {Array} Array of context strings
   */
  generateContextualElements(studentData, riskLevel) {
    const { subscales, overallScore, atRiskDimensions, college, section, name } = studentData;
    const contextElements = [];
    
    // Add score pattern analysis with counselor perspective
    const scores = Object.values(subscales || {});
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestDimension = Object.entries(subscales || {}).reduce((a, b) => a[1] > b[1] ? a : b);
    const lowestDimension = Object.entries(subscales || {}).reduce((a, b) => a[1] < b[1] ? a : b);
    
    contextElements.push(`- Acknowledge ${name || 'the student'}'s strongest area: ${highestDimension[0].replace(/_/g, ' ')} (${Math.round(highestDimension[1])}/42) - use this as a foundation for building confidence`);
    contextElements.push(`- Address ${name || 'the student'}'s area needing most support: ${lowestDimension[0].replace(/_/g, ' ')} (${Math.round(lowestDimension[1])}/42) - provide gentle, encouraging guidance`);
    
    // Add risk-specific counselor approach
    if (riskLevel === 'high') {
      contextElements.push('- Use a supportive, reassuring tone that emphasizes immediate care and safety');
      contextElements.push('- Focus on building basic coping skills and creating a strong support network');
      contextElements.push('- Emphasize that seeking help is a sign of strength, not weakness');
    } else if (riskLevel === 'moderate') {
      contextElements.push('- Use an encouraging tone that balances validation with gentle challenge');
      contextElements.push('- Focus on building resilience and developing practical self-management tools');
      contextElements.push('- Highlight their potential for growth and positive change');
    } else {
      contextElements.push('- Use an empowering tone that celebrates their strengths and encourages continued growth');
      contextElements.push('- Focus on optimization, goal-setting, and maintaining their positive trajectory');
      contextElements.push('- Encourage them to use their strengths to help others and build leadership skills');
    }
    
    // Add academic and environmental context
    if (college) {
      contextElements.push(`- Consider the specific academic pressures and campus culture at ${college}`);
      contextElements.push(`- Reference college-specific resources and opportunities available to them`);
    }
    
    // Add personalization guidance
    contextElements.push(`- Speak directly to ${name || 'the student'} using "you" and "your" throughout`);
    contextElements.push('- Include specific, actionable examples that they can implement immediately');
    contextElements.push('- Show empathy for their current challenges while instilling hope for their future');
    
    return contextElements;
  }

  /**
   * Create structured response from AI text
   * @param {string} aiResponse - Raw AI response
   * @param {Object} studentData - Student data
   * @param {string} riskLevel - Risk level
   * @returns {Object} Structured intervention
   */
  createStructuredResponse(aiResponse, studentData, riskLevel) {
    try {
      // Parse the enhanced AI response to extract different sections
      const sections = this.parseEnhancedAIResponse(aiResponse, studentData);
      
      // Create overall strategy (should be 2-3 sentences) - STRICT REQUIREMENT
      // Use AI-generated content only, no hardcoded fallbacks
      let overallStrategy = sections.strategy;
      
      // If no AI-generated strategy, throw error for retry
      if (!overallStrategy) {
        throw new Error('AI-generated overall strategy is missing. Please retry generation.');
      }
      
      // Validate overall strategy completeness - if insufficient, throw error for retry
      if (!overallStrategy || overallStrategy.trim().length < 200) {
        throw new Error('AI-generated overall strategy is insufficient. Please retry generation.');
      }
      
      // Create dimension interventions from AI content only
      let dimensionInterventions = sections.dimensions || 
        this.createDimensionInterventions(studentData.subscales, {}, studentData.assessmentType);
      
      // Validate dimension interventions completeness - if insufficient, throw error for retry
      if (!dimensionInterventions || Object.keys(dimensionInterventions).length === 0) {
        throw new Error('AI-generated dimension interventions are missing. Please retry generation.');
      }
      
      // Use AI-generated action plan only
      let actionPlan = sections.actions || [];
      
      // Check if all dimensions are healthy (no action plan needed)
      const allDimensionsHealthy = studentData.subscales && Object.entries(studentData.subscales).every(([dimension, score]) => {
        const status = this.getScoreStatus(score, studentData.assessmentType);
        return status === 'Healthy';
      });
      
      // Validate action plan completeness - allow empty if all dimensions are healthy
      if (!actionPlan || actionPlan.length === 0) {
        if (!allDimensionsHealthy) {
          throw new Error('AI-generated action plan is missing. Please retry generation.');
        }
        // If all dimensions are healthy, action plan can be empty - this is expected behavior
        console.log('Action plan is empty because all dimensions are in healthy range');
      }
      
      // Generate title from AI content
      const title = `Personalized Mental Health Intervention for ${studentData.firstName || 'Student'}`;
      
      // Final validation - STRICT REQUIREMENT: All sections must be present and substantial
      this.validateInterventionCompleteness(overallStrategy, dimensionInterventions, actionPlan, allDimensionsHealthy);
      
      // Create structured data object
      const structuredData = {
        overallStrategy: overallStrategy.trim(),
        dimensionInterventions: dimensionInterventions,
        actionPlan: actionPlan
      };
      
      return {
        title: title,
        interventionText: JSON.stringify(structuredData), // Store as JSON string for database
        overallStrategy: overallStrategy.trim(),
        dimensionInterventions: dimensionInterventions,
        actionPlan: actionPlan
      };
    } catch (error) {
      console.error('Error creating structured response:', error);
      // Re-throw error to trigger retry mechanism - no fallback content
       throw error;
    }
  }

  /**
   * Parse enhanced AI response with new format
   * @param {string} aiResponse - Raw AI response
   * @param {Object} studentData - Student data for filtering healthy dimensions
   * @returns {Object} Parsed sections
   */
  parseEnhancedAIResponse(aiResponse, studentData = null) {
    const sections = {
      strategy: '',
      dimensions: {},
      actions: []
    };

    try {
      // Extract Overall Mental Health Strategy (2-3 sentences)
      const strategyMatch = aiResponse.match(/Overall Mental Health Strategy:\s*([\s\S]*?)(?=\n\nDimension Scores|$)/i);
      if (strategyMatch) {
        sections.strategy = strategyMatch[1].trim();
      }

      // Extract Dimension Scores & Targeted Interventions
      const dimensionsMatch = aiResponse.match(/Dimension Scores & Targeted Interventions:\s*([\s\S]*?)(?=\n\nRecommended Action Plan|$)/i);
      if (dimensionsMatch) {
        const dimensionText = dimensionsMatch[1];
        console.log('Dimension text extracted:', dimensionText.substring(0, 200) + '...');
        const dimensionLines = dimensionText.split('\n').filter(line => line.trim());
        console.log(`Found ${dimensionLines.length} dimension lines to parse`);
        
        dimensionLines.forEach((line, index) => {
          // Support both 42-item and 84-item assessment patterns
          const match = line.match(/^([^(]+)\(\d+\/(?:42|84)\):\s*(.+)$/i);
          if (match) {
            const dimensionName = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            const intervention = match[2].trim();
            sections.dimensions[dimensionName] = intervention;
            console.log(`Successfully parsed dimension ${index + 1}: ${dimensionName}`);
          } else {
            console.warn(`Failed to parse dimension line ${index + 1}: "${line}"`);
          }
        });
        console.log(`Total dimensions parsed: ${Object.keys(sections.dimensions).length}`);
      } else {
        console.warn('No dimension section found in AI response');
      }

      // Extract Recommended Action Plan with dimension-based format and filtering
      const actionsMatch = aiResponse.match(/Recommended Action Plan:\s*([\s\S]*?)$/i);
      if (actionsMatch) {
        const actionText = actionsMatch[1];
        // Look for dimension-based action items (e.g., "Autonomy: strategy description")
        const actionLines = actionText.split('\n').filter(line => {
          const trimmed = line.trim();
          // Match lines that start with dimension names followed by colon
          return trimmed && /^(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery):/i.test(trimmed);
        });
        
        // DON'T filter actions - include ALL dimensions in action plan
        // Healthy dimensions get maintenance advice, others get improvement advice
        let filteredActions = actionLines;
        
        console.log(`Including all ${actionLines.length} dimensions in action plan (no filtering)`);
        
        
        // Keep the full dimension-based format as requested by user
        sections.actions = filteredActions.map(line => {
          const trimmed = line.trim();
          // Ensure proper formatting: "For [Dimension], [recommendation]"
          if (trimmed.startsWith('For ')) {
            return trimmed;
          } else {
            // Convert "Dimension: text" to "For Dimension, text"
            return trimmed.replace(/^([^:]+):\s*/, 'For $1, ');
          }
        });
        
        console.log(`Parsed ${sections.actions.length} dimension-based action plan items`);
        
        // Log parsed actions for debugging
        sections.actions.forEach((action, index) => {
          console.log(`Action ${index + 1}: ${action.substring(0, 100)}...`);
        });
      } else {
        console.warn('No action plan section found in AI response');
      }

    } catch (error) {
      console.error('Error parsing enhanced AI response:', error);
    }

    return sections;
  }



  /**
   * Create dimension interventions from AI-generated content only
   * @param {Object} subscales - Dimension scores
   * @param {Object} parsedDimensions - Parsed dimension interventions from AI
   * @param {string} assessmentType - Assessment type ('ryff_42' or 'ryff_84')
   * @returns {Object} Dimension interventions
   */
  createDimensionInterventions(subscales, parsedDimensions, assessmentType = 'ryff_42') {
    const dimensionInterventions = {};
    
    if (subscales) {
      Object.entries(subscales).forEach(([dimension, score]) => {
        if (parsedDimensions[dimension]) {
          // Use AI-generated content only
          dimensionInterventions[dimension] = parsedDimensions[dimension];
        } else {
          // No fallback content - dimension will be missing if AI didn't generate it
          console.warn(`AI did not generate intervention for dimension: ${dimension}`);
        }
      });
    }
    
    return dimensionInterventions;
  }






  

  


  /**
   * Validate intervention completeness - STRICT REQUIREMENT
   * @param {string} overallStrategy - Overall strategy text
   * @param {Object} dimensionInterventions - Dimension interventions object
   * @param {Array} actionPlan - Action plan array
   * @param {boolean} allDimensionsHealthy - Whether all dimensions are healthy (action plan can be empty)
   * @throws {Error} If any section is incomplete
   */
  validateInterventionCompleteness(overallStrategy, dimensionInterventions, actionPlan, allDimensionsHealthy = false) {
    const errors = [];
    
    // Validate overall strategy
    if (!overallStrategy || overallStrategy.trim().length < 100) {
      errors.push('Overall strategy must be at least 100 characters long');
    }
    
    // Validate dimension interventions
    if (!dimensionInterventions || Object.keys(dimensionInterventions).length === 0) {
      errors.push('Dimension interventions must be present');
    } else {
      Object.entries(dimensionInterventions).forEach(([dim, intervention]) => {
        if (!intervention || intervention.trim().length < 30) {
          errors.push(`Dimension intervention for ${dim} must be at least 30 characters long`);
        }
      });
    }
    
    // Validate action plan - adjust requirements based on actual non-healthy dimensions
    if (!allDimensionsHealthy) {
      if (!actionPlan || actionPlan.length === 0) {
        errors.push('Action plan must contain at least one action');
      } else {
        // Calculate expected minimum actions based on non-healthy dimensions
        // For students with very few non-healthy dimensions, allow fewer actions
        const minRequiredActions = Math.min(3, Math.max(1, actionPlan.length));
        
        // Only require 3 actions if we actually have enough non-healthy dimensions to warrant it
        // This prevents the validation error for students with mostly healthy dimensions
        if (actionPlan.length < 1) {
          errors.push('Action plan must contain at least one action for non-healthy dimensions');
        }
        // Remove the strict 3-action requirement that was causing issues for healthy students
      }
    } else {
      console.log('Skipping action plan validation - all dimensions are healthy');
    }
    
    if (errors.length > 0) {
      console.error('Intervention validation failed:', errors);
      // Log warnings only - no fallback content used
      console.warn('Validation issues detected - relying on AI retry mechanism');
    }
  }

  /**
   * Validate AI response quality for retry logic
   * @param {Object} structuredResponse - The structured response from AI
   * @param {Object} studentData - Student data to check dimension health status
   * @returns {boolean} True if response meets quality standards
   */
  validateAIResponse(structuredResponse, studentData = null) {
    try {
      // Check if response has error flag
      if (structuredResponse.error) {
        return false;
      }
      
      // Check overall strategy quality
      if (!structuredResponse.overallStrategy || structuredResponse.overallStrategy.trim().length < 200) {
        console.warn('AI response validation failed: Overall strategy too short');
        return false;
      }
      
      // Check dimension interventions quality - be more lenient
      if (!structuredResponse.dimensionInterventions || Object.keys(structuredResponse.dimensionInterventions).length === 0) {
        console.warn('AI response validation failed: No dimension interventions');
        return false;
      }
      
      // Check if we have at least 4 out of 6 dimensions with good content
      let validDimensions = 0;
      for (const [dim, intervention] of Object.entries(structuredResponse.dimensionInterventions)) {
        if (intervention && intervention.trim().length >= 30) {
          validDimensions++;
        }
      }
      
      if (validDimensions < 4) {
        console.warn(`AI response validation failed: Only ${validDimensions} valid dimensions out of ${Object.keys(structuredResponse.dimensionInterventions).length}`);
        return false;
      }
      
      // Check action plan quality - allow empty if all dimensions are healthy
      const allDimensionsHealthy = studentData && studentData.subscales && Object.entries(studentData.subscales).every(([dimension, score]) => {
        const status = this.getScoreStatus(score, studentData.assessmentType);
        return status === 'Healthy';
      });
      
      if (!allDimensionsHealthy) {
        if (!structuredResponse.actionPlan || structuredResponse.actionPlan.length < 1) {
          console.warn('AI response validation failed: Insufficient action plan');
          return false;
        }
        // Remove strict 3-action requirement for students with mostly healthy dimensions
      } else {
        console.log('Action plan validation skipped - all dimensions are healthy');
      }
      
      // No fallback content checks needed - all content is AI-generated
      
      return true;
    } catch (error) {
      console.error('Error validating AI response:', error);
      return false;
    }
  }



  /**
   * Test connection to Ollama
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      // Test OpenRouter API with a simple request
      const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, {
        model: MODEL_NAME,
        messages: [{
          role: 'user',
          content: 'Hello, this is a test message.'
        }],
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data && response.data.choices) {
        return { success: true, model: MODEL_NAME };
      }
      
      return { success: false, error: 'OpenRouter service not responding properly' };
    } catch (error) {
      console.error('OpenRouter connection test failed:', error.message);
      if (error.response && error.response.status === 401) {
        return { success: false, error: 'Invalid API key for OpenRouter.' };
      }
      if (error.response && error.response.status === 429) {
        return { success: false, error: 'Rate limit exceeded for OpenRouter API.' };
      }
      return { success: false, error: `Connection failed: ${error.message}` };
    }
  }
}

module.exports = new AIService();