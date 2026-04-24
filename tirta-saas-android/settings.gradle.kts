pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.10.0"
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "tirta-saas-android"
include(":printer-bridge")
// Keep the legacy :app task path working for tooling that still calls :app:assembleDebug.
include(":app")
project(":app").projectDir = file("printer-bridge")
