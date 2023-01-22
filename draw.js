class Point {
	constructor() {
		this.x = 0;
		this.y = 0;
	}
}

class Shape {
	constructor() {
		this.nPoints = 0;
		this.points = [];
		this.modified = false;
	}

	getNextPoint() {
		if (this.points.length == this.nPoints)
			return null;

		let newPoint = new Point();
		this.points.push(newPoint);
		return newPoint;
	}
}

class Line extends Shape {
	constructor() {
		super();
		this.nPoints = 2;
		this.type = "Line";
	}

	draw(gl, programInfo) {
		if (this.points.length != this.nPoints)
			return;

		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;

		let vertices = [];
		for (let i = 0; i < this.points.length; i++) {
			vertices.push(this.points[i].x);
			vertices.push(this.points[i].y);
		}

		let vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

    	const vertexCount = 2;
    	gl.drawArrays(gl.LINES, offset, vertexCount);
	}
}

class Box extends Shape {
	constructor() {
		super();
		this.nPoints = 2;
		this.type = "Box";
	}

	draw(gl, programInfo) {
		if (this.points.length != this.nPoints)
			return;

		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;

		let vertices = [];
		for (let i = 0; i < 2; i++) {
			// horizontal
			vertices.push(this.points[i].x);
			vertices.push(this.points[i].y);
			vertices.push(this.points[(i + 1) % 2].x);
			vertices.push(this.points[i].y);

			// vertical
			vertices.push(this.points[i].x);
			vertices.push(this.points[i].y);
			vertices.push(this.points[i].x);
			vertices.push(this.points[(i + 1) % 2].y);
		}

		let vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

  	const vertexCount = 8;
  	gl.drawArrays(gl.LINES, offset, vertexCount);
	}
}

const vs = `
attribute vec2 vPosition;
void main() {
	gl_Position = vec4(vPosition, 1.0, 1.0);
}
`;
const fs = `
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

let currentCursorX = 0;
let currentCursorY = 0;
let currentPoint = new Point();
let currentShape = null;
let Mode = "Box";
let shapes = [];

function getNewShapeObject(type) {
	if (type == "Line")
		return new Line();
	else if (type == "Box")
		return new Box();
	else
		return null;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error ocurred compiling the shaders: ${gl.getShaderInfoLog(shader)}")
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
	let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
	let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initalize the shader program: ${gl.getProgramInfoLog(shaderProgram)}");
		return null;
	}

	return shaderProgram;
}

function drawScene(gl, programInfo) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(programInfo.program);

	if (currentShape != null) {
		currentShape.draw(gl, programInfo);
	}

	for (let i = 0; i < shapes.length; i++) {
		shapes[i].draw(gl, programInfo);
	}
}

function main() {
	const canvas = document.getElementById("glcanvas");
	const gl = canvas.getContext("webgl");	

	if (!gl) {
		alert("Incapaz de inicializar o WebGL. Seu navegador ou sua máquina não suporta.");
		return;
	}

	const shaderProgram = initShaderProgram(gl, vs, fs);

	const programInfo = {
  		program: shaderProgram,
  		attribLocations: {
    		vertexPosition: gl.getAttribLocation(shaderProgram, "vPosition"),
  		}
	};

	canvas.addEventListener("mousemove", e => {
		let rect = canvas.getBoundingClientRect();

		let posX = (e.clientX - rect.left) * canvas.width / canvas.clientWidth;
		let posY = (e.clientY - rect.top) * canvas.height / canvas.clientHeight;

		currentCursorX = posX / canvas.width * 2.0 - 1.0;
		currentCursorY = posY / canvas.height * -2.0 + 1.0;

		if (currentPoint != null) {
			currentPoint.x = currentCursorX;
			currentPoint.y = currentCursorY;
		}
	});

	canvas.addEventListener("click", e => {
		if (Mode == "Line") {
			if (currentShape == null) {
				currentShape = new Line();

				currentPoint = currentShape.getNextPoint();
				currentPoint.x = currentCursorX;
				currentPoint.y = currentCursorY;

				currentPoint = currentShape.getNextPoint();
				currentPoint.x = currentCursorX;
				currentPoint.y = currentCursorY;	
			} else {
				let lineCopy = new Line();
				lineCopy.points = currentShape.points;
				lineCopy.modified = true;
				document.getElementById("saveButton").disabled = false;
				shapes.push(lineCopy);
				currentShape = null;
				currentPoint = new Point();
			}
		} else if (Mode == "Box") {
			if (currentShape == null) {
				currentShape = new Box();

				currentPoint = currentShape.getNextPoint();
				currentPoint.x = currentCursorX;
				currentPoint.y = currentCursorY;

				currentPoint = currentShape.getNextPoint();
				currentPoint.x = currentCursorX;
				currentPoint.y = currentCursorY;	
			} else {
				let boxCopy = new Box();
				boxCopy.points = currentShape.points;
				boxCopy.modified = true;
				document.getElementById("saveButton").disabled = false;
				shapes.push(boxCopy);
				currentShape = null;
				currentPoint = new Point();
			}
		}
	});

	document.addEventListener("keydown", (event) => {
		console.log(event.key);

		if (event.key == "l")
			Mode = "Line";
		else if (event.key == "b")
			Mode = "Box";
	});

	function render(now) {
	 	now *= 0.001; // convert to seconds

	  	drawScene(gl, programInfo);

	  	requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

async function saveShapes() {
	document.getElementById("saveButton").disabled = true;
	let enableButton = false;

	for (let i = 0; i < shapes.length; i++) {
		if (shapes[i].modified == false)
			continue;

		shapes[i].modified = false;

		let data = {
			"type": shapes[i].type,
			"points": [],
			"userId": sessionStorage.getItem("userId")
		};
		for (let j = 0; j < shapes[i].points.length; j++) {
			data["points"].push(shapes[i].points[j].x);
			data["points"].push(shapes[i].points[j].y);
		}

		console.log(data);

		const response = await fetch('https://localhost:7053/api/Shape', {
			method: 'POST',
			mode: 'cors',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then((response) => { 
			if (response.ok)
				;
			else
				shapes[i].modified = true;
				enableButton = true;
		});
	}

	if (enableButton)
		document.getElementById("saveButton").disabled = false;
}

async function loadShapes() {
	document.getElementById("loadButton").disabled = false;

	const response = await fetch('https://localhost:7053/api/Shape/user/' + '1', {
		method: 'GET',
		mode: 'cors'
	});
	if (response.ok) {
		let loadedShapes = await response.json();
		for (let i = 0; i < loadedShapes.length; i++) {
			let aShape = getNewShapeObject(loadedShapes[i].type);
			for (let j = 0; j < loadedShapes[i].points.length / 2; j++) {
				let newPoint = new Point();
				newPoint.x = loadedShapes[i].points[2 * j];
				newPoint.y = loadedShapes[i].points[2 * j + 1];
				aShape.points.push(newPoint);
			}
			shapes.push(aShape);
		}
	} else {
		document.getElementById("loadButton").disabled = false;
	}
}

main();