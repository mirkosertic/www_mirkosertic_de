#!/bin/bash

pwd
ls -la

lftp -u $FTPUSR,$FTPPWD w0077e1b.kasserver.com \
 -e 'mirror -c -e -R --parallel=10 ./public /www/testsite ; exit'