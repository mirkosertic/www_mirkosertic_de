#!/bin/bash

lftp -f "
open w0077e1b.kasserver.com
user $FTPUSR $FTPPWD
lcd ./public
mirror -v -R ./public /www
bye"