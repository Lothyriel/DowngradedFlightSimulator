(function () {
	const _changeEvent = {
		type: 'change'
	};

	class FlyControls extends THREE.EventDispatcher {
		constructor(object, domElement) {
			super();

			if (domElement === undefined) {
				console.warn('THREE.FlyControls: The second parameter "domElement" is now mandatory.');
				domElement = document;
			}

			this.object = object;
			this.domElement = domElement; // API

			this.dragCoefficient = 0.027;
			this.airDensity = 1.225;
			this.constanteSecreta = 4.5;

			this.drag = function (speed) {
				return (1 / 2) * this.dragCoefficient * this.airDensity * this.constanteSecreta * Math.pow(speed, 2);
			}

			this.maxThrust = 1;
			this.thrust = 0;

			this.speed = 0;
			this.rollSpeed = 0.75;
			// internals

			this.accelerationConstant = 0.010;

			const scope = this;
			const EPS = 0.000001;
			const lastQuaternion = new THREE.Quaternion();
			const lastPosition = new THREE.Vector3();
			this.tmpQuaternion = new THREE.Quaternion();
			this.moveState = {
				thrustUp: 0,
				thrustDown: 0,
				up: 0,	//sai fora???
				down: 0,
				left: 0,
				right: 0,
				back: 0,
				pitchUp: 0,
				pitchDown: 0,
				yawLeft: 0,
				yawRight: 0,
				rollLeft: 0,
				rollRight: 0
			};
			this.moveVector = new THREE.Vector3(0, 0, 0);
			this.rotationVector = new THREE.Vector3(0, 0, 0);

			this.keydown = function (event) {
				if (event.altKey)
					return;

				switch (event.code) {
					case 'KeyC':
						this.moveState.thrustUp = 1;
						break;

					case 'KeyV':
						this.moveState.thrustDown = 1;
						break;

					case 'KeyS':
						this.moveState.pitchUp = 1;
						break;

					case 'KeyW':
						this.moveState.pitchDown = 1;
						break;

					case 'KeyQ':
						this.moveState.yawLeft = 1;
						break;

					case 'KeyE':
						this.moveState.yawRight = 1;
						break;

					case 'KeyA':
						this.moveState.rollLeft = 1;
						break;

					case 'KeyD':
						this.moveState.rollRight = 1;
						break;
				}

				this.updateMovementVector();
				this.updateRotationVector();
			};

			this.keyup = function (event) {
				switch (event.code) {
					case 'KeyC':
						this.moveState.thrustUp = 0;
						break;

					case 'KeyV':
						this.moveState.thrustDown = 0;
						break;

					case 'KeyS':
						this.moveState.pitchUp = 0;
						break;

					case 'KeyW':
						this.moveState.pitchDown = 0;
						break;

					case 'KeyQ':
						this.moveState.yawLeft = 0;
						break;

					case 'KeyE':
						this.moveState.yawRight = 0;
						break;

					case 'KeyA':
						this.moveState.rollLeft = 0;
						break;

					case 'KeyD':
						this.moveState.rollRight = 0;
						break;
				}

				this.updateMovementVector();
				this.updateRotationVector();
			};

			this.update = function (delta) {
				this.updateThrustMeter();
				this.accelerate(delta);
				this.roll();
				this.lift();

				const rotMult = delta * scope.rollSpeed;
				const moveMult = delta * scope.speed;

				console.log(scope.rotationVector);

				scope.object.translateX(scope.moveVector.x * moveMult);
				scope.object.translateY(scope.moveVector.y * moveMult);
				scope.object.translateZ(scope.moveVector.z * moveMult);
				
				scope.tmpQuaternion.set(scope.rotationVector.x * rotMult, scope.rotationVector.y * rotMult/7.5, scope.rotationVector.z * rotMult, 1).normalize();
				scope.object.quaternion.multiply(scope.tmpQuaternion);

				if (lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
					scope.dispatchEvent(_changeEvent);
					lastQuaternion.copy(scope.object.quaternion);
					lastPosition.copy(scope.object.position);
				}
			};

			this.updateMovementVector = function () {
				this.moveVector.x = - this.moveState.left + this.moveState.right;
				this.moveVector.y = - this.moveState.down + this.moveState.up;
				this.moveVector.z = - this.speed + this.moveState.back; //console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );
			};

			this.updateRotationVector = function () {
				this.rotationVector.x = - this.moveState.pitchDown + this.moveState.pitchUp;
				this.rotationVector.y = - this.moveState.yawRight + this.moveState.yawLeft;
				this.rotationVector.z = - this.moveState.rollRight + this.moveState.rollLeft; //console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );
			};

			this.getContainerDimensions = function () {

				if (this.domElement != document) {
					return {
						size: [this.domElement.offsetWidth, this.domElement.offsetHeight],
						offset: [this.domElement.offsetLeft, this.domElement.offsetTop]
					};
				} else {

					return {
						size: [window.innerWidth, window.innerHeight],
						offset: [0, 0]
					};
				}
			};

			this.dispose = function () {
				this.domElement.removeEventListener('contextmenu', contextmenu);
				window.removeEventListener('keydown', _keydown);
				window.removeEventListener('keyup', _keyup);
			};

			const _keydown = this.keydown.bind(this);

			const _keyup = this.keyup.bind(this);

			this.domElement.addEventListener('contextmenu', contextmenu);
			window.addEventListener('keydown', _keydown);
			window.addEventListener('keyup', _keyup);
			this.updateMovementVector();
			this.updateRotationVector();
		}
		updateThrustMeter() {
			const thrust = `Thrust: ${(this.thrust / this.maxThrust) * 100}%`;
			const speed = `Speed: ${this.speed} kn`;
			const drag = `Drag: ${this.currentDrag}`;
			canvas.thrustMeter.innerHTML = `${thrust}<br>${speed}<br>${drag}`;
		}

		accelerate(delta) {
			this.thrust += (this.accelerationConstant * (this.moveState.thrustUp - this.moveState.thrustDown));
			
			if (this.thrust > this.maxThrust)
			this.thrust = this.maxThrust;
			else if (this.thrust < 0)
			this.thrust = 0;
			
			this.speed += this.thrust * delta;
			
			const drag = this.drag(this.speed);
			this.currentDrag = drag;

			this.speed += drag * delta;
		}
		roll() {
			//drift x axis to the angle (between the ground and wings) direction
		}
		lift() {
			//change y by: lift - gravity
		}
	}

	function contextmenu(event) {
		event.preventDefault();
	}

	THREE.FlyControls = FlyControls;
})();