/**
 * VAI Text-to-Speech Manager
 * Provides audio feedback for voice commands and system responses
 */

class TTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.volume = 1.0;
        this.isSpeaking = false;
        this.speechQueue = [];
        this.currentUtterance = null;
        
        this.initializeTTS();
    }

    /**
     * Initialize TTS system
     */
    initializeTTS() {
        try {
            if (!this.synthesis) {
                console.error('VAI: Speech Synthesis API not supported');
                return;
            }

            // Wait for voices to load
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices();
            };

            // Load voices immediately if available
            this.loadVoices();
            
            console.log('VAI: TTS system initialized');
            
        } catch (error) {
            console.error('VAI: Failed to initialize TTS:', error);
        }
    }

    /**
     * Load available voices
     */
    loadVoices() {
        const voices = this.synthesis.getVoices();
        
        // Try to find a good default voice
        this.voice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Premium'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        console.log('VAI: Loaded voices:', voices.length);
        console.log('VAI: Selected voice:', this.voice?.name);
    }

    /**
     * Speak text
     */
    speak(text, options = {}) {
        if (!this.synthesis || !text) {
            return;
        }

        // Add to queue
        this.speechQueue.push({
            text: text,
            options: options,
            timestamp: Date.now()
        });

        // Process queue
        this.processQueue();
    }

    /**
     * Process speech queue
     */
    async processQueue() {
        if (this.isSpeaking || this.speechQueue.length === 0) {
            return;
        }

        const speechItem = this.speechQueue.shift();
        
        try {
            this.isSpeaking = true;
            
            const utterance = new SpeechSynthesisUtterance(speechItem.text);
            
            // Configure utterance
            utterance.voice = speechItem.options.voice || this.voice;
            utterance.rate = speechItem.options.rate || this.rate;
            utterance.pitch = speechItem.options.pitch || this.pitch;
            utterance.volume = speechItem.options.volume || this.volume;
            
            // Setup event handlers
            utterance.onstart = () => {
                console.log('VAI: Started speaking:', speechItem.text);
                this.currentUtterance = utterance;
            };
            
            utterance.onend = () => {
                console.log('VAI: Finished speaking');
                this.isSpeaking = false;
                this.currentUtterance = null;
                
                // Process next item in queue
                setTimeout(() => this.processQueue(), 100);
            };
            
            utterance.onerror = (event) => {
                console.error('VAI: TTS error:', event.error);
                this.isSpeaking = false;
                this.currentUtterance = null;
                
                // Process next item in queue
                setTimeout(() => this.processQueue(), 100);
            };
            
            // Speak the utterance
            this.synthesis.speak(utterance);
            
        } catch (error) {
            console.error('VAI: Failed to speak:', error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            
            // Process next item in queue
            setTimeout(() => this.processQueue(), 100);
        }
    }

    /**
     * Announce action result
     */
    announceResult(intent, result) {
        if (!result || !result.success) {
            this.speak('Action failed');
            return;
        }

        let announcement = '';

        switch (intent.action) {
            case 'attack':
                announcement = `Attacked ${intent.target || 'target'}`;
                if (result.data?.roll) {
                    announcement += `, rolled ${result.data.roll.total}`;
                }
                break;
                
            case 'move':
                if (intent.direction) {
                    announcement = `Moved ${intent.direction}`;
                    if (intent.distance) {
                        announcement += ` ${intent.distance.value} feet`;
                    }
                } else if (intent.destination) {
                    announcement = `Moving to ${intent.destination}`;
                }
                break;
                
            case 'skillCheck':
                announcement = `Rolled ${intent.skill}`;
                if (result.data?.roll) {
                    announcement += `, result ${result.data.roll.total}`;
                }
                break;
                
            case 'castSpell':
                announcement = `Cast ${intent.spell}`;
                if (intent.target) {
                    announcement += ` on ${intent.target}`;
                }
                break;
                
            case 'target':
                announcement = `Targeted ${intent.target}`;
                break;
                
            case 'seek':
                announcement = 'Performed seek action';
                break;
                
            case 'raiseShield':
                announcement = 'Raised shield';
                break;
                
            case 'hide':
                announcement = 'Performed hide action';
                break;
                
            case 'demoralize':
                announcement = 'Performed demoralize action';
                break;
                
            case 'feint':
                announcement = 'Performed feint action';
                break;
                
            case 'treatWounds':
                announcement = 'Performed treat wounds';
                break;
                
            case 'equipItem':
                announcement = `Equipped ${intent.item}`;
                break;
                
            case 'query':
                if (result.message) {
                    announcement = result.message;
                } else {
                    announcement = 'Query completed';
                }
                break;
                
            case 'help':
                announcement = 'Help information displayed';
                break;
                
            case 'status':
                if (result.message) {
                    announcement = result.message;
                } else {
                    announcement = 'Status information displayed';
                }
                break;
                
            default:
                announcement = result.message || 'Action completed';
        }

        this.speak(announcement);
    }

    /**
     * Announce error
     */
    announceError(error) {
        const errorMessage = this.formatErrorMessage(error);
        this.speak(`Error: ${errorMessage}`);
    }

    /**
     * Format error message for speech
     */
    formatErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error.message) {
            return error.message;
        }
        
        return 'Unknown error occurred';
    }

    /**
     * Announce system status
     */
    announceStatus(status) {
        let message = '';
        
        if (status.initialized) {
            message += 'System initialized. ';
        }
        
        if (status.enabled) {
            message += 'VAI is enabled. ';
        } else {
            message += 'VAI is disabled. ';
        }
        
        if (status.listening) {
            message += 'Listening for commands. ';
        }
        
        if (status.compatibility) {
            message += 'All systems compatible. ';
        } else {
            message += 'Compatibility issues detected. ';
        }
        
        this.speak(message);
    }

    /**
     * Announce command examples
     */
    announceCommands(commands) {
        let message = 'Available commands: ';
        
        commands.forEach((cmd, index) => {
            message += `${cmd.action}`;
            if (index < commands.length - 1) {
                message += ', ';
            }
        });
        
        this.speak(message);
    }

    /**
     * Announce target information
     */
    announceTarget(target) {
        if (!target) {
            this.speak('No target selected');
            return;
        }
        
        const message = `Target: ${target.name}`;
        this.speak(message);
    }

    /**
     * Announce distance information
     */
    announceDistance(distance, targetName) {
        const message = `Distance to ${targetName}: ${Math.round(distance)} feet`;
        this.speak(message);
    }

    /**
     * Announce health information
     */
    announceHealth(current, max) {
        const percentage = Math.round((current / max) * 100);
        const message = `Health: ${current} out of ${max}, ${percentage} percent`;
        this.speak(message);
    }

    /**
     * Announce spell information
     */
    announceSpell(spellName, level) {
        const message = level ? `Spell: ${spellName}, level ${level}` : `Spell: ${spellName}`;
        this.speak(message);
    }

    /**
     * Announce item information
     */
    announceItem(itemName, charges) {
        let message = `Item: ${itemName}`;
        if (charges !== undefined) {
            message += `, ${charges} charges remaining`;
        }
        this.speak(message);
    }

    /**
     * Set voice
     */
    setVoice(voice) {
        this.voice = voice;
        console.log('VAI: Voice set to:', voice?.name);
    }

    /**
     * Set speech rate
     */
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(10, rate));
        console.log('VAI: Speech rate set to:', this.rate);
    }

    /**
     * Set speech pitch
     */
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        console.log('VAI: Speech pitch set to:', this.pitch);
    }

    /**
     * Set speech volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log('VAI: Speech volume set to:', this.volume);
    }

    /**
     * Stop current speech
     */
    stop() {
        if (this.isSpeaking && this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
            console.log('VAI: Speech stopped');
        }
    }

    /**
     * Clear speech queue
     */
    clearQueue() {
        this.speechQueue = [];
        console.log('VAI: Speech queue cleared');
    }

    /**
     * Pause speech
     */
    pause() {
        if (this.isSpeaking && this.synthesis) {
            this.synthesis.pause();
            console.log('VAI: Speech paused');
        }
    }

    /**
     * Resume speech
     */
    resume() {
        if (this.synthesis) {
            this.synthesis.resume();
            console.log('VAI: Speech resumed');
        }
    }

    /**
     * Get available voices
     */
    getVoices() {
        if (!this.synthesis) {
            return [];
        }
        
        return this.synthesis.getVoices().map(voice => ({
            name: voice.name,
            lang: voice.lang,
            default: voice.default,
            localService: voice.localService
        }));
    }

    /**
     * Get TTS status
     */
    getStatus() {
        return {
            supported: !!this.synthesis,
            speaking: this.isSpeaking,
            queueLength: this.speechQueue.length,
            voice: this.voice?.name || 'None',
            rate: this.rate,
            pitch: this.pitch,
            volume: this.volume,
            availableVoices: this.getVoices().length
        };
    }

    /**
     * Test TTS functionality
     */
    async testTTS() {
        if (!this.synthesis) {
            throw new Error('Speech synthesis not supported');
        }
        
        return new Promise((resolve, reject) => {
            const testUtterance = new SpeechSynthesisUtterance('VAI test successful');
            testUtterance.voice = this.voice;
            testUtterance.rate = this.rate;
            testUtterance.pitch = this.pitch;
            testUtterance.volume = this.volume;
            
            testUtterance.onend = () => resolve(true);
            testUtterance.onerror = (event) => reject(new Error(`TTS test failed: ${event.error}`));
            
            this.synthesis.speak(testUtterance);
        });
    }

    /**
     * Get TTS capabilities
     */
    getCapabilities() {
        return {
            supported: !!this.synthesis,
            voiceSelection: true,
            rateControl: true,
            pitchControl: true,
            volumeControl: true,
            pauseResume: true,
            queueManagement: true
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stop();
        this.clearQueue();
        this.synthesis = null;
        this.voice = null;
        this.currentUtterance = null;
        
        console.log('VAI: TTS cleanup completed');
    }
} 