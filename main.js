'use strict';

let gl;                         // The WebGL context.
let surface;                    // The Klein bottle wireframe model.
let shProgram;                  // The shader program.
let spaceball;                  // Mouse-controlled scene rotator.

function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    };
}

// Klein bottle parametrization from the course handbook.
// The book requires a > 2; a = 2.5 is used as a starting value.
const KLEIN_A = 2.5;
const SURFACE_SEGMENTS = 40;



function kleinBottlePoint(u, v) {
    const a = KLEIN_A;

    const r =
        a
        + Math.cos(u / 2) * Math.sin(v)
        - Math.sin(u / 2) * Math.sin(2 * v);

    const x = r * Math.cos(u);
    const y = r * Math.sin(u);

    const z =
        Math.sin(u / 2) * Math.sin(v)
        + Math.cos(u / 2) * Math.sin(2 * v);

    return [x, y, z];
}



/**
 * Build a (segments + 1) x (segments + 1) point grid, then extract two sets
 * of isoparametric polylines:
 *   - U curves: u varies, v is fixed;
 *   - V curves: v varies, u is fixed.
 *
 * The extra sample at 2π closes the sampled parameter interval. We do not
 * create a duplicate curve at the fixed parameter's 2π boundary. For the
 * Klein bottle, the u seam is joined with reversed v (v <-> 2π - v).
 */
function CreateSurfaceData() {
    const points = [];
    const uStep = (2 * Math.PI) / SURFACE_SEGMENTS;
    const vStep = (2 * Math.PI) / SURFACE_SEGMENTS;

    for (let i = 0; i <= SURFACE_SEGMENTS; i++) {
        const u = i * uStep;
        points[i] = [];

        for (let j = 0; j <= SURFACE_SEGMENTS; j++) {
            const v = j * vStep;
            points[i][j] = kleinBottlePoint(u, v);
        }
    }

    const uCurves = [];
    for (let j = 0; j < SURFACE_SEGMENTS; j++) {
        const curve = [];
        for (let i = 0; i <= SURFACE_SEGMENTS; i++) {
            curve.push(points[i][j]);
        }
        uCurves.push(curve);
    }

    const vCurves = [];
    for (let i = 0; i < SURFACE_SEGMENTS; i++) {
        const curve = [];
        for (let j = 0; j <= SURFACE_SEGMENTS; j++) {
            curve.push(points[i][j]);
        }
        vCurves.push(curve);
    }

    const intersectionCurve = [];
    for (let i = 0; i <= SURFACE_SEGMENTS; i++) {
        const u = i * uStep;
        intersectionCurve.push(kleinBottlePoint(u, 0));
    }

    return {
        uCurves: uCurves,
        vCurves: vCurves,
        intersectionCurves: [intersectionCurve]
    };
}

function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.025, 0.035, 0.065, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.width / gl.canvas.height;
    const projection = m4.perspective(Math.PI / 4, aspect, 1, 30);
    const modelView = spaceball.getViewMatrix();

    // Keep the original skeleton's trackball rotation and scene translation.
    const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    const translateToPointZero = m4.translation(0, 0, -10);
    const matAccum0 = m4.multiply(rotateToPointZero, modelView);
    const matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    const modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(
        shProgram.iModelViewProjectionMatrix,
        false,
        modelViewProjection
    );

    // Use different colors to make the two curve families easy to distinguish.
    gl.uniform4fv(shProgram.iColor, [0.20, 0.82, 1.00, 1.0]);
    surface.DrawU();

    gl.uniform4fv(shProgram.iColor, [1.00, 0.72, 0.22, 1.0]);
    surface.DrawV();

    gl.uniform4fv(shProgram.iColor, [1.00, 0.16, 0.24, 1.0]);
    gl.depthFunc(gl.LEQUAL);
    surface.DrawIntersection();
    gl.depthFunc(gl.LESS);
}

function initGL() {
    const prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('KleinBottle', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, 'vertex');
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(
        prog,
        'ModelViewProjectionMatrix'
    );
    shProgram.iColor = gl.getUniformLocation(prog, 'color');

    surface = new Model('KleinBottle');
    const surfaceData = CreateSurfaceData();
    surface.BufferData(
        surfaceData.uCurves,
        surfaceData.vCurves,
        surfaceData.intersectionCurves
    );

    gl.enable(gl.DEPTH_TEST);
}

/** Compile and link the vertex and fragment shaders. */
function createProgram(gl, vShader, fShader) {
    const vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error('Error in vertex shader: ' + gl.getShaderInfoLog(vsh));
    }

    const fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error('Error in fragment shader: ' + gl.getShaderInfoLog(fsh));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vsh);
    gl.attachShader(program, fsh);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Link error in program: ' + gl.getProgramInfoLog(program));
    }

    return program;
}

function init() {
    const canvas = document.getElementById('webglcanvas');

    try {
        gl = canvas.getContext('webgl');
        if (!gl) {
            throw new Error('This browser does not support WebGL.');
        }

        initGL();
        spaceball = new TrackballRotator(canvas, draw, 0);
        draw();
    } catch (error) {
        document.getElementById('canvas-holder').innerHTML =
            '<p>Could not initialize the WebGL scene: ' + error.message + '</p>';
        console.error(error);
    }
}
