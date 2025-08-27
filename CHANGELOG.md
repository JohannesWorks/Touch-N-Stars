# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.x.x] - 2025-xx-xx

### Added
- Filterwheel page: Dedicated page with responsive grid layout and status information
- Rotator page: Dedicated page with enhanced info display and controls
- Camera page: Quick access buttons and modal popups for rotator controls
- Navigation: Icons for filterwheel and rotator when equipment is connected
- Mount info: Added Right Ascension, Declination, and Time to Meridian Flip display
- TPPA page: Image modal with zoom functionality for viewing camera images during alignment
- Focuser page: Image modal with zoom functionality for viewing camera images during autofocus
- TPPA and Focus pages: Add background camera image when running

### Changed
- Rotator: Moved from camera settings modal to dedicated quick access button
- TPPA page: Mount info display hidden to reduce clutter during alignment process
- Camera page: The last image taken is now always displayed. As in NINA

### Fixed
-

## [1.1.2.2] - 2025-08-27
### Added
- Mount page: Added slew stop button
- Info message: Show 'What's new' on first start after an update

### Fixed
- Sequence: Display of the filter name
- Slew stop fixed when only slew was executed
- Mount websocket connection fix

## [1.1.2.1] - 2025-08-22
### Changed
-  Plugin: Sequece Creator: The settings are now saved in the backend.

### Fixed
- Android: The display turned itself off. Now this can be selected in the settings.
- Plugin: Sequece Creator: The endcontaienr is now processed sequentially.

## [1.1.2.0] - 2025-08-20
### Added
- Image settings: add debayer and unlinked stretch options 
- TPPA: Settings for GAIN and Exposuretime
- Telescopius Plugin: Personal target lists from Telescopius can now be loaded. Please note: An API key from Telescopius is required.
- Logcollector Plugin added - Submit your logs to the Touch N Stars team in case troubleshooting is required.

### Changed
- Error handling and debug mode rework
- Slew and center breaks off after one attempt at plate solving.

### Fixed
- Favorites: fix save rotation
- Android: Fix image download from Sequence page
- TPPA: Button position from ErrorModal 
- Plugin: Sequence Creator fix Meridian Flip

## [1.1.1.1] - 2025-08-07
### Added
- Sequence creator: Find home option

### Fixed
- fix settings button if no connection can be established
- fix cooling settings at sequence creator

## [1.1.1.0] - 2025-08-05
### Added
- PHD2 image similar to PHD2 with guide star marker
- PHD2 Starimige with starprofiel graph
- PHD2 callibration assitant
- Plugin: Sequence Creator for simple sequences added
- Plugin: Webcam viewer
- When you start the app for the first time, you will be automatically redirected to the equipment page.

### Changed
- The settings modal is now a separate page.
- Stellaruim search improved
- The sequence page design has been revised.
- The iocns of the navbar are no longer dependent on the status of the sequence. 
- Framing assistant revised

### Fixed
- Framing: The skychart and the Name is now also displayed when the coordinates come from Stellarium.

## [1.1.0.0] - 2025-07-25
### Added
- PHD2 setting support. You can now set many PHD2 parameters, such as exposure time, aggression, ...
- Display of the current `targetName` if a sequence item with status `RUNNING` exists.
- Autoscan for iOS and Andriod. The connection settings can now be determined automatically as long as the default port 5000 is used in the plugin
- In landscape, the navbar is now displayed on the left so there is more space
- Warning if the Locatoin Sync in NINA does not match TNS and the possibility to change this
- A window to set the camera's exposure time more quickly
- GuiderStatus component showing current guider state with visual indicators and multilingual support
- Added sequence load to load sequences into the advanced sequence. Load a sequence from the default sequence folder 

### Changed
- the coordinates for framing are no longer set at startup. This means that it is no longer necessary to switch to the framing tab in NINA
- design adjustments 
- Guidegraph show px and rms error
- Raise the API minimum version to API 2.2.5.0 !
- Toast notification system: Non-critical toasts now appear as non-blocking notifications in top-right corner, while confirmations and critical messages remain as blocking overlays
- Guider control buttons are now always clickable with visual feedback for inactive states

### Fixed
- fixed layout error in footer for iOS

## [1.0.9.0] - 2025-06-24
### Added
- Guidgraph can be displayed everywhere. It can be opened and closed from the status bar
- Add skychart to sequenz
- TPPA Start from current position

### Changed
- Connection timeout increased to 2s and three attempts 

### Fixed
- Automatic reconnect of the mount websocket connection

## [1.0.8.0] - 2025-05-27
### Added
- Stellarium on iOS 
- Stellarium: send coordinates to mount
- SkyChart displays the custom horizon
- Camera page: Movable modal for mount, focuser and filter

### Changed
- reworked Logfile & Image download for Android/iOS
- The communication action monitoring from TNS to NINA has been revised
- Camera page: Design reworked 
- Statusbar: Design reworked 

### Fixed
- UI rendering & touch inputs for mobile applications
- Fix connection error with alpaca devices

## [1.0.7.0] - 2025-05-08
### Added
- Favorites memory for targets added
- debug option/window 

### Changed
- The API port is now automatically detected
- Several NINA instances can run on one PC. The port increases by 1 for each instance
- The skychart shows the nautical and astronomical night
- The communication action monitoring from TNS to NINA has been revised

## [1.0.6.0] - 2025-05-03
### Added
- Focuser quick to use button
- Integrated iOS app
- Instanze Color -> There is a separate color for each instance. The navbar changes color depending on the instance
- add a plugin system
- A message is now displayed if the communication does not work

### Changed
- design rework stellarium 
- button design adjustment
- rewort guidegraph
- framing tab change reworked (!!! new api is needed !!! ) -> When starting TNS, the system now also switches back to the active tab of NINA

### Fixed
- repairs a connection error if the default port is not used
- the IP address in the plugin is now displayed correctly


## [1.0.5.0] - 2025-04-16
### Added
- Sequenceimage: Add download function
- Dome: Add Slew and Sync
- Add ToastModal 
- Focuser: Add autofocus graph 
- Camera: Add Chipsettings 
- Image History sorting by newest / oldest
- Stellarium Clock & Date view
- Altitude Chart in TargetSearch
- Settings for stretch factor and black clipping 
- Add Manuell Filterwheel controll. You have to set the filter wheel of the API

### Changed
- CaptureButton created and integrated into CameraView 
- CameraView is no longer locked when a sequence is running. Capturing only is not possible
- Manual Mountcontroll is permanently visible
- Update Eslint to 9
- add durations and dither to Guidegraph
- Sequence image is now displayed as in NINA

### Fixed
- Avoid duplicate NINA connection entries
- Eslint now fixes prettier
- Flatpanel icon state

## [1.0.4.4] - 2025-03-20
### Fixed
- fixed: add target to sequence

## [1.0.4.3] - 2025-03-29
### Fixed
- error fixed when sequence loads

## Android 1.6.3
### Added
- Implemented memory-safe APK updater with progress tracking
- Enhanced lifecycle handling for robust update management
- Integrated permission request handling for APK installation

### Fixed
- Resolved memory leak issues in the update checker
- Fixed access modifier conflict for `onDestroy()` override in `MainActivity`

### Changed
- Improved user feedback during APK downloads with a progress dialog
- Enhanced error handling for partial downloads and network failures

## [1.0.4.2] - 2025-03-28
### Fixed
- Fixed NINA Update

## [1.0.4.0] - 2025-03-28
### Added
- slew and Slew and Center added to stellarium
- settings panel for stellaruim added to activate different views
- Equipment: Device selection added
- Sequence editor
- Slew can now be canceled
- TPPA: Modal for bigger font size
- TPPA: Modal for target circel
- Framing wizard: Button slew to cenit
- Last sequence image cache
- SlewAndCenter with AzAlt
- Infomodal for slew and center

### Fixed
- fixes an error when the stellarium page is reloaded
- camera cooling status 

### Changed
- rework Stellarium mount position
- rework Stellarium selected object
- rework slew and slewAndCenter function
- Equipment connect page reworked
- Sequence info changed from json to state
- Hide the connection settings if it is not an Androidapp
- Manual mount control is only available if tracking is not active
- Last sequence image cache
- settings wizzard now loads the coordinates of nina
- imagehistory now loads thumbnails so it is much faster
- CenterHere: Rework Slwe and Centerbutton 

## [1.0.3.0] - 2025-03-08
### Added
- Stellarium Web Engine
- Display current mount position in stellarium
- Object selection in stellarium
- Framing assistent with stellarium data
- Date & Time selection in stellarium
- Image History

### Changed
- update cz
- rework history image

### Fixed
- Setup screen / Nina instance setup for Android only
- Windspeed in weather modal

## [1.0.2.2] - 2025-02-23
### Added
- Create a new SequenceImageHistory view that loads all the images from the history using the SequenceImage component.
- Add this new SequenceImageHistory view as a new tab of the "Sequence Monitoring" page.
- slew can be canceled
- set park position

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
