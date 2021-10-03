import * as THREE from 'three'
import ViewportController from "./base/ViewportController";
import ObjectManager from './base/ObjectManager';
import FragmentShader from "three/shader/BlendingFragmentShader";
import VertexShader from "three/shader/BlendingVertexShader";
import * as dat from "dat.gui";
import testImgPath from 'assets/Image/car_1000x1000/0.png';
const testGtImageSeqPath = 'Images/car_1000x1000/';
const testWarpImageSeqPath = 'Images/car_1000x1000/';
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
    preLoadGtTexturesAry: THREE.Texture[];
    preLoadWarpTexturesAry: THREE.Texture[];
    //utility
    frameIndex2DText: HTMLElement;
    frameIndex: number;
    startFrameIndex: number;
    endFrameIndex: number;
    animationFPS: number;

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
        this.startFrameIndex = 300;
        this.endFrameIndex = 310;
        this.animationFPS = 1;

        this.preLoadGtTexturesAry = [];
        this.preLoadWarpTexturesAry = [];
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
            // this.hoppingFrame();
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
            fragmentShader: FragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: uniforms
        })

        this.gtMesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.gtMesh);
        this.gtMesh.position.set(0, 0, 0)
    }

    async createWarpedMesh()
    {
        console.log("ceate warp mesh")

        const geo = new THREE.PlaneBufferGeometry(1000, 1000, 20, 20);

        const sourceTextureMap = await this.textureLoader.loadAsync(testImgPath);
        sourceTextureMap.wrapS = THREE.RepeatWrapping;
        sourceTextureMap.wrapT = THREE.RepeatWrapping;

        const uniforms = {
            map: { value: sourceTextureMap },
        };

        const mat = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: uniforms
        })

        this.warpedMesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.warpedMesh);
        this.warpedMesh.position.set(0, 0, 0)
    }

    public async preloadTexture()
    {
        console.log("preload texture")

        // gt texture
        for (let i = 0; i < imageSeqAmount; i++)
        {
            const imgPath = `${testGtImageSeqPath}${i}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.preLoadGtTexturesAry.push(sourceTextureMap)
        }

        // warp texture
        for (let i = 0; i < imageSeqAmount; i++)
        {
            const imgPath = `${testWarpImageSeqPath}${i}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.preLoadWarpTexturesAry.push(sourceTextureMap)
        }
        console.log("preload texture complete")
    }

    public updateTextureByThreeTexture(targetMesh: THREE.Mesh, texture: THREE.Texture)
    {
        (targetMesh.material as THREE.ShaderMaterial).uniforms.map.value = texture;
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

        await this.updateTextureByThreeTexture(this.gtMesh, this.preLoadGtTexturesAry[frameIndex])
        await this.updateTextureByThreeTexture(this.warpedMesh, this.preLoadWarpTexturesAry[frameIndex])
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
