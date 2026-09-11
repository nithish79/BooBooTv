# Media3 ExoPlayer rules
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# OkHttp & Coil
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class coil.** { *; }
