# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Unified testing dashboard integrated into admin dashboard
- Comprehensive testing tab with data validation capabilities
- Improved error handling across all API endpoints
- Detailed system health monitoring in admin dashboard
- Price update scheduling system
- New API endpoints with cleaner naming convention
- Complete testing suite for validating admin dashboard functionality
- Backup and recovery scripts for safe code cleanup
- Advanced card browser with filtering, sorting, and pagination capabilities
- Card database browsing functionality in the admin dashboard
- Enhanced card browser with grid/table views, set analytics, and advanced filtering
- Set distribution visualization and metrics in card browser

### Changed

- Refactored API endpoints to remove "test-" prefix
- Improved layout and organization of advanced card browser
- Consolidated all testing functionality into admin dashboard
- Renamed utils.ts to ui-utils.ts for better semantic clarity
- Enhanced API response formats for consistency
- Refactored services for better separation of concerns
- Streamlined error handling for API requests
- Updated documentation to reflect new codebase structure
- Updated main landing page to a simplified module with navigation buttons for the Inventory System and Admin Dashboard.
- Enhanced card browser with type, generation, and era filtering options
- Improved card price freshness indicators with color-coded badges

### Fixed

- Resolved synchronization issues with Pokemon TCG API
- Fixed type safety issues in database interactions
- Improved data validation accuracy
- Corrected inconsistencies in price update service
- Fixed card search pagination
- Resolved UI rendering issues in card browser
- Improved error handling in API endpoints
- Fixed SelectItem component to use non-empty string values
- Fixed card browser image rendering issues with robust URL handling and fallback mechanisms
- Added comprehensive error handling for card images with appropriate fallbacks
- Resolved CORS issues with image loading by ensuring proper URL formatting
- Fixed count method in cards API that was preventing results from displaying
- Fixed Tailwind CSS configuration to properly recognize custom utility classes

### Removed

- Deprecated test pages (/test-dashboard, /test-api, /test-cards)
- Legacy pages directory (migrated to App Router)
- Old API test directories (all /api/test-* endpoints)
- Redundant utility functions
- Duplicate code across testing implementations
- Unnecessary dependencies
- Legacy file structure and organization

## [0.7.0] - 2023-11-15

### Added

- Admin dashboard with system monitoring
- Card sync functionality
- Price update trigger
- Database statistics
- Set information panel

### Changed

- Moved to App Router architecture
- Enhanced UI with shadcn/ui components
- Improved error handling

### Fixed

- API rate limiting issues
- Data inconsistencies in card display
- Performance issues in large set retrieval

## [0.6.0] - 2023-09-20

### Added

- Initial implementation of test dashboard
- Basic card browser
- Pokemon TCG API integration
- Supabase database setup
- Card data model