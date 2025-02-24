# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.0.2.2] - 2025-02-23
### Added
- Create a new SequenceImageHistory view that loads all the images from the history using the SequenceImage component.
- Add this new SequenceImageHistory view as a new tab of the "Sequence Monitoring" page.

### Changed
- Extract the sequence image loading logic into a new SequenceImage component. This component is in charge of displaying the image + stats + opening the modal for the full preview.

### Fixed
- Plugin null exception error
- Small UI fixes in the "Sequence Monitoring" page.
- Added a new script to add a new entry to all locale files. Very handy when creating a new entry to avoid going to all the files individually.
- TPPA fix display error

## [1.0.2.0] - 2025-02-21
### Added
- add flat assistant
- add manuell mount controll
- Starsearch
- spanish translation

### Changed
- Auto prepare for the images
- TPPA  shows more info
- DLSR chip size is loaded from the framing settings

### Fixed
- Loading the autofocus graphic after a run did not always work
- Shutdown / Restart now also works when PHD2 is running

## [1.0.1.0] - 2025-02-14
### Added
- Shutdown / Restart support (NINA PC)
- New Translation keys
- Manuell mount controll
- “center here” added
- image settings

### Changed
- Android framework replaced with CapacitorJS (previous App needs to be removed first)
- Android 10 is now required as min. version
- Images are processed in the same way as in NINA
- Camerapage layout reworked

### Fixed
- ISO was not set correctly with DLSR
- Pinia store now correctly stores Instance configurations

## [1.0.0.9] - 2025-02-07
### Added
- Graphic showing the remaining exposure time
- Binning can be set
- Readoutmode can be set
- Download Logs from Modal
- Klingon support

### Changed
- Camera design adjustments
- Save exposuretime gain and offset permanently
- prevent lockscreen on Android
- Load all values from Weather
- Logic of CORS in plugin changed
- Removed wshv and Autofocus watcher

### Fixed
- Flatpanel icon does not change color
- Guidergraph: Data was not always loaded
- Error when loading the target image fixed
- regular expression for dec and ra adapted
- Fixed custom sky survey cache path

### Known Issues
- Android - Logfile Download not working

## [1.0.0.8] - 2025-02-04
### Added
- Framingassistant
- Switchpage
- portuguese support
- Manuell mount control
- Guider notes
  
### Changed
- Filter wheel cannot be connected if it is manual
- Rotator cannot be connected if it is manual
- Camera and last sequence image is now in an Modal for zooming
- Adaptations to API version 2.1.7.0
- update cz, fr, it, de, en, cn
- Sequence overview reworked
- display of the zoom factor in the image modal 
  
### Fixed
- Camera - timeout
- Sequence image does not always load
- Weather modal
- Android Update
- Subnav
- Guider state management
- Guider RA / DEC values

## [1.0.0.7] - 2025-01-27
### Added
- Italian, Czech, Chinese support
- Weather modal with additional information
- About modal
- Updater for Android
- Cors description
  
### Fixed
- Input validation for Nina instances
- FQDN working again
- Instance selection
- TPPA state handling

## [1.0.0.6] - 2025-01-22
### Added
- Support for Advanced API 2.1.4.0
- Setup screen & Tutorial
- Proper guider implementation

### Fixed
- Ui Elements fixed

## [1.0.0.5] - 2025-01-19
### Added
- Flatpanel support
- Sequence monitor

### Fixed
- Mobile optimizations
- Navbar
