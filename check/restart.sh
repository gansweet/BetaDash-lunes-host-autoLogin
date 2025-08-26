#!/bin/sh
nohup /home/container/agsb/xray run -c /home/container/agsb/xr.json > /dev/null 2>&1 &
sleep 3
nohup /home/container/cf-vps-monitor.sh -i -k 1040a7f95b039a344f458db2d2a03aec373c346456628d570eac03a77b1ccf19 -s 2xaz5k -u https://monitor.yahaibiotech.dpdns.org > /dev/null 2>&1 &
