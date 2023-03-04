import React, {useEffect, useLayoutEffect, useRef} from "react";
import { appHooks } from "@typisch/eui/euiApp";
import {ArcRotateCamera, Engine, HemisphericLight, MeshBuilder, Scene, Vector3} from "@babylonjs/core";
import { useUpdater } from "@typisch/react/hooks";

export function App() {

    const me = "App";
    const app = appHooks();

    // render when window is resized
    const updater = useUpdater();
    useEffect(() => {
        const onResize = () => {
            console.log(`window resized`);
            return updater.update();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        console.log(`${me} mounting`);
        return () => console.log(`${me} unmounting`);
    }, []);

    const canvas = useRef<HTMLCanvasElement | null>(null);
    const bab = useRef<{
        engine: Engine;
    } | null>(null);
    useEffect(() => {
        console.log(`FX engine init; canvas.current=${canvas.current}`);
        if (canvas.current) {

            const engine = new Engine(canvas.current, true);

            const scene = new Scene(engine);

            MeshBuilder.CreateBox("box", {}, scene);

            const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0), scene);
            camera.attachControl(canvas, true);
            const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);


            engine.runRenderLoop(() => scene.render());

            bab.current = {engine};

            return () => {
                engine.stopRenderLoop(); // TODO required?
                engine.dispose();
                bab.current = null;
            }

        }
    }, [canvas.current]);
    useEffect(() => {
        console.log(`FX engine resize; bab.current=${bab.current}`);
        if (bab.current) {
            bab.current.engine.resize();
        }
    }); // TODO only if size changed

    return <canvas ref={canvas} style={{width: "100%", height: "100%"}} />;
}
