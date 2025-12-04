import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";
import * as TWEEN from "@tweenjs/tween.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let camera, controls, scene, renderer;
const clock = new THREE.Clock();

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });

let physicsWorld;
const gravityConstant = 9.81;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
const margin = 0.05;

const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
let transformAux1;
let tempBtVec3_1;

const FILE_MAP = {
  1: "peon_ajedrez.glb",
  2: "rook_torre.glb",
  3: "caballo_ajedrez.glb",
  4: "chess_bishop.glb",
  5: "chess_queen.glb",
  6: "chess_king.glb",
};

const chessLayout = [
  [2, 3, 4, 6, 5, 4, 3, 2],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [-1, -1, -1, -1, -1, -1, -1, -1],
  [-2, -3, -4, -6, -5, -4, -3, -2],
];

const loadedPieceModels = {};
const boardPieces = new Array(8).fill(null).map(() => new Array(8).fill(null));

const pieceMaterials = {
  white: new THREE.MeshPhongMaterial({ color: 0xddcfbc }),
  black: new THREE.MeshPhongMaterial({ color: 0x333333 }),
};

const debugSettings = {
  matePastor: false,
  problema: false,
  dispararbola: false,
};

const conf = {
  reiniciar: function () {
    detenerSecuencia();
    resetTablero();
  },
  borrarBolas: function () {
    limpiarBolas();
  },
};

async function loadModels() {
  const loader = new GLTFLoader();
  const basePath = "src/";

  const loadPromises = Object.keys(FILE_MAP).map((typeKey) => {
    const fileName = FILE_MAP[typeKey];
    const fullPath = `${basePath}${fileName}`;

    return new Promise((resolve, reject) => {
      loader.load(
        fullPath,
        (gltf) => {
          const pieceModel = gltf.scene.clone();
          loadedPieceModels[typeKey] = pieceModel;
          resolve();
        },
        undefined,
        () => {
          reject(new Error(`Error al cargar el modelo: ${fileName}.`));
        }
      );
    });
  });

  await Promise.all(loadPromises);
}

Ammo(Ammo).then(start);

async function start() {
  initGraphics();
  initPhysics();

  try {
    await loadModels();
  } catch (e) {
    return;
  }

  tablero();
  createChessPieces();
  initGUI();
  initInput();
  animationLoop();
}

function initGUI() {
  const gui = new GUI();

  gui
    .add(debugSettings, "matePastor")
    .name("Simular Mate del Pastor")
    .onChange((value) => {
      if (value) MatePastor();
      else detenerSecuencia();
    });

  gui
    .add(debugSettings, "problema")
    .name("Resolver Problemas")
    .onChange((value) => {
      if (value) CrearProblema();
      else detenerSecuencia();
    });

  gui
    .add(debugSettings, "dispararbola")
    .name("dispararbola")
    .onChange((value) => {
      debugSettings.dispararbola = value;
    });

  gui.add(conf, "reiniciar").name("Reiniciar Tablero");
  gui.add(conf, "borrarBolas").name("Eliminar Pelotas");
}

function detenerSecuencia() {
  TWEEN.removeAll();
  limpiarBolas();
  resetTablero();
}

function initGraphics() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  camera.position.set(-14, 8, 16);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  const ambientLight = new THREE.AmbientLight(0x707070);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(-10, 18, 5);
  light.castShadow = true;
  const d = 14;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;
  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  scene.add(light);
  window.addEventListener("resize", onWindowResize);
}

function initPhysics() {
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
  tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
}

async function MatePastor() {
  resetTablero();
  await new Promise((r) => setTimeout(r, 500));

  if (!debugSettings.matePastor) return;
  await movePiece(1, 3, 3, 3);
  if (!debugSettings.matePastor) return;
  await movePiece(6, 3, 4, 3);
  if (!debugSettings.matePastor) return;
  await movePiece(0, 2, 3, 5);
  if (!debugSettings.matePastor) return;
  await movePiece(6, 7, 5, 7);
  if (!debugSettings.matePastor) return;
  await movePiece(0, 4, 2, 2);
  if (!debugSettings.matePastor) return;
  await movePiece(6, 6, 4, 6);
  if (!debugSettings.matePastor) return;
  await movePiece(2, 2, 6, 2);

  debugSettings.matePastor = false;
}

async function CrearProblema() {
  borrarTablero();

  createChessPieceInPosition(0, 7, true, 4);
  createChessPieceInPosition(5, 0, true, 3);
  createChessPieceInPosition(7, 3, true, 6);
  createChessPieceInPosition(6, 0, false, 1);
  createChessPieceInPosition(6, 1, false, 1);
  createChessPieceInPosition(7, 0, false, 6);

  await new Promise((r) => setTimeout(r, 5000));

  await movePiece(0, 7, 5, 2);
  await movePiece(6, 1, 5, 2);
  await movePiece(7, 3, 7, 2);
  await movePiece(5, 2, 4, 2);
  await movePiece(5, 0, 6, 2);
}

function tablero() {
  quat.set(0, 0, 0, 1);
  const lado = 5.0;
  const matBlanco = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const matNegro = new THREE.MeshPhongMaterial({ color: 0x111111 });

  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {
      pos.set(x * lado - 15, 0, z * lado - 20);
      const esBlanco = (x + z) % 2 === 0;
      const materialUsar = esBlanco ? matBlanco : matNegro;
      const suelo = createBoxWithPhysics(
        lado,
        1,
        lado,
        0,
        pos,
        quat,
        materialUsar
      );
      suelo.receiveShadow = true;
    }
  }
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz, 8, 1, 8),
    material
  );
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  shape.setMargin(margin);
  createRigidBody(object, shape, mass, pos, quat);
  return object;
}

function createChessPieces() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const pieceType = chessLayout[row][col];
      if (pieceType !== 0) {
        const isWhite = pieceType > 0;
        const type = Math.abs(pieceType);
        createChessPieceInPosition(row, col, isWhite, type);
      }
    }
  }
}

function createChessPieceInPosition(row, col, isWhite, type) {
  const lado = 5.0;
  const posX = col * lado - 15;
  const posZ = row * lado - 20;
  const material = isWhite ? pieceMaterials.white : pieceMaterials.black;
  const piece = createPiecePhysics(type, posX, posZ, material);
  boardPieces[row][col] = piece;
}

function createPiecePhysics(type, x, z, material) {
  let radius, height;
  const mass = 500;
  const baseVisualScale = 0.1;
  let visualScale = baseVisualScale;

  switch (type) {
    case 1:
      radius = 1.2;
      height = 3.5;
      visualScale = baseVisualScale * 10.0;
      break;
    case 2:
      radius = 1.4;
      height = 4;
      visualScale = 1.7;
      break;
    case 3:
      radius = 1.7;
      height = 5;
      visualScale = baseVisualScale * 30.0;
      break;
    case 4:
      radius = 1.3;
      height = 6;
      visualScale = 1.5;
      break;
    case 5:
      radius = 2.0;
      height = 7;
      visualScale = baseVisualScale * 18.0;
      break;
    case 6:
      radius = 2.1;
      height = 8;
      visualScale = baseVisualScale * 40.0;
      break;
  }

  const loadedModel = loadedPieceModels[type];
  const pieceWrapper = new THREE.Group();
  let visualMesh;

  if (loadedModel) {
    visualMesh = loadedModel.clone();
    visualMesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = material;
      }
    });
    visualMesh.scale.set(visualScale, visualScale, visualScale);
    visualMesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(visualMesh);
    const lowestPointY = box.min.y;
    const correctionY = -height / 2 - lowestPointY;
    visualMesh.position.y = correctionY;
  } else {
    const geometry = new THREE.CylinderGeometry(
      radius * 0.7,
      radius,
      height,
      16
    );
    visualMesh = new THREE.Mesh(geometry, material);
    visualMesh.castShadow = true;
    visualMesh.receiveShadow = true;
  }

  pieceWrapper.add(visualMesh);

  const posY = 0.5 + height / 2;
  pos.set(x, posY, z);
  quat.set(0, 0, 0, 1);
  pieceWrapper.position.copy(pos);
  pieceWrapper.quaternion.copy(quat);

  const shape = new Ammo.btCylinderShape(
    new Ammo.btVector3(radius, height * 0.5, radius)
  );
  shape.setMargin(margin);

  createRigidBody(pieceWrapper, shape, mass, pos, quat);
  pieceWrapper.userData.isPiece = true;

  return pieceWrapper;
}

function capturePiece(mesh) {
  if (!mesh) return;
  scene.remove(mesh);
  if (mesh.userData.physicsBody) {
    physicsWorld.removeRigidBody(mesh.userData.physicsBody);
    mesh.userData.physicsBody.setActivationState(0);
  }
  const index = rigidBodies.indexOf(mesh);
  if (index > -1) {
    rigidBodies.splice(index, 1);
  }
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) mesh.material.dispose();
}

function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  if (pos) object.position.copy(pos);
  else pos = object.position;
  if (quat) object.quaternion.copy(quat);
  else quat = object.quaternion;

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);
  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }
  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  object.userData.physicsBody = body;
  object.userData.collided = false;

  scene.add(object);
  if (mass > 0) {
    rigidBodies.push(object);
    body.setActivationState(4);
  }
  physicsWorld.addRigidBody(body);

  return body;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  return new Promise((resolve) => {
    const piece = boardPieces[fromRow][fromCol];
    if (!piece) {
      resolve();
      return;
    }

    const capturedPiece = boardPieces[toRow][toCol];

    if (capturedPiece) {
      capturePiece(capturedPiece);
      boardPieces[toRow][toCol] = null;
    }

    const lado = 5.0;
    const targetX = toCol * lado - 15;
    const startPos = { x: piece.position.x, z: piece.position.z };
    const targetZCorrected = toRow * lado - 20;

    new TWEEN.Tween(startPos)
      .to({ x: targetX, z: targetZCorrected }, 2000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onStart(() => {
        piece.position.y += 0.5;
      })
      .onUpdate((coords) => {
        piece.position.x = coords.x;
        piece.position.z = coords.z;

        const body = piece.userData.physicsBody;
        const ms = body.getMotionState();
        if (ms) {
          body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
          body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
          const newTrans = new Ammo.btTransform();
          newTrans.setIdentity();
          newTrans.setOrigin(
            new Ammo.btVector3(coords.x, piece.position.y, coords.z)
          );
          const rot = piece.quaternion;
          newTrans.setRotation(
            new Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w)
          );
          body.setWorldTransform(newTrans);
          ms.setWorldTransform(newTrans);
          body.activate();
        }
      })
      .onComplete(() => {
        boardPieces[toRow][toCol] = piece;
        boardPieces[fromRow][fromCol] = null;
        resolve();
      })
      .start();
  });
}

function resetTablero() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardPieces[row][col];
      if (piece) {
        capturePiece(piece);
        boardPieces[row][col] = null;
      }
    }
  }
  createChessPieces();
}

function borrarTablero() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardPieces[row][col];
      if (piece) {
        capturePiece(piece);
        boardPieces[row][col] = null;
      }
    }
  }
}

function initInput() {
  window.addEventListener("pointerdown", function (event) {
    if (debugSettings.dispararbola) {
      mouseCoords.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouseCoords, camera);

      const ballMass = 35;
      const ballRadius = 0.4;
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(ballRadius, 14, 10),
        ballMaterial
      );
      ball.castShadow = true;
      ball.receiveShadow = true;

      ball.userData.type = "ball";
      const ballShape = new Ammo.btSphereShape(ballRadius);
      ballShape.setMargin(margin);
      pos.copy(raycaster.ray.direction);
      pos.add(raycaster.ray.origin);
      quat.set(0, 0, 0, 1);
      const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

      pos.copy(raycaster.ray.direction);
      pos.multiplyScalar(24);
      ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
    }
  });
}

function limpiarBolas() {
  for (let i = rigidBodies.length - 1; i >= 0; i--) {
    const object = rigidBodies[i];
    if (object.userData.type === "ball") {
      if (object.userData.physicsBody) {
        physicsWorld.removeRigidBody(object.userData.physicsBody);
      }
      scene.remove(object);
      rigidBodies.splice(i, 1);
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  TWEEN.update();
  renderer.render(scene, camera);
}

function updatePhysics(deltaTime) {
  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = rigidBodies.length - 1; i >= 0; i--) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();

    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();

      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      objThree.userData.collided = false;

      if (objThree.userData.isPiece) {
        const upVector = new THREE.Vector3(0, 1, 0);
        upVector.applyQuaternion(objThree.quaternion);

        if (upVector.y < 0.05 || objThree.position.y < -2) {
          capturePiece(objThree);
        }
      }
    }
  }
}
