#!/bin/bash

pwd
ls -la

lftp -f "
open w0077e1b.kasserver.com
user $FTPUSR $FTPPWD
lcd ./public
cd /www/testsite
mirror -R --parallel=10
bye"