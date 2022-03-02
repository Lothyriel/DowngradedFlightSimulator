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

function main() {
    drawThrustMeter();
    drawLights();
    drawGround();
    drawNegosToLookAt();
    drawAirCraft();

    window.addEventListener('resize', onWindowResize, false);

    canvas.draw();
}
function drawThrustMeter()
{
    const info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '30px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.style.color = '#fff';
	info.style.fontWeight = 'bold';
	info.style.backgroundColor = 'transparent';
	info.style.zIndex = '1';
	info.style.fontFamily = 'Monospace';
	document.body.appendChild( info );

    canvas.thrustMeter = info;
}

function drawAirCraft() {
    var model = drawAirCraftModel()
    canvas.scene.add(model);

    model.add(canvas.camera);

    canvas.controls = new THREE.FlyControls(model, canvas.render.domElement)
}

function drawAirCraftModel() {
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/uLzLJYY.png");
    var frameGeometry = new THREE.BoxBufferGeometry(1, 0.25, 3);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var frame = new THREE.Mesh(frameGeometry, material);

    var wingsGeometry = new THREE.BoxBufferGeometry(5, 0.05, 1);
    var wings = new THREE.Mesh(wingsGeometry, material);

    frame.add(wings);
    frame.position.set(0, 0.25, 2);
    return frame;
}

function drawNegosToLookAt() {
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/9FcL47dh.jpg");
    var geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

    const delimitation = 100;
    for (let i = -delimitation; i < delimitation; i += 10) {
        for (let x = -delimitation; x < delimitation; x += 10) {
            var cube = new THREE.Mesh(geometry, material);
            cube.position.set(Math.random()*i + 2, 0.5, Math.random()*x - 5);
            canvas.scene.add(cube);
        }
    }
}

function drawGround() {
    var geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0x392a13, side: THREE.DoubleSide });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotateX(- Math.PI / 2);
    
    canvas.plane = plane;
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