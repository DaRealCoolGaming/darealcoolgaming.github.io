#!/bin/bash
# This script can fix things for you if you run into XCode Issues. 

mkdir -p ~/bin
cp /Library/Developer/CommandLineTools/usr/bin/git ~/bin/
mv ~/bin/git ~/bin/gitn 
cp /Library/Developer/CommandLineTools/usr/bin/git-shell ~/bin/
mv ~/bin/git-shell ~/bin/git-shelln
ln -s "$PWD/gitn" ~/bin/gitn 
ln -s "$PWD/git-shelln" ~/bin/git-shelln
chmod +x ~/bin/gitn
chmod +x ~/bin/git-shelln
echo 'export PATH="$Home/bin:$PATH"' >> ~/zshrc
echo 'export PATH="$Home/bin:$PATH"' >> ~/zprofile
echo "Git has been fixed. Please restart your terminal."
echo "To use git from now on, run the command gitn instead."
echo "To use git-shell from now on, run the command git-shelln instead."