import { Mesh, HemisphereLight, PerspectiveCamera, Scene, WebGLRenderer, BoxGeometry, MeshStandardMaterial, Color, MeshBasicMaterial, RingGeometry, sRGBEncoding } from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

const objectUnselectedColor = new Color(0x5853e6);
const objectSelectedColor = new Color(0xf0520a);

class App {
  constructor() {
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 3);
    this.scene = new Scene();
  
    this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);
  
    this.initXR();
    this.initScene();
  
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  initXR() {
    this.renderer.xr.enabled = true;
    document.body.appendChild(ARButton.createButton(this.renderer, {sessionInit: {requiredFeatures: ['hit-test']}}));

    this.hitTestSourceRequested = false;
    this.hitTestSource = null;

    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('select', this.onSelect.bind(this));
  }

  initScene() {
    let geometry = new RingGeometry(0.08, 0.10, 32).rotateX(-Math.PI / 2);
    let material = new MeshBasicMaterial;
    this.reticle = new Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    geometry = new BoxGeometry(0.1, 0.1, 0.1);
    material = new MeshStandardMaterial({ color: 0x5853e6 });
    this.box = new Mesh(geometry, material);
    this.box.visible = false;
    this.scene.add(this.box);

    const light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    this.scene.add(light);
  }

  render(_, frame) {
    if (frame) {
      if (this.hitTestSourceRequested === false) {
        this.requestHitTestSource();
      }
      if (this.hitTestSource) {
        this.getHitTestResults(frame);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.render(this.scene, this.camera); 
  }

  onSelect() {
    if (this.reticle.visible) {
      this.box.position.setFromMatrixPosition(this.reticle.matrix);
      this.box.position.y += this.box.geometry.parameters.height / 2;
      this.box.visible = true;
    } 
  }

  async requestHitTestSource() {
    const session = this.renderer.xr.getSession();
    session.addEventListener('end', () => {
      this.hitTestSourceRequested = false;
      this.hitTestSource = null;
    });
    const referenceSpace = await session.requestReferenceSpace('viewer');
    this.hitTestSource = await session.requestHitTestSource({ space: referenceSpace, entityTypes: ['plane'] });
    this.hitTestSourceRequested = true;
  }

  getHitTestResults(frame) {
    const hitTestResults = frame.getHitTestResults(this.hitTestSource);
    if (hitTestResults.length) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(this.renderer.xr.getReferenceSpace());
      this.reticle.visible = true;
      this.reticle.matrix.fromArray(pose.transform.matrix);
    } else {
      this.reticle.visible = false;
    }
  }
}
  
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
