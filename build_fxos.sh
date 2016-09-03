#!/bin/sh

# ============================================================
# --- Get values "version" and "id" from file "config.xml" ---
# ============================================================

VERSION=`cat config.xml| sed -n 's/.*version="\([0-9]\.[0-9]*\.[0-9]*\).*/\1/p'`
ID=`cat config.xml| sed -n 's/.*id="\([a-z]*\.[a-z]*\.[a-z]*\).*/\1/p'`
APP_NAME=myFeeds

# ============================
# --- Build and rename APP ---
# ============================

cordova build firefoxos
cp platforms/firefoxos/build/package.zip ${APP_NAME}_${VERSION}.zip

# ===============
# --- Ugly :( ---
# ===============
# Remove plugin vibration who does not works on FXOS platform.
# (It works on Android platform)

zip -d ${APP_NAME}_${VERSION}.zip "plugins/cordova-plugin-vibration/*"
