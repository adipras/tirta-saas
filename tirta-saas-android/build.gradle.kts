plugins {
    id("com.android.application") version "8.13.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}

subprojects {
    if (name == "app") {
        // The legacy alias points to the same sources as :printer-bridge, so it needs
        // its own build directory to avoid Gradle output collisions.
        layout.buildDirectory.set(rootProject.layout.buildDirectory.dir("legacy-app"))
    }
}
