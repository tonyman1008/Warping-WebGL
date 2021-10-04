import * as THREE from 'three'
import ViewportController from "./base/ViewportController";
import ObjectManager from './base/ObjectManager';
import BlendingFragmentShader from "three/shader/Blending/BlendingFragmentShader";
import BasicFragmentShader from "three/shader/FragmentShader";
import VertexShader from "three/shader/VertexShader";
import * as dat from "dat.gui";
import testImgPath from 'assets/Image/car_1000x1000/0.png';
import testImgPath2 from 'assets/Image/car_1000x1000/1.png';
import { AdditiveBlending, MultiplyBlending } from 'three';
const testGtImageSeqPath = 'Blending/viewHopping/';
const testWarpSrcImageSeqPath = 'Blending/warpForward/';
const testWarpTgtImageSeqPath = 'Blending/warpBackward/';
const imageSeqAmount = 360;

declare global
{
    interface Window
    {
        three: any;
    }
}

export default class ComparisonViewer
{
    scene: THREE.Scene;
    container: HTMLCanvasElement;

    viewportControls: ViewportController;
    datGUI: dat;
    textureLoader: THREE.TextureLoader;

    gtMesh: THREE.Mesh;
    warpedMesh: THREE.Mesh;
    warpSrcMesh: THREE.Mesh;
    warpTgtMesh: THREE.Mesh;
    preLoadGtTexturesAry: THREE.Texture[];

    preLoadWarpSrcTexturesAry: THREE.Texture[];
    preLoadWarpTgtTexturesAry: THREE.Texture[];
    //utility
    frameIndex2DText: HTMLElement;
    frameIndex: number;
    startFrameIndex: number;
    endFrameIndex: number;
    framesAmountBetweenSourceImg: number;
    animationFPS: number;

    // compare mesh position value
    posX: number;
    posY: number;

    constructor()
    {
        window.three = this;
        this.scene = new THREE.Scene()
        this.container = document.getElementById('three-canvas') as HTMLCanvasElement;

        //initial set manager
        this.viewportControls = new ViewportController();
        this.viewportControls.init(this.container);
        this.viewportControls.camera.position.set(0, 0, 1500)
        this.viewportControls.controls.enableRotate = false;

        this.textureLoader = new THREE.TextureLoader();
        this.datGUI = new dat.GUI({ width: 300 });

        this.frameIndex2DText = document.getElementById("frameIndex") as HTMLElement
        this.frameIndex2DText.innerHTML = "0"

        this.frameIndex = 0;
        this.startFrameIndex = 250;
        this.endFrameIndex = 260;
        this.animationFPS = 5;
        this.framesAmountBetweenSourceImg = 5;
        this.posX = 500;
        this.posY = 200;

        this.preLoadGtTexturesAry = [];
        this.preLoadWarpSrcTexturesAry = [];
        this.preLoadWarpTgtTexturesAry = [];

        this.setGUI()
        this.preloadTexture();

        this.createGTMesh();
        this.createWarpedMesh();
    }

    setGUI()
    {
        this.datGUI.width = '400px'

        this.datGUI.add(this, 'frameIndex', this.startFrameIndex, this.endFrameIndex - 1, 1).listen().onChange((val) =>
        {
            this.hoppingFrame();
            this.frameIndex2DText.innerHTML = val;
        })
        this.datGUI.add(this, 'playComparisonAnimation');
        this.datGUI.add(this, 'animationFPS', 1, 60, 1);
    }

    async createGTMesh()
    {
        console.log("ceate gt mesh")
        const geo = new THREE.PlaneBufferGeometry(1000, 1000, 20, 20);

        const sourceTextureMap = await this.textureLoader.loadAsync(testImgPath);
        sourceTextureMap.wrapS = THREE.RepeatWrapping;
        sourceTextureMap.wrapT = THREE.RepeatWrapping;

        const uniforms = {
            map: { value: sourceTextureMap },
        };

        const mat = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: BasicFragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: uniforms
        })

        this.gtMesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.gtMesh);
        this.gtMesh.position.set(-this.posX, this.posY, 0)
    }

    async createWarpedMesh()
    {
        console.log("ceate warp mesh")

        const geo = new THREE.PlaneBufferGeometry(1000, 1000, 20, 20);

        const sourceTextureMap = await this.textureLoader.loadAsync(testImgPath);
        const targetTextureMap = await this.textureLoader.loadAsync(testImgPath2);
        sourceTextureMap.wrapS = THREE.RepeatWrapping;
        sourceTextureMap.wrapT = THREE.RepeatWrapping;

        const uniforms = {
            sourceMap: { value: sourceTextureMap },
            targetMap: { value: targetTextureMap },
            interpVal: { value: 0 },
        };

        const mat = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: BlendingFragmentShader,
            side: THREE.FrontSide,
            transparent: true,
            uniforms: uniforms
        })

        this.warpedMesh = new THREE.Mesh(geo.clone(), mat.clone());
        this.scene.add(this.warpedMesh);
        this.warpedMesh.position.set(this.posX, this.posY, 0)

        // warp source & target
        this.warpSrcMesh = new THREE.Mesh(geo.clone(), mat.clone())
        this.scene.add(this.warpSrcMesh);
        this.warpSrcMesh.position.set(-this.posX, -this.posY, 0)

        this.warpTgtMesh = new THREE.Mesh(geo.clone(), mat.clone())
        this.scene.add(this.warpTgtMesh);
        this.warpTgtMesh.position.set(this.posX, -this.posY, 0)
    }

    public async preloadTexture()
    {
        console.log("preload texture")

        // gt texture
        for (let i = this.startFrameIndex; i < this.endFrameIndex; i++)
        {
            const imgPath = `${testGtImageSeqPath}${i}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.preLoadGtTexturesAry.push(sourceTextureMap)
        }

        // warp source texture
        for (let i = this.startFrameIndex; i < this.endFrameIndex; i++)
        {
            const imgPath = `${testWarpSrcImageSeqPath}${i}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.preLoadWarpSrcTexturesAry.push(sourceTextureMap)
        }

        // warp target texture
        for (let i = this.startFrameIndex; i < this.endFrameIndex; i++)
        {
            const imgPath = `${testWarpTgtImageSeqPath}${i}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.preLoadWarpTgtTexturesAry.push(sourceTextureMap)
        }
        console.log("preload texture complete")
    }

    public updateGtTextureByThreeTexture(targetMesh: THREE.Mesh, texture: THREE.Texture)
    {
        console.log("update texture");
        (targetMesh.material as THREE.ShaderMaterial).uniforms.sourceMap.value = texture;
    }

    public playComparisonAnimation()
    {
        this.frameIndex = this.startFrameIndex;
        const rotataAnimation = setInterval(() =>
        {
            this.hoppingFrame();
            document.getElementById("frameIndex").innerHTML = this.frameIndex.toString();

            const nextIndex = this.frameIndex + 1;
            if (nextIndex == this.endFrameIndex)
            {
                clearInterval(rotataAnimation)
            }
            else
            {
                this.frameIndex = nextIndex
            }
        }, 1000 / this.animationFPS);
    }

    async hoppingFrame()
    {
        let frameIndex = Math.round(this.frameIndex);
        console.log("frameindex", frameIndex)

        if (frameIndex >= imageSeqAmount)
            frameIndex = 0;

        // gt texture 
        (this.gtMesh.material as THREE.ShaderMaterial).uniforms.map.value = this.preLoadGtTexturesAry[frameIndex - this.startFrameIndex];

        // warp mesh texture
        const interpolationVal = (frameIndex % this.framesAmountBetweenSourceImg) / this.framesAmountBetweenSourceImg;
        (this.warpedMesh.material as THREE.ShaderMaterial).uniforms.sourceMap.value = this.preLoadWarpSrcTexturesAry[frameIndex - this.startFrameIndex];
        (this.warpedMesh.material as THREE.ShaderMaterial).uniforms.targetMap.value = this.preLoadWarpTgtTexturesAry[frameIndex - this.startFrameIndex];
        (this.warpedMesh.material as THREE.ShaderMaterial).uniforms.interpVal.value = interpolationVal;

        (this.warpSrcMesh.material as THREE.ShaderMaterial).uniforms.sourceMap.value = this.preLoadWarpSrcTexturesAry[frameIndex - this.startFrameIndex];
        (this.warpTgtMesh.material as THREE.ShaderMaterial).uniforms.sourceMap.value = this.preLoadWarpTgtTexturesAry[frameIndex - this.startFrameIndex];
    }

    animate()
    {
        requestAnimationFrame(this.animate.bind(this));
        this.viewportControls.render(this.scene);
    }

    clear()
    {

    }
}
