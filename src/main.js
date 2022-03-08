"use strict";
class Canvas {
    constructor(scene, camera, render) {
        this.scene = scene;
        this.camera = camera;
        this.render = render;
        this.draw = this.draw.bind(this);
    }
    draw() {
        this.render.render(this.scene, this.camera);
        this.flyControls.update(0.01);
        //canvas.controls.target.copy(canvas.model.position);
        requestAnimationFrame(this.draw);
    }
}

function configCanvas() {
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, 1, 5);

    let render = new THREE.WebGLRenderer({ antialias: true });
    render.setSize(window.innerWidth, window.innerHeight);
    render.setClearColor(0x3e7999, 1);

    let canvasElement = render.domElement;
    document.body.appendChild(canvasElement);

    return new Canvas(scene, camera, render);
}

function onWindowResize() {
    canvas.camera.aspect = window.innerWidth / window.innerHeight;
    canvas.camera.updateProjectionMatrix();
    canvas.render.setSize(window.innerWidth, window.innerHeight);
}

function main() {
    drawThrustMeter();
    drawLights();
    drawGround();
    drawNegosToLookAt();
    drawAirCraft();

    window.addEventListener('resize', onWindowResize, false);

    canvas.draw();
}
function drawThrustMeter() {
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '30px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.style.color = '#fff';
    info.style.fontWeight = 'bold';
    info.style.backgroundColor = 'transparent';
    info.style.zIndex = '1';
    info.style.fontFamily = 'Monospace';
    document.body.appendChild(info);

    canvas.thrustMeter = info;
}

function drawAirCraft() {
    var model = drawAirCraftModel()
    canvas.scene.add(model);

    canvas.model = model;
    model.add(canvas.camera);

    //let controls = new THREE.OrbitControls(canvas.camera, canvas.render.domElement);
    //controls.position.set(0, 0, 5);
    //controls.enablePan = false;
    //canvas.controls = controls;

    canvas.flyControls = new THREE.FlyControls(model);
}

function drawAirCraftModel() {
    var texture = new THREE.TextureLoader().load('http://127.0.0.1:8080/models/airCraft.png');
    var frameGeometry = new THREE.BoxBufferGeometry(1, 0.25, 3);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var frame = new THREE.Mesh(frameGeometry, material);

    var wingsGeometry = new THREE.BoxBufferGeometry(5, 0.05, 1);
    var wings = new THREE.Mesh(wingsGeometry, material);

    frame.add(wings);
    let old = 0.25;
    frame.position.set(0, 25, 2);
    return frame;
}

function drawNegosToLookAt() {
    const loader = new THREE.GLTFLoader();

    loader.load('http://127.0.0.1:8080/models/tree/scene.gltf', function (gltf) {

        const model = gltf.scene.clone();
        const delimitation = 100;
        const initialLimits = 10;
        for (let i = -delimitation; i < delimitation; i += 10) {
            for (let x = -delimitation; x < delimitation; x += 10) {
                if (x > -initialLimits && x < initialLimits || i > -initialLimits && i < initialLimits)
                    continue;
                    
                    model.position.set(i + Math.random() * i * 5, 5, x + Math.random() * x * 5);
                    model.scale.set(0.01, 0.01, 0.01)
                canvas.scene.add(model);
            }
        }

    }, undefined, function (error) {

        console.warn(error);

    });
}

function drawGround() {
    canvas.textureLoader = new THREE.TextureLoader();
    var texture = canvas.textureLoader.load('http://127.0.0.1:8080/models/grama.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = 800;
    texture.repeat.y = 800;
    var geo = new THREE.PlaneBufferGeometry(200, 200, 180, 90);
    var mat = new THREE.MeshStandardMaterial({
        map: texture,
        displacementMap: canvas.textureLoader.load('http://127.0.0.1:8080/models/mapDisplacement.png'),
        displacementScale: 10
    });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotateX(- Math.PI / 2);

    canvas.scene.add(plane);
}

function drawLights() {
    let ambientLight = new THREE.AmbientLight(0x333333);
    canvas.scene.add(ambientLight);

    let lightPoint = new THREE.PointLight(0x888888);
    lightPoint.position.set(2, 2, 4);
    canvas.scene.add(lightPoint);
}

var canvas = configCanvas();