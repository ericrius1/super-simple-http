require.config({
	baseUrl: "./",
	paths: {
		goo: "../src/goo",
		'goo/lib': '../lib'
	}
});
require([
	'goo/entities/World',
	'goo/renderer/Material',
	'goo/entities/GooRunner',
	'goo/entities/components/ScriptComponent',
	'goo/shapes/ShapeCreator',
	'goo/entities/EntityUtils',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/PointLight',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/math/Vector3',
	'goo/renderer/shaders/ShaderLib',
	'goo/scripts/WASDControlScript',
	'goo/scripts/MouseLookControlScript',
	'goo/renderer/MeshData',
	'goo/renderer/Shader',
	'goo/renderer/Util',
	'goo/renderer/TextureCreator',
	'goo/renderer/pass/RenderTarget',
	'goo/math/Plane',
	'goo/addons/water/FlatWaterRenderer'
], function (
	World,
	Material,
	GooRunner,
	ScriptComponent,
	ShapeCreator,
	EntityUtils,
	LightComponent,
	PointLight,
	Camera,
	CameraComponent,
	OrbitCamControlScript,
	Vector3,
	ShaderLib,
	WASDControlScript,
	MouseLookControlScript,
	MeshData,
	Shader,
	Util,
	TextureCreator,
	RenderTarget,
	Plane,
	FlatWaterRenderer
) {
	"use strict";

	var cameraEntity = null;
	var skybox = null;
	var gui = null;

	function init () {
		var goo = new GooRunner({
			//showStats: true,
			//antialias: true
		});
		goo.renderer.setClearColor(0.0, 0.0, 0.0, 1.0);
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		gui = new window.dat.GUI();

		var camera = new Camera(45, 1, 0.1, 2000);
		cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.setd(20,150,250);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();

		var scripts = new ScriptComponent();
		scripts.scripts.push(new WASDControlScript({
			domElement: goo.renderer.domElement,
			walkSpeed: 45.0,
			crawlSpeed: 10.0
		}));
		scripts.scripts.push(new MouseLookControlScript({
			domElement: goo.renderer.domElement
		}));
		cameraEntity.setComponent(scripts);

		// Setup light
		var light = new PointLight();
		var entity = createBox(goo, ShaderLib.simple, 1, 1, 1);
		entity.transformComponent.transform.translation.x = -1000;
		entity.transformComponent.transform.translation.y = 500;
		entity.transformComponent.transform.translation.z = -1000;
		entity.setComponent(new LightComponent(light));
		entity.addToWorld();

		// Examples of model loading
		loadSkybox(goo);

		var entity = createBox(goo, ShaderLib.simpleLit, 50, 150, 150);
		entity.transformComponent.transform.translation.x = -80;
		entity.addToWorld();
		var script = {
			run: function (entity) {
				var t = entity._world.time;

				var transformComponent = entity.transformComponent;
				entity.transformComponent.transform.setRotationXYZ(
					0.2,
					World.time * 0.2,
					0
				);
				transformComponent.transform.translation.y = Math.sin(t) * 5 - 70;
				transformComponent.setUpdated();
			}
		};
		entity.setComponent(new ScriptComponent(script));

		var meshData = ShapeCreator.createQuad(10000, 10000, 10, 10);
		var waterEntity = EntityUtils.createTypicalEntity(goo.world, meshData);
		var material = Material.createMaterial(ShaderLib.simple, 'mat');
		waterEntity.meshRendererComponent.materials.push(material);
		waterEntity.transformComponent.transform.setRotationXYZ(-Math.PI / 2, 0, 0);
		// waterEntity.transformComponent.transform.translation.y = -10;
		waterEntity.addToWorld();

		var waterRenderer = new FlatWaterRenderer(camera);
		goo.renderSystem.preRenderers.push(waterRenderer);

		waterRenderer.setWaterEntity(waterEntity);
		waterRenderer.setSkyBox(skybox);

		waterRenderer.waterMaterial.shader.uniforms.fogColor = [1.0, 1.0, 1.0];
		waterRenderer.waterMaterial.shader.uniforms.fogStart = 0;
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'timeMultiplier', 0.1, 5.0);
		gui.addColor(waterRenderer.waterMaterial.shader.uniforms, 'sunColor');
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'sunShininess', 0.0, 300.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'sunSpecPower', 0.0, 4.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'distortionMultiplier', 0.0, 0.5);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'fresnelPow', 1.0, 8.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'normalMultiplier', 0.0, 3.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'fresnelMultiplier', 0.0, 3.0);
		gui.addColor(waterRenderer.waterMaterial.shader.uniforms, 'waterColor');
		gui.addColor(waterRenderer.waterMaterial.shader.uniforms, 'fogColor');
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'fogStart', 0.0, 2000.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'fogScale', 1.0, 2000.0);
		var obj = {
			waterType: ''
		};
		var controller = gui.add(obj, 'waterType', [ '1', '2' ] );
		controller.onFinishChange(function(value) {
			if (value === '1') {
				waterRenderer.waterMaterial.textures[0] = new TextureCreator().loadTexture2D('../resources/water/waternormals3.png');
			} else if (value === '2') {
				waterRenderer.waterMaterial.textures[0] = new TextureCreator().loadTexture2D('../resources/water/normalmap3.dds');
			}
			console.log(value);
		});
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'waterScale', 0.0001, 5.0);
	}

	function loadSkybox (goo) {
		var environmentPath = '../resources/skybox/';
		// left, right, bottom, top, back, front
		var textureCube = new TextureCreator().loadTextureCube([
			environmentPath + '1.jpg',
			environmentPath + '3.jpg',
			environmentPath + '5.jpg',
			environmentPath + '6.jpg',
			environmentPath + '4.jpg',
			environmentPath + '2.jpg'
		]);
		skybox = createBox(goo, skyboxShader, 10, 10, 10);
		skybox.meshRendererComponent.materials[0].textures.push(textureCube);
		skybox.meshRendererComponent.materials[0].cullState.cullFace = 'Front';
		skybox.meshRendererComponent.materials[0].depthState.enabled = false;
		skybox.meshRendererComponent.materials[0].renderQueue = 0;
		skybox.meshRendererComponent.cullMode = 'Never';
		skybox.addToWorld();

		goo.callbacksPreRender.push(function () {
			var source = cameraEntity.transformComponent.worldTransform;
			var target = skybox.transformComponent.worldTransform;
			target.translation.setv(source.translation);
			target.update();
		});
	}

	function createBox (goo, shader, w, h, d) {
		var meshData = ShapeCreator.createBox(w, h, d);
		var entity = EntityUtils.createTypicalEntity(goo.world, meshData);
		var material = Material.createMaterial(shader, 'mat');
		entity.meshRendererComponent.materials.push(material);
		return entity;
	}

	var skyboxShader = {
		attributes: {
			vertexPosition: MeshData.POSITION
		},
		uniforms: {
			viewMatrix: Shader.VIEW_MATRIX,
			projectionMatrix: Shader.PROJECTION_MATRIX,
			worldMatrix: Shader.WORLD_MATRIX,
			cameraPosition: Shader.CAMERA,
			diffuseMap: Shader.TEXTURE0
		},
		vshader: [ //
			'attribute vec3 vertexPosition;', //

			'uniform mat4 viewMatrix;', //
			'uniform mat4 projectionMatrix;',//
			'uniform mat4 worldMatrix;',//
			'uniform vec3 cameraPosition;', //

			'varying vec3 eyeVec;',//

			'void main(void) {', //
			'	vec4 worldPos = worldMatrix * vec4(vertexPosition, 1.0);', //
			'	gl_Position = projectionMatrix * viewMatrix * worldPos;', //
			'	eyeVec = cameraPosition - worldPos.xyz;', //
			'}'//
		].join('\n'),
		fshader: [//
			'precision mediump float;',//

			'uniform samplerCube diffuseMap;',//

			'varying vec3 eyeVec;',//

			'void main(void)',//
			'{',//
			'	vec4 cube = textureCube(diffuseMap, eyeVec);',//
			'	gl_FragColor = cube;',//
			// ' gl_FragColor = vec4(1.0,0.0,0.0,1.0);',//
			'}'//
		].join('\n')
	};

	init();
});
