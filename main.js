import * as THREE from 'three';
import THREEOrbitControls from 'three-orbit-controls';
import { Image3DGenericDecoder, UrlToArrayBufferReader } from 'pixpipejs';

const OrbitControls = THREEOrbitControls(THREE);

const ZERO = new THREE.Vector3(0, 0, 0);

const url2buf = new UrlToArrayBufferReader();
url2buf.addInput('static/full8_400um_optbal.mnc');
url2buf.update();

const bufferPromise = new Promise((resolve) => {
  url2buf.on('ready', function bufferReady() {
    resolve(this.getOutput());
  });
})

class MRIMaterial {
  constructor(image3d) {
    const buffer = image3d.getData();
    const sqrtlength = Math.sqrt(buffer.length);
    const width = Math.ceil(sqrtlength);
    const height = Math.floor(sqrtlength);
    this.dataTexture = new THREE.DataTexture(
      buffer,
      width,
      height,
      THREE.RGBAFormat
    );
    const [xlen, ylen, zlen] = ['xspace', 'yspace', 'zspace']
      .map(s => image3d.getMetadata(s).space_length);
    this.diagonal = Math.sqrt(xlen*xlen + ylen*ylen + zlen*zlen);
    this.shader = new THREE.ShaderMaterial();
  }
  getShaderMaterial() {
    return this.shader;
  }
  getDiagonal() {
    return this.diagonal;
  }
}

function buildTexture(buffer) {
	return null;
}

bufferPromise.then((buf) => {
  const decoder = new Image3DGenericDecoder();
  decoder.addInput(buf);
  decoder.update();
  runViz(new MRIMaterial(decoder.getOutput()));
});


class Viewport {
	constructor(renderer, distance) {
    const canvas = renderer.domElement
		const { width, height } = canvas.getBoundingClientRect();
		const [ FOV, ASPECT, NEAR, FAR ] = [ 45, width / height, 0.1, 20000 ];
    this.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
		this.renderer = renderer;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0, distance);
    this.camera.lookAt(ZERO);
    renderer.setClearColor(new THREE.Color(0.9, 0.9, 0.9), 1);
    this.rendering = false;
    this.scene = null
	}
  setScene(scene) {
    if (this.scene) {
      this.scene.remove(this.camera);
    }
    scene.add(this.camera);
    this.camera.lookAt(ZERO);
    this.scene = scene;
  }
  render() {
    if (!this.rendering || !this.scene) {
      return;
    };
    const canvas = this.renderer.domElement;
		const { width, height } = canvas.getBoundingClientRect();
    this.camera.aspect = width / height;
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame( () => this.render() );
  }
  stop() {
    this.rendering = false;
  }
  startRender() {
    if (this.scene) {
      this.rendering = true;
      this.render();
      return;
    }
    this.rendering = false;
    throw new Error('Please set a scene to the Viewport')
  }
}

function makePlanes(mriMaterial) {
  const system = new THREE.Object3D();
  const shader =  mriMaterial.getShaderMaterial();
  const planeSize = mriMaterial.getDiagonal() * 2;
  const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
  const planeXY = new THREE.Mesh(planeGeometry, shader);
  const planeXZ = new THREE.Mesh(planeGeometry, shader);
  const planeYZ = new THREE.Mesh(planeGeometry, shader);
  planeXZ.rotation.x = Math.PI / 2.0;
  planeYZ.rotation.y = Math.PI / 2.0;
  const planes = [planeXY, planeXZ, planeYZ];
  planes.forEach((plane) => { system.add(plane); });
  return system;
}

function runViz(mriMaterial) {
	const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
	document.querySelector('#app').appendChild(renderer.domElement);
  const view = new Viewport(renderer, mriMaterial.getDiagonal() * 2.5);
  const scene = new THREE.Scene();
  const planeSystem = makePlanes(mriMaterial);
  scene.add(planeSystem);
  view.setScene(scene);
  view.startRender();
}
