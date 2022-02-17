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
        this.controls.update(0.01);
        requestAnimationFrame(this.draw);
    }
}

function configCanvas() {
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 5);

    let render = new THREE.WebGLRenderer();
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

function createFlyControls(aircraft) {
    const flyControls = new THREE.FlyControls(aircraft, canvas.render.domElement);
    flyControls.movementSpeed = 2;
    flyControls.rollSpeed = 0.5;

    return flyControls;
}

function main() {
    drawLights();
    drawGround();
    drawSandroToLookAt();
    drawAirCraft();

    window.addEventListener('resize', onWindowResize, false);

    canvas.draw();
}

function drawAirCraft() {
    var dummy = new THREE.Object3D();
    canvas.scene.add(dummy);

    var model = drawAirCraftModel()

    dummy.add(model);

    dummy.add(canvas.camera);

    canvas.controls = createFlyControls(dummy);
}

function drawAirCraftModel(){
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/uLzLJYY.png");
    var geometry = new THREE.BoxBufferGeometry(1, 0.25, 1);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 2);
    return cube;
}

function drawSandroToLookAt() {
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/9FcL47dh.jpg");
    var geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var cube = new THREE.Mesh(geometry, material);
    cube.position.set(2,0.5,0);
    canvas.scene.add(cube);
}

function drawGround() {
    var geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0x392a13, side: THREE.DoubleSide });
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