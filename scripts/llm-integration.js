/**
 * VAI LLM Integration
 * Provides AI-powered command interpretation and disambiguation
 */

class LLMIntegration {
    constructor() {
        this.provider = 'none';
        this.apiKey = '';
        this.isAvailable = false;
        this.endpoints = this.initializeEndpoints();
        this.prompts = this.initializePrompts();
    }

    /**
     * Initialize API endpoints
     */
    initializeEndpoints() {
        return {
            openai: {
                url: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer {apiKey}'
                }
            },
            claude: {
                url: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-haiku-20240307',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': '{apiKey}',
                    'anthropic-version': '2023-06-01'
                }
            },
            gemini: {
                url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                model: 'gemini-pro',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        };
    }

    /**
     * Initialize prompt templates
     */
    initializePrompts() {
        return {
            disambiguation: `You are a voice command interpreter for a tabletop RPG game (Pathfinder 2e/1e). 
The user spoke a command that was not clearly understood. Please help interpret what they meant.

Available game actions:
- attack [target] [with weapon]
- move [direction/distance/destination]
- cast [spell] [on target]
- roll [skill] check
- target [enemy/ally]
- seek (search for hidden things)
- raise shield
- hide/sneak
- demoralize
- feint
- treat wounds
- equip [item]
- query [information]

User's speech: "{speechText}"

Please respond with a JSON object containing:
{
    "action": "the intended action",
    "confidence": 0.0-1.0,
    "parameters": {
        "target": "target name if applicable",
        "weapon": "weapon name if applicable",
        "spell": "spell name if applicable",
        "skill": "skill name if applicable",
        "direction": "direction if applicable",
        "distance": "distance if applicable",
        "item": "item name if applicable"
    },
    "explanation": "brief explanation of interpretation"
}`,

            contextAware: `You are a voice command interpreter for a tabletop RPG game. 
Consider the current game context when interpreting commands.

Current context:
- Character: {characterName}
- Current target: {currentTarget}
- Last action: {lastAction}
- Combat state: {combatState}

User's command: "{speechText}"

Available actions: {availableActions}

Please interpret the command considering the context and respond with a JSON object:
{
    "action": "intended action",
    "confidence": 0.0-1.0,
    "parameters": {
        "target": "target (use current target if not specified)",
        "weapon": "weapon if applicable",
        "spell": "spell if applicable",
        "skill": "skill if applicable"
    },
    "contextual": true/false,
    "explanation": "explanation"
}`,

            spellMatching: `You are helping to match a spoken spell name to the correct spell in Pathfinder.

Available spells: {availableSpells}

User said: "{spellName}"

Please find the best match and respond with JSON:
{
    "matchedSpell": "exact spell name",
    "confidence": 0.0-1.0,
    "alternatives": ["other possible matches"],
    "explanation": "why this spell was chosen"
}`,

            targetMatching: `You are helping to identify a target in a tabletop RPG.

Available targets: {availableTargets}

User said: "{targetName}"

Please find the best match and respond with JSON:
{
    "matchedTarget": "exact target name",
    "confidence": 0.0-1.0,
    "alternatives": ["other possible matches"],
    "explanation": "why this target was chosen"
}`
        };
    }

    /**
     * Set provider
     */
    setProvider(provider) {
        this.provider = provider;
        this.isAvailable = provider !== 'none' && this.apiKey;
        console.log('VAI: LLM provider set to:', provider);
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.isAvailable = this.provider !== 'none' && apiKey;
        console.log('VAI: LLM API key updated');
    }

    /**
     * Check if LLM is available
     */
    isAvailable() {
        return this.isAvailable;
    }

    /**
     * Resolve ambiguous intent using AI
     */
    async resolveAmbiguousIntent(speechText, originalIntent) {
        if (!this.isAvailable) {
            throw new Error('LLM not available');
        }

        try {
            const prompt = this.prompts.disambiguation.replace('{speechText}', speechText);
            const response = await this.queryLLM(prompt);
            
            const parsedResponse = this.parseLLMResponse(response);
            
            // Merge with original intent
            const resolvedIntent = {
                ...originalIntent,
                ...parsedResponse,
                confidence: Math.max(originalIntent.confidence, parsedResponse.confidence || 0)
            };
            
            console.log('VAI: LLM resolved intent:', resolvedIntent);
            return resolvedIntent;
            
        } catch (error) {
            console.error('VAI: LLM disambiguation failed:', error);
            return originalIntent;
        }
    }

    /**
     * Get context-aware interpretation
     */
    async getContextAwareInterpretation(speechText, context) {
        if (!this.isAvailable) {
            throw new Error('LLM not available');
        }

        try {
            const prompt = this.prompts.contextAware
                .replace('{speechText}', speechText)
                .replace('{characterName}', context.characterName || 'Unknown')
                .replace('{currentTarget}', context.currentTarget || 'None')
                .replace('{lastAction}', context.lastAction || 'None')
                .replace('{combatState}', context.combatState || 'Unknown')
                .replace('{availableActions}', context.availableActions?.join(', ') || 'All actions');
            
            const response = await this.queryLLM(prompt);
            const parsedResponse = this.parseLLMResponse(response);
            
            console.log('VAI: LLM context-aware interpretation:', parsedResponse);
            return parsedResponse;
            
        } catch (error) {
            console.error('VAI: LLM context interpretation failed:', error);
            throw error;
        }
    }

    /**
     * Match spell name
     */
    async matchSpellName(spellName, availableSpells) {
        if (!this.isAvailable) {
            return { matchedSpell: spellName, confidence: 0.5 };
        }

        try {
            const prompt = this.prompts.spellMatching
                .replace('{spellName}', spellName)
                .replace('{availableSpells}', availableSpells.join(', '));
            
            const response = await this.queryLLM(prompt);
            const parsedResponse = this.parseLLMResponse(response);
            
            console.log('VAI: LLM spell matching:', parsedResponse);
            return parsedResponse;
            
        } catch (error) {
            console.error('VAI: LLM spell matching failed:', error);
            return { matchedSpell: spellName, confidence: 0.5 };
        }
    }

    /**
     * Match target name
     */
    async matchTargetName(targetName, availableTargets) {
        if (!this.isAvailable) {
            return { matchedTarget: targetName, confidence: 0.5 };
        }

        try {
            const prompt = this.prompts.targetMatching
                .replace('{targetName}', targetName)
                .replace('{availableTargets}', availableTargets.join(', '));
            
            const response = await this.queryLLM(prompt);
            const parsedResponse = this.parseLLMResponse(response);
            
            console.log('VAI: LLM target matching:', parsedResponse);
            return parsedResponse;
            
        } catch (error) {
            console.error('VAI: LLM target matching failed:', error);
            return { matchedTarget: targetName, confidence: 0.5 };
        }
    }

    /**
     * Query LLM API
     */
    async queryLLM(prompt) {
        if (!this.isAvailable) {
            throw new Error('LLM not available');
        }

        const endpoint = this.endpoints[this.provider];
        if (!endpoint) {
            throw new Error(`Unknown provider: ${this.provider}`);
        }

        try {
            const requestBody = this.buildRequestBody(prompt);
            const headers = this.buildHeaders();
            
            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.extractResponseText(data);
            
        } catch (error) {
            console.error('VAI: LLM API request failed:', error);
            throw error;
        }
    }

    /**
     * Build request body based on provider
     */
    buildRequestBody(prompt) {
        switch (this.provider) {
            case 'openai':
                return {
                    model: this.endpoints.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant for interpreting voice commands in a tabletop RPG game.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                };
                
            case 'claude':
                return {
                    model: this.endpoints.claude.model,
                    max_tokens: 500,
                    temperature: 0.3,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
                
            case 'gemini':
                return {
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 500
                    }
                };
                
            default:
                throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }

    /**
     * Build headers based on provider
     */
    buildHeaders() {
        const endpoint = this.endpoints[this.provider];
        const headers = { ...endpoint.headers };
        
        // Replace API key placeholder
        Object.keys(headers).forEach(key => {
            headers[key] = headers[key].replace('{apiKey}', this.apiKey);
        });
        
        // Add API key to URL for Gemini
        if (this.provider === 'gemini') {
            const url = new URL(endpoint.url);
            url.searchParams.append('key', this.apiKey);
            endpoint.url = url.toString();
        }
        
        return headers;
    }

    /**
     * Extract response text based on provider
     */
    extractResponseText(data) {
        switch (this.provider) {
            case 'openai':
                return data.choices?.[0]?.message?.content || '';
                
            case 'claude':
                return data.content?.[0]?.text || '';
                
            case 'gemini':
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
            default:
                throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }

    /**
     * Parse LLM response
     */
    parseLLMResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // If no JSON found, return basic response
            return {
                action: 'unknown',
                confidence: 0.5,
                explanation: response
            };
            
        } catch (error) {
            console.error('VAI: Failed to parse LLM response:', error);
            return {
                action: 'unknown',
                confidence: 0.3,
                explanation: 'Failed to parse AI response'
            };
        }
    }

    /**
     * Test LLM connection
     */
    async testConnection() {
        if (!this.isAvailable) {
            throw new Error('LLM not configured');
        }

        try {
            const testPrompt = 'Respond with: {"test": "success", "message": "Connection working"}';
            const response = await this.queryLLM(testPrompt);
            const parsed = this.parseLLMResponse(response);
            
            return parsed.test === 'success';
            
        } catch (error) {
            console.error('VAI: LLM connection test failed:', error);
            return false;
        }
    }

    /**
     * Get available providers
     */
    getAvailableProviders() {
        return Object.keys(this.endpoints);
    }

    /**
     * Get provider status
     */
    getProviderStatus() {
        return {
            provider: this.provider,
            available: this.isAvailable,
            configured: this.provider !== 'none' && this.apiKey,
            endpoints: Object.keys(this.endpoints)
        };
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        // This would track API usage over time
        return {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0
        };
    }

    /**
     * Validate API key
     */
    async validateApiKey() {
        if (!this.apiKey) {
            return false;
        }

        try {
            return await this.testConnection();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get LLM capabilities
     */
    getCapabilities() {
        return {
            disambiguation: true,
            contextAwareness: true,
            spellMatching: true,
            targetMatching: true,
            naturalLanguage: true,
            providers: this.getAvailableProviders()
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.provider = 'none';
        this.apiKey = '';
        this.isAvailable = false;
        
        console.log('VAI: LLM integration cleanup completed');
    }
} 