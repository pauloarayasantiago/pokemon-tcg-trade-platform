Based on my analysis of your codebase, here's a cleanup plan that focuses on keeping only what's essential for the admin dashboard while maintaining a clean structure:

## Files You Can Safely Remove

1. **`/src/pages/` directory**
   - This is using the legacy Next.js Pages Router while you've migrated to the App Router
   - `auth-test.js` can be removed as authentication testing should be handled through the admin dashboard

2. **`/src/app/test-dashboard/`**
   - This appears to be a duplicate of your admin dashboard with very similar interfaces
   - Your redesigned admin dashboard (`/src/app/admin/dashboard/`) now handles these functions

3. **`/src/app/test-api/`**
   - This test page for API endpoints can be removed once you've integrated all essential API testing into the admin dashboard

4. **`/src/app/test-cards/`**
   - If card testing functionality has been integrated into the admin dashboard, this can be removed

## Files to Consolidate

1. **Supabase Files**
   The multiple Supabase files are following the Next.js App Router patterns (separating server/client concerns), so they are actually following best practices. However, you could simplify:

   - **Current Structure (recommended):**
     - `supabase-browser.ts` - Client-side Supabase client
     - `supabase-server.ts` - Server-side Supabase client
     - `supabase-ssr.ts` - SSR-specific Supabase client
     - `supabase-api.ts` - API route Supabase client
     - `supabase.ts` - Re-export of browser client for simplicity

   This separation is actually a good practice for Next.js with App Router, but ensure all files are actually used.

2. **Utils File vs Utils Directory**
   - `src/lib/utils.ts` - Contains general utility functions like the `cn` function for classnames
   - `src/lib/utils/` - Contains more specific utilities

   This naming is acceptable in Next.js projects, but for clarity you could:
   - Rename `utils.ts` to `ui-utils.ts` or `style-utils.ts` to clarify its UI-specific nature
   - Keep the `utils/` directory for more specialized utilities

## Files to Keep

1. **`/src/components/ui/`**
   - Your shadcn UI components are essential for the admin dashboard

2. **`/src/components/providers/supabase-provider.tsx`**
   - Necessary for Supabase authentication integration

3. **`/src/middleware.ts`**
   - Handles authentication and routing middleware, likely needed for admin access control

4. **`/src/app/admin/`**
   - Your primary admin dashboard

5. **Core API endpoints in `/src/app/api/`**
   - Determine which endpoints your admin dashboard depends on and keep only those
   - Based on the file names, you'll likely need:
     - `test-data-validation/`
     - `test-price-update/`
     - `test-supabase/`

## Recommended Cleanup Approach

1. **Identify Dependencies First**
   Create a dependency graph to ensure no critical imports break:
   - Check all imports in `src/app/admin/dashboard/page.tsx`
   - Trace outward to all components and utilities it uses

2. **Rename Test API Routes**
   - Remove the "test-" prefix from API routes you're keeping
   - For example: `test-data-validation` → `data-validation`

3. **Consolidate Testing Code**
   - Move any critical testing functionality from `/src/app/test-dashboard/` into the admin dashboard
   - Create a dedicated testing section in your admin dashboard if needed

4. **Clean Up in Phases**
   1. First rename directories (e.g., API routes)
   2. Update imports throughout the codebase
   3. Then remove clearly unused files
   4. Finally remove entire directories that aren't needed

## Progress Tracker

| Task | Status | Notes |
|------|--------|-------|
| **Dependency Analysis** | Completed | Identified all dependencies for admin dashboard |
| **Rename API Routes** | Completed | Renamed all API routes |
| **Consolidate Testing Code** | Completed | Added Testing tab with data validation to admin dashboard |
| **Phase 1: Rename Directories** | Completed | Created new structure and marked old directories for removal |
| **Phase 2: Update Imports** | Completed | Updated import paths to reference new file structure |
| **Phase 3: Remove Unused Files** | Completed | Removed individual files no longer needed |
| **Phase 4: Remove Unused Directories** | Completed | Removed directories marked as deprecated |
| **Final Testing** | Completed | Verified admin dashboard works correctly after cleanup |

## Final Testing Summary

The final testing phase has been completed successfully with the following results:

1. **Basic Navigation Testing**
   - Admin dashboard loads correctly at `/admin/dashboard`
   - All 6 tabs are accessible and render properly
   - No console errors on page load
   - UI components render correctly with the new imports

2. **API Connectivity Testing**
   - Connection to Supabase works correctly
   - Pokemon TCG API health check succeeds
   - Price update service health check succeeds
   - All API status indicators show "success"

3. **Data Display Testing**
   - Database statistics are displayed correctly
   - API status information shows timestamps and details accurately
   - Queue statistics are properly shown
   - Set distribution displays properly

4. **Card Sync Functionality Testing**
   - Card sync operations work as expected
   - All sync modes (full, sets-only, cards-only) function properly
   - Sync results are displayed correctly after operations

5. **Price Update Testing**
   - Price updates can be triggered successfully
   - Update options (batch size, limit, etc.) work correctly
   - Results are displayed properly

6. **Testing Tab Verification**
   - Data validation can be performed for all sets
   - Specific set validation works properly
   - Validation results are displayed correctly
   - Error and warning displays function properly

7. **Error Handling Testing**
   - Application handles API errors gracefully
   - Error states are displayed to the user correctly
   - No unexpected errors in the console

All test cases have been verified and the cleanup process is now complete. The codebase is cleaner, more maintainable, and all required functionality has been preserved in the consolidated admin dashboard. The documentation has been updated to reflect the new structure, and we're now ready to proceed with future development on a solid foundation.

## Directory Removal Summary

Phase 4 of the cleanup process has been completed with the following changes:

1. **Created Backup Scripts**
   - Implemented a backup script (`create-backups.bat`) to safely backup all deprecated directories
   - Created a removal script (`remove-deprecated-directories.bat`) with confirmation prompt

2. **Backed Up All Deprecated Directories**
   - Created timestamped backups of all directories before removal
   - Stored backups in a designated `backups` directory for potential recovery if needed

3. **Removed Test App Directories**
   - Removed `/src/app/test-dashboard/`
   - Removed `/src/app/test-api/`
   - Removed `/src/app/test-cards/`

4. **Removed Legacy Pages Router Directory**
   - Removed `/src/pages/`

5. **Removed Old API Test Directories**
   - Removed `/src/app/api/test-supabase/`
   - Removed `/src/app/api/test-pokemon-tcg/`
   - Removed `/src/app/api/test-price-update/`
   - Removed `/src/app/api/test-data-validation/`
   - Removed `/src/app/api/test-card-search/`
   - Removed `/src/app/api/test-price-schedule/`

By removing these deprecated directories, we've significantly cleaned up the codebase, making it more maintainable and easier to navigate. All functionality has been preserved in the admin dashboard and its new API routes.

## Import Update Summary

Phase 2 of the cleanup process has been completed successfully with the following changes:

1. **Updated UI Component Imports**
   - All shadcn UI components now import the `cn` utility function from `@/lib/ui-utils` instead of `@/lib/utils`:
     - Updated `src/components/ui/badge.tsx`
     - Updated `src/components/ui/button.tsx`
     - Updated `src/components/ui/card.tsx`
     - Updated `src/components/ui/tabs.tsx`

2. **Verified API Endpoint References**
   - Confirmed that all API calls in the admin dashboard now use the new routes without the "test-" prefix

3. **Import Change Verification**
   - Run a search for any remaining imports from `@/lib/utils` to ensure all have been updated
   - None found, indicating a successful transition to the new import structure

These updates ensure that all components are using the clearer, more maintainable file structure while maintaining full functionality. The original `utils.ts` file is still present to provide backward compatibility during the transition but will be removed in Phase 3.

## Directory Restructuring Plan

Based on the codebase structure and cleanup requirements, here's the directory restructuring plan for Phase 1:

### Test Directories to Remove

Now that we've consolidated the testing functionality into the admin dashboard, the following directories will be marked for removal:

1. **`/src/app/test-dashboard/`** - Testing functionality moved to admin dashboard
2. **`/src/app/test-api/`** - API testing now handled through admin dashboard
3. **`/src/app/test-cards/`** - Card testing functionality moved to admin dashboard
4. **`/src/pages/`** - Using App Router instead of Pages Router

### API Directories to Reorganize

All API route directories have been renamed, but some duplicate test directories still exist:

1. **Keep newly renamed directories:**
   - `/api/supabase/`
   - `/api/pokemon-tcg/`
   - `/api/price-update/`
   - `/api/data-validation/`
   - `/api/card-search/`

2. **Mark old test directories for removal:**
   - `/api/test-supabase/`
   - `/api/test-pokemon-tcg/`
   - `/api/test-price-update/`
   - `/api/test-data-validation/`
   - `/api/test-card-search/`
   - `/api/test-price-schedule/` - Functionality moved to `/api/price-update/`

### Implementation Steps for Phase 1

1. **First, make sure all necessary files are duplicated in the new structure**
   - Confirm that all functionality from test directories has been moved to the new locations

2. **Update the admin dashboard component**
   - Remove the "Test Dashboard" link in the header of the admin dashboard

3. **Rename the remaining utility directories if needed**
   - Review and potentially rename `src/lib/utils.ts` to `src/lib/ui-utils.ts` for clarity

4. **Mark directories for removal**
   - Create a `.deprecated` file in each directory slated for removal
   - This allows a staged removal process with clear documentation

This phase focuses only on restructuring directories. Import paths will be updated in Phase 2, and actual deletion of files and directories will happen in Phases 3 and 4 after thorough testing.

## Testing Code Consolidation Summary

The testing functionality from the test dashboard has been successfully integrated into the admin dashboard:

1. **Added a dedicated "Testing" tab** in the admin dashboard interface
   - Placed as the 6th tab in the main tab navigation
   - Provides access to testing tools within the main admin interface

2. **Implemented Data Validation functionality**
   - Added ability to validate all data or a specific set
   - Shows validation results including errors and warnings
   - Displays statistics about validated data (sets, cards, missing prices, missing images)

3. **Updated all API endpoint references**
   - Changed all fetch URLs to use the new API routes without the "test-" prefix
   - For example: `/api/supabase` instead of `/api/test-supabase`

4. **Improved state management**
   - Implemented proper React state variables for all testing functionality
   - Maintained consistent UX patterns with the rest of the admin dashboard

5. **Used shadcn/ui components for consistent styling**
   - Implemented Card, Button, and other UI components
   - Maintained visual consistency with the rest of the admin dashboard

All essential testing functionality has been preserved while maintaining a clean and consistent user experience in the admin dashboard. The test-dashboard directory can now be safely removed once testing confirms the functionality works as expected.

## API Routes Renaming Plan

Based on the dependency analysis, we need to rename the following API routes by removing the "test-" prefix while preserving their functionality:

| Current Path | New Path | Status |
|--------------|----------|--------|
| `/api/test-supabase` | `/api/supabase` | Completed |
| `/api/test-pokemon-tcg` | `/api/pokemon-tcg` | Completed |
| `/api/test-pokemon-tcg/health` | `/api/pokemon-tcg/health` | Completed |
| `/api/test-price-update` | `/api/price-update` | Completed |
| `/api/test-price-update/health` | `/api/price-update/health` | Completed |
| `/api/test-price-update/queue-stats` | `/api/price-update/queue-stats` | Completed |
| `/api/test-data-validation` | `/api/data-validation` | Completed |
| `/api/test-card-search` | `/api/card-search` | Completed |

### Renaming Steps:

1. Create the new directory structure in `/api/` for each endpoint
2. Move the route.ts files from the current paths to the new paths
3. Update all references in the codebase to point to the new API routes:
   - In the admin dashboard (`src/app/admin/dashboard/page.tsx`)
   - In test pages if they're temporarily needed
   - In any other components that may reference these endpoints

### Files to Update After Renaming:

1. `src/app/admin/dashboard/page.tsx` - Update all fetch URLs
2. Any other components that may use these API endpoints directly
3. Documentation files (README.md, etc.) that reference these API routes

## Dependency Analysis Findings

### Admin Dashboard Direct Dependencies

The admin dashboard (`src/app/admin/dashboard/page.tsx`) directly depends on:

#### UI Components:
- `@/components/ui/card` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `@/components/ui/tabs` (Tabs, TabsList, TabsTrigger, TabsContent)
- `@/components/ui/button` (Button)
- `@/components/ui/badge` (Badge)

#### API Endpoints:
- `/api/test-supabase` - For database connectivity and stats retrieval
- `/api/test-pokemon-tcg/health` - For TCG API health check
- `/api/test-price-update/health` - For price update service health check
- `/api/test-price-update/queue-stats` - For queue statistics
- `/api/test-pokemon-tcg` - For Pokemon TCG API operations
- `/api/test-price-update` - For price update operations

#### Libraries:
- `react` (useState, useEffect)
- `next/link` (Link)
- `@supabase/auth-helpers-nextjs` (createClientComponentClient)

### API Endpoints Analysis

#### Used by Admin Dashboard:
1. **`/api/test-supabase`**
   - Dependencies: `next/server`, `@supabase/supabase-js`, `@/lib/database.types`
   - Purpose: Database connectivity testing and stats retrieval
   - Status: **Required**

2. **`/api/test-pokemon-tcg`**
   - Dependencies: `next/server`, `@/lib/services/pokemon-tcg-service`, `@/lib/utils/logger`
   - Purpose: Pokemon TCG API operations (syncing sets and cards)
   - Status: **Required**

3. **`/api/test-pokemon-tcg/health`**
   - Purpose: Health check for Pokemon TCG API service
   - Status: **Required**

4. **`/api/test-price-update`**
   - Dependencies: `next/server`, `@supabase/supabase-js`, `@/lib/database.types`
   - Purpose: Card price update operations
   - Status: **Required**

5. **`/api/test-price-update/health`**
   - Purpose: Health check for price update service
   - Status: **Required**

6. **`/api/test-price-update/queue-stats`**
   - Purpose: Statistics about the price update queue
   - Status: **Required**

#### Not Used Directly by Admin Dashboard:

7. **`/api/test-data-validation`**
   - Dependencies: `next/server`, `@/lib/utils/data-validator`, `@/lib/utils/logger`
   - Purpose: Validate card and set data for consistency
   - Usage: Used by the test dashboard but not the admin dashboard
   - Status: **Required for data integrity**

8. **`/api/test-card-search`**
   - Dependencies: `next/server`, `@/lib/utils/card-search`, `@/lib/utils/logger`
   - Purpose: Optimized card search functionality
   - Usage: Not directly used by admin dashboard
   - Status: **Review usage**

### Service Dependencies

1. **`src/lib/services/pokemon-tcg-service.ts`**
   - Dependencies:
     - `@/lib/supabase-server.ts`
     - `@/lib/database.types.ts`
     - `@/lib/services/pokemon-tcg-api.ts`
   - Purpose: Core service for Pokemon TCG API integration
   - Status: **Required**

2. **`src/lib/services/price-update-service.ts`**
   - Dependencies:
     - `@/lib/supabase-server.ts`
     - `@/lib/database.types.ts`
   - Purpose: Service for updating card prices
   - Status: **Required**

3. **`src/lib/services/pokemon-tcg-api.ts`**
   - Purpose: Direct API calls to Pokemon TCG API
   - Status: **Required** (used by pokemon-tcg-service)

### Utility Dependencies

1. **`src/lib/utils/logger.ts`**
   - Purpose: Consistent logging across the application
   - Status: **Required**

2. **`src/lib/utils/data-validator.ts`**
   - Dependencies:
     - `@/lib/supabase-server.ts`
     - `