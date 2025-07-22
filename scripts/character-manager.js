/**
 * VAI Character Manager
 * Handles character-specific actions and state management
 */

class CharacterManager {
    constructor() {
        this.activeCharacter = null;
        this.characterProfiles = {};
        this.characterState = {};
        this.characterActions = {};
    }

    /**
     * Set active character
     */
    setActiveCharacter(character) {
        this.activeCharacter = character;
        
        if (character) {
            this.updateCharacterState(character);
            this.loadCharacterProfile(character);
        }
        
        console.log('VAI: Active character set to:', character?.name);
    }

    /**
     * Get active character
     */
    getActiveCharacter() {
        return this.activeCharacter;
    }

    /**
     * Update character state
     */
    updateCharacterState(character, changes = {}) {
        if (!character) return;

        this.characterState[character.id] = {
            id: character.id,
            name: character.name,
            type: character.type,
            hp: this.getCharacterHP(character),
            level: this.getCharacterLevel(character),
            class: this.getCharacterClass(character),
            abilities: this.getCharacterAbilities(character),
            skills: this.getCharacterSkills(character),
            spells: this.getCharacterSpells(character),
            items: this.getCharacterItems(character),
            conditions: this.getCharacterConditions(character),
            timestamp: Date.now(),
            ...changes
        };

        console.log('VAI: Character state updated for:', character.name);
    }

    /**
     * Get character HP
     */
    getCharacterHP(character) {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            const hp = character.system.attributes?.hp;
            return {
                current: hp?.value || 0,
                max: hp?.max || 0,
                temp: hp?.temp || 0
            };
        } else if (system === 'pf1') {
            const hp = character.system.attributes?.hp;
            return {
                current: hp?.value || 0,
                max: hp?.max || 0,
                nonlethal: hp?.nonlethal || 0
            };
        }
        
        return { current: 0, max: 0 };
    }

    /**
     * Get character level
     */
    getCharacterLevel(character) {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            return character.system.details?.level?.value || 1;
        } else if (system === 'pf1') {
            return character.system.details?.level?.value || 1;
        }
        
        return 1;
    }

    /**
     * Get character class
     */
    getCharacterClass(character) {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            const classes = character.system.details?.classes;
            if (classes && Object.keys(classes).length > 0) {
                const classKey = Object.keys(classes)[0];
                return {
                    name: classes[classKey].name,
                    level: classes[classKey].level
                };
            }
        } else if (system === 'pf1') {
            const classes = character.system.details?.classes;
            if (classes && classes.length > 0) {
                return {
                    name: classes[0].name,
                    level: classes[0].level
                };
            }
        }
        
        return { name: 'Unknown', level: 1 };
    }

    /**
     * Get character abilities
     */
    getCharacterAbilities(character) {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            const abilities = character.system.abilities;
            return {
                str: abilities?.str?.mod || 0,
                dex: abilities?.dex?.mod || 0,
                con: abilities?.con?.mod || 0,
                int: abilities?.int?.mod || 0,
                wis: abilities?.wis?.mod || 0,
                cha: abilities?.cha?.mod || 0
            };
        } else if (system === 'pf1') {
            const abilities = character.system.abilities;
            return {
                str: abilities?.str?.mod || 0,
                dex: abilities?.dex?.mod || 0,
                con: abilities?.con?.mod || 0,
                int: abilities?.int?.mod || 0,
                wis: abilities?.wis?.mod || 0,
                cha: abilities?.cha?.mod || 0
            };
        }
        
        return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    }

    /**
     * Get character skills
     */
    getCharacterSkills(character) {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            const skills = character.system.skills;
            const skillList = {};
            
            Object.keys(skills).forEach(skillKey => {
                const skill = skills[skillKey];
                skillList[skillKey] = {
                    name: skill.name,
                    modifier: skill.mod,
                    rank: skill.rank || 0
                };
            });
            
            return skillList;
        } else if (system === 'pf1') {
            const skills = character.system.skills;
            const skillList = {};
            
            Object.keys(skills).forEach(skillKey => {
                const skill = skills[skillKey];
                skillList[skillKey] = {
                    name: skill.name,
                    modifier: skill.mod,
                    rank: skill.rank || 0
                };
            });
            
            return skillList;
        }
        
        return {};
    }

    /**
     * Get character spells
     */
    getCharacterSpells(character) {
        const spells = character.items.filter(item => item.type === 'spell');
        return spells.map(spell => ({
            id: spell.id,
            name: spell.name,
            level: spell.system?.level?.value || 0,
            school: spell.system?.school?.value || 'unknown',
            type: spell.system?.spellType?.value || 'unknown'
        }));
    }

    /**
     * Get character items
     */
    getCharacterItems(character) {
        const items = character.items.filter(item => item.type !== 'spell');
        return items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            equipped: item.system?.equipped || false,
            quantity: item.system?.quantity?.value || 1,
            charges: item.system?.charges?.value || null
        }));
    }

    /**
     * Get character conditions
     */
    getCharacterConditions(character) {
        const system = game.system.id;
        
        if (system === 'pf2e') {
            const effects = character.effects;
            return effects.map(effect => ({
                id: effect.id,
                name: effect.name,
                icon: effect.icon,
                duration: effect.duration
            }));
        } else if (system === 'pf1') {
            const effects = character.effects;
            return effects.map(effect => ({
                id: effect.id,
                name: effect.name,
                icon: effect.icon,
                duration: effect.duration
            }));
        }
        
        return [];
    }

    /**
     * Load character profile
     */
    loadCharacterProfile(character) {
        if (!character) return;

        const profile = this.characterProfiles[character.id];
        if (profile) {
            console.log('VAI: Loaded existing profile for:', character.name);
            return profile;
        }

        // Create new profile
        const newProfile = {
            id: character.id,
            name: character.name,
            preferredActions: this.getCharacterPreferredActions(character),
            actionHistory: [],
            preferences: {},
            timestamp: Date.now()
        };

        this.characterProfiles[character.id] = newProfile;
        console.log('VAI: Created new profile for:', character.name);
        
        return newProfile;
    }

    /**
     * Get character preferred actions
     */
    getCharacterPreferredActions(character) {
        const system = game.system.id;
        const actions = ['attack', 'move', 'target', 'help', 'status'];

        // Add class-specific actions
        const characterClass = this.getCharacterClass(character);
        
        if (system === 'pf2e') {
            // Add PF2e actions
            actions.push('seek', 'raiseShield', 'hide', 'demoralize', 'feint', 'treatWounds');
            
            // Add class-specific actions
            if (characterClass.name.toLowerCase().includes('fighter')) {
                actions.push('attackOfOpportunity');
            }
            if (characterClass.name.toLowerCase().includes('rogue')) {
                actions.push('sneakAttack');
            }
            if (characterClass.name.toLowerCase().includes('wizard') || 
                characterClass.name.toLowerCase().includes('sorcerer')) {
                actions.push('castSpell');
            }
            if (characterClass.name.toLowerCase().includes('cleric')) {
                actions.push('castSpell', 'channelEnergy');
            }
        } else if (system === 'pf1') {
            // Add PF1 actions
            actions.push('fullAttack', 'charge');
            
            // Add class-specific actions
            if (characterClass.name.toLowerCase().includes('fighter')) {
                actions.push('weaponTraining');
            }
            if (characterClass.name.toLowerCase().includes('rogue')) {
                actions.push('sneakAttack');
            }
            if (characterClass.name.toLowerCase().includes('wizard') || 
                characterClass.name.toLowerCase().includes('sorcerer')) {
                actions.push('castSpell');
            }
        }

        return actions;
    }

    /**
     * Get character-specific actions
     */
    getCharacterSpecificActions(character) {
        if (!character) return [];

        const system = game.system.id;
        const actions = [];

        // Get character state
        const state = this.characterState[character.id];
        if (!state) return actions;

        // Add actions based on character state
        if (state.hp && state.hp.current < state.hp.max * 0.5) {
            actions.push('treatWounds');
            actions.push('useHealingPotion');
        }

        if (state.spells && state.spells.length > 0) {
            actions.push('castSpell');
        }

        if (state.items && state.items.some(item => item.type === 'weapon')) {
            actions.push('attack');
        }

        if (state.items && state.items.some(item => item.type === 'armor')) {
            actions.push('equipArmor');
        }

        return actions;
    }

    /**
     * Switch character
     */
    switchCharacter(characterName) {
        const character = game.actors.find(actor => 
            actor.name.toLowerCase().includes(characterName.toLowerCase()) &&
            actor.isOwner
        );

        if (character) {
            this.setActiveCharacter(character);
            return {
                success: true,
                character: character,
                message: `Switched to ${character.name}`
            };
        } else {
            return {
                success: false,
                message: `Character not found: ${characterName}`
            };
        }
    }

    /**
     * Get character status
     */
    getCharacterStatus(character = null) {
        const targetCharacter = character || this.activeCharacter;
        if (!targetCharacter) {
            return {
                success: false,
                message: 'No character selected'
            };
        }

        const state = this.characterState[targetCharacter.id];
        if (!state) {
            return {
                success: false,
                message: 'Character state not available'
            };
        }

        return {
            success: true,
            character: targetCharacter.name,
            hp: `${state.hp.current}/${state.hp.max}`,
            level: state.level,
            class: state.class.name,
            conditions: state.conditions.length,
            timestamp: state.timestamp
        };
    }

    /**
     * Get character inventory
     */
    getCharacterInventory(character = null) {
        const targetCharacter = character || this.activeCharacter;
        if (!targetCharacter) {
            return {
                success: false,
                message: 'No character selected'
            };
        }

        const state = this.characterState[targetCharacter.id];
        if (!state) {
            return {
                success: false,
                message: 'Character state not available'
            };
        }

        return {
            success: true,
            character: targetCharacter.name,
            items: state.items,
            spells: state.spells
        };
    }

    /**
     * Find character item
     */
    findCharacterItem(itemName, character = null) {
        const targetCharacter = character || this.activeCharacter;
        if (!targetCharacter) return null;

        const state = this.characterState[targetCharacter.id];
        if (!state) return null;

        return state.items.find(item => 
            item.name.toLowerCase().includes(itemName.toLowerCase())
        );
    }

    /**
     * Find character spell
     */
    findCharacterSpell(spellName, character = null) {
        const targetCharacter = character || this.activeCharacter;
        if (!targetCharacter) return null;

        const state = this.characterState[targetCharacter.id];
        if (!state) return null;

        return state.spells.find(spell => 
            spell.name.toLowerCase().includes(spellName.toLowerCase())
        );
    }

    /**
     * Get character skill
     */
    getCharacterSkill(skillName, character = null) {
        const targetCharacter = character || this.activeCharacter;
        if (!targetCharacter) return null;

        const state = this.characterState[targetCharacter.id];
        if (!state) return null;

        return state.skills[skillName.toLowerCase()] || null;
    }

    /**
     * Update character profile
     */
    updateCharacterProfile(characterId, updates) {
        if (!this.characterProfiles[characterId]) {
            console.warn('VAI: Character profile not found:', characterId);
            return;
        }

        this.characterProfiles[characterId] = {
            ...this.characterProfiles[characterId],
            ...updates,
            timestamp: Date.now()
        };

        console.log('VAI: Character profile updated:', characterId);
    }

    /**
     * Get character profiles
     */
    getCharacterProfiles() {
        return Object.values(this.characterProfiles);
    }

    /**
     * Get character manager statistics
     */
    getCharacterManagerStats() {
        return {
            activeCharacter: this.activeCharacter?.name || 'None',
            totalProfiles: Object.keys(this.characterProfiles).length,
            totalStates: Object.keys(this.characterState).length,
            profiles: this.getCharacterProfiles().map(profile => ({
                name: profile.name,
                actions: profile.preferredActions.length,
                timestamp: profile.timestamp
            }))
        };
    }

    /**
     * Export character data
     */
    exportCharacterData() {
        return {
            activeCharacter: this.activeCharacter?.id || null,
            characterProfiles: this.characterProfiles,
            characterState: this.characterState,
            timestamp: Date.now()
        };
    }

    /**
     * Import character data
     */
    importCharacterData(data) {
        this.characterProfiles = data.characterProfiles || {};
        this.characterState = data.characterState || {};
        
        if (data.activeCharacter) {
            const character = game.actors.get(data.activeCharacter);
            if (character) {
                this.setActiveCharacter(character);
            }
        }
        
        console.log('VAI: Character data imported');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.activeCharacter = null;
        this.characterProfiles = {};
        this.characterState = {};
        this.characterActions = {};
        
        console.log('VAI: Character manager cleanup completed');
    }
} 