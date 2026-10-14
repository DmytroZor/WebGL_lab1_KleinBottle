'use strict';


function Model(name) {
    this.name = name;

    this.uCurves = [];
    this.vCurves = [];
    this.intersectionCurves = [];

    this.uRanges = [];
    this.vRanges = [];
    this.intersectionRanges = [];

    this.iUVertexBuffer = gl.createBuffer();
    this.iVVertexBuffer = gl.createBuffer();
    this.iIntersectionVertexBuffer = gl.createBuffer();

    function uploadCurves(buffer, curves) {
        const vertices = [];
        const ranges = [];

        for (const curve of curves) {
            if (!Array.isArray(curve) || curve.length === 0) {
                continue;
            }

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
        gl.vertexAttribPointer(
            shProgram.iAttribVertex,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        for (const range of ranges) {
            if (range.count >= 2) {
                gl.drawArrays(gl.LINE_STRIP, range.first, range.count);
            }
        }
    }

    this.BufferData = function (uCurves, vCurves, intersectionCurves = []) {
        this.uCurves = uCurves || [];
        this.vCurves = vCurves || [];
        this.intersectionCurves = intersectionCurves || [];

        this.uRanges = uploadCurves(this.iUVertexBuffer, this.uCurves);
        this.vRanges = uploadCurves(this.iVVertexBuffer, this.vCurves);
        this.intersectionRanges = uploadCurves(
            this.iIntersectionVertexBuffer,
            this.intersectionCurves
        );
    };

    /** Draw all polylines along the u parameter using the current shader color. */
    this.DrawU = function () {
        drawCurves(this.iUVertexBuffer, this.uRanges);
    };

    /** Draw all polylines along the v parameter using the current shader color. */
    this.DrawV = function () {
        drawCurves(this.iVVertexBuffer, this.vRanges);
    };

    /** Draw highlighted intersection curve(s) using the current shader color. */
    this.DrawIntersection = function () {
        drawCurves(this.iIntersectionVertexBuffer, this.intersectionRanges);
    };


    this.Draw = function () {
        this.DrawU();
        this.DrawV();
    };
}
