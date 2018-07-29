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

# CLIENT (BROWSER) - skip TypeScript check cause Angular is fixed on TypeScript version
cd ../client && ncu -u -a --reject typescript && echo 'client updated'

# MOBILE (APPS)
cd ../client-app && ncu -u -a && echo 'client-app updated'

# SERVER (NodeJS microservices)
cd ../server-cache && ncu -u -a && echo 'server-cache updated'
cd ../server-comment && ncu -u -a && echo 'server-comment updated'
cd ../server-event && ncu -u -a && echo 'server-event updated'
cd ../server-gateway && ncu -u -a && echo 'server-gateway updated'
cd ../server-notify && ncu -u -a && echo 'server-notify updated'
cd ../server-user && ncu -u -a && echo 'server-user updated'
cd ../shared/modules/coinpush && ncu -u -a && echo 'shared updated'