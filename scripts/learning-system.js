/**
 * VAI Learning System
 * Tracks user command patterns and preferences for improved recognition
 */

class LearningSystem {
    constructor() {
        this.commandHistory = [];
        this.userPreferences = {};
        this.commandPatterns = {};
        this.successRates = {};
        this.maxHistorySize = 100;
        this.learningEnabled = true;
    }

    /**
     * Learn from a command execution
     */
    learnFromCommand(speechText, intent, result) {
        if (!this.learningEnabled) return;

        const learningEntry = {
            speechText: speechText,
            intent: intent,
            result: result,
            timestamp: Date.now(),
            success: result?.success || false
        };

        // Add to history
        this.commandHistory.push(learningEntry);
        
        // Trim history if too long
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }

        // Update patterns
        this.updateCommandPatterns(speechText, intent);
        
        // Update success rates
        this.updateSuccessRates(intent.action, result?.success || false);
        
        // Update user preferences
        this.updateUserPreferences(speechText, intent, result);

        console.log('VAI: Learned from command:', learningEntry);
    }

    /**
     * Update command patterns
     */
    updateCommandPatterns(speechText, intent) {
        const action = intent.action;
        
        if (!this.commandPatterns[action]) {
            this.commandPatterns[action] = [];
        }

        // Extract key phrases from speech text
        const phrases = this.extractPhrases(speechText);
        
        // Add new phrases to patterns
        phrases.forEach(phrase => {
            if (!this.commandPatterns[action].includes(phrase)) {
                this.commandPatterns[action].push(phrase);
            }
        });

        // Keep only the most recent patterns
        if (this.commandPatterns[action].length > 20) {
            this.commandPatterns[action] = this.commandPatterns[action].slice(-20);
        }
    }

    /**
     * Extract key phrases from speech text
     */
    extractPhrases(speechText) {
        const phrases = [];
        const words = speechText.toLowerCase().split(' ');
        
        // Extract 2-3 word phrases
        for (let i = 0; i < words.length - 1; i++) {
            phrases.push(`${words[i]} ${words[i + 1]}`);
        }
        
        for (let i = 0; i < words.length - 2; i++) {
            phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }

        return phrases;
    }

    /**
     * Update success rates
     */
    updateSuccessRates(action, success) {
        if (!this.successRates[action]) {
            this.successRates[action] = { success: 0, total: 0 };
        }

        this.successRates[action].total++;
        if (success) {
            this.successRates[action].success++;
        }
    }

    /**
     * Update user preferences
     */
    updateUserPreferences(speechText, intent, result) {
        const action = intent.action;
        
        if (!this.userPreferences[action]) {
            this.userPreferences[action] = {
                preferredPhrases: [],
                preferredTargets: [],
                preferredWeapons: [],
                preferredSpells: [],
                successRate: 0
            };
        }

        // Update preferred phrases
        if (result?.success) {
            const phrases = this.extractPhrases(speechText);
            phrases.forEach(phrase => {
                if (!this.userPreferences[action].preferredPhrases.includes(phrase)) {
                    this.userPreferences[action].preferredPhrases.push(phrase);
                }
            });
        }

        // Update preferred targets
        if (intent.target && result?.success) {
            if (!this.userPreferences[action].preferredTargets.includes(intent.target)) {
                this.userPreferences[action].preferredTargets.push(intent.target);
            }
        }

        // Update preferred weapons
        if (intent.weapon && result?.success) {
            if (!this.userPreferences[action].preferredWeapons.includes(intent.weapon)) {
                this.userPreferences[action].preferredWeapons.push(intent.weapon);
            }
        }

        // Update preferred spells
        if (intent.spell && result?.success) {
            if (!this.userPreferences[action].preferredSpells.includes(intent.spell)) {
                this.userPreferences[action].preferredSpells.push(intent.spell);
            }
        }

        // Update success rate
        this.userPreferences[action].successRate = this.getSuccessRate(action);
    }

    /**
     * Get success rate for an action
     */
    getSuccessRate(action) {
        const stats = this.successRates[action];
        if (!stats || stats.total === 0) {
            return 0;
        }
        return stats.success / stats.total;
    }

    /**
     * Suggest alternative phrasings
     */
    suggestAlternatives(command) {
        const suggestions = [];
        
        // Find similar commands in history
        const similarCommands = this.findSimilarCommands(command);
        
        similarCommands.forEach(similar => {
            if (similar.result?.success) {
                suggestions.push({
                    text: similar.speechText,
                    confidence: this.calculateSimilarity(command, similar.speechText),
                    success: true
                });
            }
        });

        // Sort by confidence and return top suggestions
        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
    }

    /**
     * Find similar commands
     */
    findSimilarCommands(command) {
        const normalizedCommand = command.toLowerCase();
        
        return this.commandHistory.filter(entry => {
            const similarity = this.calculateSimilarity(normalizedCommand, entry.speechText.toLowerCase());
            return similarity > 0.3; // Threshold for similarity
        });
    }

    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = Math.max(words1.length, words2.length);
        
        return commonWords.length / totalWords;
    }

    /**
     * Get preferred phrases for an action
     */
    getPreferredPhrases(action) {
        return this.userPreferences[action]?.preferredPhrases || [];
    }

    /**
     * Get preferred targets for an action
     */
    getPreferredTargets(action) {
        return this.userPreferences[action]?.preferredTargets || [];
    }

    /**
     * Get preferred weapons for an action
     */
    getPreferredWeapons(action) {
        return this.userPreferences[action]?.preferredWeapons || [];
    }

    /**
     * Get preferred spells for an action
     */
    getPreferredSpells(action) {
        return this.userPreferences[action]?.preferredSpells || [];
    }

    /**
     * Boost confidence based on learning
     */
    boostConfidence(speechText, intent) {
        let boost = 0;
        const action = intent.action;

        // Check if this is a preferred phrase
        const preferredPhrases = this.getPreferredPhrases(action);
        const phrases = this.extractPhrases(speechText);
        
        phrases.forEach(phrase => {
            if (preferredPhrases.includes(phrase)) {
                boost += 0.05;
            }
        });

        // Check if target is preferred
        if (intent.target) {
            const preferredTargets = this.getPreferredTargets(action);
            if (preferredTargets.includes(intent.target)) {
                boost += 0.03;
            }
        }

        // Check if weapon is preferred
        if (intent.weapon) {
            const preferredWeapons = this.getPreferredWeapons(action);
            if (preferredWeapons.includes(intent.weapon)) {
                boost += 0.03;
            }
        }

        // Check if spell is preferred
        if (intent.spell) {
            const preferredSpells = this.getPreferredSpells(action);
            if (preferredSpells.includes(intent.spell)) {
                boost += 0.03;
            }
        }

        // Check success rate
        const successRate = this.getSuccessRate(action);
        if (successRate > 0.8) {
            boost += 0.02;
        }

        return Math.min(boost, 0.2); // Cap at 0.2
    }

    /**
     * Get learning statistics
     */
    getLearningStats() {
        const totalCommands = this.commandHistory.length;
        const successfulCommands = this.commandHistory.filter(entry => entry.success).length;
        const overallSuccessRate = totalCommands > 0 ? successfulCommands / totalCommands : 0;

        const actionStats = {};
        Object.keys(this.successRates).forEach(action => {
            actionStats[action] = {
                successRate: this.getSuccessRate(action),
                totalCommands: this.successRates[action].total,
                successfulCommands: this.successRates[action].success
            };
        });

        return {
            totalCommands,
            successfulCommands,
            overallSuccessRate,
            actionStats,
            learningEnabled: this.learningEnabled,
            maxHistorySize: this.maxHistorySize
        };
    }

    /**
     * Get command patterns
     */
    getCommandPatterns() {
        return this.commandPatterns;
    }

    /**
     * Get user preferences
     */
    getUserPreferences() {
        return this.userPreferences;
    }

    /**
     * Enable/disable learning
     */
    setLearningEnabled(enabled) {
        this.learningEnabled = enabled;
        console.log('VAI: Learning enabled:', enabled);
    }

    /**
     * Clear learning data
     */
    clearLearningData() {
        this.commandHistory = [];
        this.userPreferences = {};
        this.commandPatterns = {};
        this.successRates = {};
        console.log('VAI: Learning data cleared');
    }

    /**
     * Export learning data
     */
    exportLearningData() {
        return {
            commandHistory: this.commandHistory,
            userPreferences: this.userPreferences,
            commandPatterns: this.commandPatterns,
            successRates: this.successRates,
            learningEnabled: this.learningEnabled,
            maxHistorySize: this.maxHistorySize,
            timestamp: Date.now()
        };
    }

    /**
     * Import learning data
     */
    importLearningData(data) {
        this.commandHistory = data.commandHistory || [];
        this.userPreferences = data.userPreferences || {};
        this.commandPatterns = data.commandPatterns || {};
        this.successRates = data.successRates || {};
        this.learningEnabled = data.learningEnabled !== undefined ? data.learningEnabled : true;
        this.maxHistorySize = data.maxHistorySize || 100;
        
        console.log('VAI: Learning data imported');
    }

    /**
     * Get recent command history
     */
    getRecentHistory(limit = 10) {
        return this.commandHistory.slice(-limit);
    }

    /**
     * Get most successful commands
     */
    getMostSuccessfulCommands(limit = 5) {
        const actionSuccessRates = Object.keys(this.successRates).map(action => ({
            action,
            successRate: this.getSuccessRate(action),
            totalCommands: this.successRates[action].total
        }));

        return actionSuccessRates
            .filter(stat => stat.totalCommands >= 3) // Only actions with at least 3 attempts
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, limit);
    }

    /**
     * Get least successful commands
     */
    getLeastSuccessfulCommands(limit = 5) {
        const actionSuccessRates = Object.keys(this.successRates).map(action => ({
            action,
            successRate: this.getSuccessRate(action),
            totalCommands: this.successRates[action].total
        }));

        return actionSuccessRates
            .filter(stat => stat.totalCommands >= 3) // Only actions with at least 3 attempts
            .sort((a, b) => a.successRate - b.successRate)
            .slice(0, limit);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearLearningData();
        console.log('VAI: Learning system cleanup completed');
    }
} 