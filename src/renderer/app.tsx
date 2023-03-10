import React, {useEffect, useMemo, useRef} from "react";
import {appHooks} from "@typisch/eui/euiApp";
import {Engine} from "@babylonjs/core";
import {useUpdater} from "@typisch/react/hooks";
import {runSim} from "./sim";
import {HUD} from "./HUD";

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


    // MUTABLE
    const simInput = useMemo(() => ({
        windAngle: 180,
        windSpeed: 10,
        sailAngle: 0,
    }), []);


    const canvas = useRef<HTMLCanvasElement | null>(null);
    const bab = useRef<{
        engine: Engine;
    } | null>(null);
    useEffect(() => {
        console.log(`FX engine init; canvas.current=${canvas.current}`);
        if (canvas.current) {

            const s = runSim(canvas.current, simInput);
            bab.current = s.sim;
            return () => {
                s.stop();
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

    return <>
        <canvas ref={canvas} style={{width: "100%", height: "100%"}} />
        <div style={{position: "absolute", top: "10px", left: "10px", width: "150px"}}>
            <HUD input={simInput} updateInput={u => {
                u(simInput);
                updater.update();
            }} />
        </div>
    </>;
}
