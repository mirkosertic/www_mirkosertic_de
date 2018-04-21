#!/bin/bash

pwd
ls -la

lftp -f "
open w0077e1b.kasserver.com
user $FTPUSR $FTPPWD
mirror -v -c --parallel=10 --reverse ./public /www/testsite
bye"