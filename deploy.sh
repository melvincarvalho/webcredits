#!/bin/bash

git update-index --assume-unchanged bin/dbconfig.js

git add -u
git commit -m "$1"
git push origin master

git checkout gh-pages
git merge master
git push origin gh-pages

git checkout master

bower install
