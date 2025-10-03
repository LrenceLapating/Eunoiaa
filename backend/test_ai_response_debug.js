const aiService = require('./utils/aiService');
require('dotenv').config();

async function debugAIResponse() {
  try {
    console.log('=== DEBUG: Testing AI Response Generation ===\n');
    
    // Sample student data
    const studentData = {
      name: 'Lemuel',
      college: 'College of Computer Studies',
      section: 'BSIT-4A',
      overallScore: 145,
      overallMaxScore: 252,
      riskLevel: 'Moderate',
      assessmentType: 'ryff_42',
      subscales: {
        autonomy: 26,
        personal_growth: 27,
        purpose_in_life: 24,
        self_acceptance: 25,
        positive_relations: 22,
        environmental_mastery: 21
      }
    };

    const aiService = require('./utils/aiService');
    
    // Generate the prompt
    const prompt = aiService.createInterventionPrompt(studentData);
    console.log('Generated Prompt (last 500 characters):');
    console.log('...' + prompt.slice(-500));
    console.log('\n' + '='.repeat(80) + '\n');
    
    console.log('Generating AI response...');
    
    // Try to get raw AI response first
     try {
       // Call the AI API directly like generateIntervention does
       const axios = require('axios');
       const { config } = require('./config/environment');
       
       const OPENROUTER_BASE_URL = config.ai.openrouterBaseUrl;
       const MODEL_NAME = config.ai.modelName;
       const API_KEY = config.ai.openrouterApiKey;
       
       console.log('Full prompt being sent to AI:');
       console.log(prompt);
       console.log('\n' + '='.repeat(80) + '\n');
       
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
       
       const rawResponse = response.data?.choices?.[0]?.message?.content;
       console.log('Raw AI Response received:');
       console.log('Response length:', rawResponse ? rawResponse.length : 0);
       console.log('Response preview (first 500 chars):');
       console.log(rawResponse ? rawResponse.substring(0, 500) : 'No response');
       console.log('\n' + '='.repeat(80) + '\n');
       
       if (!rawResponse || rawResponse.trim().length === 0) {
         console.log('ERROR: AI returned empty or null response');
         return;
       }
       
       // Try to parse the response
       const parsed = aiService.parseInterventionResponse(rawResponse);
       console.log('Parsed Response:');
       console.log('Title:', parsed.title);
       console.log('Text length:', parsed.text.length);
       console.log('Text preview (first 300 chars):');
       console.log(parsed.text.substring(0, 300));
       
     } catch (aiError) {
       console.log('Error calling AI or parsing response:', aiError.message);
       console.log('Full error:', aiError);
     }
    
    
  } catch (error) {
    console.log('Error in debug test:', error);
  }
}

debugAIResponse();