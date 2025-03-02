// 场景相关变量
let scene, camera, renderer;
let leftArm, rightArm;
let playerCollider;
let buildingTexture;
let selectedSkin = 'default';

// 游戏状态变量
let gameStarted = false;
let score = 0;
let frameCount = 0;
let moveSpeed;

// 跳跃相关变量
let jumpForce = 0;
let canJump = true;
let canDoubleJump = true;
let isFirstJump = false;

// 游戏对象数组
let grounds = [];
let obstacles = [];
let coins = [];

// 位置追踪变量
let lastGroundZ = 0;
let lastObstacleZ = -30;
let lastCoinZ = -15;
let lastBuildingZ = -50;

// 计数器
let coinCount = 0;
let armSwingAngle = 0;

// 共享几何体和材质
let coinGeometry, coinMaterial;
let obstacleGeometry, obstacleMaterial;

// 游戏常量
const gravity = 0.006;
const jumpPower = 0.5;
const doubleJumpForce = 0.45;
const minJumpHeight = 2;
const maxJumpHeight = 8;

// 速度相关常量
const initialMoveSpeed = 0.08;
const maxSpeed = 0.2;
const speedIncrease = 0.00001;

// 地面生成参数
const groundDepth = 30;
const visibleGrounds = 3;

// 障碍物生成参数
const obstacleSpacing = 30;
const maxObstacles = 6;
const visibilityDistance = 50;
const cleanupDistance = 10;

// 金币相关常量
const coinSpacing = 10;
const maxCoins = 10;

// 碰撞检测相关常量
const PLAYER_WIDTH = 0.4;
const PLAYER_HEIGHT = 1.2;
const PLAYER_DEPTH = 0.4;
const COLLISION_OFFSET_Y = 1.2;

// 手臂动画相关常量
const armSwingSpeed = 0.12;
const armSwingRange = 0.15;
const armHeight = -0.2;

// 添加背景相关变量
let skybox;
const buildingTextures = [];
const buildingCount = 30; // 增加建筑数量
const buildingSpacing = 20; // 减小建筑间距
const minBuildingDistance = 15; // 与跑道的最小距离

// 添加跳跃缓冲
let jumpBuffer = 0;
const jumpBufferTime = 7; // 增加跳跃缓冲时间

// 在文件开头添加屏幕固定相关变量
let isFullscreen = false;

// 添加障碍物相关变量
const obstacleTypes = {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    WALL: 'wall',
    GAP: 'gap'
};

// 添加商城相关变量
let currentSkin = 'default'; // 当前使用的皮肤

const shopItems = {
    skins: {
        default: {
            name: '默认皮肤',
            price: 0,
            color: 0xffccaa,
            owned: true
        },
        red: {
            name: '红色皮肤',
            price: 100,
            color: 0xff4444,
            owned: false
        },
        gold: {
            name: '金色皮肤',
            price: 200,
            color: 0xffdd44,
            owned: false,
            metalness: 0.7,
            roughness: 0.3
        },
        rainbow: {
            name: '彩虹皮肤',
            price: 500,
            color: 0xffffff,
            owned: false,
            emissive: 0x888888,
            emissiveIntensity: 0.5
        }
    }
};

// 添加开始界面样式
const startScreenStyle = document.createElement('style');
startScreenStyle.textContent = `
    #startScreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 2000;
    }
    
    #startScreen h1 {
        font-size: 48px;
        margin-bottom: 30px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        animation: titleFloat 2s ease-in-out infinite;
    }
    
    @keyframes titleFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    #startScreen .button {
        padding: 15px 40px;
        font-size: 24px;
        background: rgba(255,255,255,0.2);
        border: 2px solid white;
        border-radius: 30px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 10px 0;
    }
    
    #startScreen .button:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.05);
    }
    
    #instructions {
        margin-top: 30px;
        text-align: center;
        font-size: 18px;
        max-width: 600px;
        padding: 20px;
        background: rgba(0,0,0,0.2);
        border-radius: 15px;
    }
    
    #instructions h2 {
        margin-bottom: 15px;
        font-size: 24px;
    }
    
    .key {
        display: inline-block;
        padding: 5px 10px;
        background: rgba(255,255,255,0.2);
        border-radius: 5px;
        margin: 0 5px;
    }
`;
document.head.appendChild(startScreenStyle);

// 添加性能优化变量
let lastFrameTime = 0;
const targetFrameRate = 60;
const frameInterval = 1000 / targetFrameRate;

// 修改移动相关变量
let moveLeft = false;
let moveRight = false;
let sideSpeed = 0.05; // 降低左右移动速度

// 引入后期处理相关依赖
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

function init() {
    try {
        // 创建场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // 添加天空蓝背景色
        
        // 创建相机
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, 0);
        
        // 创建渲染器
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            precision: "highp"
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        document.body.appendChild(renderer.domElement);
        
        // 创建后期处理合成器
        const composer = new EffectComposer(renderer);
        
        // 添加渲染通道
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // 添加泛光效果
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // 强度
            0.4, // 半径
            0.85 // 阈值
        );
        composer.addPass(bloomPass);
        
        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);
        
        // 创建初始地面
        createGround(0);
        
        // 创建天空盒
        createSkybox();
        
        // 创建UI
        createStartScreen();
        
        // 添加事件监听器
        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('pointerlockchange', onPointerLockChange);
        
        // 防止空格键滚动页面
        window.addEventListener('keydown', function(e) {
            if(e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        // 开始渲染循环
        animate(0);
        
        console.log('初始化成功');
        return true;
    } catch (error) {
        console.error('初始化失败:', error);
        return false;
    }
}

// 添加窗口调整函数
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 添加指针锁定变更函数
function onPointerLockChange() {
    if (document.pointerLockElement === document.body) {
        console.log('指针已锁定');
    } else {
        console.log('指针已解锁');
    }
}

// 启动游戏
window.onload = function() {
    init();
};

function createObstacles() {
    try {
        // 创建不同类型的障碍物
        for (let i = 0; i < 20; i++) { // 增加初始障碍物数量
            createRandomObstacle();
        }
    } catch (error) {
        console.error('创建障碍物失败:', error);
    }
}

function createRandomObstacle() {
    const type = getRandomObstacleType();
    const xOffset = Math.random() * 3 - 1.5;
    
    let obstacle;
    switch(type) {
        case obstacleTypes.SMALL:
            obstacle = createSmallObstacle(xOffset);
            break;
        case obstacleTypes.MEDIUM:
            obstacle = createMediumObstacle(xOffset);
            break;
        case obstacleTypes.LARGE:
            obstacle = createLargeObstacle(xOffset);
            break;
        case obstacleTypes.WALL:
            obstacle = createWallObstacle();
            break;
        case obstacleTypes.GAP:
            obstacle = createGap();
            break;
    }
    
    // 增加障碍物间距，减少随机变化
    lastObstacleZ -= (obstacleSpacing + Math.random() * 2);
}

function getRandomObstacleType() {
    const rand = Math.random();
    if (rand < 0.35) return obstacleTypes.SMALL;      // 35%
    if (rand < 0.60) return obstacleTypes.MEDIUM;     // 25%
    if (rand < 0.80) return obstacleTypes.LARGE;      // 20%
    if (rand < 0.90) return obstacleTypes.WALL;       // 10%
    return obstacleTypes.GAP;                         // 10%
}

function createSmallObstacle(xOffset) {
    const geometry = new THREE.BoxGeometry(0.8, 1, 0.6); // 进一步减小体积
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xff4444,
        roughness: 0.7,
        metalness: 0.3
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(xOffset, 0.5, lastObstacleZ); // 进一步降低高度
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createMediumObstacle(xOffset) {
    const geometry = new THREE.BoxGeometry(1.2, 1.4, 0.8); // 进一步减小体积
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x44ff44,
        roughness: 0.7,
        metalness: 0.3
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(xOffset, 0.7, lastObstacleZ); // 进一步降低高度
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createLargeObstacle(xOffset) {
    const geometry = new THREE.BoxGeometry(1.6, 1.8, 1); // 进一步减小体积
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x4444ff,
        roughness: 0.7,
        metalness: 0.3
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(xOffset, 0.9, lastObstacleZ); // 进一步降低高度
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createWallObstacle() {
    const holePosition = Math.random() * 4 - 2; // 随机洞的位置
    const wallWidth = 7; // 进一步减小墙宽
    const wallHeight = 2.5; // 进一步减小墙高
    const holeWidth = 3.5; // 进一步增加洞宽
    
    // 创建左边墙
    const leftGeometry = new THREE.BoxGeometry(
        (wallWidth + holePosition) / 2,
        wallHeight,
        0.8 // 进一步减小厚度
    );
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const leftWall = new THREE.Mesh(leftGeometry, material);
    leftWall.position.set(-wallWidth/4 + holePosition/2, wallHeight/2, lastObstacleZ);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    obstacles.push(leftWall);
    
    // 创建右边墙
    const rightGeometry = new THREE.BoxGeometry(
        (wallWidth - holePosition) / 2,
        wallHeight,
        0.8 // 进一步减小厚度
    );
    const rightWall = new THREE.Mesh(rightGeometry, material);
    rightWall.position.set(wallWidth/4 + holePosition/2, wallHeight/2, lastObstacleZ);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    obstacles.push(rightWall);
}

function createGap() {
    const gapWidth = 2.5; // 进一步减小间隙宽度
    const groundDepth = 1.5; // 进一步减小地面深度
    
    // 创建左边地面
    const leftGeometry = new THREE.BoxGeometry(3.5, 0.5, groundDepth);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });
    const leftGround = new THREE.Mesh(leftGeometry, material);
    leftGround.position.set(-3, -0.25, lastObstacleZ);
    scene.add(leftGround);
    obstacles.push(leftGround);
    
    // 创建右边地面
    const rightGround = new THREE.Mesh(leftGeometry, material);
    rightGround.position.set(3, -0.25, lastObstacleZ);
    scene.add(rightGround);
    obstacles.push(rightGround);
}

// 添加键盘按下事件处理
function onKeyDown(event) {
    if (!gameStarted) return;
    
    switch(event.code) {
        case 'Space':
        case 'ArrowUp':
            // 第一段跳
            if (canJump && camera.position.y <= minJumpHeight + 0.1) {
                jumpForce = jumpPower;
                canJump = false;
                isFirstJump = true;
                canDoubleJump = true;
                console.log('First jump'); // 调试日志
            }
            // 二段跳
            else if (isFirstJump && canDoubleJump) {
                jumpForce = doubleJumpForce;
                canDoubleJump = false;
                console.log('Double jump'); // 调试日志
            }
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true;
            break;
        case 'b':
        case 'B':
            toggleShop();
            break;
    }
}

// 添加键盘抬起事件处理
function onKeyUp(event) {
    switch(event.code) {
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false;
            break;
    }
}

function updatePlayerCollider() {
    // 更新碰撞体积位置跟随相机
    playerCollider.position.copy(camera.position);
    playerCollider.position.y -= 0.5; // 调整碰撞体积位置
}

function checkCollision() {
    const playerBox = new THREE.Box3().setFromObject(playerCollider);
    
    for (let obstacle of obstacles) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
            return true;
        }
    }
    return false;
}

function createInfiniteGround() {
    const segments = 5;
    const segmentLength = 200;
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.7,
        metalness: 0.2,
        envMapIntensity: 0.5
    });
    
    for (let i = 0; i < segments; i++) {
        const groundGeometry = new THREE.BoxGeometry(10, 0.5, segmentLength);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = -0.25;
        ground.position.z = -i * segmentLength;
        ground.receiveShadow = true;
        scene.add(ground);
    }
}

function createArms() {
    try {
        // 创建手臂几何体
        const armGeometry = new THREE.BoxGeometry(0.15, 0.45, 0.15); // 更粗更长的手臂
        const armMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffccaa,  // 肤色
            shininess: 20,
            specular: 0x111111
        });
        
        // 创建左手臂
        leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.45, armHeight, -0.3); // 更靠前和外侧
        leftArm.rotation.x = 0.8; // 更大的前倾角度
        leftArm.rotation.z = -0.2; // 更大的外倾角度
        leftArm.rotation.y = 0.1; // 稍微向内转
        leftArm.geometry.translate(0, -0.2, 0);
        camera.add(leftArm);
        
        // 创建右手臂
        rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.45, armHeight, -0.3);
        rightArm.rotation.x = 0.8;
        rightArm.rotation.z = 0.2;
        rightArm.rotation.y = -0.1;
        rightArm.geometry.translate(0, -0.2, 0);
        camera.add(rightArm);

        // 调整相机视野
        camera.fov = 85; // 增加视野范围
        camera.updateProjectionMatrix();

        console.log('手臂创建成功');
    } catch (error) {
        console.error('创建手臂失败:', error);
    }
}

function updateArms() {
    if (!leftArm || !rightArm) return;
    
    const baseRotationX = 0.2;
    const swingAmount = 0.3;
    
    // 在跳跃时增加手臂动作
    if (jumpForce > 0) {
        const jumpEffect = Math.min(jumpForce * 0.5, 0.4);
        leftArm.rotation.x = baseRotationX - jumpEffect;
        rightArm.rotation.x = baseRotationX - jumpEffect;
    } else {
        // 正常走路时的手臂摆动
        const swingAngle = Math.sin(Date.now() * 0.01) * swingAmount;
        leftArm.rotation.x = baseRotationX + swingAngle;
        rightArm.rotation.x = baseRotationX - swingAngle;
    }
}

function updateGround() {
    const cameraZ = camera.position.z;
    
    // 移除远处的地面
    for (let i = grounds.length - 1; i >= 0; i--) {
        if (grounds[i].position.z > cameraZ + groundDepth) {
            scene.remove(grounds[i]);
            grounds.splice(i, 1);
        }
    }
    
    // 生成新的地面
    while (lastGroundZ > cameraZ - (groundDepth * visibleGrounds)) {
        createGround(lastGroundZ);
        lastGroundZ -= groundDepth;
    }
}

function createGround(zPosition) {
    const geometry = new THREE.BoxGeometry(10, 0.5, groundDepth);
    const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.position.set(0, -0.25, zPosition - groundDepth/2);
    ground.receiveShadow = true;
    scene.add(ground);
    grounds.push(ground);
}

function createCoin(xOffset, zPos) {
    // 使用共享几何体和材质
    if (!coinGeometry) {
        coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8); // 减少多边形数量
    }
    if (!coinMaterial) {
        coinMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            metalness: 0.7,
            roughness: 0.3,
        });
    }
    
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(xOffset, 1.5, zPos);
    coin.castShadow = true;
    
    scene.add(coin);
    coins.push(coin);
    
    coin.userData.rotationSpeed = 0.02;
}

function createCoins() {
    try {
        // 创建金币材质
        coinMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0xFFD700,
            emissiveIntensity: 0.2
        });
        
        // 初始生成一批金币
        for (let i = 0; i < 10; i++) {
            createCoin(Math.random() * 4 - 2, lastCoinZ);
            lastCoinZ -= (coinSpacing + Math.random() * 3);
        }
        console.log('金币创建成功');
    } catch (error) {
        console.error('创建金币失败:', error);
        coins = []; // 如果创建失败，清空金币数组
    }
}

function updateCoins() {
    if (frameCount % 2 !== 0) return; // 降低更新频率
    
    const cameraZ = camera.position.z;
    
    // 移除远处的金币
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (coin.position.z > cameraZ + cleanupDistance) {
            scene.remove(coin);
            coins.splice(i, 1);
        } else {
            coin.rotation.y += coin.userData.rotationSpeed;
        }
    }
    
    // 生成新的金币
    while (lastCoinZ > cameraZ - visibilityDistance && coins.length < maxCoins) {
        const xOffset = Math.random() * 3 - 1.5;
        createCoin(xOffset, lastCoinZ);
        lastCoinZ -= (coinSpacing + Math.random() * 2);
    }
}

// 金币收集检测
function checkCoinCollection() {
    const playerPos = camera.position.clone();
    playerPos.y -= 0.5;
    
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        const distance = playerPos.distanceTo(coin.position);
        
        if (distance < 1) {
            collectCoin(coin);
            coins.splice(i, 1);
        }
    }
}

// 收集金币函数
function collectCoin(coin) {
    scene.remove(coin);
    coinCount += 10;
    
    // 更新UI显示
    updateCoinDisplay();
    
    // 播放收集音效（可选）
    // playCoinSound();
}

// 更新金币显示
function updateCoinDisplay() {
    const coinDisplay = document.getElementById('coinDisplay');
    if (coinDisplay) {
        coinDisplay.textContent = `金币: ${coinCount}`;
    }
    
    const shopCoins = document.getElementById('shopCoins');
    if (shopCoins) {
        shopCoins.textContent = `金币: ${coinCount}`;
    }
}

// 重置金币函数
function resetCoins() {
    // 清除现有金币
    coins.forEach(coin => scene.remove(coin));
    coins = [];
    coinCount = 0;
    lastCoinZ = -15;
    
    // 初始生成金币
    for (let i = 0; i < 10; i++) {
        const xOffset = Math.random() * 4 - 2;
        createCoin(xOffset, lastCoinZ);
        lastCoinZ -= (coinSpacing + Math.random() * 3);
    }
    
    // 更新显示
    updateCoinDisplay();
}

// 修改resetGame函数
function resetGame() {
    // 清除现有的游戏元素
    grounds.forEach(ground => scene.remove(ground));
    obstacles.forEach(obstacle => scene.remove(obstacle));
    coins.forEach(coin => scene.remove(coin));
    
    // 重置数组和位置
    grounds = [];
    obstacles = [];
    coins = [];
    lastGroundZ = 0;
    lastObstacleZ = -30;
    lastCoinZ = -15;
    
    // 创建初始游戏元素
    for (let i = 0; i < visibleGrounds; i++) {
        createGround(lastGroundZ);
        lastGroundZ -= groundDepth;
    }
    
    for (let i = 0; i < 8; i++) {
        createRandomObstacle();
    }
    
    for (let i = 0; i < 10; i++) {
        const xOffset = Math.random() * 4 - 2;
        createCoin(xOffset, lastCoinZ);
        lastCoinZ -= (coinSpacing + Math.random() * 3);
    }
    
    // 创建天空盒
    createSkybox();
}

function updateObstacles() {
    const cameraZ = camera.position.z;
    
    // 优化清理逻辑
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (obstacle.position.z > cameraZ + cleanupDistance) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
        }
    }
    
    // 控制生成频率
    while (lastObstacleZ > cameraZ - visibilityDistance && obstacles.length < maxObstacles) {
        createRandomObstacle();
    }
}

// 优化碰撞检测函数
function checkCollisions() {
    if (!gameStarted) return;
    
    const playerPos = camera.position.clone();
    playerPos.y -= COLLISION_OFFSET_Y; // 调整碰撞检测点的高度
    
    // 只检测附近的障碍物
    for (const obstacle of obstacles) {
        // 只检测在玩家前后2个单位内的障碍物
        const zDistance = Math.abs(obstacle.position.z - playerPos.z);
        if (zDistance < 2) {
            // 快速距离检查
            const xDistance = Math.abs(obstacle.position.x - playerPos.x);
            if (xDistance < 2) { // 只有在x方向足够近时才进行详细碰撞检测
                if (checkCollisionWithObstacle(playerPos, obstacle)) {
                    gameOver();
                    return;
                }
            }
        }
    }
}

// 改进碰撞检测算法
function checkCollisionWithObstacle(playerPos, obstacle) {
    // 创建玩家碰撞箱
    const playerBox = new THREE.Box3();
    playerBox.min.set(
        playerPos.x - PLAYER_WIDTH/2,
        playerPos.y - PLAYER_HEIGHT/2,
        playerPos.z - PLAYER_DEPTH/2
    );
    playerBox.max.set(
        playerPos.x + PLAYER_WIDTH/2,
        playerPos.y + PLAYER_HEIGHT/2,
        playerPos.z + PLAYER_DEPTH/2
    );

    // 获取障碍物的包围盒
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    
    // 添加一些容差
    obstacleBox.min.x += 0.1;
    obstacleBox.min.z += 0.1;
    obstacleBox.max.x -= 0.1;
    obstacleBox.max.z -= 0.1;

    // 检查是否相交
    return playerBox.intersectsBox(obstacleBox);
}

// 添加可视化碰撞箱的函数（调试用）
function visualizeCollisionBox(playerPos) {
    // 移除旧的碰撞箱
    const oldBox = scene.getObjectByName('collisionBox');
    if (oldBox) scene.remove(oldBox);

    // 创建新的碰撞箱
    const geometry = new THREE.BoxGeometry(
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        PLAYER_DEPTH
    );
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const box = new THREE.Mesh(geometry, material);
    box.position.copy(playerPos);
    box.name = 'collisionBox';
    scene.add(box);
}

// 创建天空盒
function createSkybox() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg', 
        function(texture) {
            const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
            rt.fromEquirectangularTexture(renderer, texture);
            scene.background = rt.texture;
        },
        undefined,
        function(err) {
            console.error('天空盒加载失败，使用纯色背景');
            scene.background = new THREE.Color(0x87ceeb);
        }
    );
}

// 创建城市背景
function createCityBackground() {
    // 创建更多样的建筑物几何体
    const buildingGeometries = [
        new THREE.BoxGeometry(8, 35, 8),
        new THREE.BoxGeometry(6, 25, 6),
        new THREE.BoxGeometry(10, 45, 10),
        new THREE.BoxGeometry(7, 30, 7),
        // 添加更复杂的建筑形状
        createComplexBuilding(12, 50, 12),
        createComplexBuilding(9, 40, 9)
    ];

    const buildingMaterials = [
        new THREE.MeshStandardMaterial({ 
            map: buildingTexture,
            color: 0xe0e0e0,
            roughness: 0.3,
            metalness: 0.2,
            bumpMap: buildingTexture,
            bumpScale: 0.05,
            envMapIntensity: 1.5
        }),
        new THREE.MeshStandardMaterial({ 
            map: buildingTexture,
            color: 0xd0d0d0,
            roughness: 0.4,
            metalness: 0.3,
            bumpMap: buildingTexture,
            bumpScale: 0.04,
            envMapIntensity: 1.2
        }),
        new THREE.MeshStandardMaterial({ 
            map: buildingTexture,
            color: 0xc0c0c0,
            roughness: 0.5,
            metalness: 0.4,
            bumpMap: buildingTexture,
            bumpScale: 0.03,
            envMapIntensity: 1
        })
    ];

    // 在两侧生成建筑
    for (let i = 0; i < buildingCount; i++) {
        createBuilding(buildingGeometries, buildingMaterials);
    }
}

function createBuilding(geometries, materials) {
    try {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = materials[Math.floor(Math.random() * materials.length)];
        
        // 如果是Group类型的几何体，需要特殊处理
        let building;
        if (geometry instanceof THREE.Group) {
            building = geometry.clone();
            building.children.forEach(child => {
                child.material = material;
            });
        } else {
            building = new THREE.Mesh(geometry, material);
        }
        
        // 调整贴图重复次数
        if (material.map) {
            material.map.repeat.set(
                (geometry.parameters ? geometry.parameters.width : 1) * 0.5,
                (geometry.parameters ? geometry.parameters.height : 1) * 0.5
            );
        }
        
        // 设置建筑位置
        const side = Math.random() > 0.5 ? 1 : -1;
        const distanceFromCenter = minBuildingDistance + Math.random() * 30;
        
        building.position.x = side * distanceFromCenter;
        building.position.z = lastBuildingZ - (buildingSpacing + Math.random() * 10);
        building.position.y = geometry.parameters ? geometry.parameters.height / 2 : 20;
        
        building.rotation.y = Math.atan2(-building.position.x, -building.position.z);
        
        building.castShadow = true;
        building.receiveShadow = true;
        
        lastBuildingZ = building.position.z;
        buildingTextures.push(building);
        scene.add(building);
        
        // 添加窗户和细节
        if (!(geometry instanceof THREE.Group)) {
            addWindowsToBuilding(building);
        }
        
        return building;
    } catch (error) {
        console.error('创建建筑失败:', error);
        return null;
    }
}

// 创建复杂建筑几何体
function createComplexBuilding(width, height, depth) {
    const geometry = new THREE.Group();
    
    // 主体
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const main = new THREE.Mesh(mainGeometry);
    
    // 顶部结构
    const topWidth = width * 0.7;
    const topHeight = height * 0.15;
    const topGeometry = new THREE.BoxGeometry(topWidth, topHeight, depth * 0.7);
    const top = new THREE.Mesh(topGeometry);
    top.position.y = height / 2 + topHeight / 2;
    
    // 天线或装饰物
    const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, height * 0.1, 8);
    const antenna = new THREE.Mesh(antennaGeometry);
    antenna.position.y = height / 2 + topHeight + height * 0.05;
    
    geometry.add(main);
    geometry.add(top);
    geometry.add(antenna);
    
    return geometry;
}

// 修改窗户创建函数
function addWindowsToBuilding(building) {
    const floors = Math.floor(building.geometry.parameters.height / 3);
    const sidesCount = 4; // 四个面都添加窗户
    
    for (let side = 0; side < sidesCount; side++) {
        addWindowsToSide(building, side, floors);
    }
    
    // 添加屋顶装饰
    addRoofDetails(building);
}

function addWindowsToSide(building, side, floors) {
    const windowTypes = [
        {
            geometry: new THREE.BoxGeometry(0.6, 1.2, 0.1),
            probability: 0.7,
            columns: 3
        },
        {
            geometry: new THREE.BoxGeometry(1.2, 1.8, 0.1),
            probability: 0.3,
            columns: 2
        }
    ];
    
    const windowMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
    });

    const windowType = windowTypes[Math.floor(Math.random() * windowTypes.length)];
    
    for (let floor = 0; floor < floors; floor++) {
        for (let col = 0; col < windowType.columns; col++) {
            if (Math.random() < windowType.probability) {
                const window = createWindowWithFrame(windowType.geometry, windowMaterial);
                
                // 根据side确定窗户位置和旋转
                positionWindowOnSide(window, building, side, floor, col, windowType);
                
                building.add(window);
            }
        }
    }
}

function createWindowWithFrame(windowGeometry, windowMaterial) {
    const windowGroup = new THREE.Group();
    
    // 窗户玻璃
    const glass = new THREE.Mesh(windowGeometry, windowMaterial);
    
    // 窗框
    const frameGeometry = new THREE.BoxGeometry(
        windowGeometry.parameters.width + 0.1,
        windowGeometry.parameters.height + 0.1,
        0.15
    );
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = -0.02;
    
    // 窗台
    const sillGeometry = new THREE.BoxGeometry(
        windowGeometry.parameters.width + 0.2,
        0.1,
        0.2
    );
    const sill = new THREE.Mesh(sillGeometry, frameMaterial);
    sill.position.y = -windowGeometry.parameters.height/2 - 0.05;
    sill.position.z = 0.05;
    
    windowGroup.add(frame);
    windowGroup.add(glass);
    windowGroup.add(sill);
    
    return windowGroup;
}

function positionWindowOnSide(window, building, side, floor, col, windowType) {
    const width = building.geometry.parameters.width;
    const height = building.geometry.parameters.height;
    const depth = building.geometry.parameters.depth;
    
    const spacing = width / (windowType.columns + 1);
    const yPos = floor * 3 - height/2 + 1.5;
    const xPos = (col - (windowType.columns-1)/2) * spacing;
    
    window.position.y = yPos;
    
    switch(side) {
        case 0: // 前面
            window.position.x = xPos;
            window.position.z = depth/2 + 0.1;
            break;
        case 1: // 右面
            window.position.x = width/2 + 0.1;
            window.position.z = -xPos;
            window.rotation.y = Math.PI/2;
            break;
        case 2: // 后面
            window.position.x = -xPos;
            window.position.z = -depth/2 - 0.1;
            window.rotation.y = Math.PI;
            break;
        case 3: // 左面
            window.position.x = -width/2 - 0.1;
            window.position.z = xPos;
            window.rotation.y = -Math.PI/2;
            break;
    }
}

function addRoofDetails(building) {
    try {
        if (!building.geometry || !building.geometry.parameters) return;
        
        const width = building.geometry.parameters.width;
        const height = building.geometry.parameters.height;
        
        // 添加屋顶围栏
        const railing = createRailing(width, height);
        building.add(railing);
        
        // 添加空调外机或其他设备
        const equipment = createRoofEquipment(width, height);
        equipment.position.y = height/2;
        building.add(equipment);
    } catch (error) {
        console.error('添加屋顶细节失败:', error);
    }
}

function createRailing(width, height) {
    const railing = new THREE.Group();
    const railMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.7,
        metalness: 0.3
    });
    
    // 创建围栏
    const postGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const railGeometry = new THREE.BoxGeometry(width, 0.1, 0.1);
    
    for (let i = 0; i <= width; i += width/4) {
        const post = new THREE.Mesh(postGeometry, railMaterial);
        post.position.set(i - width/2, height/2 + 0.5, width/2);
        railing.add(post);
        
        const post2 = post.clone();
        post2.position.z = -width/2;
        railing.add(post2);
    }
    
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.y = height/2 + 1;
    rail.position.z = width/2;
    railing.add(rail);
    
    const rail2 = rail.clone();
    rail2.position.z = -width/2;
    railing.add(rail2);
    
    return railing;
}

function createRoofEquipment(width, height) {
    try {
        const equipment = new THREE.Group();
        const equipmentMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.6,
            metalness: 0.4
        });
        
        // 添加空调外机
        const acUnit = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 0.8),
            equipmentMaterial
        );
        acUnit.position.set(-width/4, 0.5, 0);
        equipment.add(acUnit);
        
        // 添加通风管道
        const vent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
            equipmentMaterial
        );
        vent.position.set(width/4, 1, 0);
        equipment.add(vent);
        
        return equipment;
    } catch (error) {
        console.error('创建屋顶设备失败:', error);
        return new THREE.Group(); // 返回空组
    }
}

// 在 update 函数中添加背景更新
function updateBackground() {
    const cameraZ = camera.position.z;
    
    // 移除远处的建筑物
    for (let i = buildingTextures.length - 1; i >= 0; i--) {
        const building = buildingTextures[i];
        if (building.position.z > cameraZ + 150) {
            scene.remove(building);
            buildingTextures.splice(i, 1);
        }
    }
    
    // 生成新的建筑物
    while (lastBuildingZ > cameraZ - 300) {
        createBuilding(
            [
                new THREE.BoxGeometry(8, 30, 8),
                new THREE.BoxGeometry(6, 20, 6),
                new THREE.BoxGeometry(10, 40, 10),
                new THREE.BoxGeometry(7, 25, 7)
            ],
            [
                new THREE.MeshStandardMaterial({ 
                    map: buildingTexture,
                    color: 0xcccccc,
                    roughness: 0.5,
                    metalness: 0.3,
                    bumpMap: buildingTexture,
                    bumpScale: 0.02,
                }),
                new THREE.MeshStandardMaterial({ 
                    map: buildingTexture,
                    color: 0xbbbbbb,
                    roughness: 0.5,
                    metalness: 0.3,
                    bumpMap: buildingTexture,
                    bumpScale: 0.02,
                }),
                new THREE.MeshStandardMaterial({ 
                    map: buildingTexture,
                    color: 0xaaaaaa,
                    roughness: 0.5,
                    metalness: 0.3,
                    bumpMap: buildingTexture,
                    bumpScale: 0.02,
                })
            ]
        );
    }
}

// 修改update函数，添加移动逻辑
function update() {
    // 更新分数
    score = Math.floor(-camera.position.z);
    
    // 更新速度
    const distanceMultiplier = Math.min(1, score / 2000);
    moveSpeed = initialMoveSpeed + (maxSpeed - initialMoveSpeed) * Math.pow(distanceMultiplier, 1.5);
    moveSpeed = Math.min(maxSpeed, moveSpeed);
    
    // 更新相机位置
    camera.position.z -= moveSpeed;
    
    // 处理左右移动（添加平滑效果）
    if (moveLeft) {
        camera.position.x = Math.max(camera.position.x - sideSpeed * (1 - Math.abs(camera.position.x) / 2), -2);
    }
    if (moveRight) {
        camera.position.x = Math.min(camera.position.x + sideSpeed * (1 - Math.abs(camera.position.x) / 2), 2);
    }
    
    // 降低更新频率
    if (frameCount % 2 === 0) {
        updateGround();
        updateObstacles();
        updateCoins();
        checkCollisions();
    }
    
    // 更新跳跃
    if (jumpForce !== 0 || camera.position.y > minJumpHeight) {
        // 应用跳跃力
        camera.position.y += jumpForce;
        // 应用重力（添加缓冲效果）
        if (jumpForce > 0) {
            jumpForce -= gravity * 0.8; // 上升时重力较小
        } else {
            jumpForce -= gravity * 1.2; // 下落时重力较大
        }
        
        // 处理落地
        if (camera.position.y < minJumpHeight) {
            camera.position.y = minJumpHeight;
            jumpForce = 0;
            canJump = true;
            isFirstJump = false;
            canDoubleJump = true;
        }
        
        // 限制最大高度（添加缓冲效果）
        if (camera.position.y > maxJumpHeight) {
            camera.position.y = maxJumpHeight;
            jumpForce = Math.min(0, jumpForce * 0.5); // 更平滑的高度限制
        }
    }
    
    frameCount = (frameCount + 1) % 1000000;
}

function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // 限制帧率
    const deltaTime = currentTime - lastFrameTime;
    if (deltaTime < frameInterval) return;
    
    lastFrameTime = currentTime - (deltaTime % frameInterval);
    
    // 始终渲染场景
    renderer.render(scene, camera);
    
    // 只在游戏开始后更新游戏逻辑
    if (gameStarted) {
        update();
    }
    
    // 使用composer而不是renderer
    composer.render();
}

function render() {
    renderer.render(scene, camera);
}

// 修改游戏启动逻辑
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始初始化游戏...');
    if (init()) {
        console.log('游戏初始化成功，开始动画循环');
        animate();
    } else {
        console.error('游戏初始化失败');
    }
});

// 窗口大小调整
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 添加全屏切换功能
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`全屏请求失败: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// 修改CSS样式
document.head.insertAdjacentHTML('beforeend', `
    <style>
        body {
            margin: 0;
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        canvas {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
        }
        #score {
            position: fixed;
            top: 10px;
            left: 10px;
            color: white;
            font-size: 20px;
            font-family: Arial;
            text-shadow: 2px 2px 2px rgba(0,0,0,0.5);
            z-index: 1000;
            pointer-events: none;
        }
    </style>
`);

// 修改商城UI样式和创建方式
function createShopUI() {
    // 添加样式到head
    const style = document.createElement('style');
    style.textContent = `
        #shop {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.85);
            padding: 30px;
            border-radius: 15px;
            color: white;
            display: none;
            z-index: 1000;
            min-width: 300px;
            font-family: Arial, sans-serif;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        #shop h2 {
            margin: 0 0 20px 0;
            text-align: center;
            color: #fff;
            font-size: 24px;
        }
        #shopCoins {
            background: rgba(255,215,0,0.2);
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
            margin-bottom: 20px;
        }
        .skin-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 15px;
            border: 1px solid #444;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
        }
        .shop-button {
            padding: 8px 15px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            background: #4CAF50;
            color: white;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .shop-button:hover {
            background: #45a049;
        }
        .shop-button:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }
        #closeShop {
            display: block;
            width: 100%;
            margin-top: 20px;
            padding: 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        #closeShop:hover {
            background: #da190b;
        }
        .coin-display {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            padding: 10px 20px;
            border-radius: 20px;
            color: #ffd700;
            font-size: 18px;
            font-weight: bold;
            z-index: 100;
        }
    `;
    document.head.appendChild(style);

    // 创建金币显示
    const coinDisplay = document.createElement('div');
    coinDisplay.className = 'coin-display';
    coinDisplay.id = 'coinDisplay';
    coinDisplay.textContent = `金币: ${coins}`;
    document.body.appendChild(coinDisplay);

    // 创建商城容器
    const shopContainer = document.createElement('div');
    shopContainer.id = 'shop';

    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '商城';
    shopContainer.appendChild(title);

    // 创建金币显示
    const shopCoins = document.createElement('div');
    shopCoins.id = 'shopCoins';
    shopCoins.textContent = `金币: ${coins}`;
    shopContainer.appendChild(shopCoins);

    // 创建皮肤列表
    const skinList = document.createElement('div');
    skinList.id = 'skinList';

    for (const [id, skin] of Object.entries(shopItems.skins)) {
        const skinItem = document.createElement('div');
        skinItem.className = 'skin-item';

        const skinInfo = document.createElement('div');
        skinInfo.textContent = skin.name;

        const button = document.createElement('button');
        button.className = 'shop-button';

        if (skin.owned) {
            if (currentSkin === id) {
                button.textContent = '使用中';
                button.disabled = true;
            } else {
                button.textContent = '使用';
                button.onclick = () => equipSkin(id);
            }
        } else {
            button.textContent = `购买 (${skin.price})`;
            button.onclick = () => purchaseSkin(id);
        }

        skinItem.appendChild(skinInfo);
        skinItem.appendChild(button);
        skinList.appendChild(skinItem);
    }

    shopContainer.appendChild(skinList);

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.id = 'closeShop';
    closeButton.textContent = '关闭';
    closeButton.onclick = toggleShop;
    shopContainer.appendChild(closeButton);

    document.body.appendChild(shopContainer);
}

function purchaseSkin(skinId) {
    const skin = shopItems.skins[skinId];
    if (coins >= skin.price && !skin.owned) {
        coins -= skin.price;
        skin.owned = true;
        updateShopUI();
        equipSkin(skinId);
    }
}

function equipSkin(skinId) {
    const skin = shopItems.skins[skinId];
    if (skin.owned) {
        currentSkin = skinId;
        updatePlayerAppearance();
        updateShopUI();
    }
}

function updatePlayerAppearance() {
    const skin = shopItems.skins[currentSkin];
    const material = new THREE.MeshPhongMaterial({
        color: skin.color,
        shininess: 30,
        metalness: skin.metalness || 0.3,
        roughness: skin.roughness || 0.7
    });
    
    if (skin.emissive) {
        material.emissive = new THREE.Color(skin.emissive);
        material.emissiveIntensity = skin.emissiveIntensity || 1;
    }

    // 更新手臂材质
    if (leftArm) leftArm.material = material;
    if (rightArm) rightArm.material = material;
}

function updateShopUI() {
    document.getElementById('shopCoins').textContent = `金币: ${coins}`;
    // 更新按钮状态
    // ... 更新商店UI的其他部分 ...
}

// 修改createStartScreen函数
function createStartScreen() {
    // 移除旧的开始界面（如果存在）
    const oldStartScreen = document.getElementById('startScreen');
    if (oldStartScreen) {
        oldStartScreen.remove();
    }

    const startScreen = document.createElement('div');
    startScreen.id = 'startScreen';
    startScreen.style.position = 'absolute';
    startScreen.style.top = '50%';
    startScreen.style.left = '50%';
    startScreen.style.transform = 'translate(-50%, -50%)';
    startScreen.style.textAlign = 'center';
    startScreen.style.color = 'white';
    startScreen.style.fontSize = '24px';
    startScreen.style.fontFamily = 'Arial, sans-serif';
    startScreen.style.zIndex = '1000';
    startScreen.style.userSelect = 'none'; // 防止文字被选中

    startScreen.innerHTML = `
        <h1 style="margin-bottom: 20px;">跑酷游戏</h1>
        <div id="startButton" style="
            padding: 15px 30px;
            font-size: 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
            display: inline-block;
            user-select: none;
        ">开始游戏</div>
        <div style="
            background-color: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 10px;
        ">
            <h2 style="margin-bottom: 10px;">操作说明</h2>
            <p style="line-height: 1.6;">
                <span style="background: #666; padding: 2px 8px; border-radius: 3px;">空格</span> 跳跃<br>
                <span style="background: #666; padding: 2px 8px; border-radius: 3px;">A/D</span> 或 
                <span style="background: #666; padding: 2px 8px; border-radius: 3px;">←/→</span> 左右移动<br>
                <span style="background: #666; padding: 2px 8px; border-radius: 3px;">B</span> 打开商店
            </p>
        </div>
    `;

    document.body.appendChild(startScreen);

    // 直接绑定点击事件
    const startButton = startScreen.querySelector('#startButton');
    startButton.onclick = function() {
        console.log('Start button clicked'); // 调试日志
        startGame();
    };

    // 添加鼠标悬停效果
    startButton.onmouseover = function() {
        this.style.backgroundColor = '#45a049';
    };
    startButton.onmouseout = function() {
        this.style.backgroundColor = '#4CAF50';
    };

    // 添加空格和回车键启动游戏
    document.onkeydown = function(event) {
        if (!gameStarted && (event.code === 'Space' || event.code === 'Enter')) {
            console.log('Start key pressed'); // 调试日志
            startGame();
        }
    };
}

// 修改startGame函数
function startGame() {
    console.log('Starting game...'); // 调试日志
    
    if (gameStarted) {
        console.log('Game already started'); // 调试日志
        return;
    }

    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    
    gameStarted = true;
    console.log('Game started flag set'); // 调试日志

    // 重置游戏状态
    score = 0;
    moveSpeed = initialMoveSpeed;
    camera.position.set(0, 2, 0);
    camera.rotation.set(0, 0, 0);
    
    // 重置玩家状态
    camera.position.y = minJumpHeight;
    jumpForce = 0;
    canJump = true;
    isFirstJump = false;
    canDoubleJump = true;
    
    // 创建初始游戏元素
    resetGame();
    
    try {
        document.body.requestPointerLock();
    } catch (error) {
        console.error('Pointer lock failed:', error);
    }

    console.log('Game initialization complete'); // 调试日志
}

// 修改游戏结束函数
function gameOver() {
    if (!gameStarted) return;
    
    gameStarted = false;
    document.exitPointerLock();
    
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        const finalScore = Math.floor(-camera.position.z);
        startScreen.querySelector('h1').textContent = `游戏结束\n距离: ${finalScore}米`;
        startScreen.style.display = 'flex';
    }
}

// 修改鼠标移动处理
function onMouseMove(event) {
    if (!gameStarted || !document.pointerLockElement) return;
    
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    camera.position.x = Math.max(-2, Math.min(2, camera.position.x + movementX * 0.005)); // 降低鼠标移动灵敏度
} 