#!/bin/bash

while getopts u:p: option 
do 
 case "${option}" 
 in 
 u) FOLDERS=${OPTARG};; 
 esac 
done 

# if [$FOLDERS = 'client'] || [-n "$FOLDERS"]; then
    # cd ../client && rm -rf node_modules && rm -f package-lock.json
    # echo 'balasdfadsf'
# fi

cd ../client && rm -rf node_modules && rm -f package-lock.json && echo 'client cleaned'
cd ../client-app && rm -rf node_modules && rm -f package-lock.json && echo 'client-app cleaned'
cd ../server-cache && rm -rf node_modules && rm -f package-lock.json && echo 'server-cache cleaned'
cd ../server-comment && rm -rf node_modules && rm -f package-lock.json && echo 'server-comment cleaned'
cd ../server-event && rm -rf node_modules && rm -f package-lock.json && echo 'server-event cleaned'
cd ../server-gateway && rm -rf node_modules && rm -f package-lock.json && echo 'server-gateway cleaned'
cd ../server-notify && rm -rf node_modules && rm -f package-lock.json && echo 'server-notify cleaned'
cd ../server-user && rm -rf node_modules && rm -f package-lock.json && echo 'server-user cleaned'
cd ../shared/modules/coinpush && rm -rf node_modules && rm -f package-lock.json && echo 'shared cleaned'