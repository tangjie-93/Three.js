import {Vector3,Vector2} from "three";
import {Earcut} from './Earcut.js';


export function  triangulateShape(contour, holes = [], dim) {
    // flat array in vertices like [ x0,y0, x1,y1, x2,y2, ... ]
    const vertices = [];
    // array in hole indices
    const holeIndices = [];
    // final array in vertex indices like [ [ a,b,d ], [ b,c,d ] ]

    removeDupEndPts(contour);
    addContour(vertices, contour);

    let holeIndex = contour.length;

    holes.forEach(removeDupEndPts);

    for (var i = 0; i < holes.length; i++) {
        holeIndices.push(holeIndex);
        holeIndex += holes[i].length;
        addContour(vertices, holes[i]);
    }

    //

    const triangles = Earcut.triangulate(vertices, holeIndices, dim);

    //

    // for ( var i = 0; i < triangles.length; i += 3 ) {

    // 	faces.push( triangles.slice( i, i + 3 ) );

    // }

    return triangles;
}

/**
 * 删除重复点
 * @param {*} points 点数组
 */
 export function removeDupEndPts(points) {
    let l = points.length;
    if (points[0] instanceof Vector3 || points[0] instanceof Vector2) {
        if (l > 2 && points[l - 1].equals(points[0])) {
            points.pop();
        }
    } else {
        if (l > 2 && equals(points[l - 1], points[0])) {
            points.pop();
        }
    }
}

// 二维的点数组转成一维的点数组
// [[x,y,z],[x,y,z],[x,y,z],[x,y,z]] -> [x,y,x,y,x,y,x,y,x,y]
function addContour(vertices, contour) {
    let isVector = false;
    if (contour && (contour[0] instanceof Vector3 || contour[0] instanceof Vector2)) {
        isVector = true;
    }
    for (var i = 0; i < contour.length; i++) {
        if (isVector) {
            vertices.push(contour[i].x);
            vertices.push(contour[i].y);
        } else {
            vertices.push(contour[i][0]);
            vertices.push(contour[i][1]);
        }
    }
}

export function computeCenter(coords) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0, len = coords.length; i < len; i++) {
        const c = coords[i];
        const x = c[0];
        const y = c[1];

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    // 返回中心点和长宽
    return [(minX + maxX) / 2, (minY + maxY) / 2, maxX - minX, maxY - minY];
}

// 判断两个点是否相同
export function equals(arr1, arr2) {
    return Math.abs(arr1[0] - arr2[0]) + Math.abs(arr1[1] - arr2[1]) < 0.01;
}