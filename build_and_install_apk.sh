#!/bin/sh

# ============================================================
# --- Get values "version" and "id" from file "config.xml" ---
# ============================================================

VERSION=`cat config.xml| sed -n 's/.*version="\([0-9]\.[0-9]*\.[0-9]*\).*/\1/p'`
ID=`cat config.xml| sed -n 's/.*id="\([a-z]*\.[a-z]*\.[a-z]*\).*/\1/p'`
APP_NAME=myFeeds

# ============================
# --- Build and rename APK ---
# ============================

cordova build android
cp platforms/android/build/outputs/apk/android-debug.apk ${APP_NAME}_${VERSION}.apk

# =============================
# --- Update or Replace APK ---
# =============================

echo ""
echo "Connect your device then..."
read -p "Update APK (u) or Delete and Replace APK (r) ? " choice
case "$choice" in 
  r|R ) INSTALL=replace;;
  u|U ) INSTALL=update;;
  * ) exit;;
esac

if [ "$INSTALL" = "replace" ];
then
	# Unintall previous version
	adb shell pm uninstall -k $ID
	# Install APK
	adb install ${APP_NAME}_${VERSION}.apk
else
	# Update APK
	adb install -r ${APP_NAME}_${VERSION}.apk
fi
