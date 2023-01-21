class Point {
	constructor() {
		this.x = 0;
		this.y = 0;
	}
}

class Line {
	constructor() {
		this.nPoints = 2;
		this.points = [];
	}

	getNextPoint() {
		if (this.points.length == this.nPoints)
			return null;

		let newPoint = new Point();
		this.points.push(newPoint);
		return newPoint;
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
let currentLine = null;
let lines = [];

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

	if (currentLine != null) {
		currentLine.draw(gl, programInfo);
	}

	for (let i = 0; i < lines.length; i++) {
		lines[i].draw(gl, programInfo);
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
		currentCursorX = 2.0 * (e.clientX / canvas.width) - 1.0;
		currentCursorY = 1.0 - 2.0 * (e.clientY / canvas.height);

		if (currentPoint != null) {
			currentPoint.x = currentCursorX;
			currentPoint.y = currentCursorY;
		}
	});

	canvas.addEventListener("click", e => {
		if (currentLine == null) {
			currentLine = new Line();

			currentPoint = currentLine.getNextPoint();
			currentPoint.x = currentCursorX;
			currentPoint.y = currentCursorY;

			currentPoint = currentLine.getNextPoint();
			currentPoint.x = currentCursorX;
			currentPoint.y = currentCursorY;
		} else {
			let lineCopy = new Line();
			lineCopy.points = currentLine.points;
			lines.push(lineCopy);
			currentLine = null;
			currentPoint = new Point();
		}
	});

	function render(now) {
	 	now *= 0.001; // convert to seconds

	  	drawScene(gl, programInfo);

	  	requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

async function saveShapes() {
	for (let i = 0; i < lines.length; i++) {
		let data = {
			"type": "Line",
			"points": lines[i].points,
			"userId": 0
		};

		console.log(data);

		const response = await fetch('https://drawapi-production.up.railway.app/api/Shape', {
			method: 'POST',
			mode: 'cors',
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
	}
}

main();