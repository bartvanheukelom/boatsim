import kotlinx.serialization.json.*
import kotlinx.serialization.json.Json.Default.decodeFromString

//plugins {
//    id("de.undercouch.download") version "4.1.2"
//}
buildscript {
	dependencies {
//		"classpath"("org.jbali:jbali-gradle-tools:cd012738_gradle-7.6") - TODO ugh, github doesn't allow anonymous download
		"classpath"("org.jetbrains.kotlinx:kotlinx-serialization-json:1.4.1")
	}
	repositories {
//		maven("https://maven.pkg.github.com/bartvanheukelom/jbali-gradle-tools")
		mavenCentral()
	}
}

val subsGroup = childProjects.getValue("subs")
val typischProjects = subsGroup.childProjects.getValue("typisch").childProjects.getValue("packs").childProjects
val typischPacks = typischProjects.values.map { it.name }

val moduleProjects = childProjects.getValue("modules").childProjects
val mpMain = moduleProjects.getValue("main")
val mpRenderer = moduleProjects.getValue("renderer")

//import de.undercouch.gradle.tasks.download.Download

buildDir = file("build")

val depLockFile = file("pnpm-lock.yaml")
// describes the contents of node_modules and can be used for up-to-date checks instead of the node_modules dir itself
val nodeModules = file("node_modules")
val nodeModulesManifest = File(nodeModules, ".pnpm/lock.yaml")

//val srcCommon = file("src/common")
//val srcMain = file("src/main")
//val srcTypisch = file("typisch/src")
//val srcRenderer = file("src/renderer")
//val buildTscMain = File(buildDir, "tsc/main")
//val buildTscRenderer = File(buildDir, "tsc/renderer")
////val buildRollupMain = File(buildDir, "rollup/main")
//val buildRollupRenderer = File(buildDir, "rollup/renderer")


val src = file("src")
//val buildTsc = File(buildDir, "tsc")
//val buildBundle = File(buildDir, "bundle/index.js") // must have its own subdir for the copy task
//val buildSass = File(buildDir, "sass")
val buildRenderer = File(buildDir, "renderer")
val rootDir = projectDir


fun ExecSpec.pnpmCommand(vararg cmd: String) {
	workingDir = projectDir
	commandLine("npx", "pnpm", *cmd)
}

val npmInstall = tasks.register("npmInstall") {
	
	inputs.property("version", 22110302)
	inputs.file("package.json")
//	inputs.file(depLockFile)
	outputs.file(depLockFile) // also input
	outputs.file(nodeModulesManifest)
 
	doLast {
		
		// hardcore, causes a full reinstall even if only e.g. this build script changed a bit,
		// so disabled. enable if you want to force a full reinstall (or just delete node_modules).
//		nodeModules.deleteRecursively()
//		check(!nodeModules.exists())
		
		exec { pnpmCommand("install",
			"--shamefully-hoist"
		) }
		
		exec {
			workingDir = projectDir
			// TODO this poisons PNPM's centrally stored version, do something about that
			commandLine("npx", "electron-rebuild")
		}
		
		typischPacks.forEach {
			val link = File(nodeModules, "@typisch/$it")
			val target = file("subs/typisch/build/$it")
			link.parentFile.mkdirs()
			check(link.parentFile.isDirectory)
			exec {
				commandLine("ln", "--symbolic", "--no-target-directory",
					"--force", // because it may already exist from a previous install
					target.relativeTo(link.parentFile), link)
			}
		}
	}
}

configure(typischProjects.values) {
	val tp = this
	
	val typischRoot = file("../..")
	val srcRoot = File(typischRoot, "src")
	
	tasks {
		
		val tsc by registering {
			dependsOn(npmInstall)
			
			val srcDir = File(srcRoot, tp.name)
			val configFile = File(srcDir, "tsconfig.json")
			
			val tsConfig = configFile.readText()
				.let { decodeFromString(JsonObject.serializer(), it) }
			
			val interDeps = tsConfig.get("references")
				?.let { refs -> refs.jsonArray
					.map { it.jsonObject.getValue("path").jsonPrimitive.content.removePrefix("../") }
				}
				?: emptyList()
			logger.info("Inter-project dependencies for typisch pack ${tp.name}: $interDeps")
			interDeps.forEach {
				dependsOn(typischProjects.getValue(it).tasks.named("tsc"))
			}
			
			inputs.file(nodeModulesManifest)
			inputs.file(configFile)
			inputs.file(File(srcRoot, "tsconfig-base.json"))
			inputs.file(File(typischRoot, "tsconfig-base.json"))
			inputs.dir(srcDir)
			
			outputs.dir(File(typischRoot, "build/${tp.name}"))
			
			val cmdLine = listOf(
				"npx", "tsc",
				"--project", configFile.absolutePath,
				"--incremental",
				// make CJS modules for Node - TODO cleaner solution
				"--module", "commonjs",
			)
			inputs.property("cmdLine", cmdLine)
			
			// TODO https://github.com/microsoft/TypeScript/wiki/Performance#concurrent-type-checking
			doLast {
				exec {
					workingDir = typischRoot // TEMP because typisch/$pack dir doesn't exist
					commandLine(cmdLine)
				}
			}
		}
		
		val build by registering {
			dependsOn(tsc)
		}
		
	}
}

val srcRoot = file("src")

configure(moduleProjects.values) {
	val mp = this
	
	val srcDir = File(srcRoot, mp.name)
	val configFile = File(srcDir, "tsconfig.json")
	
	val tsConfig = configFile.readText()
		.let { decodeFromString(JsonObject.serializer(), it) }
	
	val outDir = File(configFile.parentFile, tsConfig.getValue("compilerOptions").jsonObject.getValue("outDir").jsonPrimitive.content)
	
	tasks {
		
		val tsc by registering {
			dependsOn(npmInstall)
			
			val tpDeps = tsConfig.get("references")
				?.let { refs -> refs.jsonArray
					.map { it.jsonObject.getValue("path").jsonPrimitive.content.removePrefix("../../subs/typisch/src/") }
				}
				?: emptyList()
			logger.info("Typisch pack dependencies for module ${mp.name}: $tpDeps")
			tpDeps.forEach {
				val tp = typischProjects[it] ?: error("Typisch pack '$it' not found in ${typischProjects.keys}")
				dependsOn(tp.tasks.named("tsc"))
			}
			
			inputs.file(nodeModulesManifest)
			inputs.file(configFile)
//			inputs.file(File(srcRoot, "tsconfig-base.json"))
//			inputs.file(File(typischRoot, "tsconfig-base.json"))
			inputs.dir(srcDir)
			
			logger.info("Output dir for module ${mp.name}: $outDir")
			outputs.dir(outDir)
			
			doLast {
				exec {
					workingDir = srcDir
					commandLine("npx", "tsc",
						"--project", configFile.absolutePath,
						"--incremental",
					)
				}
			}
			
		}
		
		val build by registering {
			dependsOn(tsc)
		}
		
		if (mp.name == "renderer") {
			
			val buildBundle = File(rootProject.buildDir, "bundle/index.js")
			val buildSass = File(rootProject.buildDir, "sass")
			
			val bundle by registering(Exec::class) {
				dependsOn(tsc)
				
				val configFile = file("esbuild.mjs")
				val typischModules = file("subs/typisch/node_modules")
				
				inputs.file(nodeModulesManifest)
				inputs.file(configFile)
				inputs.dir(outDir)
				inputs.dir(rootProject.file("subs/typisch/build"))
				
				outputs.file(buildBundle)
				
				doFirst {
					if (typischModules.exists()) {
						// TODO fix properly
						error("Cannot safely bundle while '$typischModules' exists. Delete it.")
					}
					delete(buildBundle)
				}
				commandLine(
					configFile.absolutePath,
					"--indir", outDir.absolutePath,
					"--outfile", buildBundle.absolutePath,
				)
				standardOutput = System.out
				errorOutput = System.err
			}
			
			val sass by registering(Exec::class) {
				dependsOn(npmInstall)
				
				val inputFile = file("index.scss")
				val outputFile = File(buildSass, "index.css")
				
				inputs.file(nodeModulesManifest) // in case sass itself is updated
				inputs.file(inputFile)
//				inputs.files(fileTree("src") {
//					include("**/*.css")
//					include("**/*.scss")
//				})
				
				outputs.file(outputFile)
				
				commandLine("npx", "sass", inputFile.absolutePath, outputFile.absolutePath)
//				workingDir = rootProject.projectDir - doesn't matter, imports are resolved relative to the file they're in
				standardOutput = System.out
				errorOutput = System.err
			}
			
			val copy by registering(Copy::class) {
				dependsOn(bundle, sass)
				
				doFirst {
					delete(buildRenderer)
				}
				
				// TODO why do extra dirs main and renderer appear in result
				from(
					// dirs
					rootProject.file("renderer"),
					buildBundle.parentFile,
					buildSass,
					// files
//					File(nodeModules, "cropperjs/dist/cropper.css"), TODO not used?
				)
				into(buildRenderer)
				
				doLast {
					File(buildRenderer, "build.json").writeText("""
						{ "time": "${java.time.Instant.now()}" }
					""".trimIndent())
				}
			}
			
			build {
				dependsOn(copy)
			}
		}
		
	}
	
}



tasks {

//	val rdtDownload by registering(Download::class) {
//		src("https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3Dfmkadmapgofadopljbjfkapdkoienihi%26uc&prodversion=32")
//		dest(File(buildDir, "rdt/crx.zip"))
//		onlyIfModified(true)
//	}
//
//	val rdtExtract by registering(Exec::class) {
//		dependsOn(rdtDownload)
//		val zipFile = File(buildDir, "rdt/crx.zip") // TODO get from rdtDownload?
//		val outDir = File(buildDir, "rdt/extract")
//		inputs.file(zipFile)
//		outputs.dir(outDir)
//		doFirst {
//			delete(outDir)
//			mkdir(outDir)
//		}
//		// use unzip because Gradle zipTree seemingly can't handle the extra prefix bytes in the zip
//		commandLine("unzip", zipFile.absolutePath)
//		workingDir(outDir)
//		standardOutput = System.out
//		errorOutput = System.err
//		setIgnoreExitValue(true) // unzip returns an error code because of the prefix, but works fine
//	}
	
	
	val preNpmStartMain by registering {
		dependsOn(mpMain.tasks.named("build"))
	}

	val preNpmStart by registering {
		dependsOn(
			preNpmStartMain,
			mpRenderer.tasks.named("copy")
			//rdtExtract,
		)
	}

	val build by registering {
	}
	
}

afterEvaluate {
	tasks.named("build").configure {
		val parent = this
		typischProjects.values.forEach { child ->
			parent.dependsOn(child.tasks["build"])
		}
        moduleProjects.values.forEach { child ->
            parent.dependsOn(child.tasks["build"])
        }
	}
}

gradle.taskGraph.addTaskExecutionListener(object : TaskExecutionListener {
	override fun beforeExecute(task: Task) {}
	
	override fun afterExecute(task: Task, state: TaskState) {
		state.failure?.let { e ->
			exec {
				commandLine("notify-send", "${task.name}: ERROR $e")
			}
		}
	}
	
})
