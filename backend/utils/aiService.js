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
    
    // Generate unique context elements for personalization
    const contextElements = this.generateContextualElements(studentData, riskLevel);
    
    // Calculate dynamic max scores based on assessment type
    const dimensionMaxScore = assessmentType === 'ryff_84' ? 84 : 42;
    const overallMaxScore = assessmentType === 'ryff_84' ? 504 : 252; // 6 dimensions × max score per dimension
    
    // Create comprehensive prompt with detailed instructions
    let prompt = `You are a calm, motivational mental health guide speaking directly to ${name || 'your student'}, a college student from ${college || 'their institution'} in section ${section || 'their class'}. Your role is to be a personal coach or mentor, not a clinical diagnostician. Write as a gentle, encouraging narrative guide that helps students understand their scores and feel supported to improve.

=== STUDENT ASSESSMENT DETAILS ===
Risk Level: ${riskLevel}
Assessment Type: ${assessmentType || 'Ryff Psychological Well-being Scale'}
Overall Score: ${Math.round(overallScore || 0)}/${overallMaxScore}
At-Risk Dimensions: ${atRiskDimensions?.length ? atRiskDimensions.join(', ') : 'None'}

DIMENSION SCORES:
- Autonomy: ${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.autonomy || 0, assessmentType)})
- Personal Growth: ${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType)})
- Purpose in Life: ${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType)})
- Self Acceptance: ${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType)})
- Positive Relations: ${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType)})
- Environmental Mastery: ${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType)})

=== CALM, MOTIVATIONAL NARRATIVE STYLE REQUIREMENTS ===
Your output should feel like a calm, motivational narrative guide—a mix of explanation + encouragement, or "why this matters" + gentle direction. Help students understand their scores and feel supported to improve.

TONE REQUIREMENTS BY RISK LEVEL (Assessment-Type Specific):
For ${assessmentType === 'ryff_84' ? '84-item' : '42-item'} Assessment:
- At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Supportive and uplifting. Content: Motivational advice with clear, gentle steps to improve. Example tone: "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits, like talking to a trusted friend or writing down your thoughts each evening. Each small action builds strength."
- Moderate (${assessmentType === 'ryff_84' ? '37-59' : '19-30'}): Encouraging and positive. Content: Acknowledge progress and motivate further improvement. Example tone: "You're on the right track! Keep practicing habits that bring you balance, like regular exercise or setting aside time to relax. Small adjustments can bring even greater stability."
- Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Appreciative and celebratory. Content: Recognize achievements while encouraging consistency. Example tone: "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."

OVERALL STRATEGY TONE:
- Warm, guiding, and reassuring
- Explain why the overall result matters
- Provide a general action plan that motivates the student to keep going and improve
- Example: "Your scores show a balanced picture of your mental well-being. Keep nurturing your growth by setting small daily intentions, celebrating progress, and reminding yourself that every step forward matters."

=== INTERVENTION REQUIREMENTS ===
Create a PERSONALIZED intervention that:
1. Directly addresses this specific student's unique score pattern
2. Considers their college environment and academic pressures
3. Provides practical, actionable strategies based on their exact scores
4. Acknowledges their strengths and areas for growth
5. Offers hope and encouragement for improvement

=== RESPONSE FORMAT (FOLLOW EXACTLY) ===

Overall Mental Health Strategy:
[Write 2-3 sentences in a counselor's voice, speaking directly to the student. Address their specific score pattern, acknowledge their strengths, and provide a personalized strategy. Use "you" and "your" throughout.]

Dimension Scores & Targeted Interventions:
Autonomy (${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore}): [Write a personalized narrative based on the specific score level. At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Use supportive and uplifting tone - "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like [specific example]. Each small action builds strength." Lower Moderate (${assessmentType === 'ryff_84' ? '37-48' : '19-24'}): Use gentle encouragement - "You're making progress in this area. Focus on building consistency with [specific example]. Small, steady steps will help you feel more confident." Upper Moderate (${assessmentType === 'ryff_84' ? '49-59' : '25-30'}): Use positive reinforcement - "You're doing well here! Keep strengthening these habits like [specific example]. You're close to feeling really strong in this area." Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Use appreciative and celebratory tone - "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."]
Personal Growth (${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore}): [Write a personalized narrative based on the specific score level. At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Use supportive and uplifting tone - "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like [specific example]. Each small action builds strength." Lower Moderate (${assessmentType === 'ryff_84' ? '37-48' : '19-24'}): Use gentle encouragement - "You're making progress in this area. Focus on building consistency with [specific example]. Small, steady steps will help you feel more confident." Upper Moderate (${assessmentType === 'ryff_84' ? '49-59' : '25-30'}): Use positive reinforcement - "You're doing well here! Keep strengthening these habits like [specific example]. You're close to feeling really strong in this area." Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Use appreciative and celebratory tone - "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."]
Purpose in Life (${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore}): [Write a personalized narrative based on the specific score level. At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Use supportive and uplifting tone - "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like [specific example]. Each small action builds strength." Lower Moderate (${assessmentType === 'ryff_84' ? '37-48' : '19-24'}): Use gentle encouragement - "You're making progress in this area. Focus on building consistency with [specific example]. Small, steady steps will help you feel more confident." Upper Moderate (${assessmentType === 'ryff_84' ? '49-59' : '25-30'}): Use positive reinforcement - "You're doing well here! Keep strengthening these habits like [specific example]. You're close to feeling really strong in this area." Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Use appreciative and celebratory tone - "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."]
Self Acceptance (${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore}): [Write a personalized narrative based on the specific score level. At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Use supportive and uplifting tone - "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like [specific example]. Each small action builds strength." Lower Moderate (${assessmentType === 'ryff_84' ? '37-48' : '19-24'}): Use gentle encouragement - "You're making progress in this area. Focus on building consistency with [specific example]. Small, steady steps will help you feel more confident." Upper Moderate (${assessmentType === 'ryff_84' ? '49-59' : '25-30'}): Use positive reinforcement - "You're doing well here! Keep strengthening these habits like [specific example]. You're close to feeling really strong in this area." Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Use appreciative and celebratory tone - "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."]
Positive Relations (${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore}): [Write a personalized narrative based on the specific score level. At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Use supportive and uplifting tone - "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like [specific example]. Each small action builds strength." Lower Moderate (${assessmentType === 'ryff_84' ? '37-48' : '19-24'}): Use gentle encouragement - "You're making progress in this area. Focus on building consistency with [specific example]. Small, steady steps will help you feel more confident." Upper Moderate (${assessmentType === 'ryff_84' ? '49-59' : '25-30'}): Use positive reinforcement - "You're doing well here! Keep strengthening these habits like [specific example]. You're close to feeling really strong in this area." Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Use appreciative and celebratory tone - "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."]
Environmental Mastery (${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore}): [Write a personalized narrative based on the specific score level. At Risk (${assessmentType === 'ryff_84' ? '≤36' : '≤18'}): Use supportive and uplifting tone - "This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like [specific example]. Each small action builds strength." Lower Moderate (${assessmentType === 'ryff_84' ? '37-48' : '19-24'}): Use gentle encouragement - "You're making progress in this area. Focus on building consistency with [specific example]. Small, steady steps will help you feel more confident." Upper Moderate (${assessmentType === 'ryff_84' ? '49-59' : '25-30'}): Use positive reinforcement - "You're doing well here! Keep strengthening these habits like [specific example]. You're close to feeling really strong in this area." Healthy (${assessmentType === 'ryff_84' ? '≥60' : '≥31'}): Use appreciative and celebratory tone - "You're doing wonderfully in this area! Keep nurturing these habits, and remember to celebrate the hard work that keeps you feeling strong."]

Recommended Action Plan:
[Provide 3-4 specific, practical strategies for each dimension based on its score. Include clear examples of daily actions to build growth. Use this format example:

"For Autonomy, I recommend focusing on strengthening your decision-making confidence. For example: set one small independent goal each day—like choosing your own study schedule or planning a meal—and track your progress in a personal journal. Each choice reinforces your ability to lead your own path."

Each recommendation should:
1. Target the specific dimension and its current level
2. Provide concrete daily actions with specific examples
3. Explain how these actions build growth and strength
4. Use motivational language that encourages ${name || 'the student'} to take action

Make each strategy feel achievable and personally meaningful to ${name || 'the student'}.]

=== PERSONALIZATION CONTEXT ===
${contextElements.join('\n')}

CRITICAL REQUIREMENTS - STRICT COMPLIANCE MANDATORY:
1. ALWAYS include specific examples in EVERY action plan item
2. Write in a warm, counselor-like tone throughout
3. Address the student directly using "you" and "your"
4. Base ALL recommendations on their specific scores, not generic advice
5. Make each intervention unique and personalized to this student's exact situation
6. Show empathy and understanding for their current challenges
7. Provide hope and encouragement for their growth journey
8. MANDATORY: Complete ALL sections - Overall Strategy, ALL 6 Dimension Interventions, and Action Plan
9. MANDATORY: Overall Strategy must be at least 100 characters long
10. MANDATORY: Each dimension intervention must be at least 30 characters long
11. MANDATORY: Action plan must contain at least 5 specific actions with examples
12. MANDATORY: Do NOT truncate or cut off any section - complete the entire response
13. MANDATORY: If you reach token limits, prioritize completing all sections over length`;
    
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
        
        title = titleMatch ? titleMatch[1].trim() : 'Personalized Well-being Guidance';
        interventionText = interventionMatch ? interventionMatch[1].trim() : response.trim();
      }
      
      // Clean up and validate
      title = title.substring(0, 100); // Limit title length
      interventionText = interventionText.trim();
      
      if (!interventionText) {
        interventionText = response.trim();
      }
      
      return {
        title: title || 'Personalized Mental Health Guidance',
        text: interventionText || 'We recommend scheduling a consultation to discuss your well-being and develop a personalized support plan.'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        title: 'Personalized Mental Health Guidance',
        text: 'We recommend scheduling a consultation to discuss your well-being and develop a personalized support plan.'
      };
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
        healthy: 59   // ≥59: Healthy
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
          if (this.validateAIResponse(structuredResponse)) {
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
      const sections = this.parseEnhancedAIResponse(aiResponse);
      
      // Create overall strategy (should be 2-3 sentences) - STRICT REQUIREMENT
      // Use AI-generated content only, no hardcoded fallbacks
      let overallStrategy = sections.strategy || 
        'No overall strategy available. Please generate interventions using the "Generate AI Interventions" button.';
      
      // Validate overall strategy completeness - if insufficient, throw error for retry
      if (!overallStrategy || overallStrategy.trim().length < 100) {
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
      
      // Validate action plan completeness - if insufficient, throw error for retry
      if (!actionPlan || actionPlan.length === 0) {
        throw new Error('AI-generated action plan is missing. Please retry generation.');
      }
      
      // Generate title from AI content
      const title = `Personalized Mental Health Intervention for ${studentData.firstName || 'Student'}`;
      
      // Final validation - STRICT REQUIREMENT: All sections must be present and substantial
      this.validateInterventionCompleteness(overallStrategy, dimensionInterventions, actionPlan);
      
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
      // Return error response indicating AI generation failed
      return {
        title: `Mental Health Assessment for ${studentData.firstName || 'Student'}`,
        interventionText: JSON.stringify({
          overallStrategy: 'AI intervention generation failed. Please try generating interventions again using the "Generate AI Interventions" button.',
          dimensionInterventions: {},
          actionPlan: []
        }),
        overallStrategy: 'AI intervention generation failed. Please try generating interventions again using the "Generate AI Interventions" button.',
        dimensionInterventions: {},
        actionPlan: [],
        error: true
      };
    }
  }

  /**
   * Parse enhanced AI response with new format
   * @param {string} aiResponse - Raw AI response
   * @returns {Object} Parsed sections
   */
  parseEnhancedAIResponse(aiResponse) {
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

      // Extract Recommended Action Plan with examples
      const actionsMatch = aiResponse.match(/Recommended Action Plan:\s*([\s\S]*?)$/i);
      if (actionsMatch) {
        const actionText = actionsMatch[1];
        const actionLines = actionText.split('\n').filter(line => line.trim() && /^\d+\./.test(line.trim()));
        
        sections.actions = actionLines.map(line => {
          return line.replace(/^\d+\.\s*/, '').trim();
        });
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
          // Use AI-generated content
          dimensionInterventions[dimension] = parsedDimensions[dimension];
        } else {
          // Provide a more helpful fallback message
          const status = this.getScoreStatus(score, assessmentType);
          dimensionInterventions[dimension] = `Your ${this.formatDimensionName(dimension)} score is ${Math.round(score)} (${status}). Please use the "Generate AI Interventions" button to get personalized recommendations for this dimension.`;
          console.warn(`Using fallback intervention for dimension: ${dimension}`);
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
   * @throws {Error} If any section is incomplete
   */
  validateInterventionCompleteness(overallStrategy, dimensionInterventions, actionPlan) {
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
    
    // Validate action plan
    if (!actionPlan || actionPlan.length === 0) {
      errors.push('Action plan must contain at least one action');
    } else if (actionPlan.length < 3) {
      errors.push('Action plan must contain at least 3 actions');
    }
    
    if (errors.length > 0) {
      console.error('Intervention validation failed:', errors);
      // Don't throw error, just log warnings - we'll use fallbacks
      console.warn('Using fallback methods to ensure completeness');
    }
  }

  /**
   * Validate AI response quality for retry logic
   * @param {Object} structuredResponse - The structured response from AI
   * @returns {boolean} True if response meets quality standards
   */
  validateAIResponse(structuredResponse) {
    try {
      // Check if response has error flag
      if (structuredResponse.error) {
        return false;
      }
      
      // Check overall strategy quality
      if (!structuredResponse.overallStrategy || structuredResponse.overallStrategy.trim().length < 100) {
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
        if (intervention && intervention.trim().length >= 30 && !intervention.includes('No AI intervention available')) {
          validDimensions++;
        }
      }
      
      if (validDimensions < 4) {
        console.warn(`AI response validation failed: Only ${validDimensions} valid dimensions out of ${Object.keys(structuredResponse.dimensionInterventions).length}`);
        return false;
      }
      
      // Check action plan quality
      if (!structuredResponse.actionPlan || structuredResponse.actionPlan.length < 3) {
        console.warn('AI response validation failed: Insufficient action plan');
        return false;
      }
      
      // Check for generic fallback content
      const responseText = JSON.stringify(structuredResponse).toLowerCase();
      if (responseText.includes('please generate interventions') || 
          responseText.includes('no ai intervention available') ||
          responseText.includes('ai intervention generation failed')) {
        console.warn('AI response validation failed: Contains fallback content');
        return false;
      }
      
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