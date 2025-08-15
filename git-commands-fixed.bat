@echo off
set GIT_PATH="C:\Program Files\Git\bin\git.exe"

echo Initializing Git repository...
%GIT_PATH% init

echo Setting up Git configuration...
echo Please enter your name:
set /p USERNAME="Enter your name: "
%GIT_PATH% config user.name "%USERNAME%"

echo Please enter your email:
set /p EMAIL="Enter your email: "
%GIT_PATH% config user.email "%EMAIL%"

echo Adding all files to staging area...
%GIT_PATH% add .

echo Creating initial commit...
%GIT_PATH% commit -m "Initial commit: Korean Language Learning Platform"

echo Adding remote origin...
%GIT_PATH% remote add origin https://github.com/0336930905/korean-learning-platform.git

echo Setting main branch...
%GIT_PATH% branch -M main

echo Pushing to GitHub...
%GIT_PATH% push -u origin main

echo Done! Your project has been uploaded to GitHub.
pause
