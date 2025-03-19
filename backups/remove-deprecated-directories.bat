@echo off
echo WARNING: This script will permanently delete deprecated directories.
echo Make sure you have run create-backups.bat first.
echo.
set /p confirm="Are you sure you want to continue? (y/n): "
if /i "%confirm%" neq "y" (
    echo Operation canceled.
    exit /b
)

echo.
echo Removing deprecated directories...

REM Remove test app directories
echo Removing test app directories...
if exist "src\app\test-dashboard" rmdir /S /Q "src\app\test-dashboard"
if exist "src\app\test-api" rmdir /S /Q "src\app\test-api"
if exist "src\app\test-cards" rmdir /S /Q "src\app\test-cards"

REM Remove pages directory
echo Removing pages directory...
if exist "src\pages" rmdir /S /Q "src\pages"

REM Remove old API test directories
echo Removing old API test directories...
if exist "src\app\api\test-supabase" rmdir /S /Q "src\app\api\test-supabase"
if exist "src\app\api\test-pokemon-tcg" rmdir /S /Q "src\app\api\test-pokemon-tcg"
if exist "src\app\api\test-price-update" rmdir /S /Q "src\app\api\test-price-update"
if exist "src\app\api\test-data-validation" rmdir /S /Q "src\app\api\test-data-validation"
if exist "src\app\api\test-card-search" rmdir /S /Q "src\app\api\test-card-search"
if exist "src\app\api\test-price-schedule" rmdir /S /Q "src\app\api\test-price-schedule"

echo.
echo Cleanup complete. All deprecated directories have been removed.
echo Please run your tests to confirm everything is working as expected. 