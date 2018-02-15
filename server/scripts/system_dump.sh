#!/usr/bin/env bash

# GENERAL SYSTEM INFORMATION
#
# used by installer and system_info module
#

disk_space_data=$( df -T -h -x tmpfs -x devtmpfs | grep -v ^Filesystem )
mem_total=$( grep MemTotal /proc/meminfo | awk {'print $2'} )
cpu_count=$( grep -c ^processor /proc/cpuinfo )
cpu_model=$( grep "^model name" /proc/cpuinfo | head -1 | awk -F: {'print $2'} )

echo "{ \"disks\": [ "
IFS_bak=$IFS;IFS=$'\n'
comma=""
(for part_data in $disk_space_data
do
	echo -n "$part_data" | awk {'print "'$comma'{ \"part\": \""$1"\", \"type\": \""$2"\", \"size\": \""$3"\", \"free\": \""$5"\", \"mount\": \""$7"\" }"'}
	comma=","
done)
IFS=$IFS_bak
echo "	], "
echo "\"mem\": \"$mem_total\","
echo "\"cpu\": { \"model\": \"$cpu_model\", \"count\": \"$cpu_count\" }"
echo " }"
