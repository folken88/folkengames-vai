/**
 * VAI Action Executor
 * Executes Foundry VTT actions based on parsed intents
 */

class ActionExecutor {
    constructor() {
        this.availableActions = this.initializeActions();
        this.systemActions = this.initializeSystemActions();
        this.currentTarget = null;
        this.lastAction = null;
    }

    /**
     * Initialize available actions
     */
    initializeActions() {
        return {
            // Basic actions
            help: this.showHelp.bind(this),
            status: this.showStatus.bind(this),
            
            // Combat actions
            attack: this.executeAttack.bind(this),
            target: this.executeTarget.bind(this),
            
            // Movement
            move: this.executeMove.bind(this),
            
            // Skills and checks
            skillCheck: this.executeSkillCheck.bind(this),
            
            // Spells
            castSpell: this.executeCastSpell.bind(this),
            
            // Character management
            equipItem: this.executeEquipItem.bind(this),
            addSpell: this.executeAddSpell.bind(this),
            
            // Information queries
            query: this.executeQuery.bind(this)
        };
    }

    /**
     * Initialize system-specific actions
     */
    initializeSystemActions() {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            return {
                seek: this.executeSeek.bind(this),
                raiseShield: this.executeRaiseShield.bind(this),
                hide: this.executeHide.bind(this),
                demoralize: this.executeDemoralize.bind(this),
                feint: this.executeFeint.bind(this),
                treatWounds: this.executeTreatWounds.bind(this)
            };
        } else if (system === 'pf1') {
            return {
                // PF1 specific actions
                fullAttack: this.executeFullAttack.bind(this),
                charge: this.executeCharge.bind(this),
                castSpell: this.executeCastSpellPF1.bind(this)
            };
        }
        
        return {};
    }

    /**
     * Execute action based on intent
     */
    async executeAction(intent) {
        try {
            console.log('VAI: Executing action:', intent);
            
            // Validate intent
            const validation = this.validateIntent(intent);
            if (!validation.valid) {
                throw new Error(`Invalid intent: ${validation.errors.join(', ')}`);
            }
            
            // Check permissions
            if (!this.checkPermissions(intent)) {
                throw new Error('Insufficient permissions for this action');
            }
            
            // Get action function
            const actionFunction = this.getActionFunction(intent.action);
            if (!actionFunction) {
                throw new Error(`Unknown action: ${intent.action}`);
            }
            
            // Execute action
            const result = await actionFunction(intent);
            
            // Update context
            this.lastAction = intent;
            if (intent.target) {
                this.currentTarget = intent.target;
            }
            
            console.log('VAI: Action executed successfully:', result);
            return result;
            
        } catch (error) {
            console.error('VAI: Action execution failed:', error);
            throw error;
        }
    }

    /**
     * Get action function
     */
    getActionFunction(action) {
        return this.availableActions[action] || this.systemActions[action];
    }

    /**
     * Validate intent
     */
    validateIntent(intent) {
        const errors = [];
        
        if (!intent.action) {
            errors.push('No action specified');
        }
        
        // Check required parameters for specific actions
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
     * Check permissions for action
     */
    checkPermissions(intent) {
        const character = game.user.character;
        if (!character) {
            return false;
        }
        
        // Check if user owns the character
        if (!character.isOwner) {
            return false;
        }
        
        // Additional permission checks can be added here
        return true;
    }

    /**
     * Get current character
     */
    getCurrentCharacter() {
        return game.user.character;
    }

    /**
     * Find token by name
     */
    findTokenByName(name) {
        const tokens = canvas.tokens.placeables;
        return tokens.find(token => 
            token.name.toLowerCase().includes(name.toLowerCase()) ||
            token.actor?.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    /**
     * Find item by name
     */
    findItemByName(character, itemName) {
        return character.items.find(item => 
            item.name.toLowerCase().includes(itemName.toLowerCase())
        );
    }

    /**
     * Find spell by name
     */
    findSpellByName(character, spellName) {
        return character.items.find(item => 
            item.type === 'spell' && 
            item.name.toLowerCase().includes(spellName.toLowerCase())
        );
    }

    // === Basic Actions ===

    /**
     * Show help information
     */
    async showHelp(intent) {
        const commands = this.getAvailableCommands();
        const helpText = commands.map(cmd => 
            `${cmd.action}: ${cmd.examples.join(', ')}`
        ).join('\n');
        
        return {
            success: true,
            message: 'Available commands',
            data: { commands, helpText }
        };
    }

    /**
     * Show character status
     */
    async showStatus(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const status = {
            name: character.name,
            hp: character.system.attributes?.hp?.value || 'Unknown',
            maxHp: character.system.attributes?.hp?.max || 'Unknown',
            level: character.system.details?.level?.value || 'Unknown'
        };
        
        return {
            success: true,
            message: `Status: ${status.name}, HP ${status.hp}/${status.maxHp}, Level ${status.level}`,
            data: status
        };
    }

    // === Combat Actions ===

    /**
     * Execute attack
     */
    async executeAttack(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        // Find target token
        const targetToken = this.findTokenByName(intent.target);
        if (!targetToken) {
            throw new Error(`Target not found: ${intent.target}`);
        }
        
        // Find weapon if specified
        let weapon = null;
        if (intent.weapon) {
            weapon = this.findItemByName(character, intent.weapon);
        }
        
        // If no weapon specified, use first available weapon
        if (!weapon) {
            weapon = character.items.find(item => item.type === 'weapon');
        }
        
        if (!weapon) {
            throw new Error('No weapon available');
        }
        
        // Execute attack based on system
        const system = game.system.id;
        if (system === 'pf2e') {
            return await this.executeAttackPF2e(character, weapon, targetToken);
        } else if (system === 'pf1') {
            return await this.executeAttackPF1(character, weapon, targetToken);
        } else {
            throw new Error('Unsupported game system');
        }
    }

    /**
     * Execute target selection
     */
    async executeTarget(intent) {
        const targetToken = this.findTokenByName(intent.target);
        if (!targetToken) {
            throw new Error(`Target not found: ${intent.target}`);
        }
        
        // Set as current target
        this.currentTarget = targetToken;
        
        return {
            success: true,
            message: `Targeted ${targetToken.name}`,
            data: { target: targetToken }
        };
    }

    // === Movement Actions ===

    /**
     * Execute movement
     */
    async executeMove(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const token = character.getActiveTokens()[0];
        if (!token) {
            throw new Error('No active token found');
        }
        
        // Handle different movement types
        if (intent.direction) {
            return await this.moveInDirection(token, intent.direction, intent.distance);
        } else if (intent.destination) {
            return await this.moveToDestination(token, intent.destination);
        } else {
            throw new Error('No direction or destination specified');
        }
    }

    /**
     * Move in specific direction
     */
    async moveInDirection(token, direction, distance) {
        const moveDistance = distance?.value || 30; // Default 30 feet
        
        // Calculate new position based on direction
        const currentPos = token.center;
        let newPos = { x: currentPos.x, y: currentPos.y };
        
        const gridSize = canvas.grid.size;
        const pixelsPerFoot = gridSize / 5; // Assuming 5 feet per grid square
        const movePixels = moveDistance * pixelsPerFoot;
        
        switch (direction.toLowerCase()) {
            case 'north':
                newPos.y -= movePixels;
                break;
            case 'south':
                newPos.y += movePixels;
                break;
            case 'east':
                newPos.x += movePixels;
                break;
            case 'west':
                newPos.x -= movePixels;
                break;
            case 'northeast':
                newPos.x += movePixels * 0.707;
                newPos.y -= movePixels * 0.707;
                break;
            case 'northwest':
                newPos.x -= movePixels * 0.707;
                newPos.y -= movePixels * 0.707;
                break;
            case 'southeast':
                newPos.x += movePixels * 0.707;
                newPos.y += movePixels * 0.707;
                break;
            case 'southwest':
                newPos.x -= movePixels * 0.707;
                newPos.y += movePixels * 0.707;
                break;
            default:
                throw new Error(`Unknown direction: ${direction}`);
        }
        
        // Move token
        await token.update({ x: newPos.x, y: newPos.y });
        
        return {
            success: true,
            message: `Moved ${moveDistance} feet ${direction}`,
            data: { direction, distance: moveDistance, newPosition: newPos }
        };
    }

    /**
     * Move to destination
     */
    async moveToDestination(token, destination) {
        // This would require more complex pathfinding
        // For now, just acknowledge the command
        return {
            success: true,
            message: `Moving towards ${destination}`,
            data: { destination }
        };
    }

    // === Skill Actions ===

    /**
     * Execute skill check
     */
    async executeSkillCheck(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const system = game.system.id;
        if (system === 'pf2e') {
            return await this.executeSkillCheckPF2e(character, intent.skill);
        } else if (system === 'pf1') {
            return await this.executeSkillCheckPF1(character, intent.skill);
        } else {
            throw new Error('Unsupported game system');
        }
    }

    // === Spell Actions ===

    /**
     * Execute spell casting
     */
    async executeCastSpell(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const spell = this.findSpellByName(character, intent.spell);
        if (!spell) {
            throw new Error(`Spell not found: ${intent.spell}`);
        }
        
        const system = game.system.id;
        if (system === 'pf2e') {
            return await this.executeCastSpellPF2e(character, spell, intent.target);
        } else if (system === 'pf1') {
            return await this.executeCastSpellPF1(character, spell, intent.target);
        } else {
            throw new Error('Unsupported game system');
        }
    }

    // === Character Management ===

    /**
     * Execute item equipping
     */
    async executeEquipItem(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const item = this.findItemByName(character, intent.item);
        if (!item) {
            throw new Error(`Item not found: ${intent.item}`);
        }
        
        // Equip the item
        await item.update({ 'system.equipped': true });
        
        return {
            success: true,
            message: `Equipped ${item.name}`,
            data: { item: item.name }
        };
    }

    /**
     * Execute adding spell
     */
    async executeAddSpell(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        // This would typically involve searching compendiums
        // For now, just acknowledge the command
        return {
            success: true,
            message: `Adding ${intent.spell} to spell list`,
            data: { spell: intent.spell }
        };
    }

    // === Information Queries ===

    /**
     * Execute information query
     */
    async executeQuery(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        switch (intent.query) {
            case 'itemCharges':
                return await this.queryItemCharges(character);
            case 'hitPoints':
                return await this.queryHitPoints(character);
            case 'spellSlots':
                return await this.querySpellSlots(character);
            case 'distance':
                return await this.queryDistance();
            default:
                return await this.queryGeneral(character, intent);
        }
    }

    /**
     * Query item charges
     */
    async queryItemCharges(character) {
        const items = character.items.filter(item => 
            item.system.charges || item.system.uses
        );
        
        const chargeInfo = items.map(item => ({
            name: item.name,
            charges: item.system.charges?.value || item.system.uses?.value || 0,
            max: item.system.charges?.max || item.system.uses?.max || 0
        }));
        
        return {
            success: true,
            message: `Items with charges: ${chargeInfo.map(i => `${i.name} (${i.charges}/${i.max})`).join(', ')}`,
            data: { items: chargeInfo }
        };
    }

    /**
     * Query hit points
     */
    async queryHitPoints(character) {
        const hp = character.system.attributes?.hp;
        const current = hp?.value || 0;
        const max = hp?.max || 0;
        
        return {
            success: true,
            message: `Hit Points: ${current}/${max}`,
            data: { current, max }
        };
    }

    /**
     * Query spell slots
     */
    async querySpellSlots(character) {
        const system = game.system.id;
        if (system === 'pf2e') {
            return await this.querySpellSlotsPF2e(character);
        } else if (system === 'pf1') {
            return await this.querySpellSlotsPF1(character);
        } else {
            return {
                success: true,
                message: 'Spell slot information not available',
                data: {}
            };
        }
    }

    /**
     * Query distance to target
     */
    async queryDistance() {
        if (!this.currentTarget) {
            throw new Error('No target selected');
        }
        
        const character = this.getCurrentCharacter();
        const characterToken = character.getActiveTokens()[0];
        
        if (!characterToken) {
            throw new Error('No active token found');
        }
        
        const distance = canvas.grid.measureDistance(characterToken.center, this.currentTarget.center);
        
        return {
            success: true,
            message: `Distance to target: ${Math.round(distance)} feet`,
            data: { distance }
        };
    }

    /**
     * Query general information
     */
    async queryGeneral(character, intent) {
        return {
            success: true,
            message: `Query: ${intent.originalText}`,
            data: { query: intent.originalText }
        };
    }

    // === System-Specific Actions ===

    /**
     * Execute PF2e attack
     */
    async executeAttackPF2e(character, weapon, targetToken) {
        // Use PF2e action system
        const action = await weapon.use();
        
        return {
            success: true,
            message: `Attacked ${targetToken.name} with ${weapon.name}`,
            data: { weapon: weapon.name, target: targetToken.name, action }
        };
    }

    /**
     * Execute PF1 attack
     */
    async executeAttackPF1(character, weapon, targetToken) {
        // Use PF1 attack system
        const roll = await weapon.roll();
        
        return {
            success: true,
            message: `Attacked ${targetToken.name} with ${weapon.name}`,
            data: { weapon: weapon.name, target: targetToken.name, roll }
        };
    }

    /**
     * Execute PF2e skill check
     */
    async executeSkillCheckPF2e(character, skill) {
        const skillCheck = await character.rollSkill(skill);
        
        return {
            success: true,
            message: `Rolled ${skill} check`,
            data: { skill, roll: skillCheck }
        };
    }

    /**
     * Execute PF1 skill check
     */
    async executeSkillCheckPF1(character, skill) {
        const skillCheck = await character.rollSkill(skill);
        
        return {
            success: true,
            message: `Rolled ${skill} check`,
            data: { skill, roll: skillCheck }
        };
    }

    /**
     * Execute PF2e spell casting
     */
    async executeCastSpellPF2e(character, spell, target) {
        const castResult = await spell.cast();
        
        return {
            success: true,
            message: `Cast ${spell.name}`,
            data: { spell: spell.name, target, result: castResult }
        };
    }

    /**
     * Execute PF1 spell casting
     */
    async executeCastSpellPF1(character, spell, target) {
        const castResult = await spell.cast();
        
        return {
            success: true,
            message: `Cast ${spell.name}`,
            data: { spell: spell.name, target, result: castResult }
        };
    }

    // === PF2e Specific Actions ===

    /**
     * Execute seek action
     */
    async executeSeek(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const seekAction = await game.pf2e.actions.seek({ event: new Event('click') });
        
        return {
            success: true,
            message: 'Performed seek action',
            data: { action: seekAction }
        };
    }

    /**
     * Execute raise shield
     */
    async executeRaiseShield(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const raiseShieldAction = await game.pf2e.actions.raiseAShield({ actors: [character] });
        
        return {
            success: true,
            message: 'Raised shield',
            data: { action: raiseShieldAction }
        };
    }

    /**
     * Execute hide action
     */
    async executeHide(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const hideAction = await game.pf2e.actions.hide({ event: new Event('click') });
        
        return {
            success: true,
            message: 'Performed hide action',
            data: { action: hideAction }
        };
    }

    /**
     * Execute demoralize action
     */
    async executeDemoralize(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const demoralizeAction = await game.pf2e.actions.demoralize({ event: new Event('click') });
        
        return {
            success: true,
            message: 'Performed demoralize action',
            data: { action: demoralizeAction }
        };
    }

    /**
     * Execute feint action
     */
    async executeFeint(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const feintAction = await game.pf2e.actions.feint({ event: new Event('click') });
        
        return {
            success: true,
            message: 'Performed feint action',
            data: { action: feintAction }
        };
    }

    /**
     * Execute treat wounds
     */
    async executeTreatWounds(intent) {
        const character = this.getCurrentCharacter();
        if (!character) {
            throw new Error('No character selected');
        }
        
        const treatWoundsAction = await game.pf2e.actions.treatWounds({ event: new Event('click') });
        
        return {
            success: true,
            message: 'Performed treat wounds',
            data: { action: treatWoundsAction }
        };
    }

    // === Utility Methods ===

    /**
     * Get available commands
     */
    getAvailableCommands() {
        const commands = [];
        
        // Add basic commands
        Object.keys(this.availableActions).forEach(action => {
            commands.push({
                action,
                examples: this.getCommandExamples(action)
            });
        });
        
        // Add system-specific commands
        Object.keys(this.systemActions).forEach(action => {
            commands.push({
                action,
                examples: this.getCommandExamples(action)
            });
        });
        
        return commands;
    }

    /**
     * Get command examples
     */
    getCommandExamples(action) {
        const examples = {
            attack: ['attack the goblin', 'shoot an arrow at bob'],
            move: ['move north', 'walk to the door'],
            skillCheck: ['roll stealth', 'check perception'],
            castSpell: ['cast fireball', 'use invisibility'],
            seek: ['seek', 'search the area'],
            raiseShield: ['raise shield', 'lift my shield'],
            hide: ['hide', 'stealth'],
            demoralize: ['demoralize', 'intimidate'],
            feint: ['feint', 'distract'],
            treatWounds: ['treat wounds', 'heal injuries']
        };
        
        return examples[action] || [];
    }

    /**
     * Get executor status
     */
    getStatus() {
        return {
            currentTarget: this.currentTarget?.name || null,
            lastAction: this.lastAction?.action || null,
            availableActions: Object.keys(this.availableActions),
            systemActions: Object.keys(this.systemActions),
            gameSystem: game.system.id
        };
    }
} 