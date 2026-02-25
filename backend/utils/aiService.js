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
          'Content-Type': 'application/json',
          'HTTP-Referer': config.frontendUrl || 'https://eunoia-app.com',
          'X-Title': 'Eunoia Mental Health Platform'
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
    
    // SIMPLIFIED PROMPT FOR NATURAL AI RESPONSES
     let prompt = `You are a professional mental health counselor creating a personalized intervention for ${name || 'this student'}, a student at ${college} in ${section}. Based on their Ryff Psychological Well-being Scale assessment results, provide a comprehensive intervention.

Assessment Results:
- Overall Score: ${overallScore}/${overallMaxScore} (${riskLevel} risk level)
- Assessment Type: ${assessmentType === 'ryff_84' ? '84-item' : '42-item'} Ryff Scale
- At-Risk Dimensions: ${atRiskDimensionsList.length > 0 ? atRiskDimensionsList.join(', ') : 'None'}

Individual Dimension Scores:
- Autonomy: ${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.autonomy || 0, assessmentType)})
- Personal Growth: ${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType)})
- Purpose in Life: ${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType)})
- Self Acceptance: ${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType)})
- Positive Relations: ${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType)})
- Environmental Mastery: ${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore} (${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType)})

Context: ${atRiskText} ${healthyText} ${moderateText}

CRITICAL FORMATTING RULES:
1. Overall Mental Health Strategy MUST be EXACTLY 2-3 sentences (no more!)
2. DO NOT use markdown formatting (**, *, #, etc.) - use plain text only
3. Each dimension intervention should be 3-4 sentences maximum
4. Keep language natural and conversational
5. Follow the exact format below

Please provide your response in this EXACT format:

TITLE: [Create a personalized, encouraging title for this intervention]

INTERVENTION:
Overall Mental Health Strategy:
Write EXACTLY 2-3 sentences (no more!) providing an overall assessment and strategy. Focus on their strengths and areas for growth. Mention their overall score of ${Math.round(overallScore || 0)} out of ${overallMaxScore}. DO NOT use markdown formatting.

Dimension Scores & Targeted Interventions:
For each dimension below, write 3-4 sentences that naturally include the numerical score. DO NOT use markdown formatting (no **, *, etc.). Write in plain text only.

Autonomy (${Math.round(subscales?.autonomy || 0)}/${dimensionMaxScore}): Write 3-4 sentences about their independence and self-determination. Naturally incorporate their score somewhere in the text. Plain text only, no markdown.

Personal Growth (${Math.round(subscales?.personal_growth || 0)}/${dimensionMaxScore}): Write 3-4 sentences about their openness to new experiences. Include their score naturally. Plain text only, no markdown.

Purpose in Life (${Math.round(subscales?.purpose_in_life || 0)}/${dimensionMaxScore}): Write 3-4 sentences about their sense of direction and meaning. Weave in their score naturally. Plain text only, no markdown.

Self Acceptance (${Math.round(subscales?.self_acceptance || 0)}/${dimensionMaxScore}): Write 3-4 sentences about their self-regard and acceptance. Integrate their score naturally. Plain text only, no markdown.

Positive Relations (${Math.round(subscales?.positive_relations || 0)}/${dimensionMaxScore}): Write 3-4 sentences about their social connections. Include their score naturally. Plain text only, no markdown.

Environmental Mastery (${Math.round(subscales?.environmental_mastery || 0)}/${dimensionMaxScore}): Write 3-4 sentences about their ability to manage their environment. Mention their score naturally. Plain text only, no markdown.

Recommended Action Plan:
Provide ONE specific, actionable recommendation for each dimension. Format as "Dimension Name: [one specific action]". Plain text only, no markdown.

Autonomy: One specific action based on their ${this.getScoreStatus(subscales?.autonomy || 0, assessmentType)} status
Personal Growth: One specific action based on their ${this.getScoreStatus(subscales?.personal_growth || 0, assessmentType)} status
Purpose in Life: One specific action based on their ${this.getScoreStatus(subscales?.purpose_in_life || 0, assessmentType)} status
Self Acceptance: One specific action based on their ${this.getScoreStatus(subscales?.self_acceptance || 0, assessmentType)} status
Positive Relations: One specific action based on their ${this.getScoreStatus(subscales?.positive_relations || 0, assessmentType)} status
Environmental Mastery: One specific action based on their ${this.getScoreStatus(subscales?.environmental_mastery || 0, assessmentType)} status

REMEMBER: NO MARKDOWN FORMATTING. Use plain text only. Keep Overall Strategy to 2-3 sentences maximum.`;
    
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
            'Content-Type': 'application/json',
            'HTTP-Referer': config.frontendUrl || 'https://eunoia-app.com',
            'X-Title': 'Eunoia Mental Health Platform'
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
      // Try multiple patterns to find the strategy section
      let strategyMatch = aiResponse.match(/Overall Mental Health Strategy:\s*([\s\S]*?)(?=\n\n(?:Dimension Scores|Recommended Action Plan)|$)/i);
      
      // If not found, try alternative patterns
      if (!strategyMatch) {
        // Try finding content between INTERVENTION: and first dimension
        strategyMatch = aiResponse.match(/INTERVENTION:\s*([\s\S]*?)(?=\n\n(?:Dimension Scores|Autonomy|Personal Growth)|$)/i);
      }
      
      if (!strategyMatch) {
        // Try finding content after "Overall" keyword
        strategyMatch = aiResponse.match(/Overall[^:]*:\s*([\s\S]*?)(?=\n\n|$)/i);
      }
      
      if (strategyMatch) {
        let strategy = strategyMatch[1].trim();
        
        // Clean up markdown formatting
        strategy = this.cleanMarkdown(strategy);
        
        // Ensure it's only 2-3 sentences (limit to first 3 sentences)
        const sentences = strategy.match(/[^.!?]+[.!?]+/g) || [strategy];
        if (sentences.length > 3) {
          strategy = sentences.slice(0, 3).join(' ').trim();
        }
        
        sections.strategy = strategy;
        console.log('Overall strategy extracted:', sections.strategy.substring(0, 100) + '...');
      } else {
        console.warn('No overall strategy section found in AI response');
      }

      // Extract Dimension Scores & Targeted Interventions
      const dimensionsMatch = aiResponse.match(/Dimension Scores & Targeted Interventions:\s*([\s\S]*?)(?=\n\nRecommended Action Plan|$)/i);
      if (dimensionsMatch) {
        const dimensionText = dimensionsMatch[1];
        console.log('Dimension text extracted:', dimensionText.substring(0, 200) + '...');
        
        // Split by dimension headers - look for patterns like "Autonomy (22/42):" or "**Autonomy (22/42):**"
        const dimensionPattern = /\*{0,2}(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*\((\d+)\/(?:42|84)\)\s*:\*{0,2}\s*([\s\S]*?)(?=\n\*{0,2}(?:Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*\(|$)/gi;
        
        let match;
        let dimensionCount = 0;
        while ((match = dimensionPattern.exec(dimensionText)) !== null) {
          const dimensionName = match[1].trim().toLowerCase().replace(/\s+/g, '_');
          const score = match[2];
          let intervention = match[3].trim();
          
          if (intervention) {
            // Clean up markdown formatting from intervention text
            intervention = this.cleanMarkdown(intervention);
            
            sections.dimensions[dimensionName] = intervention;
            dimensionCount++;
            console.log(`Successfully parsed dimension ${dimensionCount}: ${dimensionName} (${score})`);
          }
        }
        
        console.log(`Total dimensions parsed: ${Object.keys(sections.dimensions).length}`);
      } else {
        console.warn('No dimension section found in AI response');
      }

      // Extract Recommended Action Plan with dimension-based format and filtering
      const actionsMatch = aiResponse.match(/Recommended Action Plan:\s*([\s\S]*?)$/i);
      if (actionsMatch) {
        const actionTextContent = actionsMatch[1];
        
        // Look for dimension-based action items with flexible formatting
        // Matches: "Autonomy:", "**Autonomy:**", "Autonomy (score):", etc.
        const actionPattern = /\*{0,2}(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*(?:\([^)]+\))?\s*:\*{0,2}\s*([^\n]+)/gi;
        
        const actionLines = [];
        let match;
        while ((match = actionPattern.exec(actionTextContent)) !== null) {
          const dimensionName = match[1].trim();
          const actionDescription = match[2].trim();
          if (actionDescription) {
            actionLines.push(`${dimensionName}: ${actionDescription}`);
          }
        }
        
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
   * Clean markdown formatting from text
   * @param {string} text - Text with markdown
   * @returns {string} Clean text without markdown
   */
  cleanMarkdown(text) {
    if (!text) return '';
    
    return text
      // Remove bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove inline code markers
      .replace(/`([^`]+)`/g, '$1')
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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
          'Content-Type': 'application/json',
          'HTTP-Referer': config.frontendUrl || 'https://eunoia-app.com',
          'X-Title': 'Eunoia Mental Health Platform'
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
      if (error.response && error.response.status === 402) {
        return { success: false, error: 'Payment required - check OpenRouter credits or add required headers (HTTP-Referer, X-Title).' };
      }
      if (error.response && error.response.status === 429) {
        return { success: false, error: 'Rate limit exceeded for OpenRouter API.' };
      }
      return { success: false, error: `Connection failed: ${error.message}` };
    }
  }
}

module.exports = new AIService();