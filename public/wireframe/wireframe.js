require([
	'goo/entities/components/MeshDataComponent',
	'goo/entities/components/MeshRendererComponent',
	'goo/renderer/MeshData',
	'goo/renderer/Material',
	'goo/renderer/Shader',
	'goo/entities/GooRunner',
	'goo/renderer/TextureCreator',
	'goo/entities/components/ScriptComponent',
	'goo/shapes/ShapeCreator',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/scripts/BasicControlScript',
	'goo/math/Vector3',
	'goo/renderer/shaders/ShaderLib'
], function (
	MeshDataComponent,
	MeshRendererComponent,
	MeshData,
	Material,
	Shader,
	GooRunner,
	TextureCreator,
	ScriptComponent,
	ShapeCreator,
	Camera,
	CameraComponent,
	BasicControlScript,
	Vector3,
	ShaderLib
) {
	"use strict";

	var resourcePath = "../resources";

	function init() {
		// Create typical goo application
		var goo = new GooRunner({
			showStats : true,
			antialias : true
		});
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		var camera = new Camera(45, 1, 1, 1000);
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.set(0, 5, 10);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();

		var meshData = ShapeCreator.createTorus(20, 20, 1, 3);
		createMesh(goo, meshData, 0, 0, 0);
	}

	function createMesh(goo, meshData, x, y, z) {
		var world = goo.world;

		// Create entity
		var entity = world.createEntity();

		entity.transformComponent.transform.translation.set(x, y, z);

		// Create meshdata component using above data
		var meshDataComponent = new MeshDataComponent(meshData);
		entity.setComponent(meshDataComponent);

		// Create meshrenderer component with material and shader
		var meshRendererComponent = new MeshRendererComponent();

		var material = Material.createMaterial(ShaderLib.textured);
		var texture = new TextureCreator().loadTexture2D(resourcePath + '/wood.jpg');
		material.textures.push(texture);

		var wireframeMaterial = Material.createMaterial(ShaderLib.textured);
		wireframeMaterial.wireframe = true;

		meshRendererComponent.materials.push(material);
		meshRendererComponent.materials.push(wireframeMaterial);
		entity.setComponent(meshRendererComponent);

		entity.setComponent(new ScriptComponent(new BasicControlScript()));

		entity.addToWorld();
	}

	function createShader() {
		return {
			attributes : {
				vertexPosition : MeshData.POSITION,
				center : 'center'
			},
			uniforms : {
				viewMatrix : Shader.VIEW_MATRIX,
				projectionMatrix : Shader.PROJECTION_MATRIX,
				worldMatrix : Shader.WORLD_MATRIX,
			},
			vshader : [ //
			'precision highp float;',//

			'attribute vec3 vertexPosition;', //
			'attribute vec4 center;', //

			'uniform mat4 viewMatrix;', //
			'uniform mat4 projectionMatrix;',//
			'uniform mat4 worldMatrix;',//

			'varying vec4 vCenter;', //

			'void main() {', //
			'	vCenter = center;', //
			'	gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(vertexPosition, 1.0);', //
			'}', //
			].join('\n'),
			fshader : [//
			'precision highp float;',//
			// 'precision mediump float;',//

			'#extension GL_OES_standard_derivatives : enable',//

			'varying vec4 vCenter;',//

			'float edgeFactorTri() {',//
			'	vec3 d = fwidth( vCenter.xyz );',//
			'	vec3 a3 = smoothstep( vec3( 0.0 ), d * 1.5, vCenter.xyz );',//
			'	return min( min( a3.x, a3.y ), a3.z );',//
			'}',//

			'float edgeFactorQuad1() {',//
			'	vec2 d = fwidth( vCenter.xy );',//
			'	vec2 a2 = smoothstep( vec2( 0.0 ), d * 1.5, vCenter.xy );',//
			'	return min( a2.x, a2.y );',//
			'}',//

			'float edgeFactorQuad2() {',//
			'	vec2 d = fwidth( 1.0 - vCenter.xy );',//
			'	vec2 a2 = smoothstep( vec2( 0.0 ), d * 1.5, 1.0 - vCenter.xy );',//
			'	return min( a2.x, a2.y );',//
			'}',//

			'void main() {',//
			'	if ( vCenter.w == 0.0 ) {',//
			'		gl_FragColor.rgb = mix( vec3( 1.0 ), vec3( 0.2 ), edgeFactorTri() );',//
			'	} else {',//
			'		gl_FragColor.rgb = mix( vec3( 1.0 ), vec3( 0.2 ), min( edgeFactorQuad1(), edgeFactorQuad2() ) );',//
			'	}',//
			'	gl_FragColor.a = 1.0;',//
			'}',//
			].join('\n')
		};
	}

	init();
});
