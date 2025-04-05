import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const videoFeed = document.getElementById('videoFeed');
const cameraButton = document.getElementById('enableCamera');
const loadMap = document.getElementById('loadMap');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,2,4);

const renderer = new THREE.WebGLRenderer({alpha:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;

// Initial map plane
const mapPlane=new THREE.Mesh(
  new THREE.PlaneGeometry(4,4),
  new THREE.MeshBasicMaterial({color:0xcccccc,side:THREE.DoubleSide})
);
mapPlane.rotation.x=-Math.PI/2;
scene.add(mapPlane);

// Camera setup
cameraButton.onclick=async()=>{
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
    videoFeed.srcObject=stream;
  }catch(e){console.error(e);}
};
loadMap.onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const {latitude, longitude} = pos.coords;
    const zoom = 16;
    const centerTile = latLonToTileXY(latitude, longitude, zoom);
    const loader = new THREE.TextureLoader();

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = centerTile.x + i;
        const y = centerTile.y + j;
        const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
        
        loader.load(url, texture => {
          texture.repeat.y = -1;    // Flip texture vertically
          texture.needsUpdate = true;

          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
          );
          tile.rotation.x = Math.PI / 2;
          tile.position.set(i, -0.01, j);
          scene.add(tile);
        });
      }
    }
  })
};


// Convert GPS coords to tile XY
function latLonToTileXY(lat,lon,zoom){
  const n=2**zoom;
  const x=Math.floor((lon+180)/360*n);
  const y=Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*n);
  return{x,y};
}

// Render loop
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene,camera);
}
animate();

window.onresize=()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
};