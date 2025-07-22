/**
 * VAI Context Manager
 * Tracks game state and provides context-aware command interpretation
 */

class ContextManager {
    constructor() {
        this.currentTarget = null;
        this.lastAction = null;
        this.combatState = null;
        this.characterState = null;
        this.gameContext = null;
        this.contextHistory = [];
        this.maxHistorySize = 50;
    }

    /**
     * Update context with new information
     */
    updateContext(type, data) {
        const timestamp = Date.now();
        const contextEntry = {
            type,
            data,
            timestamp
        };

        // Update specific context based on type
        switch (type) {
            case 'command':
                this.updateCommandContext(data);
                break;
            case 'result':
                this.updateResultContext(data);
                break;
            case 'chat':
                this.updateChatContext(data);
                break;
            case 'combat':
                this.updateCombatContext(data);
                break;
            case 'character':
                this.updateCharacterContext(data);
                break;
            case 'target':
                this.updateTargetContext(data);
                break;
        }

        // Add to history
        this.contextHistory.push(contextEntry);
        
        // Trim history if too long
        if (this.contextHistory.length > this.maxHistorySize) {
            this.contextHistory.shift();
        }

        console.log('VAI: Context updated:', type, data);
    }

    /**
     * Update command context
     */
    updateCommandContext(data) {
        this.lastAction = {
            type: 'command',
            text: data.text,
            timestamp: Date.now()
        };
    }

    /**
     * Update result context
     */
    updateResultContext(data) {
        if (data.intent) {
            this.lastAction = {
                type: 'action',
                action: data.intent.action,
                target: data.intent.target,
                timestamp: Date.now()
            };
        }

        if (data.result && data.result.success) {
            // Update relevant context based on successful action
            this.updateActionResultContext(data.result);
        }
    }

    /**
     * Update action result context
     */
    updateActionResultContext(result) {
        // Update target if action involved targeting
        if (result.data?.target) {
            this.currentTarget = result.data.target;
        }

        // Update character state if action affected character
        if (result.data?.character) {
            this.characterState = {
                ...this.characterState,
                ...result.data.character
            };
        }
    }

    /**
     * Update chat context
     */
    updateChatContext(data) {
        // Extract relevant information from chat messages
        const message = data.message;
        
        if (message.content && message.content.includes('VAI:')) {
            // Parse VAI system messages
            this.parseVAIMessage(message.content);
        }
    }

    /**
     * Parse VAI system messages
     */
    parseVAIMessage(content) {
        // Extract action and target information from VAI messages
        const actionMatch = content.match(/VAI: (\w+)/);
        if (actionMatch) {
            this.lastAction = {
                type: 'system',
                action: actionMatch[1],
                timestamp: Date.now()
            };
        }
    }

    /**
     * Update combat context
     */
    updateCombatContext(data) {
        this.combatState = {
            inCombat: data.inCombat || false,
            turn: data.turn || null,
            round: data.round || null,
            initiative: data.initiative || null,
            timestamp: Date.now()
        };
    }

    /**
     * Update character context
     */
    updateCharacterContext(data) {
        this.characterState = {
            ...this.characterState,
            ...data,
            timestamp: Date.now()
        };
    }

    /**
     * Update target context
     */
    updateTargetContext(data) {
        this.currentTarget = {
            name: data.name,
            id: data.id,
            type: data.type,
            distance: data.distance,
            timestamp: Date.now()
        };
    }

    /**
     * Get current context
     */
    getCurrentContext() {
        return {
            currentTarget: this.currentTarget,
            lastAction: this.lastAction,
            combatState: this.combatState,
            characterState: this.characterState,
            gameContext: this.gameContext,
            timestamp: Date.now()
        };
    }

    /**
     * Get contextual suggestions for commands
     */
    getContextualSuggestions() {
        const suggestions = [];

        // Add suggestions based on current target
        if (this.currentTarget) {
            suggestions.push(`attack ${this.currentTarget.name}`);
            suggestions.push(`target ${this.currentTarget.name}`);
        }

        // Add suggestions based on last action
        if (this.lastAction) {
            switch (this.lastAction.action) {
                case 'attack':
                    suggestions.push('raise shield');
                    suggestions.push('move');
                    break;
                case 'move':
                    suggestions.push('attack');
                    suggestions.push('seek');
                    break;
                case 'castSpell':
                    suggestions.push('move');
                    suggestions.push('target');
                    break;
            }
        }

        // Add suggestions based on combat state
        if (this.combatState?.inCombat) {
            suggestions.push('raise shield');
            suggestions.push('seek');
            suggestions.push('hide');
        }

        // Add suggestions based on character state
        if (this.characterState) {
            if (this.characterState.hp && this.characterState.hp.current < this.characterState.hp.max * 0.5) {
                suggestions.push('treat wounds');
                suggestions.push('use healing potion');
            }
        }

        return suggestions;
    }

    /**
     * Get contextual information for command interpretation
     */
    getContextualInfo() {
        return {
            characterName: this.characterState?.name || 'Unknown',
            currentTarget: this.currentTarget?.name || 'None',
            lastAction: this.lastAction?.action || 'None',
            combatState: this.combatState?.inCombat ? 'In Combat' : 'Out of Combat',
            availableActions: this.getAvailableActions()
        };
    }

    /**
     * Get available actions based on context
     */
    getAvailableActions() {
        const actions = ['attack', 'move', 'castSpell', 'skillCheck', 'target', 'help', 'status'];

        // Add system-specific actions
        const system = game.system.id;
        if (system === 'pf2e') {
            actions.push('seek', 'raiseShield', 'hide', 'demoralize', 'feint', 'treatWounds');
        } else if (system === 'pf1') {
            actions.push('fullAttack', 'charge');
        }

        return actions;
    }

    /**
     * Check if action is contextually appropriate
     */
    isActionContextuallyAppropriate(action, intent) {
        // Check if action makes sense in current context
        switch (action) {
            case 'attack':
                return this.currentTarget || intent.target;
            case 'move':
                return true; // Always appropriate
            case 'castSpell':
                return true; // Always appropriate
            case 'raiseShield':
                return this.combatState?.inCombat;
            case 'treatWounds':
                return this.characterState?.hp?.current < this.characterState?.hp?.max;
            default:
                return true;
        }
    }

    /**
     * Get contextual confidence boost
     */
    getContextualConfidenceBoost(intent) {
        let boost = 0;

        // Boost confidence if target matches current target
        if (intent.target && this.currentTarget && 
            intent.target.toLowerCase() === this.currentTarget.name.toLowerCase()) {
            boost += 0.1;
        }

        // Boost confidence if action follows logically from last action
        if (this.lastAction) {
            if (this.lastAction.action === 'target' && intent.action === 'attack') {
                boost += 0.1;
            }
            if (this.lastAction.action === 'attack' && intent.action === 'raiseShield') {
                boost += 0.1;
            }
        }

        // Boost confidence if action is contextually appropriate
        if (this.isActionContextuallyAppropriate(intent.action, intent)) {
            boost += 0.05;
        }

        return Math.min(boost, 0.3); // Cap at 0.3
    }

    /**
     * Get context history
     */
    getContextHistory(limit = 10) {
        return this.contextHistory.slice(-limit);
    }

    /**
     * Clear context history
     */
    clearContextHistory() {
        this.contextHistory = [];
        console.log('VAI: Context history cleared');
    }

    /**
     * Export context for debugging
     */
    exportContext() {
        return {
            currentTarget: this.currentTarget,
            lastAction: this.lastAction,
            combatState: this.combatState,
            characterState: this.characterState,
            gameContext: this.gameContext,
            contextHistory: this.contextHistory,
            timestamp: Date.now()
        };
    }

    /**
     * Import context from data
     */
    importContext(data) {
        this.currentTarget = data.currentTarget || null;
        this.lastAction = data.lastAction || null;
        this.combatState = data.combatState || null;
        this.characterState = data.characterState || null;
        this.gameContext = data.gameContext || null;
        this.contextHistory = data.contextHistory || [];
        
        console.log('VAI: Context imported');
    }

    /**
     * Get context statistics
     */
    getContextStats() {
        return {
            historySize: this.contextHistory.length,
            maxHistorySize: this.maxHistorySize,
            hasTarget: !!this.currentTarget,
            hasLastAction: !!this.lastAction,
            inCombat: this.combatState?.inCombat || false,
            hasCharacterState: !!this.characterState
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearContextHistory();
        this.currentTarget = null;
        this.lastAction = null;
        this.combatState = null;
        this.characterState = null;
        this.gameContext = null;
        
        console.log('VAI: Context manager cleanup completed');
    }
} 