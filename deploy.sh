#!/bin/bash

git add -u
git commit -m "$1"
git push origin master

git checkout gh-pages
git merge master
git push origin gh-pages

git checkout master

bower install
