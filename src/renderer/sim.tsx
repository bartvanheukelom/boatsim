import React from "react";
import {
    ArcRotateCamera,
    Color3,
    Engine,
    HemisphericLight, InstancedMesh, Mesh,
    MeshBuilder, Quaternion,
    Scene,
    Space,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {SimInput} from "./types";
import * as CN from "cannon-es";



export function runSim(canvas: HTMLCanvasElement, input: SimInput) {

    const engine = new Engine(canvas, true);

    const scene = new Scene(engine);

    const gravity = 9.82;
    const cWorld = new CN.World({
        gravity: new CN.Vec3(0, -gravity, 0),
    });


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

    const ww = 32;
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

    const boatBodySize = { x: 2, y: 0.75, z: 6 };
    const keelSize = { x: 0.2, y: 0.6, z: 1 };
    const keelOffset = { x: 0, y: -boatBodySize.y/2 - keelSize.y/2, z: 0 };
    const boatCOM = { x: 0, y: keelOffset.y * 0.9, z: 0 }; // center of mass, TODO calculate from masses of shapes

    const cBoat = new CN.Body({
        mass: 5,
        position: new CN.Vec3(0, 0, 0),
    });
    const cBoatOffset = new CN.Vec3(-boatCOM.x, -boatCOM.y, -boatCOM.z);
    // main body
    cBoat.addShape(
        new CN.Box(new CN.Vec3(
            boatBodySize.x / 2,
            boatBodySize.y / 2,
            boatBodySize.z / 2,
        )),
        cBoatOffset,
    );
    // heavy keel
    cBoat.addShape(
        new CN.Box(new CN.Vec3(
            keelSize.x / 2,
            keelSize.y / 2,
            keelSize.z / 2,
        )),
        new CN.Vec3(keelOffset.x, keelOffset.y, keelOffset.z).vadd(cBoatOffset),
    );
    cWorld.addBody(cBoat);

    const boatAtCOM = new TransformNode("boatAtCOM", scene);
    const boat = new TransformNode("boat", scene);
    boat.parent = boatAtCOM;
    const body = MeshBuilder.CreateBox("body", {width: boatBodySize.x, height: boatBodySize.y, depth: boatBodySize.z}, scene);
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

    const keel = MeshBuilder.CreateBox("keel", {width: keelSize.x, height: keelSize.y, depth: keelSize.z}, scene);
    keel.parent = boat;
    keel.material = blackAlu;
    keel.position.set(keelOffset.x, keelOffset.y, keelOffset.z);

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
    const airs: InstancedMesh[] = [];
    const air = MeshBuilder.CreateSphere("air", {diameter: 0.1}, scene);
    air.material = airMat;
    air.isVisible = false;
    const airsPerM3 = 1/100;
    for (let i = 0; i < (ww*ww*ww) * airsPerM3; i++) {
        const airi = air.createInstance("air" + i);
        airi.position.x = Math.random() * ww - hww;
        airi.position.y = Math.random() * 7;
        airi.position.z = Math.random() * ww - hww;
        airs.push(airi);
    }

    let t = 0;
    let paused = false;
    engine.runRenderLoop(() => {

        // auto pause if boat sinks
        if (cBoat.position.y < -20) {
            paused = true;
        }

        if (!paused) {
            cWorld.step(1/60);

            const f = 1.5;
            const a = 0.4;

            // boat.rotationQuaternion = null;

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



            // sample a 3d grid of points in cBoat, convert to world space,
            // and apply a force to the boat based on their depth in the water, ie their y value
            const sd = 0.1;
            const slicesX = 5; // Math.ceil(boatBodySize.x / sd);
            const slicesY = 7; //Math.ceil(boatBodySize.y / sd);
            const slicesZ = 13; //Math.ceil(boatBodySize.z / sd);

            const swx = boatBodySize.x / slicesX; // slice width x
            const swy = boatBodySize.y / slicesY; // slice width y
            const swz = boatBodySize.z / slicesZ; // slice width z
            const sliceVolume = swx * swy * swz;

            for (let ix = 0; ix < slicesX; ix++) {
                const sx = (ix * swx) + swx/2 - boatBodySize.x/2; // center of slice x
                for (let iy = 0; iy < slicesY; iy++) {
                    const sy = (iy * swy) + swy/2 - boatBodySize.y/2; // center of slice y
                    for (let iz = 0; iz < slicesZ; iz++) {
                        const sz = (iz * swz) + swz/2 - boatBodySize.z/2; // center of slice z

                        // centerpoint of slice in boat space
                        const p = new CN.Vec3(sx, sy, sz);
                        // centerpoint of slice in world space
                        const pWorld = cBoat.pointToWorldFrame(p);
                        // console.log(`slice[${ix},${iy},${iz}] p=${p.toString()} pWorld=${pWorld.toString()}`);

                        if (pWorld.y < 0) {
                            // TODO if not fully submerged, correct volume approximately

                            // buoyant force = fluid density * displacement volume * gravity
                            const buoyantForce = 1 * sliceVolume * gravity;
                            const force = new CN.Vec3(0, buoyantForce, 0);
                            // console.log(`force=${force.toString()}`);
                            cBoat.applyForce(force, cBoat.vectorToWorldFrame(p));
                        }
                    }
                }
            }

            // apply wind force
            const windForce = new CN.Vec3(windVec.x, 0, windVec.z)
                .scale(0.1);
            cBoat.applyForce(windForce, cBoat.vectorToWorldFrame(new CN.Vec3(0, 3, 0)));

            // if boat goes too far from 0,*,0, nudge it back
            const boatDistance: CN.Vec3 = cBoat.position.clone();
            boatDistance.y = 0;
            if (boatDistance.length() > 3) {

                if (boatDistance.length() > 10) {
                    paused = true; // applied next frame
                }

                const hysterisis = 0.5;
                const nudgeForce = (boatDistance.length() - 3 + hysterisis) * 20;
                let nudgeForceWorld = boatDistance.clone();
                nudgeForceWorld.normalize(); // MUTATES! WHYYYYYYYYYYYY
                nudgeForceWorld = nudgeForceWorld.scale(-nudgeForce);
                console.log(`BOAT RUNNING AWAY! boatDistance=${boatDistance.toString()} nudgeForce=${nudgeForce} nudgeForceWorld=${nudgeForceWorld.toString()}`);
                cBoat.applyForce(nudgeForceWorld, cBoat.vectorToWorldFrame(new CN.Vec3(0, 0, -3)));
            }


            const tiltAngle = (Math.PI * 2) * 0.005;
            // boat.rotate(new Vector3(0, 0, 1), -tiltAngle * windVec.x, Space.LOCAL);
            // boat.rotate(new Vector3(1, 0, 0), -tiltAngle * windVec.z * 0.12, Space.LOCAL);

            // bob bob bob
            // boat.rotate(new Vector3(1, 0, 0), Math.sin(t * 2) * Math.PI * 0.01, Space.WORLD);
            // boat.rotate(new Vector3(0, 0, 1), Math.sin(t * 1.5) * Math.PI * 0.01, Space.WORLD);
            // boat.rotate(new Vector3(0, 0, 1), Math.sin(t * 0.621) * Math.PI * 0.01, Space.WORLD);

            sail.rotationQuaternion = null;
            sail.rotate(new Vector3(0, 1, 0), -degToRad(input.sailAngle) + Math.PI, Space.LOCAL);

            t += 1/60;
        }

        boatAtCOM.position.set(cBoat.position.x, cBoat.position.y, cBoat.position.z);
        boatAtCOM.rotationQuaternion = new Quaternion(cBoat.quaternion.x, cBoat.quaternion.y, cBoat.quaternion.z, cBoat.quaternion.w);

        scene.render();

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
