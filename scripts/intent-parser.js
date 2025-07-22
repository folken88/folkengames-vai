/**
 * VAI Intent Parser
 * Analyzes speech text and converts it into structured commands
 */

class IntentParser {
    constructor() {
        this.commandPatterns = this.initializePatterns();
        this.contextKeywords = this.initializeContextKeywords();
        this.confidenceThreshold = 0.8;
    }

    /**
     * Initialize command patterns
     */
    initializePatterns() {
        return {
            // Combat actions
            attack: {
                patterns: [
                    /(?:attack|shoot|strike|hit)\s+(.+)/i,
                    /(?:use|wield)\s+(.+)\s+(?:to\s+)?(?:attack|hit|strike)/i,
                    /(?:attack|shoot|strike|hit)\s+(?:with|using)\s+(.+)/i
                ],
                confidence: 0.9
            },
            
            target: {
                patterns: [
                    /(?:target|focus on|aim at)\s+(.+)/i,
                    /(?:select|choose)\s+(.+)\s+(?:as\s+)?(?:target)/i
                ],
                confidence: 0.85
            },
            
            // Movement
            move: {
                patterns: [
                    /(?:move|go|walk|run)\s+(.+)/i,
                    /(?:move|go|walk|run)\s+(?:to|towards|toward)\s+(.+)/i,
                    /(?:move|go|walk|run)\s+(\d+)\s+(?:feet|ft)/i,
                    /(?:move|go|walk|run)\s+(?:north|south|east|west|northeast|northwest|southeast|southwest)/i
                ],
                confidence: 0.9
            },
            
            // Skills and checks
            skillCheck: {
                patterns: [
                    /(?:roll|check)\s+(.+)/i,
                    /(?:make|do)\s+(?:a\s+)?(?:roll|check)\s+(?:for\s+)?(.+)/i,
                    /(?:roll|check)\s+(.+)\s+(?:skill|check)/i
                ],
                confidence: 0.85
            },
            
            // Spells
            castSpell: {
                patterns: [
                    /(?:cast|use)\s+(.+)/i,
                    /(?:cast|use)\s+(.+)\s+(?:spell)/i,
                    /(?:cast|use)\s+(.+)\s+(?:on|at|to)\s+(.+)/i
                ],
                confidence: 0.9
            },
            
            // Information queries
            query: {
                patterns: [
                    /(?:how many|what is|tell me|show)\s+(.+)/i,
                    /(?:what's|whats)\s+(.+)/i,
                    /(?:check|look up)\s+(.+)/i
                ],
                confidence: 0.8
            },
            
            // Character management
            equipItem: {
                patterns: [
                    /(?:equip|use|wear)\s+(.+)/i,
                    /(?:put on|don)\s+(.+)/i
                ],
                confidence: 0.85
            },
            
            addSpell: {
                patterns: [
                    /(?:add|learn)\s+(.+)\s+(?:to\s+)?(?:spells?|spell list)/i,
                    /(?:add|learn)\s+(.+)\s+(?:spell)/i
                ],
                confidence: 0.8
            },
            
            // PF2e specific actions
            seek: {
                patterns: [
                    /(?:seek|search|look around)/i,
                    /(?:use|perform)\s+(?:seek|search)/i
                ],
                confidence: 0.9
            },
            
            raiseShield: {
                patterns: [
                    /(?:raise|lift)\s+(?:shield|my shield)/i,
                    /(?:use|perform)\s+(?:raise shield)/i
                ],
                confidence: 0.9
            },
            
            hide: {
                patterns: [
                    /(?:hide|stealth|sneak)/i,
                    /(?:use|perform)\s+(?:hide|stealth)/i
                ],
                confidence: 0.9
            },
            
            demoralize: {
                patterns: [
                    /(?:demoralize|intimidate)/i,
                    /(?:use|perform)\s+(?:demoralize|intimidate)/i
                ],
                confidence: 0.9
            },
            
            feint: {
                patterns: [
                    /(?:feint|distract)/i,
                    /(?:use|perform)\s+(?:feint)/i
                ],
                confidence: 0.9
            },
            
            treatWounds: {
                patterns: [
                    /(?:treat|heal)\s+(?:wounds?|injuries?)/i,
                    /(?:use|perform)\s+(?:treat wounds)/i
                ],
                confidence: 0.9
            },
            
            // Utility commands
            help: {
                patterns: [
                    /(?:help|what can I do|commands|options)/i
                ],
                confidence: 0.95
            },
            
            status: {
                patterns: [
                    /(?:status|how am I|my status)/i,
                    /(?:what's|whats)\s+(?:my|the)\s+(?:status|condition)/i
                ],
                confidence: 0.85
            }
        };
    }

    /**
     * Initialize context keywords
     */
    initializeContextKeywords() {
        return {
            targets: ['enemy', 'ally', 'friend', 'foe', 'target', 'creature', 'monster', 'npc', 'player'],
            directions: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'up', 'down', 'forward', 'back', 'left', 'right'],
            distances: ['close', 'near', 'far', 'adjacent', 'within', 'beyond'],
            weapons: ['sword', 'axe', 'bow', 'arrow', 'crossbow', 'dagger', 'mace', 'hammer', 'spear', 'staff', 'wand', 'rod'],
            spells: ['fireball', 'magic missile', 'cure wounds', 'heal', 'invisibility', 'fly', 'teleport', 'shield', 'armor', 'lightning bolt'],
            skills: ['acrobatics', 'athletics', 'deception', 'diplomacy', 'intimidation', 'medicine', 'nature', 'occultism', 'performance', 'religion', 'society', 'stealth', 'survival', 'thievery']
        };
    }

    /**
     * Parse speech text into structured intent
     */
    parseIntent(speechText) {
        if (!speechText || !speechText.trim()) {
            return {
                action: 'none',
                confidence: 0,
                message: 'No speech detected'
            };
        }

        const normalizedText = this.normalizeText(speechText);
        console.log('VAI: Parsing intent for:', normalizedText);

        // Try to match against patterns
        for (const [action, config] of Object.entries(this.commandPatterns)) {
            for (const pattern of config.patterns) {
                const match = normalizedText.match(pattern);
                if (match) {
                    const intent = this.buildIntent(action, match, config.confidence, normalizedText);
                    console.log('VAI: Intent matched:', intent);
                    return intent;
                }
            }
        }

        // No pattern match found
        return {
            action: 'unknown',
            confidence: 0.1,
            message: 'Command not recognized',
            originalText: speechText
        };
    }

    /**
     * Build intent object from pattern match
     */
    buildIntent(action, match, baseConfidence, originalText) {
        const intent = {
            action: action,
            confidence: baseConfidence,
            originalText: originalText,
            timestamp: Date.now()
        };

        // Extract parameters based on action type
        switch (action) {
            case 'attack':
                intent.target = this.extractTarget(match[1]);
                intent.weapon = this.extractWeapon(match[1]);
                break;
                
            case 'target':
                intent.target = this.extractTarget(match[1]);
                break;
                
            case 'move':
                intent.direction = this.extractDirection(match[1]);
                intent.distance = this.extractDistance(match[1]);
                intent.destination = this.extractDestination(match[1]);
                break;
                
            case 'skillCheck':
                intent.skill = this.extractSkill(match[1]);
                break;
                
            case 'castSpell':
                intent.spell = this.extractSpell(match[1]);
                intent.target = this.extractTarget(match[1]);
                break;
                
            case 'query':
                intent.query = this.extractQuery(match[1]);
                break;
                
            case 'equipItem':
                intent.item = this.extractItem(match[1]);
                break;
                
            case 'addSpell':
                intent.spell = this.extractSpell(match[1]);
                break;
        }

        // Adjust confidence based on context
        intent.confidence = this.adjustConfidence(intent, baseConfidence);

        return intent;
    }

    /**
     * Normalize text for better matching
     */
    normalizeText(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    }

    /**
     * Extract target from text
     */
    extractTarget(text) {
        // Look for target keywords
        const targetMatch = text.match(/(enemy|ally|friend|foe|target|creature|monster|npc|player|bob|goblin|orc|dragon)/i);
        if (targetMatch) {
            return targetMatch[1];
        }
        
        // Look for names (simple heuristic)
        const words = text.split(' ');
        for (const word of words) {
            if (word.length > 2 && /^[A-Za-z]+$/.test(word)) {
                return word;
            }
        }
        
        return null;
    }

    /**
     * Extract weapon from text
     */
    extractWeapon(text) {
        const weaponMatch = text.match(/(sword|axe|bow|arrow|crossbow|dagger|mace|hammer|spear|staff|wand|rod)/i);
        return weaponMatch ? weaponMatch[1] : null;
    }

    /**
     * Extract direction from text
     */
    extractDirection(text) {
        const directionMatch = text.match(/(north|south|east|west|northeast|northwest|southeast|southwest|up|down|forward|back|left|right)/i);
        return directionMatch ? directionMatch[1] : null;
    }

    /**
     * Extract distance from text
     */
    extractDistance(text) {
        const distanceMatch = text.match(/(\d+)\s*(feet|ft|meters?|m)/i);
        if (distanceMatch) {
            return {
                value: parseInt(distanceMatch[1]),
                unit: distanceMatch[2]
            };
        }
        return null;
    }

    /**
     * Extract destination from text
     */
    extractDestination(text) {
        // Look for destination keywords
        const destMatch = text.match(/(door|wall|corner|cover|tree|rock|building|house|tower)/i);
        return destMatch ? destMatch[1] : null;
    }

    /**
     * Extract skill from text
     */
    extractSkill(text) {
        const skillMatch = text.match(/(acrobatics|athletics|deception|diplomacy|intimidation|medicine|nature|occultism|performance|religion|society|stealth|survival|thievery|perception|fortitude|reflex|will)/i);
        return skillMatch ? skillMatch[1] : null;
    }

    /**
     * Extract spell from text
     */
    extractSpell(text) {
        const spellMatch = text.match(/(fireball|magic missile|cure wounds|heal|invisibility|fly|teleport|shield|armor|lightning bolt|burning hands|charm person|detect magic)/i);
        return spellMatch ? spellMatch[1] : null;
    }

    /**
     * Extract query from text
     */
    extractQuery(text) {
        // Look for specific query types
        if (text.includes('charges') || text.includes('charge')) {
            return 'itemCharges';
        }
        if (text.includes('hit points') || text.includes('hp')) {
            return 'hitPoints';
        }
        if (text.includes('spell slots') || text.includes('spell slot')) {
            return 'spellSlots';
        }
        if (text.includes('distance') || text.includes('far')) {
            return 'distance';
        }
        return 'general';
    }

    /**
     * Extract item from text
     */
    extractItem(text) {
        const itemMatch = text.match(/(sword|axe|bow|armor|shield|helmet|boots|gloves|ring|amulet|potion|scroll|wand|staff|rod)/i);
        return itemMatch ? itemMatch[1] : null;
    }

    /**
     * Adjust confidence based on context
     */
    adjustConfidence(intent, baseConfidence) {
        let confidence = baseConfidence;

        // Reduce confidence if required parameters are missing
        if (intent.action === 'attack' && !intent.target) {
            confidence -= 0.2;
        }
        if (intent.action === 'move' && !intent.direction && !intent.destination) {
            confidence -= 0.1;
        }
        if (intent.action === 'skillCheck' && !intent.skill) {
            confidence -= 0.2;
        }

        // Increase confidence for exact matches
        if (intent.action === 'help' || intent.action === 'status') {
            confidence += 0.1;
        }

        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Get available commands for help
     */
    getAvailableCommands() {
        return Object.keys(this.commandPatterns).map(action => ({
            action: action,
            examples: this.getCommandExamples(action)
        }));
    }

    /**
     * Get examples for a specific command
     */
    getCommandExamples(action) {
        const examples = {
            attack: ['attack the goblin', 'shoot an arrow at bob', 'strike with my sword'],
            move: ['move north', 'walk to the door', 'run 30 feet'],
            skillCheck: ['roll stealth', 'check perception', 'make an athletics check'],
            castSpell: ['cast fireball', 'use invisibility', 'cast heal on ally'],
            query: ['how many charges in my wand', 'what are my hit points', 'show my spell slots'],
            equipItem: ['equip my sword', 'wear armor', 'use my ring'],
            help: ['help', 'what can I do', 'show commands']
        };
        
        return examples[action] || [];
    }

    /**
     * Validate intent before execution
     */
    validateIntent(intent) {
        const errors = [];

        // Check required parameters
        if (intent.action === 'attack' && !intent.target) {
            errors.push('Target required for attack');
        }
        if (intent.action === 'skillCheck' && !intent.skill) {
            errors.push('Skill required for skill check');
        }
        if (intent.action === 'castSpell' && !intent.spell) {
            errors.push('Spell required for casting');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get parser statistics
     */
    getStats() {
        return {
            totalPatterns: Object.keys(this.commandPatterns).length,
            supportedActions: Object.keys(this.commandPatterns),
            confidenceThreshold: this.confidenceThreshold,
            contextKeywords: Object.keys(this.contextKeywords)
        };
    }
} 