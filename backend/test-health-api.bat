@echo off
echo Testing Health Metrics API Endpoints...
echo.

REM Get JWT token (replace with actual token)
set TOKEN=your-jwt-token-here

echo 1. Testing POST /api/health-readings/record
curl -X POST http://localhost:4000/api/health-readings/record ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test-user\",\"heartRate\":72,\"steps\":8500,\"sleepHours\":7.5}"
echo.
echo.

echo 2. Testing GET /api/health-readings/latest/test-user
curl http://localhost:4000/api/health-readings/latest/test-user ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 3. Testing GET /api/health-readings/stats/test-user?days=30
curl "http://localhost:4000/api/health-readings/stats/test-user?days=30" ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo Tests complete!
pause
