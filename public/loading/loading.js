/*
Demonstrates how to load a scene from config files.

The scene config (simple.scene) contains references to all entities
that should be loaded.
*/

require([
	'goo/loaders/Loader',
	'goo/loaders/SceneLoader',
	'goo/entities/GooRunner'
], function (
	Loader,
	SceneLoader,
	GooRunner
) {
	'use strict';

	function init() {
		// Create typical goo application
		var goo = new GooRunner();
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		// The Loader takes care of loading data from a URL.
		var loader = new Loader({rootPath: './scene/'});

		// ...and the SceneLoader uses the Loader to load a scene.
		var sceneLoader = new SceneLoader({
			loader: loader,
			world: goo.world
		});

		sceneLoader.load('simple.scene').then(function(entities) {
			// This function is called when all the entities
			// and their dependencies have been loaded.
			// Just add all the entities to the world.
			for (var i = 0; i < entities.length; ++i) {
				var entity = entities[i];
				console.log('Adding entity', entity.name);
				entity.addToWorld();
			}
		}).then(null, function(e) {
			// The second parameter of `then` is an error handling function.
			// We just pop up an error message in case the scene fails to load.
			alert('Failed to load scene: ' + e);
		});
	}

	init();
});
