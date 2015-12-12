var ZERO = new THREE.Vector2();

function n_to_xy(n, size) {
    var x = n % size, y = Math.floor(n / size);
    return new THREE.Vector2(x, y);
}

function xy_to_n(xy, size) {
    return xy.y * size + xy.x;
}

function neighbours(xy) {
    return [
        xy.clone().add(new THREE.Vector2(1, 0)),
        xy.clone().add(new THREE.Vector2(-1, 0)),
        xy.clone().add(new THREE.Vector2(0, -1)),
        xy.clone().add(new THREE.Vector2(0, 1))
    ]
}

function aStar(grid, startXY, endXY, cost, size) {
    var closedSet = [],
        openSet = [xy_to_n(startXY, size)],
        cameFrom = fillArray(undefined, size*size),
        startN =  xy_to_n(startXY, size),
        endN =  xy_to_n(endXY, size),
        gScore = fillArray(undefined, size*size),
        fScore = fillArray(undefined, size*size);
    gScore[startN] = 0;
    fScore[startN] = startXY.distanceTo(endXY);        

    while (openSet.length) {
        var currentN = minIndex(fScore, openSet),
            currentXY = n_to_xy(currentN, size);
        if (currentN == endN) {
            return reconstructPath(cameFrom, endN);
        }

        removeFrom(openSet, currentN);
        closedSet.push(currentN);

        var neighbours_ = neighbours(currentXY);
        for (var n = 0; n < neighbours_.length; n++) {
            var neighbourXY = neighbours_[n],
                neighbourN = xy_to_n(neighbourXY, size);
            if (n.x < 0 || n.y >= size) continue;
            if (n.y < 0 || n.y >= size) continue;
            if (closedSet.indexOf(neighbourN) != -1) continue;

            var tentativeGScore = gScore[neighbourN] + 1;
            if (openSet.indexOf(neighbourN) == -1) openSet.push(neighbourN);
            else if (tentativeGScore >= gScore[neighbourN]) continue;

            cameFrom[neighbourN] = currentN;
            gScore[neighbourN] = tentativeGScore;
            fScore[neighbourN] = tentativeGScore + neighbourXY.distanceTo(endXY);
        }
    }
}

function reconstructPath(cameFrom, goal) {
    var route = [], current = goal;
    while (cameFrom[current] !== undefined) {
        route.splice(0, 0, current);
        current = cameFrom[current];
    }
    return route;
}