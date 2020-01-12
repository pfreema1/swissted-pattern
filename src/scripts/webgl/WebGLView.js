import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import glslify from 'glslify';
import Tweakpane from 'tweakpane';
import OrbitControls from 'three-orbitcontrols';
import TweenMax from 'TweenMax';
import baseDiffuseFrag from '../../shaders/basicDiffuse.frag';
import basicDiffuseVert from '../../shaders/basicDiffuse.vert';
import MouseCanvas from '../MouseCanvas';
import TextCanvas from '../TextCanvas';
import RenderTri from '../RenderTri';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export default class WebGLView {
	constructor(app) {
		this.app = app;
		this.PARAMS = {
			rotSpeed: 0.005
		};

		this.init();
	}

	async init() {
		this.initThree();
		this.initBgScene();
		this.initLights();
		this.initTweakPane();
		await this.loadTestMesh();
		this.setupTextCanvas();
		this.initMouseMoveListen();
		this.initMouseCanvas();
		this.initRenderTri();
		this.initPostProcessing();
	}

	initPostProcessing() {
		this.composer = new EffectComposer(this.renderer);

		const renderPass = new RenderPass(this.scene, this.camera);
		const fxaaPass = new ShaderPass(FXAAShader);
		const pixelRatio = this.renderer.getPixelRatio();

		fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixeRatio);
		fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixeRatio);

		this.composer.addPass(renderPass);
		this.composer.addPass(fxaaPass);


	}

	initTweakPane() {
		this.pane = new Tweakpane();

		this.pane
			.addInput(this.PARAMS, 'rotSpeed', {
				min: 0.0,
				max: 0.5
			})
			.on('change', value => {

			});
	}

	initMouseCanvas() {
		this.mouseCanvas = new MouseCanvas();
	}

	initMouseMoveListen() {
		this.mouse = new THREE.Vector2();
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		window.addEventListener('mousemove', ({ clientX, clientY }) => {
			this.mouse.x = clientX; //(clientX / this.width) * 2 - 1;
			this.mouse.y = clientY; //-(clientY / this.height) * 2 + 1;

			this.mouseCanvas.addTouch(this.mouse);
		});
	}

	initThree() {
		this.scene = new THREE.Scene();

		this.camera = new THREE.OrthographicCamera();

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.autoClear = true;

		this.clock = new THREE.Clock();
	}

	setupTextCanvas() {
		this.textCanvas = new TextCanvas(this);
	}

	loadTestMesh() {
		return new Promise((res, rej) => {
			let loader = new GLTFLoader();

			loader.load('./bbali.glb', object => {
				this.testMesh = object.scene.children[0];
				console.log(this.testMesh);
				this.testMesh.add(new THREE.AxesHelper());

				this.testMeshMaterial = new THREE.ShaderMaterial({
					fragmentShader: glslify(baseDiffuseFrag),
					vertexShader: glslify(basicDiffuseVert),
					uniforms: {
						u_time: {
							value: 0.0
						},
						u_lightColor: {
							value: new THREE.Vector3(0.0, 1.0, 1.0)
						},
						u_lightPos: {
							value: new THREE.Vector3(-2.2, 2.0, 2.0)
						}
					}
				});

				this.testMesh.material = this.testMeshMaterial;
				this.testMesh.material.needsUpdate = true;

				this.bgScene.add(this.testMesh);
				res();
			});
		});
	}

	initRenderTri() {
		this.resize();

		this.renderTri = new RenderTri(this.scene, this.renderer, this.bgRenderTarget, this.mouseCanvas, this.textCanvas)
	}

	initBgScene() {
		this.bgRenderTarget = new THREE.WebGLRenderTarget(
			window.innerWidth,
			window.innerHeight
		);
		this.bgCamera = new THREE.PerspectiveCamera(
			50,
			window.innerWidth / window.innerHeight,
			0.01,
			100
		);
		this.controls = new OrbitControls(this.bgCamera, this.renderer.domElement);

		this.bgCamera.position.z = 3;
		this.controls.update();

		this.bgScene = new THREE.Scene();
	}

	initLights() {
		this.pointLight = new THREE.PointLight(0xff0000, 1, 100);
		this.pointLight.position.set(0, 0, 50);
		this.bgScene.add(this.pointLight);
	}

	resize() {
		if (!this.renderer) return;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.fovHeight =
			2 *
			Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
			this.camera.position.z;
		this.fovWidth = this.fovHeight * this.camera.aspect;

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		if (this.trackball) this.trackball.handleResize();
	}


	updateTestMesh(time) {
		this.testMesh.rotation.y += this.PARAMS.rotSpeed;

		this.testMeshMaterial.uniforms.u_time.value = time;
	}

	updateTextCanvas(time) {

		this.textCanvas.textLine.update(time);
		this.textCanvas.textLine.draw(time);
		this.textCanvas.texture.needsUpdate = true;
	}

	update() {
		const delta = this.clock.getDelta();
		const time = performance.now() * 0.0005;

		this.controls.update();

		if (this.renderTri) {
			this.renderTri.triMaterial.uniforms.uTime.value = time;
		}

		if (this.testMesh) {
			this.updateTestMesh(time);
		}

		if (this.mouseCanvas) {
			this.mouseCanvas.update();
		}

		if (this.textCanvas) {
			this.updateTextCanvas(time);
		}

		if (this.trackball) this.trackball.update();
	}

	draw() {
		this.renderer.setRenderTarget(this.bgRenderTarget);
		this.renderer.render(this.bgScene, this.bgCamera);
		this.renderer.setRenderTarget(null);



		this.renderer.render(this.scene, this.camera);

		if (this.composer) {
			this.composer.render();

		}

	}
}
