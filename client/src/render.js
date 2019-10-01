function init(){

    var canvas = document.getElementById('surface');
    console.log(canvas);

    var engine = new babylon.Engine(canvas, true);


    var createScene = function() {
        // Create a basic BJS Scene object.
        var scene = new babylon.Scene(engine);

        // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
        var camera = new babylon.FreeCamera('camera', new BABYLON.Vector3(0, 5,-10), scene);

        // Target the camera to scene origin.
        camera.setTarget(babylon.Vector3.Zero());

        // Attach the camera to the canvas.
        camera.attachControl(canvas, false);

        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        var light = new babylon.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

        // Create a built-in "sphere" shape.
        var sphere = babylon.MeshBuilder.CreateSphere('sphere', {segments:16, diameter:2}, scene);

        // Move the sphere upward 1/2 of its height.
        sphere.position.y = 1;

        // Create a built-in "ground" shape.
        var ground = babylon.MeshBuilder.CreateGround('ground1', {height:6, width:6, subdivisions: 2}, scene);

        // Return the created scene.
        return scene;
    }

    var scene = createScene();

    engine.runRenderLoop(function(){
        scene.render();
    })
}

window.addEventListener('DOMContentLoaded',init);
