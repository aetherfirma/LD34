var cityobj;

function main() {
    var renderer, camera, scene,
        buildings = {
            "miterTower": {
                "models": []
            },
            "park": {
                "models": []
            }
        },
        troops = {
            "good": {
                "apc": undefined,
                "tank": undefined
            },
            "bad": {
                "spawner": undefined,
                "hovertank": undefined,
                "vtol": undefined
            }
        },
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
            0: 5,
            1: 1
        },
        cameraLocation = {x: 0, y: 0}, cameraRotation = Math.PI/2, cameraZoom = 5,
        unit = 1,
        leftMouseDown = false, rightMouseDown = false, mouseDownAt,
        mousetAt, mouseLastAt, mouseDelta,
        lastFrame,
        sun,
        stats,
        cityMap,

        units = [];


    function makeAI(position, obj, decision, routing, speed, health) {
        var aiObj = obj.clone();
        aiObj.position.set(position.x - 5, 0, position.y - 5);
        scene.add(aiObj);
        return {
            position: position,
            object: aiObj,
            health: health,
            speed: speed,
            actions: [],
            decision: decision,
            routing: routing,
            current: undefined,
            tick: function (delta) {
                if (this.health <= 0) {
                    return; // add smoke maybe?
                }

                if (this.current === undefined) {
                    if (this.actions.length === 0) {
                        this.decision(this);
                    } else {
                        this.current = this.actions.pop();
                    }
                } else {
                    if (this.current.action === "move") {
                        if (this.current.route.length === 0) {
                            this.current = undefined;
                            return;
                        }
                        var v2 = this.current.route[this.current.route.length - 1],
                            v3 = new THREE.Vector3(v2.x - 5, 0, v2.y - 5),
                            dist = this.object.position.distanceTo(v3);
                        if (dist === 0) {
                            this.current.route.pop();
                            return;
                        }
                        var speed = this.speed / this.routing[cityMap[xy_to_n(this.position, 11)]],
                            lerp = Math.min(1, (speed * delta / 1000) / dist);
                        this.object.lookAt(v3);
                        this.object.position.lerp(v3, lerp);
                        this.position = new THREE.Vector2(Math.round(this.object.position.x + 5), Math.round(this.object.position.z + 5));
                    } else if (this.current.action === "spawn") {
                        var spawn = choice(this.current.thing);
                        units.push(spawn(this.position));
                        this.current = undefined;
                    }
                }
            }
        };
    }

    function makeTransport(position) {
        return makeAI(
            position,
            troops.good.apc,
            function (self) {
                var target, route;
                while (route === undefined) {
                    target = new THREE.Vector2(randint(0, 10), randint(0, 10));
                    route = aStar(cityMap, self.position, target, self.routing, 11);
                }
                self.actions.splice(0, 0, {
                    action: "move",
                    location: target,
                    route: route
                })
            },
            {
                1: 1
            },
            1,
            100
        );
    }

    function makeTank(position) {
        return makeAI(
            position,
            troops.good.tank,
            function (self) {
                var target, route;
                while (route === undefined) {
                    target = new THREE.Vector2(randint(0, 10), randint(0, 10));
                    route = aStar(cityMap, self.position, target, self.routing, 11);
                }
                self.actions.splice(0, 0, {
                    action: "move",
                    location: target,
                    route: route
                })
            },
            {
                1: 1,
                0: 2
            },
            1.25,
            100
        );
    }

    function makeHoverTank(position) {
        return makeAI(
            position,
            troops.bad.hovertank,
            function (self) {
                var target, route;
                while (route === undefined) {
                    target = new THREE.Vector2(randint(0, 10), randint(0, 10));
                    route = aStar(cityMap, self.position, target, self.routing, 11);
                }
                self.actions.splice(0, 0, {
                    action: "move",
                    location: target,
                    route: route
                })
            },
            {
                1: 1,
                0: 4
            },
            1,
            100
        );
    }

    function makeVtol(position) {
        return makeAI(
            position,
            troops.bad.vtol,
            function (self) {
                if (Math.random() < 0.35) {
                    self.actions.splice(0, 0, {
                        action: "spawn",
                        thing: [makeSpawner]
                    })
                } else {
                    var target, route;
                    while (route === undefined) {
                        target = new THREE.Vector2(randint(0, 10), randint(0, 10));
                        route = aStar(cityMap, self.position, target, self.routing, 11);
                    }
                    self.actions.splice(0, 0, {
                        action: "move",
                        location: target,
                        route: route
                    })
                }
            },
            {
                0: 1,
                1: 1
            },
            3,
            100)
    }

    function makeSpawner(position) {
        return makeAI(
            position,
            troops.bad.spawner,
            function (self) {
                if (Math.random() < 0.005) {
                    self.actions.splice(0, 0, {
                        action: "spawn",
                        thing: [makeHoverTank, makeHoverTank, makeHoverTank, makeVtol]
                    })
                }
            },
            {
                0: 1,
                1: 1
            },
            3,
            100)
    }

    function generateCity(size) {
        var city = new THREE.Object3D(),
            grid = fillArray(undefined, size*size),
            n, xy, type, tile;

        for (n = 0; n < grid.length; n++) {
            xy = n_to_xy(n, size);
            if ((xy.x - 1) % 4 == 0 || (xy.y - 1) % 4 == 0) grid[n] = tiles.ROAD;
            else grid[n] = choice([tiles.BUILDING, tiles.BUILDING, tiles.BUILDING, tiles.PARK, tiles.PARK, tiles.PARK, tiles.PARK]);
        }

        for (n = 0; n < grid.length; n ++) {
            xy = n_to_xy(n, size);
            type = grid[n];
            if (type == tiles.PARK) {
                tile = Building(buildings.park);
            } else if (type == tiles.ROAD) {
                var neigh = neighbours(xy),
                    x = 0, y = 0;

                for (var t = 0; t < neigh.length; t++) {
                    var nt = neigh[t];
                    if (nt.x < 0 || nt.x >= size) continue;
                    if (nt.y < 0 || nt.y >= size) continue;

                    if (nt.x == xy.x && grid[xy_to_n(nt, size)] == tiles.ROAD) x++;
                    if (nt.y == xy.y && grid[xy_to_n(nt, size)] == tiles.ROAD) y++;
                }

                if (x != 0 && y != 0) tile = roads.cross.clone();
                else if (x != 0 && y == 0) {
                    tile = roads.straight.clone();
                } else if (x == 0 && y != 0) {
                    tile = roads.straight.clone();
                    tile.rotateZ(Math.PI/2);
                }
            } else if (type == tiles.BUILDING) {
                tile = Building(choice([buildings.miterTower]));
            }
            tile.position.set(xy.x, 0, xy.y);
            city.add(tile);
        }

        city.updateMatrix();
        cityobj = city;

        cityMap = grid;
        return city
    }

    function render(dt) {
        renderer.render(scene, camera);
    }

    function runAI(dt) {
        var u, unit;
        for (u = 0; u < units.length; u++) {
            unit = units[u];
            unit.tick(dt);
        }
    }

    function tick() {
        var now = +new Date, dt = now - lastFrame;
        if (mouseLastAt !== undefined) {
            mouseDelta = {x: mouseLastAt.x - mousetAt.x, y: mouseLastAt.y - mousetAt.y};
        }

        requestAnimationFrame(tick);

        positionCamera(dt);
        runAI(dt);
        render(dt);

        lastFrame = now;
        mouseLastAt = mousetAt;
        stats.update();
    }

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
            "path": "models/building1-1.dae",
            "callback": function (model) {
                buildings["miterTower"]["models"].push(model)
            }
        },
        {
            "path": "models/building1-2.dae",
            "callback": function (model) {
                buildings["miterTower"]["models"].push(model)
            }
        },
        {
            "path": "models/building1-3.dae",
            "callback": function (model) {
                buildings["miterTower"]["models"].push(model)
            }
        },
        {
            "path": "models/building1-4.dae",
            "callback": function (model) {
                buildings["miterTower"]["models"].push(model)
            }
        },
        {
            "path": "models/building1-5.dae",
            "callback": function (model) {
                buildings["miterTower"]["models"].push(model)
            }
        },
        {
            "path": "models/building1-6.dae",
            "callback": function (model) {
                buildings["miterTower"]["models"].push(model)
            }
        },
        {
            "path": "models/park.dae",
            "callback": function (model) {
                buildings["park"]["models"].push(model)
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
        },
        {
            "path": "models/goodtank.dae",
            "callback": function (model) {
                troops.good.tank = model;
            }
        },
        {
            "path": "models/goodapc.dae",
            "callback": function (model) {
                troops.good.apc = model;
            }
        },
        {
            "path": "models/badtank.dae",
            "callback": function (model) {
                troops.bad.hovertank = model;
            }
        },
        {
            "path": "models/baddropship.dae",
            "callback": function (model) {
                troops.bad.vtol = model;
            }
        },
        {
            "path": "models/badspawner.dae",
            "callback": function (model) {
                troops.bad.spawner = model;
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
        var b = choice(building.models).clone();
        b.rotateZ(Math.PI/2*randint(0, 3));
        return b;
    }


    var initPipeline = [
        function () { // Initialise renderer
            console.log("Starting three.js");
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.01, 1000);
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
        function () {
            units.push(makeVtol(new THREE.Vector2(5, 5)));
            units.push(makeTank(new THREE.Vector2(5, 5)));
            units.push(makeTank(new THREE.Vector2(5, 5)));
            units.push(makeTank(new THREE.Vector2(5, 5)));
            units.push(makeTank(new THREE.Vector2(5, 5)));
            units.push(makeTank(new THREE.Vector2(5, 5)));
            units.push(makeTank(new THREE.Vector2(5, 5)));
            units.push(makeTransport(new THREE.Vector2(5, 5)));
            units.push(makeTransport(new THREE.Vector2(5, 5)));
            units.push(makeTransport(new THREE.Vector2(5, 5)));
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
            stats = new Stats();
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.top = '0px';
            document.body.appendChild( stats.domElement );
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