#!/bin/sh
set -e
TEMP_ORIG=$(mktemp)
TEMP_NEW=$(mktemp)
curl -f -s "http://localhost:15077/prettier?filename=$FILENAME&baseDir=$(pwd)&inPlace=1" -XPOST  --header "Content-Type: text/plain" > /dev/null && \
  git show :$FILENAME > $TEMP_ORIG && \
  git show :$FILENAME | \
  curl -f -s "http://localhost:15077/prettier?filename=$FILENAME&baseDir=$(pwd)" -XPOST --data-binary @- --header "Content-Type: text/plain" > $TEMP_NEW && \
  ( \
    diff $TEMP_NEW $TEMP_ORIG >/dev/null || \
    ( \
      git diff $TEMP_ORIG $TEMP_NEW | \
      sed "s#$TEMP_ORIG#/$FILENAME#g" | \
      sed "s#$TEMP_NEW#/$FILENAME#g" | \
      git apply --cached \
    ) \
  )
rm $TEMP_NEW $TEMP_ORIG
