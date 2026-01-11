#!/bin/bash
SOURCE="/Users/mehmet/Documents/github/broccoliapps/ema-pulse/assets/ema-pulse-logo-1024.png"
IOS_DEST="/Users/mehmet/Documents/github/broccoliapps/ema-pulse/mobile-app/ios/MobileApp/Images.xcassets/AppIcon.appiconset"
ANDROID_RES="/Users/mehmet/Documents/github/broccoliapps/ema-pulse/mobile-app/android/app/src/main/res"

# iOS icons
sips -z 40 40 "$SOURCE" --out "$IOS_DEST/icon-20@2x.png"
sips -z 60 60 "$SOURCE" --out "$IOS_DEST/icon-20@3x.png"
sips -z 58 58 "$SOURCE" --out "$IOS_DEST/icon-29@2x.png"
sips -z 87 87 "$SOURCE" --out "$IOS_DEST/icon-29@3x.png"
sips -z 80 80 "$SOURCE" --out "$IOS_DEST/icon-40@2x.png"
sips -z 120 120 "$SOURCE" --out "$IOS_DEST/icon-40@3x.png"
sips -z 120 120 "$SOURCE" --out "$IOS_DEST/icon-60@2x.png"
sips -z 180 180 "$SOURCE" --out "$IOS_DEST/icon-60@3x.png"
cp "$SOURCE" "$IOS_DEST/icon-1024.png"

# Android icons
sips -z 48 48 "$SOURCE" --out "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
sips -z 72 72 "$SOURCE" --out "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
sips -z 96 96 "$SOURCE" --out "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
sips -z 144 144 "$SOURCE" --out "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
sips -z 192 192 "$SOURCE" --out "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"

sips -z 48 48 "$SOURCE" --out "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"
sips -z 72 72 "$SOURCE" --out "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"
sips -z 96 96 "$SOURCE" --out "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"
sips -z 144 144 "$SOURCE" --out "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"
sips -z 192 192 "$SOURCE" --out "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"

echo "App icons generated successfully!"
