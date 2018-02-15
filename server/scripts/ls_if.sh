#!/usr/bin/env bash

# CONNECTIVITY INFORMATION
#

for x in $( ip link show | sed -nr 's/.*\s([a-z0-9].*):.*\s((DOWN|UP)).*/\1-\2/p' ) ; do
        if=$( echo $x | sed -nr 's/(.*)\-.*/\1/p')
        state=$( echo $x | sed -nr 's/(.*)\-(.*)/\2/p')
        ip=$( ifconfig $if | grep "inet addr" | cut -d ":" -f2 | awk '{ print $1 }' )

        echo "{ \"name\": \"$if\" , \"state\": \"$state\", \"ip\": \"$ip\" }"
done
