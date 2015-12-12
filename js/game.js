function main() {
    var renderer, camera, scene,
        buildings = {
            "building1": {
                "base": undefined,
                "tower": undefined,
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
        unit = 1;

    function tick() {
        requestAnimationFrame(tick);

        renderer.render(scene, camera);
    }

    function load_model(path, callback) {
        var loader = new THREE.ColladaLoader({convertUpAxis: true});

        loader.load(path, function (result) {
            var dae = result.scene.children[0];
            dae.scale.x = dae.scale.y = dae.scale.z = 1/unit;
            dae.updateMatrix();
            console.log(path, new THREE.Box3().setFromObject(dae));

            callback(dae);
        });
    }

    var asset_pipeline = [
        {
            "path": "models/unitcube.dae",
            "callback": function (model) {
                unit = new THREE.Box3().setFromObject(model).max.x;
            }
        },
        {
            "path": "models/building1-base.dae",
            "callback": function (model) {
                buildings["building1"]["base"] = model
            }
        },
        {
            "path": "models/building1-tower.dae",
            "callback": function (model) {
                buildings["building1"]["tower"] = model
            }
        },
        {
            "path": "models/building1-cap.dae",
            "callback": function (model) {
                buildings["building1"]["cap"] = model
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


    var init_pipeline = [
        function () { // Initialise renderer
            console.log("Starting three.js");
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 1, 1000);

            renderer = new THREE.WebGLRenderer();
            renderer.setSize(innerWidth, innerHeight);
        },
        function () { // Add renderer to the dom
            console.log("Starting render surface");
            document.body.appendChild(renderer.domElement);

            $(window).resize(function () {
                camera.aspect = innerWidth/innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(innerWidth, innerHeight);
            });
        },
        function () {
            console.log("Starting renderer");
            tick();
        }
    ];

    function call_asset_pipeline() {
        var asset = asset_pipeline.shift();
        if (asset === undefined) {
            call_init_pipeline();
            return;
        }
        console.log("Loading", asset.path);
        load_model(asset.path, function (dae) {
            asset.callback(dae);
            setTimeout(call_asset_pipeline, 50);
        })
    }

    function call_init_pipeline() {
        var func = init_pipeline.shift();
        if (func === undefined) return;
        func();
        setTimeout(init, 50)
    }

    function init() {
        call_asset_pipeline();
    }

    init()
}