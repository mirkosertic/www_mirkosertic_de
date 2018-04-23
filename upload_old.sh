#!/bin/bash

lftp -f "
open w0077e1b.kasserver.com
user $FTPUSR $FTPPWD
set ftp:passive-mode off
mirror -v -R ./public /www
bye"