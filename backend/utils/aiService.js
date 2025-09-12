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
    
    // Create comprehensive prompt with detailed instructions
    let prompt = `You are a caring, professional mental health counselor speaking directly to ${name || 'your student'}, a college student from ${college || 'their institution'} in section ${section || 'their class'}. Write in a warm, supportive, and encouraging tone as if you're having a personal conversation with them.

=== STUDENT ASSESSMENT DETAILS ===
Risk Level: ${riskLevel}
Assessment Type: ${assessmentType || 'Ryff Psychological Well-being Scale'}
Overall Score: ${Math.round(overallScore || 0)}/252
At-Risk Dimensions: ${atRiskDimensions?.length ? atRiskDimensions.join(', ') : 'None'}

DIMENSION SCORES:
- Autonomy: ${Math.round(subscales?.autonomy || 0)}/42 (${this.getScoreStatus(subscales?.autonomy || 0)})
- Personal Growth: ${Math.round(subscales?.personal_growth || 0)}/42 (${this.getScoreStatus(subscales?.personal_growth || 0)})
- Purpose in Life: ${Math.round(subscales?.purpose_in_life || 0)}/42 (${this.getScoreStatus(subscales?.purpose_in_life || 0)})
- Self Acceptance: ${Math.round(subscales?.self_acceptance || 0)}/42 (${this.getScoreStatus(subscales?.self_acceptance || 0)})
- Positive Relations: ${Math.round(subscales?.positive_relations || 0)}/42 (${this.getScoreStatus(subscales?.positive_relations || 0)})
- Environmental Mastery: ${Math.round(subscales?.environmental_mastery || 0)}/42 (${this.getScoreStatus(subscales?.environmental_mastery || 0)})

=== COUNSELOR TONE REQUIREMENTS ===
- Write as if you're speaking directly to the student with empathy and understanding
- Use "you" and "your" to make it personal
- Be encouraging and supportive, acknowledging their strengths
- Show genuine care and concern for their well-being
- Provide hope and confidence in their ability to grow
- Use warm, professional language that builds trust

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
Autonomy (${Math.round(subscales?.autonomy || 0)}/42): [1-2 sentences speaking directly to the student about this specific score, what it means for them, and personalized guidance based on whether it's at-risk, moderate, or healthy.]
Personal Growth (${Math.round(subscales?.personal_growth || 0)}/42): [1-2 sentences speaking directly to the student about this specific score, what it means for them, and personalized guidance based on whether it's at-risk, moderate, or healthy.]
Purpose in Life (${Math.round(subscales?.purpose_in_life || 0)}/42): [1-2 sentences speaking directly to the student about this specific score, what it means for them, and personalized guidance based on whether it's at-risk, moderate, or healthy.]
Self Acceptance (${Math.round(subscales?.self_acceptance || 0)}/42): [1-2 sentences speaking directly to the student about this specific score, what it means for them, and personalized guidance based on whether it's at-risk, moderate, or healthy.]
Positive Relations (${Math.round(subscales?.positive_relations || 0)}/42): [1-2 sentences speaking directly to the student about this specific score, what it means for them, and personalized guidance based on whether it's at-risk, moderate, or healthy.]
Environmental Mastery (${Math.round(subscales?.environmental_mastery || 0)}/42): [1-2 sentences speaking directly to the student about this specific score, what it means for them, and personalized guidance based on whether it's at-risk, moderate, or healthy.]

Recommended Action Plan:
- [Specific action written in counselor's voice with detailed example: "I recommend you [action description]. For example: [Concrete, specific example of how to implement this, including time, place, or method]"]
- [Specific action written in counselor's voice with detailed example: "I suggest you [action description]. For example: [Concrete, specific example of how to implement this, including time, place, or method]"]
- [Specific action written in counselor's voice with detailed example: "Consider [action description]. For example: [Concrete, specific example of how to implement this, including time, place, or method]"]
- [Specific action written in counselor's voice with detailed example: "Try [action description]. For example: [Concrete, specific example of how to implement this, including time, place, or method]"]
- [Specific action written in counselor's voice with detailed example: "I encourage you to [action description]. For example: [Concrete, specific example of how to implement this, including time, place, or method]"]

=== PERSONALIZATION CONTEXT ===
${contextElements.join('\n')}

CRITICAL REQUIREMENTS:
1. ALWAYS include specific examples in EVERY action plan item
2. Write in a warm, counselor-like tone throughout
3. Address the student directly using "you" and "your"
4. Base ALL recommendations on their specific scores, not generic advice
5. Make each intervention unique and personalized to this student's exact situation
6. Show empathy and understanding for their current challenges
7. Provide hope and encouragement for their growth journey`;
    
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
   * @returns {string} Status description
   */
  getScoreStatus(score) {
    if (score <= 21) return 'At Risk';
    if (score <= 31.5) return 'Moderate';
    return 'Healthy';
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
   * Generate structured intervention with specific sections
   * @param {Object} studentData - Student assessment data
   * @param {string} riskLevel - Student's risk level
   * @returns {Object} Structured intervention with separate sections
   */
  async generateStructuredIntervention(studentData, riskLevel) {
    try {
      // Generate a simple intervention text first
      const simplePrompt = this.createSimpleInterventionPrompt(studentData, riskLevel);
      
      const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, {
        model: MODEL_NAME,
        messages: [{
          role: 'user',
          content: simplePrompt
        }],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        // Structure the response programmatically
        return this.createStructuredResponse(response.data.choices[0].message.content, studentData, riskLevel);
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Error generating structured intervention:', error);
      throw new Error(`Failed to generate structured intervention: ${error.message}`);
    }
  }

  /**
   * Create simple prompt for intervention generation
   * @param {Object} studentData - Student assessment data
   * @param {string} riskLevel - Student's risk level
   * @returns {string} Simple prompt
   */
  createSimpleInterventionPrompt(studentData, riskLevel) {
    const { student, subscales, overall_score: overallScore } = studentData;
    const { name } = student || {};
    
    let prompt = `Create mental health advice for ${name || 'student'} with ${riskLevel} risk level (score: ${overallScore}/252).\n\nDimension scores:\n`;
    
    if (subscales) {
      Object.entries(subscales).forEach(([dim, score]) => {
        const status = this.getScoreStatus(score);
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
      
      // Create overall strategy (should be 2-3 sentences)
      const overallStrategy = sections.strategy || 
        this.generateFallbackStrategy(studentData, riskLevel);
      
      // Create dimension interventions (1-2 sentences each)
      const dimensionInterventions = sections.dimensions || 
        this.createDimensionInterventions(studentData.subscales, {});
      
      // Generate action plan with examples
      const actionPlan = sections.actions || 
        this.generateEnhancedActionPlan(riskLevel, studentData.atRiskDimensions, studentData);
      
      // Generate title
      const title = this.generateInterventionTitle(overallStrategy, riskLevel);
      
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
      // Fallback to enhanced structure
      return this.createEnhancedFallbackResponse(studentData, riskLevel);
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
        const dimensionLines = dimensionText.split('\n').filter(line => line.trim());
        
        dimensionLines.forEach(line => {
          const match = line.match(/^([^(]+)\(\d+\/42\):\s*(.+)$/i);
          if (match) {
            const dimensionName = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            const intervention = match[2].trim();
            sections.dimensions[dimensionName] = intervention;
          }
        });
      }

      // Extract Recommended Action Plan with examples
      const actionsMatch = aiResponse.match(/Recommended Action Plan:\s*([\s\S]*?)$/i);
      if (actionsMatch) {
        const actionText = actionsMatch[1];
        const actionLines = actionText.split('\n').filter(line => line.trim() && line.startsWith('-'));
        
        sections.actions = actionLines.map(line => {
          return line.replace(/^-\s*/, '').trim();
        });
      }

    } catch (error) {
      console.error('Error parsing enhanced AI response:', error);
    }

    return sections;
  }

  /**
   * Generate fallback strategy when parsing fails
   * @param {Object} studentData - Student data
   * @param {string} riskLevel - Risk level
   * @returns {string} Fallback strategy
   */
  generateFallbackStrategy(studentData, riskLevel) {
    const { subscales } = studentData;
    const lowestDimension = Object.entries(subscales || {}).reduce((a, b) => a[1] < b[1] ? a : b);
    
    return `Focus on comprehensive well-being improvement with emphasis on ${lowestDimension[0]?.replace(/_/g, ' ')} development. This ${riskLevel} risk level requires targeted interventions to build resilience and enhance overall psychological well-being. Implement structured activities that address specific dimensional weaknesses while maintaining existing strengths.`;
  }

  /**
   * Create dimension interventions with fallback
   * @param {Object} subscales - Dimension scores
   * @param {Object} parsedDimensions - Parsed dimension interventions
   * @returns {Object} Dimension interventions
   */
  createDimensionInterventions(subscales, parsedDimensions) {
    const dimensionInterventions = {};
    
    if (subscales) {
      Object.entries(subscales).forEach(([dimension, score]) => {
        const status = this.getScoreStatus(score);
        dimensionInterventions[dimension] = parsedDimensions[dimension] || 
          this.getDimensionAdvice(dimension, score, status);
      });
    }
    
    return dimensionInterventions;
  }

  /**
   * Generate enhanced action plan with examples
   * @param {string} riskLevel - Risk level
   * @param {Array} atRiskDimensions - At-risk dimensions
   * @param {Object} studentData - Student data
   * @returns {Array} Enhanced action items
   */
  generateEnhancedActionPlan(riskLevel, atRiskDimensions, studentData) {
    const actions = [];
    const { subscales, name } = studentData;
    
    if (subscales) {
      // Find lowest scoring dimensions
      const sortedDimensions = Object.entries(subscales)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 2);
      
      sortedDimensions.forEach(([dimension, score]) => {
        if (score < 21) {
          actions.push(`I recommend you focus on strengthening your ${this.formatDimensionName(dimension)} through daily practice. For example: Set one small independent goal each day (like choosing your study schedule or meal plan) and track your progress in a personal journal to build confidence in your decision-making abilities.`);
        }
      });
    }
    
    // Add risk-specific actions with examples in counselor tone
    if (riskLevel === 'high') {
      actions.push('I strongly encourage you to schedule regular check-ins with a counselor for ongoing support. For example: Book recurring appointments every Tuesday at 2 PM with our counseling center, and use this time to discuss your progress and any challenges you\'re facing.');
      actions.push('I suggest you establish a consistent daily self-care routine to build stability in your life. For example: Start each morning with 10 minutes of deep breathing or meditation, eat a nutritious breakfast, and end your day with 5 minutes of reflection about three things that went well.');
    } else if (riskLevel === 'moderate') {
      actions.push('I recommend you practice stress management techniques to help you navigate challenging moments. For example: When you feel overwhelmed, use the 4-7-8 breathing technique (inhale for 4 counts, hold for 7, exhale for 8) or take a 5-minute walk around campus to reset your mindset.');
      actions.push('Consider gradually building stronger social connections to enhance your support network. For example: Reach out to one classmate or friend each week for a coffee chat or study session, and make an effort to attend one social event or club meeting monthly.');
    } else {
      actions.push('I encourage you to maintain your current positive well-being practices while exploring new growth opportunities. For example: Continue your existing healthy routines and challenge yourself to try one new activity each month, such as joining a new club or learning a skill you\'ve always wanted to develop.');
      actions.push('Consider using your strengths to support others, which can further enhance your own well-being. For example: Volunteer to tutor peers in subjects you excel at, or join a peer mentoring program where you can share your positive coping strategies with other students.');
    }
    
    actions.push('I suggest you incorporate mindfulness into your daily routine to enhance your overall mental clarity and emotional regulation. For example: Use a meditation app like Headspace for 10 minutes each morning before classes, or practice mindful walking between buildings on campus by focusing on your breathing and surroundings.');
    
    return actions.slice(0, 5); // Limit to 5 actions
  }

  /**
   * Create enhanced fallback response
   * @param {Object} studentData - Student data
   * @param {string} riskLevel - Risk level
   * @returns {Object} Enhanced fallback response
   */
  createEnhancedFallbackResponse(studentData, riskLevel) {
    const overallStrategy = this.generateFallbackStrategy(studentData, riskLevel);
    const dimensionInterventions = this.createDimensionInterventions(studentData.subscales, {});
    const actionPlan = this.generateEnhancedActionPlan(riskLevel, studentData.atRiskDimensions, studentData);
    const title = this.generateInterventionTitle(overallStrategy, riskLevel);
    
    const structuredData = {
      overallStrategy: overallStrategy,
      dimensionInterventions: dimensionInterventions,
      actionPlan: actionPlan
    };
    
    return {
      title: title,
      interventionText: JSON.stringify(structuredData),
      overallStrategy: overallStrategy,
      dimensionInterventions: dimensionInterventions,
      actionPlan: actionPlan
    };
  }

  /**
   * Get dimension-specific advice
   * @param {string} dimension - Dimension name
   * @param {number} score - Dimension score
   * @param {string} status - Score status
   * @returns {string} Specific advice
   */
  getDimensionAdvice(dimension, score, status) {
    const advice = {
      autonomy: {
        'At Risk': 'Practice making small decisions independently in low-stakes situations to build confidence. Start with daily choices like meal planning or study schedules.',
        'Moderate': 'Set weekly goals for independent decision-making and track your progress. Balance autonomy with seeking advice when needed.',
        'Healthy': 'Continue making autonomous choices and help others develop their decision-making skills. Consider mentoring peers who struggle with independence.'
      },
      personal_growth: {
        'At Risk': 'Start with one small learning goal each week, such as reading for 15 minutes daily. Focus on areas that genuinely interest you.',
        'Moderate': 'Challenge yourself with new skills or hobbies that align with your interests. Join clubs or activities that push your comfort zone.',
        'Healthy': 'Maintain your growth mindset and consider mentoring others in their development. Share your learning strategies with peers.'
      },
      purpose_in_life: {
        'At Risk': 'Reflect on your values and identify one meaningful activity to engage in weekly. Keep a journal about what truly matters to you.',
        'Moderate': 'Explore volunteer opportunities or activities that align with your personal values. Make small adjustments to ensure actions reflect values.',
        'Healthy': 'Continue pursuing meaningful activities and help others find their purpose. Consider leadership roles that align with your values.'
      },
      self_acceptance: {
        'At Risk': 'Practice daily self-compassion exercises and challenge negative self-talk. Keep a gratitude journal focusing on positive qualities.',
        'Moderate': 'Develop a gratitude practice and celebrate small personal achievements. Acknowledge improvements while working on growth areas.',
        'Healthy': 'Maintain your positive self-regard and model self-acceptance for others. Use confidence to support others in building theirs.'
      },
      positive_relations: {
        'At Risk': 'Schedule one social activity per week and practice active listening skills. Show genuine interest in others during conversations.',
        'Moderate': 'Strengthen existing relationships and be open to forming new connections. Schedule regular check-ins with friends and family.',
        'Healthy': 'Continue nurturing relationships and support others in building social connections. Consider facilitating group activities or peer support.'
      },
      environmental_mastery: {
        'At Risk': 'Break overwhelming tasks into smaller, manageable steps and use planning tools. Create structured daily routines that work for you.',
        'Moderate': 'Develop better organizational systems and time management strategies. Build systems that work for your lifestyle and academic demands.',
        'Healthy': 'Maintain your organizational skills and help others improve their environment management. Consider tutoring peers in time management.'
      }
    };
    
    return advice[dimension]?.[status] || `Focus on improving ${this.formatDimensionName(dimension)} through consistent daily practice and targeted skill-building activities.`;
  }
  
  /**
   * Generate action plan based on scores
   * @param {Object} subscales - Dimension scores
   * @param {string} riskLevel - Risk level
   * @returns {Array} Action items
   */
  generateActionPlan(subscales, riskLevel) {
    const actions = [];
    
    if (subscales) {
      // Find lowest scoring dimensions
      const sortedDimensions = Object.entries(subscales)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 3);
      
      sortedDimensions.forEach(([dimension, score]) => {
        if (score < 21) {
          actions.push(`Focus on ${this.formatDimensionName(dimension)} through daily practice and skill building`);
        }
      });
    }
    
    // Add general actions based on risk level
    if (riskLevel === 'high') {
      actions.push('Schedule weekly check-ins with a counselor or mental health professional');
      actions.push('Establish a daily routine that includes self-care activities');
    }
    
    actions.push('Practice mindfulness or meditation for 10 minutes daily');
    actions.push('Maintain regular social connections with friends and family');
    
    return actions.slice(0, 6); // Limit to 6 actions
  }
  
  /**
   * Generate intervention title based on content and risk level
   * @param {string} strategy - Overall strategy text
   * @param {string} riskLevel - Student's risk level
   * @returns {string} Generated title
   */
  generateInterventionTitle(strategy, riskLevel) {
    const titles = {
      'low': ['Wellness Enhancement Plan', 'Positive Growth Strategy', 'Strength Building Approach'],
      'moderate': ['Balanced Development Plan', 'Supportive Growth Strategy', 'Wellness Improvement Plan'],
      'high': ['Comprehensive Support Plan', 'Intensive Wellness Strategy', 'Priority Care Plan']
    };
    
    const levelTitles = titles[riskLevel] || titles['moderate'];
    return levelTitles[Math.floor(Math.random() * levelTitles.length)];
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