#!/bin/bash

pwd
ls -la

lftp -e "mirror -c -v -R ./public /www/testsite/" -u $FTPUSR,$FTPPWD w0077e1b.kasserver.com
