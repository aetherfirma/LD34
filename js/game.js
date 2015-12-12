function main() {
    var renderer, camera, scene,
        models = {};

    var assets = {
        "building1-base": "models/building1-base.bae",
        "building1-tower": "models/building1-tower.bae",
        "building1-cap": "models/building1-cap.bae",
        "park": "models/park.dae",
        "road-straight": "models/road-s.dae",
        "road-cross": "models/road-x.dae",
        "road-corner": "models/road-c.dae"
    };

    function tick() {
        requestAnimationFrame(tick);

        renderer.render(scene, camera);
    }

    var init_pipeline = [
        function () { // Initialise renderer
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 1, 1000);

            renderer = new THREE.WebGLRenderer();
            renderer.setSize(innerWidth, innerHeight);
        },
        function () { // Add renderer to the dom
            document.body.appendChild(renderer.domElement);

            $(window).resize(function () {
                camera.aspect = innerWidth/innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(innerWidth, innerHeight);
            });
        },
        function () {
            tick();
        }
    ];

    function init() {
        var func = init_pipeline.shift();
        if (func === undefined) return;
        func();
        setTimeout(init, 50)
    }

    init()
}