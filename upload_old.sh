#!/bin/bash

cd public
find . -type f -exec curl -u $FTPUSR:$FTPPWD --ftp-create-dirs -T {} ftp://w0077e1b.kasserver.com/www/testsite2/{} \;
