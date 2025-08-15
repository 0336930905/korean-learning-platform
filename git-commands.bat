@echo off
echo Initializing Git repository...
git init

echo Setting up Git configuration...
echo Please enter your name:
set /p USERNAME="Enter your name: "
git config user.name "%USERNAME%"

echo Please enter your email:
set /p EMAIL="Enter your email: "
git config user.email "%EMAIL%"

echo Adding all files to staging area...
git add .

echo Creating initial commit...
git commit -m "Initial commit: Korean Language Learning Platform"

echo Adding remote origin...
git remote add origin https://github.com/0336930905/korean-learning-platform.git

echo Setting main branch...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done! Your project has been uploaded to GitHub.
pause
