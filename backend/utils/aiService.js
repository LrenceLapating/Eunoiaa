const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL_NAME = 'mistralai/mistral-7b-instruct';
const API_KEY = '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';

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
    let prompt = `You are a professional mental health counselor creating a personalized intervention for ${name || 'a student'}, a college student from ${college || 'their institution'} in section ${section || 'their class'}.

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

=== INTERVENTION REQUIREMENTS ===
Create a UNIQUE, PERSONALIZED intervention that:
1. Addresses this specific student's score pattern
2. Considers their college environment and academic context
3. Provides practical, actionable strategies
4. Varies in approach even for similar scores

=== RESPONSE FORMAT (FOLLOW EXACTLY) ===

Overall Mental Health Strategy:
[Write 2-3 sentences that provide a comprehensive strategy focusing on this student's specific needs, strengths, and areas for improvement. Make it personal and actionable.]

Dimension Scores & Targeted Interventions:
Autonomy (${Math.round(subscales?.autonomy || 0)}/42): [1-2 sentences with specific intervention for this score level]
Personal Growth (${Math.round(subscales?.personal_growth || 0)}/42): [1-2 sentences with specific intervention for this score level]
Purpose in Life (${Math.round(subscales?.purpose_in_life || 0)}/42): [1-2 sentences with specific intervention for this score level]
Self Acceptance (${Math.round(subscales?.self_acceptance || 0)}/42): [1-2 sentences with specific intervention for this score level]
Positive Relations (${Math.round(subscales?.positive_relations || 0)}/42): [1-2 sentences with specific intervention for this score level]
Environmental Mastery (${Math.round(subscales?.environmental_mastery || 0)}/42): [1-2 sentences with specific intervention for this score level]

Recommended Action Plan:
- [Specific action with detailed example: "Action description. Example: Concrete example of how to implement this"]
- [Specific action with detailed example: "Action description. Example: Concrete example of how to implement this"]
- [Specific action with detailed example: "Action description. Example: Concrete example of how to implement this"]
- [Specific action with detailed example: "Action description. Example: Concrete example of how to implement this"]
- [Specific action with detailed example: "Action description. Example: Concrete example of how to implement this"]

=== PERSONALIZATION CONTEXT ===
${contextElements.join('\n')}

IMPORTANT: Make this intervention UNIQUE by varying your language, examples, and specific recommendations. Even students with similar scores should receive different approaches and examples.`;
    
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
    const { subscales, overallScore, atRiskDimensions, college, section } = studentData;
    const contextElements = [];
    
    // Add score pattern analysis
    const scores = Object.values(subscales || {});
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestDimension = Object.entries(subscales || {}).reduce((a, b) => a[1] > b[1] ? a : b);
    const lowestDimension = Object.entries(subscales || {}).reduce((a, b) => a[1] < b[1] ? a : b);
    
    contextElements.push(`- Student's strongest area: ${highestDimension[0].replace(/_/g, ' ')} (${Math.round(highestDimension[1])}/42)`);
    contextElements.push(`- Student's area needing most support: ${lowestDimension[0].replace(/_/g, ' ')} (${Math.round(lowestDimension[1])}/42)`);
    
    // Add risk-specific context
    if (riskLevel === 'high') {
      contextElements.push('- Focus on immediate support and crisis prevention strategies');
      contextElements.push('- Emphasize building basic coping skills and safety nets');
    } else if (riskLevel === 'moderate') {
      contextElements.push('- Balance prevention with skill-building interventions');
      contextElements.push('- Focus on developing resilience and self-management tools');
    } else {
      contextElements.push('- Emphasize growth, optimization, and maintaining well-being');
      contextElements.push('- Focus on advanced personal development strategies');
    }
    
    // Add academic context
    if (college) {
      contextElements.push(`- Consider academic pressures and college environment at ${college}`);
    }
    
    // Add uniqueness factors
    const timestamp = Date.now();
    const uniqueId = Math.floor(Math.random() * 1000);
    contextElements.push(`- Intervention ID: ${timestamp}-${uniqueId} (ensure unique approach)`);
    
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
    const { subscales } = studentData;
    
    if (subscales) {
      // Find lowest scoring dimensions
      const sortedDimensions = Object.entries(subscales)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 2);
      
      sortedDimensions.forEach(([dimension, score]) => {
        if (score < 21) {
          actions.push(`Focus on ${this.formatDimensionName(dimension)} through daily practice. Example: Set one small independent goal each day and track your progress in a journal.`);
        }
      });
    }
    
    // Add risk-specific actions with examples
    if (riskLevel === 'high') {
      actions.push('Schedule weekly check-ins with a counselor. Example: Book recurring appointments every Tuesday at 2 PM for consistent support.');
      actions.push('Establish a daily self-care routine. Example: 10 minutes morning meditation, healthy breakfast, and evening reflection.');
    } else if (riskLevel === 'moderate') {
      actions.push('Practice stress management techniques. Example: Use the 4-7-8 breathing technique when feeling overwhelmed.');
      actions.push('Build social connections gradually. Example: Reach out to one friend or family member each week for a meaningful conversation.');
    } else {
      actions.push('Maintain current well-being practices. Example: Continue your existing routines and add one new growth activity monthly.');
      actions.push('Consider mentoring others. Example: Volunteer to help peers or join a peer support group as a mentor.');
    }
    
    actions.push('Practice mindfulness daily. Example: Use a meditation app for 10 minutes each morning or practice mindful walking between classes.');
    
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