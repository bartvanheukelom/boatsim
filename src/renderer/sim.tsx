import React from "react";
import {
    ArcRotateCamera,
    Color3,
    Engine,
    HemisphericLight, Mesh,
    MeshBuilder,
    Scene,
    Space,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {SimInput} from "./types";

export function runSim(canvas: HTMLCanvasElement, input: SimInput) {

    const engine = new Engine(canvas, true);

    const scene = new Scene(engine);


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

    const ww = 100;
    const hww = ww / 2;

    const water = MeshBuilder.CreateGround("water", {width:ww, height:ww}, scene);
    water.material = waterMat;


    const blackAlu = new StandardMaterial("blackAlu", scene);
    blackAlu.diffuseColor = new Color3(0, 0, 0);
    const navyBlueWood = new StandardMaterial("navyBlueWood", scene);
    // navyBlueWood.diffuseColor = new Color3(0, 0, 0.5);
    navyBlueWood.diffuseTexture = new Texture("https://www.babylonjs.com/assets/wood.jpg", scene);
    const offWhiteCloth = new StandardMaterial("offWhiteCloth", scene);
    offWhiteCloth.diffuseColor = new Color3(1, 1, 0.9);

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
    mast.position.z = 1;
    mast.parent = boat;

    const sail = new TransformNode("sail", scene);
    sail.parent =  mast;
    sail.position.y = 2;

    const sailMesh = MeshBuilder.CreateBox("sailMesh", {width: 0.01, height: 4, depth: 3}, scene);
    sailMesh.parent = sail;
    sailMesh.material = offWhiteCloth;
    sailMesh.position.y = -2.5;
    sailMesh.position.z = 1.6;

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);

    const airMat = new StandardMaterial("air", scene);
    airMat.diffuseColor = new Color3(1, 0, 0);
    const airs: Mesh[] = [];
    for (let i = 0; i < 3000; i++) {
        const air = MeshBuilder.CreateSphere("air", {diameter: 0.1}, scene);
        air.position.x = Math.random() * ww - hww;
        air.position.y = Math.random() * 7;
        air.position.z = Math.random() * ww - hww;
        air.material = airMat;
        airs.push(air);
    }

    let t = 0;
    engine.runRenderLoop(() => {

        const f = 1.5;
        const a = 0.4;

        boat.rotationQuaternion = null;

        // bob bob bob - TODO QUATERNION
        // boat.rotation.x = Math.sin(t * f) * (Math.PI / 8) * a;

        // add a tilt based on windAngle (where y+ is up)
        const waRadians = (input.windAngle * Math.PI / 180) + Math.PI;
        const windVec = new Vector3(Math.sin(waRadians) * input.windSpeed, 0, Math.cos(waRadians) * input.windSpeed);

        for (const air of airs) {
            air.position.addInPlace(windVec.scale(1/60));
            if (air.position.x < -hww) {
                air.position.x += ww;
            }
            if (air.position.x > hww) {
                air.position.x -= ww;
            }
            if (air.position.z < -hww) {
                air.position.z += ww;
            }
            if (air.position.z > hww) {
                air.position.z -= ww;
            }
        }

        const tiltAngle = (Math.PI * 2) * 0.005;
        // boat.rotation.z += Math.sin(waRadians) * tiltAngle * a;
        // boat.rotation.y += Math.cos(waRadians) * tiltAngle * a;
        // boat.rotate(new Vector3(Math.sin(waRadians), 0, Math.cos(waRadians)), tiltAngle, Space.WORLD);
        boat.rotate(new Vector3(0, 0, 1), -tiltAngle * windVec.x, Space.LOCAL);
        boat.rotate(new Vector3(1, 0, 0), -tiltAngle * windVec.z * 0.12, Space.LOCAL);

        // bob bob bob
        boat.rotate(new Vector3(1, 0, 0), Math.sin(t * 2) * Math.PI * 0.01, Space.WORLD);
        boat.rotate(new Vector3(0, 0, 1), Math.sin(t * 1.5) * Math.PI * 0.01, Space.WORLD);
        boat.rotate(new Vector3(0, 0, 1), Math.sin(t * 0.621) * Math.PI * 0.01, Space.WORLD);

        sail.rotationQuaternion = null;
        sail.rotate(new Vector3(0, 1, 0), -degToRad(input.sailAngle) + Math.PI, Space.LOCAL);

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

function degToRad(deg: number) {
    return deg * Math.PI / 180;
}
