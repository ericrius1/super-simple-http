require([
	'goo/entities/components/MeshDataComponent',
	'goo/entities/components/MeshRendererComponent',
	'goo/renderer/Material',
	'goo/entities/GooRunner',
	'goo/renderer/TextureCreator',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/math/Vector3',
	'goo/scripts/WASDControlScript',
	'goo/scripts/MouseLookControlScript',
	'goo/entities/systems/ParticlesSystem',
	'goo/entities/components/ParticleComponent',
	'goo/particles/ParticleUtils',
	'goo/renderer/shaders/ShaderLib'
], function (
	MeshDataComponent,
	MeshRendererComponent,
	Material,
	GooRunner,
	TextureCreator,
	ScriptComponent,
	Camera,
	CameraComponent,
	Vector3,
	WASDControlScript,
	MouseLookControlScript,
	ParticlesSystem,
	ParticleComponent,
	ParticleUtils,
	ShaderLib
) {
	"use strict";

	var resourcePath = "../resources";

	var material;

	function init () {
		// Create typical goo application
		var goo = new GooRunner({
			showStats : true
		});
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		material = Material.createMaterial(ShaderLib.particles);
		var texture = new TextureCreator().loadTexture2D(resourcePath + '/flare.png');
		texture.wrapS = 'EdgeClamp';
		texture.wrapT = 'EdgeClamp';
		texture.generateMipmaps = true;
		material.textures.push(texture);
		material.blendState.blending = 'AdditiveBlending';
		material.cullState.enabled = false;
		material.depthState.write = false;

		// create an entity with particles
		createParticles(goo);

		// Add camera
		var camera = new Camera(45, 1, 1, 1000);
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.set(0, 10, 20);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 2, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();

		var scripts = new ScriptComponent();
		scripts.scripts.push(new WASDControlScript({
			domElement : goo.renderer.domElement,
			walkSpeed : 25.0,
			crawlSpeed : 10.0
		}));
		scripts.scripts.push(new MouseLookControlScript({
			domElement : goo.renderer.domElement
		}));
		cameraEntity.setComponent(scripts);
	}

	// Create simple quad
	function createParticles (goo) {
		var world = goo.world;

		// Create entity
		var entity = world.createEntity();

		entity.transformComponent.transform.translation.set(0, 0, 0);

		// Create particle component
		var particleComponent = new ParticleComponent({
			particleCount : 200,
			timeline : [{
				timeOffset : 0.0,
				spin : 0,
				mass : 1,
				size : 0.5,
				color : [0.0, 0.0625, 1.0, 1.0]
			}, {
				timeOffset : 1.0,
				size : 0.25,
				color : [0.0, 0.0625, 1.0, 0.0]
			}],
			emitters : [{
				totalParticlesToSpawn : -1,
				releaseRatePerSecond : 100,
				minLifetime : 1.300,
				maxLifetime : 1.950,
				getEmissionVelocity : function (particle, particleEntity) {
					var vec3 = particle.velocity;
					return ParticleUtils.getRandomVelocityOffY(vec3, 0, 0.2268928, 10, particleEntity);
				}
			}]
		});
		particleComponent.emitters[0].influences.push(ParticleUtils.createConstantForce(new Vector3(0, -20, 0)));

		entity.setComponent(particleComponent);

		// Create meshdata component using particle data
		var meshDataComponent = new MeshDataComponent(particleComponent.meshData);
		entity.setComponent(meshDataComponent);

		// Create meshrenderer component with material and shader
		var meshRendererComponent = new MeshRendererComponent();
		meshRendererComponent.materials.push(material);
		entity.setComponent(meshRendererComponent);

		entity.addToWorld();

		// add keyhandler for restarting particles if we run out.
		// XXX: Only useful if totalParticlesToSpawn != Infinity down in generateNewEmitter
		document.addEventListener('keydown', function (e) {
			e = window.event || e;
			var code = e.charCode || e.keyCode;
			if (code === 32) { // space bar
				// reset particles to spawn on the emitters
				for ( var i = 0, max = particleComponent.emitters.length; i < max; i++) {
					if (particleComponent.emitters[i].totalParticlesToSpawn <= 0) {
						particleComponent.emitters[i].totalParticlesToSpawn = 500;
					}
				}
				particleComponent.enabled = true;
			}
		}, false);
	}

	init();
});
