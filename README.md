# VAI (Verbal Action Intelligence) - Foundry VTT Module

## Overview

VAI is a comprehensive voice-controlled assistant for blind Foundry VTT players that interprets natural language commands and executes appropriate game actions without requiring visual UI interaction.

## 🎯 Core Concept

**Push-to-Talk → Speech Recognition → Intent Parsing → Action Execution → TTS Feedback**

### User Experience Flow
1. **Push-to-Talk**: Player holds key and speaks command
2. **Speech Recognition**: Convert speech to text
3. **Intent Parsing**: Understand what the player wants to do
4. **Action Execution**: Call appropriate Foundry VTT functions/macros
5. **TTS Feedback**: Announce results to player
6. **Chat Integration**: Display results in chat for other players

## 🚀 Features

### Core Functionality
- **Voice Command Recognition**: Natural language processing for game actions
- **Push-to-Talk Interface**: Hold a key to speak commands
- **Text-to-Speech Feedback**: Audio confirmation of actions and results
- **Combat Integration**: Voice-controlled attacks, movement, and tactical actions
- **Character Management**: Voice commands for inventory, spells, and abilities
- **AI-Powered Disambiguation**: Uses LLM integration for complex command interpretation

### Supported Game Systems
- **Pathfinder 2e**: Full integration with PF2e action system
- **Pathfinder 1e**: Basic compatibility and core actions

### Accessibility Features
- **Zero Visual Dependencies**: Complete voice-controlled operation
- **Screen Reader Compatible**: Works with existing accessibility tools
- **Customizable Voice Feedback**: Adjustable speech rate and voice options
- **Keyboard Navigation**: Full keyboard support for setup and configuration

## 📋 Installation

1. **Manual Installation**:
   - Download the module files
   - Extract to your Foundry VTT `modules` directory
   - Enable the module in your world settings

2. **Module Manifest** (Future):
   - Add the module manifest URL to Foundry VTT
   - Install directly through the module browser

## ⚙️ Configuration

### Basic Settings
- **Push-to-Talk Key**: Configure the key to hold while speaking (default: Space)
- **Voice Settings**: Adjust speech rate, pitch, and voice selection
- **AI Provider**: Choose between OpenAI, Claude, or Gemini for complex queries
- **API Keys**: Configure your preferred AI service API key

### Advanced Settings
- **Command Sensitivity**: Adjust recognition sensitivity and confidence thresholds
- **Custom Commands**: Create personalized voice commands
- **Context Awareness**: Enable/disable contextual command suggestions
- **Learning Mode**: Allow the system to learn from your command patterns

## 🎮 Usage Examples

### Combat Commands
```
"target bob-smith and shoot an arrow at him"
"attack the goblin with my sword"
"cast fireball centered on the orc"
"raise my shield"
"use my healing potion"
```

### Movement Commands
```
"move me closer to bob"
"walk to the door"
"run to cover"
"move 30 feet north"
```

### Skill and Ability Checks
```
"roll stealth"
"check perception"
"make a fortitude save"
"roll athletics to climb"
```

### Information Queries
```
"how many charges in my healing wand?"
"what's my current hit points?"
"show me my spell slots"
"what's the distance to the enemy?"
```

### Character Management
```
"equip my longsword"
"cast invisibility"
"add fireball to my spell list"
"use my ring of protection"
```

## 🏗️ Technical Architecture

### Module Structure
```
vai/
├── module.json              # Module manifest
├── README.md               # This file
├── CHANGELOG.md            # Version history
├── scripts/
│   ├── vai-core.js         # Main module logic
│   ├── speech-recognition.js # Speech-to-text handling
│   ├── intent-parser.js    # Natural language processing
│   ├── action-executor.js  # Foundry VTT action execution
│   ├── tts-manager.js      # Text-to-speech feedback
│   └── llm-integration.js  # AI assistant for complex queries
├── styles/
│   └── vai.css            # Minimal UI styles
├── templates/
│   └── settings.html      # Module settings interface
└── lang/
    └── en.json           # English language file
```

### Key Components

#### Speech Recognition Engine
- Web Speech API integration
- Configurable recognition settings
- Background noise filtering
- Multi-language support

#### Intent Parser
- Pattern-based command recognition
- Natural language processing
- Context-aware interpretation
- Ambiguous command resolution

#### Action Executor
- Foundry VTT API integration
- Game system-specific actions
- Permission checking
- Error handling and recovery

#### TTS Manager
- Text-to-speech feedback
- Configurable voice options
- Priority-based announcements
- Non-blocking speech synthesis

#### LLM Integration
- AI-powered command interpretation
- Multiple provider support
- Context-aware suggestions
- Learning and adaptation

## 🔧 Development

### Prerequisites
- Foundry VTT v11+
- Modern web browser with Speech Recognition API support
- Optional: AI service API key for advanced features

### Local Development
1. Clone the repository
2. Install dependencies (if any)
3. Link to your Foundry VTT modules directory
4. Enable developer mode in Foundry VTT
5. Make changes and test

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎯 Roadmap

### Phase 1: Core Foundation ✅
- [x] Basic speech recognition
- [x] Simple intent parsing
- [x] Basic action execution
- [x] TTS feedback
- [x] Push-to-talk functionality

### Phase 2: Game Integration 🚧
- [ ] PF2e action system integration
- [ ] PF1 compatibility
- [ ] Character sheet integration
- [ ] Combat system integration
- [ ] Movement system integration

### Phase 3: AI Enhancement 📋
- [ ] LLM integration
- [ ] Ambiguous intent resolution
- [ ] Natural language processing
- [ ] Context awareness
- [ ] Learning system

### Phase 4: Advanced Features 📋
- [ ] Multi-character support
- [ ] Custom command creation
- [ ] Voice training
- [ ] Accessibility enhancements
- [ ] Performance optimization

## 🤝 Support

### Getting Help
- **Documentation**: Check this README and the module settings
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions for tips and help

### Known Issues
- Speech recognition requires HTTPS in production
- Some browsers have limited Speech API support
- AI features require valid API keys

### Troubleshooting
1. **Speech not recognized**: Check microphone permissions and browser settings
2. **Commands not working**: Verify game system compatibility and permissions
3. **TTS not speaking**: Check browser speech synthesis support
4. **AI features failing**: Verify API key configuration

## 📄 License

This module is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Foundry VTT community for inspiration and support
- Web Speech API developers for accessibility technology
- AI service providers for natural language processing capabilities
- Blind gaming community for feedback and testing

## 📞 Contact

- **Author**: Folkengames
- **GitHub**: [github.com/folkengames/vai](https://github.com/folkengames/vai)
- **Issues**: [GitHub Issues](https://github.com/folkengames/vai/issues)

---

**VAI - Making Foundry VTT accessible to everyone through voice control.** 