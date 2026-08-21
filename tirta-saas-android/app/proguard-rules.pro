# Proguard & R8 rules for Tirta SaaS Android

# Kotlin Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keepclassmembers class * {
    *** Companion;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}

# Retrofit & OkHttp
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepattributes Signature
-keepattributes Exceptions
-keepclasseswithmembers interface * {
    @retrofit2.http.* <methods>;
}

# Room Database
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }

# Timber Logging
-dontwarn timber.log.**
-keep class timber.log.** { *; }

# Models & DTOs
-keep class com.adipras.tirtasaas.**.**Dto { *; }
-keep class com.adipras.tirtasaas.**.**Request { *; }
-keep class com.adipras.tirtasaas.**.**Response { *; }
-keep class com.adipras.tirtasaas.core.database.entity.** { *; }
