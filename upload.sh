#!/bin/bash

pwd
ls -la

if  [[ $TRAVIS_PULL_REQUEST = "false" ]]
    cd public || exit
    ncftpput -R -v -u "$FTPUSR" -p "$FTPPWD" "w0077e1b.kasserver.com" /www/testsite .
fi
