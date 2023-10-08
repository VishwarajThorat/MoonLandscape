import * as THREE from 'three';

let renderer = new THREE.WebGLRenderer({alpha:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//renderer.physicallyCorrectLights = true;
renderer.shadowMap.needsUpdate = true;
document.body.appendChild(renderer.domElement);

//SCENE & CAMERA
let scene = new THREE.Scene();
let cam = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,5,1000);
cam.position.set(150,10,100);
cam.aspect = window.innerWidth / window.innerHeight;

//HELPERS
//var axesHelper = new THREE.AxesHelper(500);
//scene.add( axesHelper );

//SKY
let skyGeometry = new THREE.SphereBufferGeometry(500,32,32);
let bgTexture = new THREE.TextureLoader().load("https://cdn140.picsart.com/271411672011201.jpg",
    texture => {
        var img = texture.image;
        img.crossOrigin = "Anonymous";
        var bgWidth= img.width;
        var bgHeight = img.height;
        texture.resize;
    } );
let skyMaterial = new THREE.MeshPhongMaterial({map:bgTexture});
skyMaterial.side = THREE.DoubleSide;
bgTexture.wrapS = THREE.RepeatWrapping;
bgTexture.wrapT = THREE.RepeatWrapping;
bgTexture.repeat.set( 10, 10 );
let sky = new THREE.Mesh( skyGeometry, skyMaterial );

//Sun
let sunGeom = new THREE.SphereBufferGeometry(10,32,32);
let sunMater = new THREE.MeshLambertMaterial({color: 0xf3a229});
let sun = new THREE.Mesh(sunGeom,sunMater);
sun.position.set(480,120,-30);

//Moon
let moonGeom = new THREE.SphereBufferGeometry(10,32,32);
let moonTexture = new THREE.TextureLoader().load("https://lh3.googleusercontent.com/-UP2nFt9n1Qs/WNFHxsvtCUI/AAAAAAAAADM/DLZLJLH5NnYAkhH8pZyT5Ma-5jif9yg_wCJkCGAYYCw/w1082-h609-n-rw-no/moon.jpg");
let moonMater = new THREE.MeshLambertMaterial({map: moonTexture});
let moon = new THREE.Mesh(moonGeom,moonMater);
moon.position.set(-480,-120,30);
moon.rotation.x = Math.PI * 0.3;
moon.rotation.y = Math.PI * -0.2;

//Water
let waterParams = {
			color: '#4c7fb9',
			scale: 1.3,
			flowX: 1,
			flowY: 1
		};
let waterGeom = new THREE.PlaneBufferGeometry(1000,1000,32,32);
let water = new THREE.Water( waterGeom, {
				color: waterParams.color,
				scale: waterParams.scale,
				flowDirection: new THREE.Vector2( waterParams.flowX, waterParams.flowY ),
				textureWidth: 512,
				textureHeight: 512
			} );
water.receiveShadow = true;
water.rotation.x = -Math.PI / 2;
water.position.y = -5;

//LIGHTS
let ambLight = new THREE.AmbientLight( 0x404040 );
scene.add(ambLight);
let moonLight = new THREE.PointLight( 0xaaaaaa, 2, 800,3);
moonLight.position.set(-400,-120,30);
moonLight.castShadow = true;
let sunLight = new THREE.SpotLight( 0xffffff, 3, 2000,2);
sunLight.position.set(480,120,-30); 
//sunLight.position.set(-400,-100,400);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 512;
sunLight.shadow.mapSize.height = 512; 
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;

let bkGround = new THREE.Object3D();
bkGround.add(sky,moon,moonLight,sunLight,sun);
bkGround.rotation.x =Math.PI;

//Add sky and water to scene
scene.add(bkGround,water);

//CONTROLS
let ctrls = new THREE.OrbitControls(cam, renderer.domElement);
ctrls.addEventListener('change',renderer);
ctrls.minPolarAngle = Math.PI * 0.25;
ctrls.maxPolarAngle = Math.PI *0.55;

//Boundaries 
//let bounds = new THREE.Box3();

/*Ground constructor - https://github.com/wybiral/terrain*/
class Terrain {
  constructor (width, height){
    this.width = width;
    this.height = height;
    this.grndGeom = new THREE.PlaneBufferGeometry(width,height,width-1,height-1);
    let rotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    this.grndGeom.applyMatrix4(rotation);
    this.array = this.grndGeom.attributes.position.array;
    this.ground = null;
  }
  build(){
    this.grndGeom.computeBoundingSphere();
    this.grndGeom.computeVertexNormals();
    //this.grndMater = new THREE.MeshLambertMaterial({color: 0x176d45});
    this.texture = new THREE.TextureLoader().load("https://s3.amazonaws.com/files.d20.io/images/37740/thumb.jpg");
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.repeat.set( 8,8 );
    this.grndMater = new THREE.MeshLambertMaterial({map: this.texture});
    this.ground = new THREE.Mesh(this.grndGeom,this.grndMater);
    this.ground.receiveShadow = true;
    this.ground.position.y = -30;
    this.ground.receiveShadow = true;
    this.ground.castShadow = false;
    //add ground boundaries
    //bounds.setFromObject(this.ground);
    this.ground.scale.x = 3.0;
    this.ground.scale.z = 3.0;
    this.ground.scale.y = 5.0;
    return this.ground;
  }
  
  //Load ground relief
  static fromImg (src){ 
    return new Promise(function(resolve, reject) {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function() {
      let width = img.width;
      let height = img.height;
      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var pixels = ctx.getImageData(0, 0, width, height).data;
      let terrain = new Terrain(width, height);
      for (let i = 0; i < width * height; i++) {
        terrain.array[i * 3 + 1] = pixels[i * 4] / 16;
      }
      resolve(terrain);
    };
    img.onabort = reject;
    img.onerror = reject;
    img.src = src;
    });
  }
}

Terrain.fromImg('https://upload.wikimedia.org/wikipedia/commons/5/57/Heightmap.png').then(terrain => {
  scene.add(terrain.build());
  // Scale terrain peaks
}).catch(function(e) {
  console.error(e);
});


function onResize(){
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  requestAnimationFrame(animate);
  bkGround.rotation.z-=0.01;
 /* if(cam.position.x > 130){
    cam.position.x = 110;
    cam.lookAt(0,-10,0);
  }

  if(cam.position.x < -130){
    cam.position.x = -110;
    cam.lookAt(0,-10,0);
  }

  if(cam.position.z > 130){
    cam.position.z = 110;
    cam.lookAt(0,-10,0);
  }

  if(cam.position.z < -130){
    cam.position.z = -110;
    cam.lookAt(0,-10,0);
  }*/
  //console.log(cam.position);
  window.addEventListener( 'resize', onResize, false );
  ctrls.addEventListener( 'change', () => renderer.render( scene, camera ) );
  ctrls.addEventListener('change',renderer);
  ctrls.maxPolarAngle = Math.PI * 0.49;
  ctrls.minPolarAngle = Math.PI * 0.45;
  renderer.render(scene,cam); 
}
animate();

