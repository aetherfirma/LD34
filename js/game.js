function main() {
    var renderer, camera, scene,
        buildings = {
            "miterTower": {
                "base": undefined,
                "tower": [],
                "cap": undefined,
                "minHeight": 1,
                "maxHeight": 6
            },
            "park": {
                "base": undefined,
                "minHeight": 0,
                "maxHeight": 0
            }
        },
        troops = {},
        roads = {
            "straight": undefined,
            "corner": undefined,
            "cross": undefined
        },
        tiles = {
            PARK: 0,
            ROAD: 1,
            BUILDING: 2
        },
        routingCost = {
            0: 4,
            1: 1,
            2: 100
        },
        cameraLocation = {x: 0, y: 0}, cameraRotation = Math.PI/2, cameraZoom = 5,
        unit = 1, floor = 0.35,
        leftMouseDown = false, rightMouseDown = false, mouseDownAt,
        mousetAt, mouseLastAt, mouseDelta,
        lastFrame,
        sun;


    function generateCity(size) {
        var city = new THREE.Object3D(),
            grid = fillArray(undefined, size*size),
            n, xy, type, tile;

        for (n = 0; n < grid.length; n++) {
            xy = n_to_xy(n, size);
            if ((xy.x - 1) % 4 == 0 || (xy.y - 1) % 4 == 0) grid[n] = tiles.ROAD;
            else grid[n] = choice([tiles.BUILDING, tiles.BUILDING, tiles.PARK]);
        }

        for (n = 0; n < grid.length; n ++) {
            xy = n_to_xy(n, size);
            type = grid[n];
            if (type == tiles.PARK) {
                tile = Building(buildings.park);
            } else if (type == tiles.ROAD) {
                tile = roads.cross.clone();
            } else if (type == tiles.BUILDING) {
                tile = Building(choice([buildings.miterTower]));
            }
            tile.position.set(xy.x, 0, xy.y);
            city.add(tile);
        }

        return city
    }

    function render(dt) {
        renderer.render(scene, camera);
    }

    function tick() {
        var now = +new Date, dt = now - lastFrame;
        if (mouseLastAt !== undefined) {
            mouseDelta = {x: mouseLastAt.x - mousetAt.x, y: mouseLastAt.y - mousetAt.y};
        }

        requestAnimationFrame(tick);

        positionCamera(dt);
        render(dt);

        lastFrame = now;
        mouseLastAt = mousetAt;    }

    function mouse_move_handler(evt) {
        mousetAt = {x: evt.pageX, y: evt.pageY};
    }

    function mouse_down(evt) {
        if (evt.which == 1) {
            leftMouseDown = true;
            rightMouseDown = false;
        } else if (evt.which == 3) {
            rightMouseDown = true;
            leftMouseDown = false;
        } else {
            return;
        }
        mouseDownAt = {x: evt.pageX, y: evt.pageY};
        return false;
    }

    function mouse_up(evt) {
        var mouse_up_at = {x: evt.pageX, y: evt.pageY};
        if (evt.which == 1 && leftMouseDown && squareDist(mouseDownAt, mouse_up_at) < 100) left_click_handler(evt);
        if (evt.which == 3 && rightMouseDown && squareDist(mouseDownAt, mouse_up_at) < 100) right_click_handler(evt);
        if (evt.which == 1 || evt.which == 3) {
            rightMouseDown = false;
            leftMouseDown = false;
            mouseDownAt = undefined;
        } else {
            return;
        }
        return false;
    }

    function mouse_scroll(evt) {
        var scroll = evt.originalEvent.wheelDelta || evt.originalEvent.detail;
        cameraZoom -= scroll / 120;
        cameraZoom = Math.min(10, Math.max(3, cameraZoom));
        return false;
    }

    function left_click_handler(evt) {
        console.log("left");
    }

    function right_click_handler(evt) {
        console.log("right");
    }

    function load_model(path, callback) {
        var loader = new THREE.ColladaLoader({convertUpAxis: true});

        loader.load(path, function (result) {
            var dae = result.scene.children[0];
            dae.scale.x = dae.scale.y = dae.scale.z = 1/unit;
            dae.updateMatrix();
            dae.rotateX(-Math.PI/2);
            console.log(path, new THREE.Box3().setFromObject(dae));

            callback(dae);
        });
    }

    var assetPipeline = [
        {
            "path": "models/unitcube.dae",
            "callback": function (model) {
                unit = new THREE.Box3().setFromObject(model).max.x;
            }
        },
        {
            "path": "models/building1-base.dae",
            "callback": function (model) {
                buildings["miterTower"]["base"] = model
            }
        },
        {
            "path": "models/building1-tower.dae",
            "callback": function (model) {
                buildings["miterTower"]["tower"].push(model)
            }
        },
        {
            "path": "models/building1-cap.dae",
            "callback": function (model) {
                buildings["miterTower"]["cap"] = model
            }
        },
        {
            "path": "models/park.dae",
            "callback": function (model) {
                buildings["park"]["base"] = model
            }
        },
        {
            "path": "models/road-s.dae",
            "callback": function (model) {
                roads.straight = model
            }
        },
        {
            "path": "models/road-x.dae",
            "callback": function (model) {
                roads.cross = model
            }
        },
        {
            "path": "models/road-c.dae",
            "callback": function (model) {
                roads.corner = model
            }
        }
    ];

    function positionCamera(dt) {
        if (mouseDelta !== undefined && rightMouseDown) {
            cameraRotation -= mouseDelta.x / 6 * (dt / 1000);
        }

        var skew = 1.2 * cameraZoom;
        var new_camera_vector = new THREE.Vector3(-Math.sin(cameraRotation)*-skew, cameraZoom, Math.cos(cameraRotation)*-skew);
        new_camera_vector.x += cameraLocation.x;
        new_camera_vector.z += cameraLocation.y;
        camera.position.set(new_camera_vector.x, new_camera_vector.y, new_camera_vector.z);
        camera.lookAt(new THREE.Vector3(cameraLocation.x, (-15/50)*cameraZoom, cameraLocation.y));
    }


    function Building(building) {
        var obj = new THREE.Object3D(),
            height = randint(building.minHeight, building.maxHeight);

        var base = building.base.clone();
        base.position.set(0, 0, 0);
        obj.add(base);
        if (height > 0) {
            for (var l = 1; l < height; l++) {
                var body = choice(building.tower).clone();
                body.position.set(0, floor * l, 0);
                obj.add(body);
            }
            var cap = building.cap.clone();
            cap.position.set(0, floor * height, 0);
            obj.add(cap);
        }
        return obj;
    }


    var initPipeline = [
        function () { // Initialise renderer
            console.log("Starting three.js");
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 1, 1000);
            scene.add(new THREE.AmbientLight(0x333333));

            sun = new THREE.DirectionalLight(0xffffff, 1);
            sun.position.set(5000,5000,5000);
            scene.add(sun);

            renderer = new THREE.WebGLRenderer();
            renderer.setSize(innerWidth, innerHeight);
        },
        function () { // add some things to the screen
            var city = generateCity(11);
            city.position.set(-5, 0, -5);
            scene.add(city);
        },
        function () { // Add renderer to the dom
            console.log("Starting render surface");
            document.body.appendChild(renderer.domElement);
            var surface = $(renderer.domElement);

            surface.mousemove(mouse_move_handler);
            surface.mousedown(mouse_down);
            surface.mouseup(mouse_up);
            surface.bind("mousewheel DOMMouseScroll", mouse_scroll);
            renderer.domElement.oncontextmenu = function(){return false};

            $(window).resize(function () {
                camera.aspect = innerWidth/innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(innerWidth, innerHeight);
            });
        },
        function () {
            console.log("Starting renderer");
            lastFrame = +new Date;
            tick();
        }
    ];

    function callAssetPipeline() {
        var asset = assetPipeline.shift();
        if (asset === undefined) {
            callInitPipeline();
            return;
        }
        console.log("Loading", asset.path);
        load_model(asset.path, function (dae) {
            asset.callback(dae);
            setTimeout(callAssetPipeline, 50);
        })
    }

    function callInitPipeline() {
        var func = initPipeline.shift();
        if (func === undefined) return;
        func();
        setTimeout(init, 50);
    }

    function init() {
        callAssetPipeline();
    }

    init()
}