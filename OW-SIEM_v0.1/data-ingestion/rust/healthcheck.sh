#!/bin/sh
if nc -z localhost 4000; then
  exit 0
else
  exit 1
fi
