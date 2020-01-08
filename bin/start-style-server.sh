#!/bin/sh
(npx barona-style-server&) 2>/dev/null 1>&2 ; while ! curl http://localhost:15077 2>/dev/null 1>&2; do true; done
