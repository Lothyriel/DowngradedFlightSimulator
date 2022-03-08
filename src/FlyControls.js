(function () {
	const _changeEvent = {
		type: 'change'
	};

	class FlyControls extends THREE.EventDispatcher {
		constructor(object) {
			super();

			//constants
			this.gravityForce = -0.75;
			this.airDensity = 1.225;	//I could make air density based on altitude (Y)
			this.frameArea = 1;

			this.dragCoefficient = 0.06;

			this.maxThrust = 3.5;
			this.thrust = 0;
			this.rollSpeed = 0.75;
			this.accelerationConstant = this.maxThrust / 100;

			//variables
			this.velocity = 0;
			this.yVelocity = 0;
			this.currentLift = 0;
			this.aoa = 0;
			this.bankAngle = 0;
			this.falling = 0;

			// internals
			this.object = object;
			const scope = this;
			const EPS = 0.000001;
			const lastQuaternion = new THREE.Quaternion();
			const lastPosition = new THREE.Vector3();
			this.tmpQuaternion = new THREE.Quaternion();
			this.tmpVector3 = new THREE.Vector3();
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
				switch (event.code) {
					case 'KeyC':
						this.moveState.thrustUp = 1;
						break;

					case 'Enter':
						this.object.rotateY(-Math.PI);	//remove before flight!!!
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
					case 'Escape':
						this.changeCamera();
						break;
				}
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
			};

			this.update = function (delta) {
				this.updateMovementVector();
				this.updateRotationVector();
				this.accelerate(delta);
				this.climb();
				this.detectCollision();
				this.roll();
				this.updateThrustMeter();

				const rotMult = delta * scope.rollSpeed;
				const moveMult = delta * scope.velocity;

				scope.object.translateX(scope.moveVector.x * moveMult);
				scope.object.translateY(scope.moveVector.y * moveMult);
				scope.object.translateZ(scope.moveVector.z * moveMult);

				scope.tmpQuaternion.set(scope.rotationVector.x * rotMult, scope.rotationVector.y * rotMult / 7.5, scope.rotationVector.z * rotMult, 1).normalize();
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
				this.moveVector.z = - this.velocity + this.moveState.back;
			};

			this.updateRotationVector = function () {
				this.rotationVector.x = - this.moveState.pitchDown + this.moveState.pitchUp;
				this.rotationVector.y = - this.moveState.yawRight + this.moveState.yawLeft;
				this.rotationVector.z = - this.moveState.rollRight + this.moveState.rollLeft;
			};

			const _keydown = this.keydown.bind(this);
			const _keyup = this.keyup.bind(this);
			window.addEventListener('keydown', _keydown);
			window.addEventListener('keyup', _keyup);
		}
		changeCamera() {
			canvas.camera.position.copy(this.object.position);	//needs refining
		}

		updateThrustMeter() {
			let info = [];

			info.push(`Thrust: ${(this.thrust / this.maxThrust) * 100}%`);
			info.push(`Velocity: ${this.velocity} kn`);
			info.push(`Drag: ${this.currentDrag}`);
			info.push(`Lift: ${this.currentLift}`);
			info.push(`AOA: ${this.aoa}`);
			info.push(`Bank Angle: ${this.bankAngle}`);

			canvas.thrustMeter.innerHTML = info.join("<br>");
		}

		accelerate(delta) {
			this.thrust += this.accelerationConstant * (this.moveState.thrustUp - this.moveState.thrustDown);

			if (this.thrust > this.maxThrust)
				this.thrust = this.maxThrust;
			else if (this.thrust < 0)
				this.thrust = 0;

			this.currentDrag = this.drag(this.velocity);
			this.velocity += (this.thrust - this.currentDrag) * delta;
		}
		roll(delta) {
			return;
			this.bankAngle = this.object.rotation.z * this.object.rotation.w;;

			if (this.currentLift <= this.gravityForce)
				return;

			this.tmpQuaternion.set(0, this.bankAngle * delta, 0, 1);
			this.object.quaternion.multiply(this.tmpQuaternion);
		}
		climb() {
			this.currentLift = this.lift(this.velocity);
			this.yVelocity = this.gravityForce + this.currentLift;
			//console.log(this.yVelocity)
			this.object.position.y += this.yVelocity;
		}
		detectCollision() {
			if (this.object.position.y < 0.125) {
				this.falling = 0;
				this.object.position.y = 0.125;
				this.yVelocity = 0;
			} else {
				this.falling = 1;
			}
		}
		drag(speed) {
			/*The drag equation states that drag is equal to the
			p: the density of the fluid times
			v squared: the speed of the object relative to the fluid times
			A: the cross sectional area times
			C: the drag coefficient – a dimensionless number.*/
			return (1 / 2) * this.airDensity * this.dragCoefficient * this.frameArea * Math.pow(speed, 2);
		}
		lift(speed) {
			/*The lift equation states that lift L is equal to the 
			lift coefficient Cl 
			times the density r 
			times half of the velocity V squared 
			times the wing area A.*/
			//get based on AOA
			return (1 / 2) * this.airDensity * this.liftCoefficient() * this.frameArea * Math.pow(speed, 2);
		}
		liftCoefficient() {
			this.aoa = this.object.quaternion.x * this.object.quaternion.w;
			const x = this.aoa;
			return 0.0137 +
				0.0892 * x +
				-0.134 * Math.pow(x, 2) +
				-2.62 * Math.pow(x, 3) +
				0.193 * Math.pow(x, 4) +
				28.7 * Math.pow(x, 5) +
				-0.136 * Math.pow(x, 6) +
				-134 * Math.pow(x, 7) +
				20.2 * Math.pow(x, 8) +
				222 * Math.pow(x, 9) +
				-70.4 * Math.pow(x, 10);
		}
	}

	THREE.FlyControls = FlyControls;
})();