'use strict';

/**
 * A wireframe model represented by two families of parameter curves.
 *
 * Each curve is an array of 3D points: [[x, y, z], ...]. The U family
 * contains curves with varying u and fixed v; the V family contains curves
 * with fixed u and varying v.
 *
 * The curves are packed into two WebGL buffers. Separate draw ranges are
 * kept for each polyline so gl.LINE_STRIP never connects adjacent curves.
 */
function Model(name) {
    this.name = name;

    this.uCurves = [];
    this.vCurves = [];
    this.uRanges = [];
    this.vRanges = [];

    this.iUVertexBuffer = gl.createBuffer();
    this.iVVertexBuffer = gl.createBuffer();

    function uploadCurves(buffer, curves) {
        const vertices = [];
        const ranges = [];

        for (const curve of curves) {
            const first = vertices.length / 3;

            for (const point of curve) {
                vertices.push(point[0], point[1], point[2]);
            }

            ranges.push({ first: first, count: curve.length });
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            gl.STATIC_DRAW
        );

        return ranges;
    }

    function drawCurves(buffer, ranges) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        for (const range of ranges) {
            gl.drawArrays(gl.LINE_STRIP, range.first, range.count);
        }
    }

    /** Upload separate U and V curve sets to WebGL. */
    this.BufferData = function (uCurves, vCurves) {
        this.uCurves = uCurves;
        this.vCurves = vCurves;

        this.uRanges = uploadCurves(this.iUVertexBuffer, this.uCurves);
        this.vRanges = uploadCurves(this.iVVertexBuffer, this.vCurves);
    };

    /** Draw all polylines along the u parameter. */
    this.DrawU = function () {
        drawCurves(this.iUVertexBuffer, this.uRanges);
    };

    /** Draw all polylines along the v parameter. */
    this.DrawV = function () {
        drawCurves(this.iVVertexBuffer, this.vRanges);
    };

    /** Draw both curve families using the currently selected shader color. */
    this.Draw = function () {
        this.DrawU();
        this.DrawV();
    };
}
