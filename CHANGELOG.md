# Changelog

All notable changes to the VAI (Verbal Action Intelligence) module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial module structure and documentation
- Basic module.json configuration
- README with comprehensive feature overview
- Development roadmap and technical architecture

### Planned
- Core speech recognition functionality
- Intent parsing system
- Action execution framework
- TTS feedback system
- PF2e and PF1e integration

## [1.0.0] - 2024-01-XX

### Added
- Initial release of VAI module
- Basic speech recognition using Web Speech API
- Simple intent parsing for common commands
- Text-to-speech feedback system
- Push-to-talk functionality
- Module settings interface
- Basic PF2e action integration

### Technical Details
- Foundry VTT v11+ compatibility
- ES6 module structure
- Modular architecture for easy extension
- Comprehensive error handling
- Accessibility-first design principles

---

## Version History

### Version 1.0.0 (Planned)
- **Core Foundation**: Basic speech recognition and command processing
- **Game Integration**: PF2e action system support
- **Accessibility**: Zero visual dependencies, screen reader compatible
- **User Experience**: Push-to-talk interface with TTS feedback

### Future Versions
- **1.1.0**: Enhanced AI integration and natural language processing
- **1.2.0**: PF1e compatibility and advanced combat features
- **1.3.0**: Multi-character support and custom command creation
- **2.0.0**: Advanced learning system and voice training capabilities

---

## Development Notes

### Breaking Changes
- None in current version

### Deprecations
- None in current version

### Known Issues
- Speech recognition requires HTTPS in production environments
- Limited browser support for Web Speech API
- AI features require valid API keys for full functionality

### Performance Notes
- Speech recognition runs in background thread
- TTS feedback is non-blocking
- Action execution optimized for minimal latency

---

## Contributing

When contributing to this project, please update this changelog with your changes following the established format.

### Changelog Entry Format
```markdown
### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
``` 