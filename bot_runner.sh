#!/bin/sh

for i in {1..40}
do
	{ node bot_random.js Lluis yolo 0 & } > /dev/null 2> /dev/null
	{ node bot_random.js demo demo 1 & } > /dev/null 2> /dev/null
done