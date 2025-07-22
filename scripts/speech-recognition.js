/**
 * VAI Speech Recognition Manager
 * Handles Web Speech API integration for voice command recognition
 */

class SpeechRecognitionManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.currentPromise = null;
        this.currentResolve = null;
        this.currentReject = null;
        
        this.initializeRecognition();
    }

    /**
     * Initialize speech recognition
     */
    initializeRecognition() {
        try {
            // Check for Speech Recognition API support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                console.error('VAI: Speech Recognition API not supported');
                this.isSupported = false;
                return;
            }

            // Create recognition instance
            this.recognition = new SpeechRecognition();
            
            // Configure recognition settings
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 3;
            
            // Setup event handlers
            this.setupEventHandlers();
            
            this.isSupported = true;
            console.log('VAI: Speech recognition initialized');
            
        } catch (error) {
            console.error('VAI: Failed to initialize speech recognition:', error);
            this.isSupported = false;
        }
    }

    /**
     * Setup recognition event handlers
     */
    setupEventHandlers() {
        if (!this.recognition) return;

        // Speech start
        this.recognition.onstart = () => {
            console.log('VAI: Speech recognition started');
            this.isListening = true;
        };

        // Speech end
        this.recognition.onend = () => {
            console.log('VAI: Speech recognition ended');
            this.isListening = false;
            
            // Resolve promise if still pending
            if (this.currentPromise && this.currentResolve) {
                this.currentResolve('');
                this.clearCurrentPromise();
            }
        };

        // Speech results
        this.recognition.onresult = (event) => {
            console.log('VAI: Speech recognition results received');
            
            const results = event.results;
            const transcript = results[0][0].transcript;
            const confidence = results[0][0].confidence;
            
            console.log('VAI: Transcript:', transcript, 'Confidence:', confidence);
            
            // Resolve promise with transcript
            if (this.currentPromise && this.currentResolve) {
                this.currentResolve(transcript);
                this.clearCurrentPromise();
            }
        };

        // Speech error
        this.recognition.onerror = (event) => {
            console.error('VAI: Speech recognition error:', event.error);
            
            let errorMessage = 'Speech recognition error';
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected';
                    break;
                case 'audio-capture':
                    errorMessage = 'Microphone not available';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone permission denied';
                    break;
                case 'network':
                    errorMessage = 'Network error';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'Speech recognition service not allowed';
                    break;
                case 'bad-grammar':
                    errorMessage = 'Grammar error';
                    break;
                case 'language-not-supported':
                    errorMessage = 'Language not supported';
                    break;
                default:
                    errorMessage = `Speech recognition error: ${event.error}`;
            }
            
            // Reject promise with error
            if (this.currentPromise && this.currentReject) {
                this.currentReject(new Error(errorMessage));
                this.clearCurrentPromise();
            }
        };

        // Speech not recognized
        this.recognition.onnomatch = () => {
            console.log('VAI: No speech match found');
            
            // Resolve promise with empty string
            if (this.currentPromise && this.currentResolve) {
                this.currentResolve('');
                this.clearCurrentPromise();
            }
        };
    }

    /**
     * Start listening for speech
     */
    async startListening() {
        if (!this.isSupported) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isListening) {
            console.log('VAI: Already listening');
            return;
        }

        try {
            // Create new promise for this listening session
            this.currentPromise = new Promise((resolve, reject) => {
                this.currentResolve = resolve;
                this.currentReject = reject;
            });

            // Start recognition
            this.recognition.start();
            
            console.log('VAI: Started listening for speech');
            
        } catch (error) {
            console.error('VAI: Failed to start listening:', error);
            this.clearCurrentPromise();
            throw error;
        }
    }

    /**
     * Stop listening and return transcript
     */
    async stopListening() {
        if (!this.isSupported || !this.isListening) {
            return '';
        }

        try {
            // Stop recognition
            this.recognition.stop();
            
            // Wait for promise to resolve
            const transcript = await this.currentPromise;
            
            console.log('VAI: Stopped listening, transcript:', transcript);
            
            return transcript;
            
        } catch (error) {
            console.error('VAI: Failed to stop listening:', error);
            throw error;
        }
    }

    /**
     * Clear current promise
     */
    clearCurrentPromise() {
        this.currentPromise = null;
        this.currentResolve = null;
        this.currentReject = null;
    }

    /**
     * Set recognition language
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
            console.log('VAI: Language set to:', lang);
        }
    }

    /**
     * Set recognition mode
     */
    setMode(mode) {
        if (!this.recognition) return;
        
        switch (mode) {
            case 'continuous':
                this.recognition.continuous = true;
                break;
            case 'single':
                this.recognition.continuous = false;
                break;
            default:
                console.warn('VAI: Unknown recognition mode:', mode);
        }
    }

    /**
     * Set interim results
     */
    setInterimResults(enabled) {
        if (this.recognition) {
            this.recognition.interimResults = enabled;
        }
    }

    /**
     * Set maximum alternatives
     */
    setMaxAlternatives(max) {
        if (this.recognition) {
            this.recognition.maxAlternatives = max;
        }
    }

    /**
     * Get recognition status
     */
    getStatus() {
        return {
            supported: this.isSupported,
            listening: this.isListening,
            language: this.recognition?.lang || 'en-US',
            continuous: this.recognition?.continuous || false,
            interimResults: this.recognition?.interimResults || false,
            maxAlternatives: this.recognition?.maxAlternatives || 1
        };
    }

    /**
     * Test microphone access
     */
    async testMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('VAI: Microphone test failed:', error);
            return false;
        }
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'en-CA', name: 'English (Canada)' },
            { code: 'en-AU', name: 'English (Australia)' },
            { code: 'es-ES', name: 'Spanish (Spain)' },
            { code: 'es-MX', name: 'Spanish (Mexico)' },
            { code: 'fr-FR', name: 'French (France)' },
            { code: 'fr-CA', name: 'French (Canada)' },
            { code: 'de-DE', name: 'German (Germany)' },
            { code: 'it-IT', name: 'Italian (Italy)' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'pt-PT', name: 'Portuguese (Portugal)' },
            { code: 'ru-RU', name: 'Russian (Russia)' },
            { code: 'ja-JP', name: 'Japanese (Japan)' },
            { code: 'ko-KR', name: 'Korean (Korea)' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' },
            { code: 'zh-TW', name: 'Chinese (Traditional)' }
        ];
    }

    /**
     * Check if language is supported
     */
    isLanguageSupported(lang) {
        const availableLanguages = this.getAvailableLanguages();
        return availableLanguages.some(l => l.code === lang);
    }

    /**
     * Get recognition capabilities
     */
    getCapabilities() {
        return {
            supported: this.isSupported,
            continuous: true,
            interimResults: true,
            maxAlternatives: true,
            languageSelection: true,
            microphoneTest: true
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn('VAI: Error stopping recognition during cleanup:', error);
            }
        }
        
        this.clearCurrentPromise();
        this.recognition = null;
        this.isListening = false;
        
        console.log('VAI: Speech recognition cleanup completed');
    }
} 