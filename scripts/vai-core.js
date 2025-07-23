/**
 * VAI (Verbal Action Intelligence) - Core Module
 * Test version for debugging module loading
 */

console.log('VAI: Module script loaded');

// Simple test class
class VAICore {
    constructor() {
        console.log('VAI: Core class instantiated');
        this.isInitialized = false;
    }

    async initialize() {
        console.log('VAI: Initializing...');
        this.isInitialized = true;
        console.log('VAI: Initialized successfully');
    }
}

// Initialize VAI when module is loaded
Hooks.once('init', () => {
    console.log('VAI: Module loaded in init hook');
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
    console.log('VAI: Module unloading');
    if (window.VAI) {
        delete window.VAI;
    }
}); 