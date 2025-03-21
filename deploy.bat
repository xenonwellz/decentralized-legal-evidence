@echo off
REM Clean up directories
rmdir /s /q packages\frontend\src\artifacts
rmdir /s /q packages\hardhat\artifacts
rmdir /s /q packages\hardhat\ignition\deployments
rmdir /s /q packages\hardhat\cache

REM Navigate to hardhat directory and run deploy
cd packages\hardhat
call pnpm run deploy
xcopy /E /I /Y artifacts ..\frontend\src\artifacts

REM Find deployed_addresses.json and copy it
for /f "tokens=*" %%a in ('dir /b /s ignition\deployments\deployed_addresses.json') do (
    set "DEPLOYED_ADDRESSES_FILE=%%a"
    goto :found
)

:found
if defined DEPLOYED_ADDRESSES_FILE (
    echo Found deployed addresses at !DEPLOYED_ADDRESSES_FILE!
    copy "!DEPLOYED_ADDRESSES_FILE!" ..\frontend\src\artifacts
) else (
    echo deployed_addresses.json not found
)

REM Return to original directory
cd ..\.. 