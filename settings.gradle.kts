rootProject.name = "boatsim"

val typischPacks = listOf("core", "earthapp", "electron", "eui", "node", "react")
val modules = listOf("main", "renderer")

typischPacks.forEach { p ->
    include(":subs:typisch:packs:$p")
}
modules.forEach { m ->
    include(":modules:$m")
}
