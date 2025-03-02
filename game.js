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
            roughness: 0.3,
            metalness: 0.1,
            envMapIntensity: 0.8,
            transparent: true,
            opacity: 0.95,
            owned: true
        },
        red: {
            name: '红色皮肤',
            price: 100,
            color: 0xff4444,
            roughness: 0.2,
            metalness: 0.8,
            envMapIntensity: 1.2,
            emissive: 0x441111,
            emissiveIntensity: 0.2,
            owned: false
        },
        gold: {
            name: '金色皮肤',
            price: 200,
            color: 0xffdd44,
            roughness: 0.1,
            metalness: 0.9,
            envMapIntensity: 2.0,
            emissive: 0x442200,
            emissiveIntensity: 0.3,
            owned: false
        },
        rainbow: {
            name: '彩虹皮肤',
            price: 500,
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.8,
            envMapIntensity: 1.5,
            emissive: 0x888888,
            emissiveIntensity: 0.5,
            owned: false,
            onUpdate: function(material) {
                // 添加彩虹效果
                const hue = (Date.now() * 0.001) % 1;
                material.color.setHSL(hue, 0.8, 0.5);
                material.emissive.setHSL(hue, 0.8, 0.3);
            }
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

// 在全局作用域声明 composer
let composer;

// 添加性能监控和画质控制变量
let fpsArray = [];
let lastTime = 0;
let qualityLevel = 'high'; // 'low', 'medium', 'high'
let bloomPass;

// 修改画质等级定义
const QUALITY_LEVELS = {
    LOW: {
        pixelRatio: 1,
        shadowMapSize: 1024,
        bloomStrength: 0.5,
        bloomRadius: 0.2,
        shadowType: THREE.BasicShadowMap,
        particleCount: 100,
        maxLights: 2,
        antiAlias: false,
        envMapIntensity: 0.5
    },
    MEDIUM: {
        pixelRatio: 1.5,
        shadowMapSize: 2048,
        bloomStrength: 0.8,
        bloomRadius: 0.3,
        shadowType: THREE.PCFShadowMap,
        particleCount: 200,
        maxLights: 3,
        antiAlias: true,
        envMapIntensity: 1.0
    },
    HIGH: {
        pixelRatio: window.devicePixelRatio,
        shadowMapSize: 4096,
        bloomStrength: 1.2,
        bloomRadius: 0.4,
        shadowType: THREE.PCFSoftShadowMap,
        particleCount: 500,
        maxLights: 4,
        antiAlias: true,
        envMapIntensity: 1.5
    },
    ULTRA: {
        pixelRatio: window.devicePixelRatio,
        shadowMapSize: 8192,
        bloomStrength: 1.5,
        bloomRadius: 0.5,
        shadowType: THREE.VSMShadowMap,
        particleCount: 1000,
        maxLights: 6,
        antiAlias: true,
        envMapIntensity: 2.0
    }
};

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
            precision: "highp",
            physicallyCorrectLights: true,
            logarithmicDepthBuffer: true
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
        composer = new EffectComposer(renderer);
        
        // 添加渲染通道
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // 添加泛光效果
        bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,    // 强度降低
            0.3,    // 半径降低
            0.85    // 阈值
        );
        composer.addPass(bloomPass);
        
        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        
        // 添加第二个方向光源以改善阴影
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight2.position.set(-5, 3, -5);
        directionalLight2.castShadow = true;
        directionalLight2.shadow.mapSize.width = 1024;
        directionalLight2.shadow.mapSize.height = 1024;
        scene.add(directionalLight2);
        
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
        
        // 添加环境贴图
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        
        new THREE.TextureLoader().load(
            'https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg',
            function(texture) {
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                scene.environment = envMap;
                texture.dispose();
                pmremGenerator.dispose();
            }
        );
        
        // 初始化性能监控
        initPerformanceMonitoring();
        
        // 创建初始粒子系统
        createParticleSystem(QUALITY_LEVELS.HIGH.particleCount);
        
        console.log('初始化成功');
        return true;
    } catch (error) {
        console.error('初始化失败:', error);
        return false;
    }
}

// 修改 animate 函数
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // 计算FPS
    if (lastTime) {
        const fps = 1000 / (currentTime - lastTime);
        if (fps < 120) { // 过滤掉异常值
            fpsArray.push(fps);
            if (fpsArray.length > 60) fpsArray.shift(); // 保持最近60帧的记录
        }
    }
    lastTime = currentTime;
    
    // 限制帧率
    const deltaTime = currentTime - lastFrameTime;
    if (deltaTime < frameInterval) return;
    
    lastFrameTime = currentTime - (deltaTime % frameInterval);
    
    // 只在游戏开始后更新游戏逻辑
    if (gameStarted) {
        update();
    }
    
    // 使用 composer 进行渲染
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

// 修改窗口调整大小的处理函数
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 更新 composer 的大小
    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
    }
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
    const geometry = new THREE.BoxGeometry(0.8, 1, 0.6);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xff4444,
        roughness: 0.4,
        metalness: 0.6,
        envMapIntensity: 1.5
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(xOffset, 0.5, lastObstacleZ);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createMediumObstacle(xOffset) {
    const geometry = new THREE.BoxGeometry(1.2, 1.4, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x44ff44,
        roughness: 0.4,
        metalness: 0.6,
        envMapIntensity: 1.5,
        emissive: 0x004400,
        emissiveIntensity: 0.2
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(xOffset, 0.7, lastObstacleZ);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createLargeObstacle(xOffset) {
    const geometry = new THREE.BoxGeometry(1.6, 1.8, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x4444ff,
        roughness: 0.4,
        metalness: 0.7,
        envMapIntensity: 1.5,
        emissive: 0x000044,
        emissiveIntensity: 0.2
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(xOffset, 0.9, lastObstacleZ);
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
        const armGeometry = new THREE.BoxGeometry(0.15, 0.45, 0.15);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffccaa,  // 肤色
            roughness: 0.3,   // 降低粗糙度
            metalness: 0.1,   // 降低金属度
            envMapIntensity: 0.8, // 添加环境反射
            // 添加次表面散射效果模拟皮肤
            transparent: true,
            opacity: 0.95
        });
        
        // 创建左手臂
        leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.45, armHeight, -0.3);
        leftArm.rotation.x = 0.8;
        leftArm.rotation.z = -0.2;
        leftArm.rotation.y = 0.1;
        leftArm.geometry.translate(0, -0.2, 0);
        leftArm.castShadow = true; // 添加阴影
        camera.add(leftArm);
        
        // 创建右手臂
        rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.45, armHeight, -0.3);
        rightArm.rotation.x = 0.8;
        rightArm.rotation.z = 0.2;
        rightArm.rotation.y = -0.1;
        rightArm.geometry.translate(0, -0.2, 0);
        rightArm.castShadow = true; // 添加阴影
        camera.add(rightArm);

        // 调整相机视野
        camera.fov = 85;
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
    const material = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.3,
        metalness: 0.7,
        envMapIntensity: 1.2,
        // 添加法线贴图使地面看起来更有纹理
        normalScale: new THREE.Vector2(0.5, 0.5)
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.position.set(0, -0.25, zPosition - groundDepth/2);
    ground.receiveShadow = true;
    scene.add(ground);
    grounds.push(ground);
}

function createCoin(xOffset, zPos) {
    if (!coinGeometry) {
        coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32); // 增加分段数以使硬币更圆滑
    }
    if (!coinMaterial) {
        coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 2.0,
            emissive: 0xffa500,
            emissiveIntensity: 0.2
        });
    }
    
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(xOffset, 1.5, zPos);
    coin.castShadow = true;
    
    // 添加光晕效果
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32),
        glowMaterial
    );
    coin.add(glowMesh);
    
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
    
    // 更新手臂材质（如果有特殊效果）
    if (leftArm && leftArm.userData.updateMaterial) {
        leftArm.userData.updateMaterial();
    }
    if (rightArm && rightArm.userData.updateMaterial) {
        rightArm.userData.updateMaterial();
    }
    
    frameCount = (frameCount + 1) % 1000000;
    
    // 更新粒子系统
    if (particleSystem) {
        const settings = QUALITY_LEVELS[qualityLevel];
        updateParticleSystem(settings.particleCount);
    }
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
    const material = new THREE.MeshStandardMaterial({
        color: skin.color,
        roughness: skin.roughness || 0.3,
        metalness: skin.metalness || 0.1,
        envMapIntensity: skin.envMapIntensity || 1.0,
        transparent: skin.transparent || false,
        opacity: skin.opacity || 1.0
    });
    
    if (skin.emissive) {
        material.emissive = new THREE.Color(skin.emissive);
        material.emissiveIntensity = skin.emissiveIntensity || 1;
    }

    // 更新手臂材质
    if (leftArm) {
        leftArm.material = material;
        if (skin.onUpdate) {
            leftArm.userData.updateMaterial = () => skin.onUpdate(leftArm.material);
        } else {
            delete leftArm.userData.updateMaterial;
        }
    }
    if (rightArm) {
        rightArm.material = material;
        if (skin.onUpdate) {
            rightArm.userData.updateMaterial = () => skin.onUpdate(rightArm.material);
        } else {
            delete rightArm.userData.updateMaterial;
        }
    }
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

// 添加性能监控函数
function initPerformanceMonitoring() {
    // 创建性能监控器
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    
    // 定期检查性能并调整画质
    setInterval(() => {
        const averageFPS = fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length;
        adjustQuality(averageFPS);
        fpsArray = []; // 重置FPS数组
    }, 5000); // 每5秒检查一次
}

// 修改画质调整函数
function adjustQuality(fps) {
    console.log('Current FPS:', fps);
    if (fps < 30) {
        setQualityLevel('LOW');
    } else if (fps < 45) {
        setQualityLevel('MEDIUM');
    } else if (fps < 58) {
        setQualityLevel('HIGH');
    } else {
        setQualityLevel('ULTRA');
    }
}

// 修改画质设置函数
function setQualityLevel(level) {
    const settings = QUALITY_LEVELS[level];
    qualityLevel = level;
    
    // 更新渲染器设置
    renderer.setPixelRatio(settings.pixelRatio);
    renderer.shadowMap.type = settings.shadowType;
    renderer.antialias = settings.antiAlias;
    
    // 更新后期处理效果
    bloomPass.strength = settings.bloomStrength;
    bloomPass.radius = settings.bloomRadius;
    
    // 更新环境光照强度
    scene.traverse(object => {
        if (object.material) {
            if (object.material.envMapIntensity !== undefined) {
                object.material.envMapIntensity = settings.envMapIntensity;
                object.material.needsUpdate = true;
            }
        }
        if (object.isDirectionalLight) {
            object.shadow.mapSize.width = settings.shadowMapSize;
            object.shadow.mapSize.height = settings.shadowMapSize;
            object.shadow.map && object.shadow.map.dispose();
            object.shadow.camera.updateProjectionMatrix();
        }
    });
    
    // 更新粒子系统
    updateParticleSystem(settings.particleCount);
    
    console.log(`Quality set to ${level}`);
}

// 添加粒子系统
let particleSystem;
function createParticleSystem(count) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = Math.random() * 20 - 10;
        positions[i + 1] = Math.random() * 10;
        positions[i + 2] = Math.random() * 20 - 30;
        
        colors[i] = Math.random();
        colors[i + 1] = Math.random();
        colors[i + 2] = Math.random();
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    
    if (particleSystem) {
        scene.remove(particleSystem);
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
    }
    
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// 更新粒子系统
function updateParticleSystem(count) {
    if (!particleSystem) {
        createParticleSystem(count);
        return;
    }
    
    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;
    
    for (let i = 0; i < count * 3; i += 3) {
        positions[i] += Math.random() * 0.1 - 0.05;
        positions[i + 1] += Math.random() * 0.1 - 0.05;
        positions[i + 2] += Math.random() * 0.1 - 0.05;
        
        if (positions[i + 2] > camera.position.z + 10) {
            positions[i + 2] = camera.position.z - 30;
        }
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
} 