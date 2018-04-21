#!/bin/bash

pwd
ls -la

cd public || exit
ncftpput -R -v -u "$FTPUSR" -p "$FTPPWD" "w0077e1b.kasserver.com" /www/testsite .