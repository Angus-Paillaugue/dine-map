#!/usr/bin/env bash

HERE=$(dirname "$0")
PROJECT_ROOT=$(realpath "$HERE/../..")

# Run all the scrip in the same directory as this script
. "$HERE/download.sh"
. "$HERE/compile.sh"
