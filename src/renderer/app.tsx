import React, {useEffect, useRef} from "react";
import { appHooks } from "@typisch/eui/euiApp";
import {ArcRotateCamera, Engine, HemisphericLight, MeshBuilder, Scene, Vector3} from "@babylonjs/core";

export function App() {

    const me = "App";
    const app = appHooks();

    useEffect(() => {
        console.log(`${me} mounting`);
        return () => console.log(`${me} unmounting`);
    }, []);

    //  const canvas = document.getElementById("renderCanvas"); // Get the canvas element
    //       const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
    //
    //       // Add your code here matching the playground format
    //
    //       const scene = createScene(); //Call the createScene function
    //
    //       // Register a render loop to repeatedly render the scene
    //       engine.runRenderLoop(function () {
    //         scene.render();
    //       });
    //
    //       // Watch for browser/canvas resize events
    //       window.addEventListener("resize", function () {
    //         engine.resize();
    //       });

    const canvas = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        if (canvas.current) {

            const engine = new Engine(canvas.current, true);

            const scene = new Scene(engine);

            MeshBuilder.CreateBox("box", {}, scene);

            const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0), scene);
            camera.attachControl(canvas, true);
            const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);


            engine.runRenderLoop(() => scene.render());

            // TODO resize

            return () => {
                engine.stopRenderLoop(); // TODO required?
                engine.dispose();
            }

        }
    }, [canvas.current]);

    return <canvas ref={canvas} style={{width: "100%", height: "100%"}} />;
}
