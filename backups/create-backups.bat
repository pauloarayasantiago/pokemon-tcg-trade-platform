@echo off
echo Creating backups of deprecated directories...

REM Get current date and time for backup name
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "backup_dir=backups\cleanup_backup_%datestamp%"

mkdir "%backup_dir%"
echo Backup directory created: %backup_dir%

REM Backup test app directories
echo Backing up test app directories...
if exist "src\app\test-dashboard" xcopy "src\app\test-dashboard" "%backup_dir%\test-dashboard\" /E /I /H /Y
if exist "src\app\test-api" xcopy "src\app\test-api" "%backup_dir%\test-api\" /E /I /H /Y
if exist "src\app\test-cards" xcopy "src\app\test-cards" "%backup_dir%\test-cards\" /E /I /H /Y

REM Backup pages directory
echo Backing up pages directory...
if exist "src\pages" xcopy "src\pages" "%backup_dir%\pages\" /E /I /H /Y

REM Backup old API test directories
echo Backing up old API test directories...
if exist "src\app\api\test-supabase" xcopy "src\app\api\test-supabase" "%backup_dir%\api\test-supabase\" /E /I /H /Y
if exist "src\app\api\test-pokemon-tcg" xcopy "src\app\api\test-pokemon-tcg" "%backup_dir%\api\test-pokemon-tcg\" /E /I /H /Y
if exist "src\app\api\test-price-update" xcopy "src\app\api\test-price-update" "%backup_dir%\api\test-price-update\" /E /I /H /Y
if exist "src\app\api\test-data-validation" xcopy "src\app\api\test-data-validation" "%backup_dir%\api\test-data-validation\" /E /I /H /Y
if exist "src\app\api\test-card-search" xcopy "src\app\api\test-card-search" "%backup_dir%\api\test-card-search\" /E /I /H /Y
if exist "src\app\api\test-price-schedule" xcopy "src\app\api\test-price-schedule" "%backup_dir%\api\test-price-schedule\" /E /I /H /Y

echo Backup completed. Files are stored in %backup_dir%
echo You can now safely remove the deprecated directories. 