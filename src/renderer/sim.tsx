import React, {useEffect, useLayoutEffect, useRef} from "react";
import { appHooks } from "@typisch/eui/euiApp";
import {
    ArcRotateCamera, Color3,
    Engine,
    HemisphericLight,
    MeshBuilder,
    Scene,
    StandardMaterial, Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import { useUpdater } from "@typisch/react/hooks";
import {Color4} from "@babylonjs/core/Maths/math.color";

export function runSim(canvas: HTMLCanvasElement) {

    const engine = new Engine(canvas, true);

    const scene = new Scene(engine);


    const blackAlu = new StandardMaterial("blackAlu", scene);
    blackAlu.diffuseColor = new Color3(0, 0, 0);
    const navyBlueWood = new StandardMaterial("navyBlueWood", scene);
    // navyBlueWood.diffuseColor = new Color3(0, 0, 0.5);
    navyBlueWood.diffuseTexture = new Texture("https://www.babylonjs.com/assets/wood.jpg", scene);
    const waterMat = new StandardMaterial("water", scene);
    waterMat.diffuseColor = new Color3(0, 0, 1);
    waterMat.diffuseTexture = new Texture("https://www.babylonjs.com/assets/waterbump.png", scene);
    waterMat.bumpTexture = new Texture("https://www.babylonjs.com/assets/waterbump.png", scene);
    waterMat.bumpTexture.level = 0.5;
    // water.specularColor = new Color3(0, 0, 0);
    // water.reflectionTexture = new Texture("https://www.babylonjs.com/assets/waterbump.png", scene);
    // water.reflectionTexture.coordinatesMode = Texture.SPHERICAL_MODE;
    // water.reflectionTexture.level = 0.5;
    // water.reflectionTexture.hasAlpha = true;
    // water.reflectionTexture.getAlphaFromRGB = true;
    // water.reflectionTexture.gammaSpace = false;
    // water.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;



    const water = MeshBuilder.CreateGround("water", {width:1000, height:1000}, scene);
    water.material = waterMat;


    const boat = new TransformNode("boat", scene);
    const body = MeshBuilder.CreateBox("body", {width: 1, height: 0.75, depth: 6}, scene);
    body.material = navyBlueWood;
    body.parent = boat;
    const mast = MeshBuilder.CreateBox("mast", {width: 0.1, height: 6, depth: 0.1,
        // faceColors: [
        //     Color4.FromInts(255, 255, 255, 255),
        //     Color4.FromInts(255, 255, 255, 255),
        //     Color4.FromInts(255, 255, 255, 255),
        //     Color4.FromInts(255, 255, 255, 255),
        //     Color4.FromInts(255, 255, 255, 255),
        //     Color4.FromInts(255, 255, 255, 255),
        // ]
    }, scene);
    mast.material = blackAlu;
    mast.position.y = (6 + 0.75) / 2;
    mast.position.z = 2;
    mast.parent = boat;

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);

    let t = 0;
    engine.runRenderLoop(() => {

        const f = 1.5;
        const a = 0.4;
        boat.rotation.x = Math.sin(t * f) * (Math.PI / 8) * a;

        scene.render();
        t += 1/60;
    });




    return {
        sim: {
            engine,
        },
        stop: () => {
            engine.stopRenderLoop(); // TODO required?
            engine.dispose();
        }
    }

}
