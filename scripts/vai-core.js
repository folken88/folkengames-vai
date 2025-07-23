/**
 * VAI (Verbal Action Intelligence) - Core Module
 * Main orchestrator for voice-controlled Foundry VTT assistant
 */

class VAICore {
    constructor() {
        this.speechRecognition = null;
        this.intentParser = null;
        this.actionExecutor = null;
        this.ttsManager = null;
        this.llmIntegration = null;
        this.contextManager = null;
        this.learningSystem = null;
        this.characterManager = null;
        
        this.isInitialized = false;
        this.isListening = false;
        this.isEnabled = false;
        
        this.setupEventListeners();
    }

    /**
     * Initialize the VAI system
     */
    async initialize() {
        try {
            console.log('VAI: Initializing core system...');
            
            // Initialize components
            this.speechRecognition = new SpeechRecognitionManager();
            this.intentParser = new IntentParser();
            this.actionExecutor = new ActionExecutor();
            this.ttsManager = new TTSManager();
            this.llmIntegration = new LLMIntegration();
            this.contextManager = new ContextManager();
            this.learningSystem = new LearningSystem();
            this.characterManager = new CharacterManager();
            
            // Initialize settings
            await this.initializeSettings();
            
            // Check system compatibility
            if (!this.checkCompatibility()) {
                throw new Error('System compatibility check failed');
            }
            
            this.isInitialized = true;
            console.log('VAI: Core system initialized successfully');
            
            // Announce ready status
            this.ttsManager.speak('VAI system ready');
            
        } catch (error) {
            console.error('VAI: Initialization failed:', error);
            this.ttsManager.speak('VAI initialization failed');
            throw error;
        }
    }

    /**
     * Initialize module settings
     */
    async initializeSettings() {
        // Register settings if not already registered
        if (!game.settings.settings.has('folkengames-vai.pushToTalkKey')) {
            game.settings.register('folkengames-vai', 'pushToTalkKey', {
                name: 'Push-to-Talk Key',
                hint: 'Key to hold while speaking commands',
                scope: 'client',
                config: true,
                type: String,
                default: 'Space',
                onChange: (value) => this.updatePushToTalkKey(value)
            });
        }

        if (!game.settings.settings.has('folkengames-vai.enabled')) {
            game.settings.register('folkengames-vai', 'enabled', {
                name: 'Enable VAI',
                hint: 'Enable or disable the VAI system',
                scope: 'client',
                config: true,
                type: Boolean,
                default: true,
                onChange: (value) => this.setEnabled(value)
            });
        }

        if (!game.settings.settings.has('folkengames-vai.llmProvider')) {
            game.settings.register('folkengames-vai', 'llmProvider', {
                name: 'AI Provider',
                hint: 'Choose your preferred AI provider',
                scope: 'client',
                config: true,
                type: String,
                choices: {
                    'openai': 'OpenAI GPT',
                    'claude': 'Anthropic Claude',
                    'gemini': 'Google Gemini',
                    'none': 'None (Basic mode only)'
                },
                default: 'none',
                onChange: (value) => this.updateLLMProvider(value)
            });
        }

        if (!game.settings.settings.has('folkengames-vai.llmApiKey')) {
            game.settings.register('folkengames-vai', 'llmApiKey', {
                name: 'AI API Key',
                hint: 'Your API key for the selected AI provider',
                scope: 'client',
                config: true,
                type: String,
                default: '',
                onChange: (value) => this.updateLLMApiKey(value)
            });
        }

        if (!game.settings.settings.has('folkengames-vai.voiceRate')) {
            game.settings.register('folkengames-vai', 'voiceRate', {
                name: 'Voice Rate',
                hint: 'Speed of text-to-speech feedback',
                scope: 'client',
                config: true,
                type: Number,
                range: { min: 0.5, max: 2.0, step: 0.1 },
                default: 1.0,
                onChange: (value) => this.updateVoiceRate(value)
            });
        }

        if (!game.settings.settings.has('folkengames-vai.confidenceThreshold')) {
            game.settings.register('folkengames-vai', 'confidenceThreshold', {
                name: 'Confidence Threshold',
                hint: 'Minimum confidence level for command recognition',
                scope: 'client',
                config: true,
                type: Number,
                range: { min: 0.1, max: 1.0, step: 0.1 },
                default: 0.8,
                onChange: (value) => this.updateConfidenceThreshold(value)
            });
        }
    }

    /**
     * Check system compatibility
     */
    checkCompatibility() {
        // Check for Web Speech API support
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            console.error('VAI: Speech Recognition API not supported');
            return false;
        }

        // Check for Speech Synthesis API support
        if (!window.speechSynthesis) {
            console.error('VAI: Speech Synthesis API not supported');
            return false;
        }

        // Check for required Foundry VTT APIs
        if (!game || !game.user) {
            console.error('VAI: Foundry VTT game object not available');
            return false;
        }

        return true;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for push-to-talk key
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled || !this.isInitialized) return;
            
            const pushToTalkKey = game.settings.get('folkengames-vai', 'pushToTalkKey');
            if (event.code === `Key${pushToTalkKey.toUpperCase()}` || 
                event.code === pushToTalkKey) {
                event.preventDefault();
                this.startListening();
            }
        });

        document.addEventListener('keyup', (event) => {
            if (!this.isEnabled || !this.isInitialized) return;
            
            const pushToTalkKey = game.settings.get('folkengames-vai', 'pushToTalkKey');
            if (event.code === `Key${pushToTalkKey.toUpperCase()}` || 
                event.code === pushToTalkKey) {
                event.preventDefault();
                this.stopListening();
            }
        });

        // Listen for Foundry VTT hooks
        Hooks.on('ready', () => {
            this.initialize();
        });

        Hooks.on('renderChatMessage', (message, html, data) => {
            this.handleChatMessage(message, html, data);
        });

        Hooks.on('updateActor', (actor, changes, options, userId) => {
            this.handleActorUpdate(actor, changes, options, userId);
        });
    }

    /**
     * Start listening for voice commands
     */
    async startListening() {
        if (this.isListening) return;
        
        try {
            this.isListening = true;
            this.ttsManager.speak('Listening');
            await this.speechRecognition.startListening();
            
        } catch (error) {
            console.error('VAI: Failed to start listening:', error);
            this.ttsManager.speak('Failed to start listening');
            this.isListening = false;
        }
    }

    /**
     * Stop listening and process command
     */
    async stopListening() {
        if (!this.isListening) return;
        
        try {
            this.isListening = false;
            const speechText = await this.speechRecognition.stopListening();
            
            if (speechText && speechText.trim()) {
                await this.processCommand(speechText);
            }
            
        } catch (error) {
            console.error('VAI: Failed to stop listening:', error);
            this.ttsManager.speak('Failed to process command');
        }
    }

    /**
     * Process voice command
     */
    async processCommand(speechText) {
        try {
            console.log('VAI: Processing command:', speechText);
            
            // Update context
            this.contextManager.updateContext('command', { text: speechText });
            
            // Parse intent
            let intent = this.intentParser.parseIntent(speechText);
            
            // Check confidence threshold
            const confidenceThreshold = game.settings.get('folkengames-vai', 'confidenceThreshold');
            if (intent.confidence < confidenceThreshold) {
                // Try LLM disambiguation if available
                if (this.llmIntegration.isAvailable()) {
                    intent = await this.llmIntegration.resolveAmbiguousIntent(speechText, intent);
                } else {
                    this.ttsManager.speak('Command not recognized, please try again');
                    return;
                }
            }
            
            // Execute action
            const result = await this.actionExecutor.executeAction(intent);
            
            // Provide feedback
            this.ttsManager.announceResult(intent, result);
            
            // Log to chat
            this.logToChat(intent, result);
            
            // Learn from command
            this.learningSystem.learnFromCommand(speechText, intent, result);
            
            // Update context
            this.contextManager.updateContext('result', { intent, result });
            
        } catch (error) {
            console.error('VAI: Command processing error:', error);
            this.ttsManager.speak(`Error: ${error.message}`);
        }
    }

    /**
     * Log action to chat
     */
    logToChat(intent, result) {
        const message = {
            user: game.user.id,
            content: `VAI: ${intent.action} - ${result.message || 'Action completed'}`,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: {
                actor: game.user.character?.id,
                alias: game.user.character?.name || game.user.name
            }
        };
        
        ChatMessage.create(message);
    }

    /**
     * Handle chat message events
     */
    handleChatMessage(message, html, data) {
        // Process relevant chat messages for context
        if (message.user.id === game.user.id) {
            this.contextManager.updateContext('chat', { message, data });
        }
    }

    /**
     * Handle actor update events
     */
    handleActorUpdate(actor, changes, options, userId) {
        // Update character context when actor changes
        if (actor.id === game.user.character?.id) {
            this.characterManager.updateCharacterState(actor, changes);
        }
    }

    /**
     * Enable/disable VAI system
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.ttsManager.speak('VAI enabled');
        } else {
            this.ttsManager.speak('VAI disabled');
            if (this.isListening) {
                this.stopListening();
            }
        }
    }

    /**
     * Update push-to-talk key
     */
    updatePushToTalkKey(key) {
        console.log('VAI: Push-to-talk key updated to:', key);
    }

    /**
     * Update LLM provider
     */
    updateLLMProvider(provider) {
        this.llmIntegration.setProvider(provider);
        console.log('VAI: LLM provider updated to:', provider);
    }

    /**
     * Update LLM API key
     */
    updateLLMApiKey(key) {
        this.llmIntegration.setApiKey(key);
        console.log('VAI: LLM API key updated');
    }

    /**
     * Update voice rate
     */
    updateVoiceRate(rate) {
        this.ttsManager.setRate(rate);
        console.log('VAI: Voice rate updated to:', rate);
    }

    /**
     * Update confidence threshold
     */
    updateConfidenceThreshold(threshold) {
        console.log('VAI: Confidence threshold updated to:', threshold);
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.isEnabled,
            listening: this.isListening,
            compatibility: this.checkCompatibility(),
            settings: {
                pushToTalkKey: game.settings.get('folkengames-vai', 'pushToTalkKey'),
                llmProvider: game.settings.get('folkengames-vai', 'llmProvider'),
                voiceRate: game.settings.get('folkengames-vai', 'voiceRate'),
                confidenceThreshold: game.settings.get('folkengames-vai', 'confidenceThreshold')
            }
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.isListening) {
            this.stopListening();
        }
        
        if (this.speechRecognition) {
            this.speechRecognition.cleanup();
        }
        
        if (this.ttsManager) {
            this.ttsManager.cleanup();
        }
        
        console.log('VAI: Cleanup completed');
    }
}

// Initialize VAI when module is loaded
Hooks.once('init', () => {
    console.log('VAI: Module loaded');
    window.VAI = new VAICore();
});

// Initialize VAI when game is ready
Hooks.once('ready', async () => {
    console.log('VAI: Game ready, initializing VAI system...');
    if (window.VAI) {
        try {
            await window.VAI.initialize();
            console.log('VAI: System initialization complete');
        } catch (error) {
            console.error('VAI: Failed to initialize system:', error);
        }
    }
});

// Cleanup on module unload
Hooks.once('unload', () => {
    if (window.VAI) {
        window.VAI.cleanup();
        delete window.VAI;
    }
}); 