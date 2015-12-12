function squareDist(a, b) {
    return ((b.x - a.x) * (b.x - a.x)) + ((b.y - a.y) * (b.y - a.y));
}

function fillArray(value, size) {
    var r = [];
    for (var _ = 0; _ < size; _++) {
        r.push(value);
    }
    return r
}

function minIndex(array, keys) {
    var min = undefined, index = undefined;
    for (var i = 0; i < array.length; i++) {
        if (keys.indexOf(i) == -1) continue;
        var val = array[i];
        if (min === undefined || val < min) {
            min = val;
            index = i;
        }
    }
    return index;
}

function subset(obj, array) {
    var result = {};
    for (var n = 0; n < array.length; n++) {
        result[array[n]] = obj[array[n]];
    }
    return result
}

function removeFrom(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
