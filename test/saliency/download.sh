#!/bin/sh

# Fetch and parse the MSRA Salient Object Database 'Image set B'
# http://research.microsoft.com/en-us/um/people/jiansun/salientobject/salient_object.htm

if [ ! -d Image ]; then
  if [ ! -f ImageB.zip ]; then
    echo "Downloading 5000 images (101MB)"
    curl -O http://research.microsoft.com/en-us/um/people/jiansun/salientobject/ImageSetB/ImageB.zip
  fi
  unzip ImageB.zip
fi

if [ ! -d UserData ]; then
  if [ ! -f UserDataB.zip ]; then
    echo "Downloading human-labelled regions"
    curl -O http://research.microsoft.com/en-us/um/people/jiansun/salientobject/ImageSetB/UserDataB.zip
  fi
  unzip UserDataB.zip
fi

if [ ! -f userData.json ]; then
  echo "Processing human-labelled regions"
  node userData.js
fi
