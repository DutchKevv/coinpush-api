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

cd ../

# CLIENT - skip TypeScript check cause Angular is fixed on TypeScript version
cd ../client && npm i && echo 'client installed'

# MOBILE APPS
cd ../client-app && npm i && echo 'client-app installed'

# SERVER
cd ../server-cache && npm i --silent && echo 'server-cache installed'
cd ../server-comment && npm i --silent && echo 'server-comment installed'
cd ../server-event && npm i --silent && echo 'server-event installed'
cd ../server-gateway && npm i --silent && echo 'server-gateway installed'
cd ../server-notify && npm i --silent && echo 'server-notify installed'
cd ../server-user && npm i --silent && echo 'server-user installed'

# SHARED
# cd ../shared/modules/coinpush && npm i && echo 'shared installed'
