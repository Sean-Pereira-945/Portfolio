import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import TWEEN from '@tweenjs/tween.js';
import Application from '../Application';
import Resources from '../Utils/Resources';
import AudioManager from '../Audio/AudioManager';
import UIEventBus from '../UI/EventBus';
import { prefersReducedMotion } from '../UI/Animation';
import { isUIControl } from '../Camera/Camera';
import { PHONE_BODY, PHONE_SCREEN } from '../Utils/Device';

// Pose the phone starts in before the intro spins it round to face the visitor.
const INTRO_POSE = { rx: 0.35, ry: -Math.PI * 0.85, rz: 0.1, z: -1400 };
const INTRO_DURATION = 2400;

/** Rounded rectangle centred on the origin. */
const roundedRect = (w: number, h: number, r: number) => {
    const x = -w / 2;
    const y = -h / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(x + w, y + h - r);
    shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    shape.lineTo(x + r, y + h);
    shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(x, y + r);
    shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return shape;
};

/**
 * Phone mode: a 3D phone with SeanOS running as an app on its screen.
 * The app is a real iframe placed with the CSS3D renderer; a transparent
 * "hole" in the WebGL render lets it show through the glass.
 */
export default class PhoneWorld {
    application: Application;
    scene: THREE.Scene;
    cssScene: THREE.Scene;
    resources: Resources;
    audioManager: AudioManager;

    phone: THREE.Group;
    screenMesh: THREE.Mesh;
    cssObject: CSS3DObject;
    iframe: HTMLIFrameElement;

    started: boolean;
    dragging: boolean;
    dragStart: { x: number; y: number; yaw: number; pitch: number };
    pose: { rx: number; ry: number; rz: number; z: number };
    poseTween: any;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.cssScene = this.application.cssScene;
        this.resources = this.application.resources;
        this.started = false;
        this.dragging = false;
        this.pose = { ...INTRO_POSE };

        this.setEnvironment();
        this.createPhone();
        this.createScreen();
        this.relayScreenMessages();
        this.setIntro();
        this.setDragToSpin();
        this.applyPose();

        this.resources.on('ready', () => {
            this.audioManager = new AudioManager();
        });
    }

    setEnvironment() {
        // Studio-style reflections for the metal frame and glass, no downloads needed.
        const pmrem = new THREE.PMREMGenerator(
            this.application.renderer.instance
        );
        this.scene.environment = pmrem.fromScene(
            new RoomEnvironment(),
            0.04
        ).texture;
        pmrem.dispose();

        const key = new THREE.DirectionalLight(0xffffff, 0.8);
        key.position.set(-600, 900, 1200);
        this.scene.add(key);

        const rim = new THREE.DirectionalLight(0x9fc4ff, 0.6);
        rim.position.set(900, -300, -800);
        this.scene.add(rim);
    }

    createPhone() {
        const { bezel, radius, depth, bevel } = PHONE_BODY;
        const bodyW = PHONE_SCREEN.w + bezel * 2;
        const bodyH = PHONE_SCREEN.h + bezel * 2;
        const front = depth / 2;

        this.phone = new THREE.Group();
        this.scene.add(this.phone);

        const frame = new THREE.MeshStandardMaterial({
            color: 0x3c3e43,
            metalness: 1,
            roughness: 0.3,
        });
        const frontGlass = new THREE.MeshStandardMaterial({
            color: 0x050506,
            metalness: 0.2,
            roughness: 0.06,
        });
        const backGlass = new THREE.MeshStandardMaterial({
            color: 0x2b2d31,
            metalness: 0.1,
            roughness: 0.55,
            side: THREE.DoubleSide,
        });
        const lensGlass = new THREE.MeshStandardMaterial({
            color: 0x020203,
            metalness: 0.4,
            roughness: 0.02,
        });

        // Body: extruded rounded rectangle; group 0 is the front/back caps, group 1 the sides.
        const bodyGeometry = new THREE.ExtrudeGeometry(
            roundedRect(bodyW, bodyH, radius),
            {
                depth: depth - bevel * 2,
                bevelEnabled: true,
                bevelThickness: bevel,
                bevelSize: bevel,
                bevelSegments: 6,
                curveSegments: 40,
            }
        );
        bodyGeometry.center();
        this.phone.add(new THREE.Mesh(bodyGeometry, [frontGlass, frame]));

        // Frosted back glass
        const back = new THREE.Mesh(
            new THREE.ShapeGeometry(
                roundedRect(bodyW - 4, bodyH - 4, radius - 2),
                40
            ),
            backGlass
        );
        back.position.z = -front - 0.3;
        back.rotation.y = Math.PI;
        this.phone.add(back);

        // Camera bump, top-left when looking at the back
        const bump = new THREE.Group();
        const bumpSize = 150;
        const bumpGeometry = new THREE.ExtrudeGeometry(
            roundedRect(bumpSize, bumpSize, 40),
            {
                depth: 4,
                bevelEnabled: true,
                bevelThickness: 1.5,
                bevelSize: 1.5,
                bevelSegments: 3,
                curveSegments: 24,
            }
        );
        bumpGeometry.center();
        bump.add(new THREE.Mesh(bumpGeometry, [backGlass, frame]));

        const lensOffsets = [
            [-34, 34],
            [-34, -34],
            [36, 0],
        ];
        lensOffsets.forEach(([x, y]) => {
            const ring = new THREE.Mesh(
                new THREE.CylinderGeometry(27, 27, 7, 48),
                frame
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(x, y, -5);
            bump.add(ring);

            const lens = new THREE.Mesh(
                new THREE.CircleGeometry(20, 48),
                lensGlass
            );
            lens.position.set(x, y, -8.6);
            lens.rotation.y = Math.PI;
            bump.add(lens);
        });

        const flash = new THREE.Mesh(
            new THREE.CircleGeometry(8, 24),
            new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.4 })
        );
        flash.position.set(38, 44, -4.1);
        flash.rotation.y = Math.PI;
        bump.add(flash);

        bump.position.set(
            bodyW / 2 - 24 - bumpSize / 2,
            bodyH / 2 - 24 - bumpSize / 2,
            -front - 3
        );
        this.phone.add(bump);

        // Side buttons
        const outerX = bodyW / 2 + bevel;
        const addButton = (side: 1 | -1, y: number, length: number) => {
            const button = new THREE.Mesh(
                new THREE.BoxGeometry(4, length, 9),
                frame
            );
            button.position.set(side * (outerX + 1.2), bodyH / 2 - y, 0);
            this.phone.add(button);
        };
        addButton(-1, 170, 34); // action button
        addButton(-1, 250, 64); // volume up
        addButton(-1, 330, 64); // volume down
        addButton(1, 280, 100); // side button

        // Dynamic Island sits on top of the app's status bar.
        const island = new THREE.Mesh(
            new THREE.ShapeGeometry(roundedRect(118, 35, 17.5), 24),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        island.position.set(0, PHONE_SCREEN.h / 2 - 11 - 17.5, front + 0.8);
        this.phone.add(island);
    }

    createScreen() {
        const { w, h, radius } = PHONE_SCREEN;
        const front = PHONE_BODY.depth / 2;

        // Transparent cut-out: NoBlending writes alpha 0 so the CSS iframe behind shows through.
        this.screenMesh = new THREE.Mesh(
            new THREE.ShapeGeometry(roundedRect(w, h, radius), 40),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0,
                blending: THREE.NoBlending,
            })
        );
        this.screenMesh.position.z = front + 0.4;
        this.phone.add(this.screenMesh);

        const container = document.createElement('div');
        container.style.width = `${w}px`;
        container.style.height = `${h}px`;
        container.style.borderRadius = `${radius}px`;
        container.style.overflow = 'hidden';
        container.style.background = '#f7f3ee';
        container.style.backfaceVisibility = 'hidden';

        this.iframe = document.createElement('iframe');
        this.iframe.src = new URL(
            './os/index.html?app',
            window.location.href
        ).href;
        this.iframe.title = 'SeanOS app';
        this.iframe.id = 'phone-screen';
        this.iframe.style.width = `${w}px`;
        this.iframe.style.height = `${h}px`;
        this.iframe.style.border = '0';
        this.iframe.style.display = 'block';
        container.appendChild(this.iframe);

        this.cssObject = new CSS3DObject(container);
        this.cssScene.add(this.cssObject);
    }

    /** Key presses inside the app (and the UI's typing sounds) reach the audio code as keydown events. */
    relayScreenMessages() {
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || (data.type !== 'keydown' && data.type !== 'keyup'))
                return;
            const evt = new CustomEvent(data.type, {
                bubbles: true,
                cancelable: false,
            });
            // @ts-ignore
            evt.inComputer = true;
            // @ts-ignore
            evt.key = data.key;
            document.dispatchEvent(evt);
        });
    }

    setIntro() {
        UIEventBus.on('loadingScreenDone', () => {
            this.started = true;
            this.tweenPoseTo(
                { rx: 0, ry: 0, rz: 0, z: 0 },
                INTRO_DURATION,
                TWEEN.Easing.Exponential.Out
            );
        });
    }

    tweenPoseTo(
        target: { rx: number; ry: number; rz: number; z: number },
        duration: number,
        easing: (k: number) => number
    ) {
        if (this.poseTween) this.poseTween.stop();
        if (prefersReducedMotion() || duration === 0) {
            Object.assign(this.pose, target);
            return;
        }
        this.poseTween = new TWEEN.Tween(this.pose)
            .to(target, duration)
            .easing(easing)
            .start();
    }

    /** Drag anywhere outside the screen to spin the phone; it settles back facing you. */
    setDragToSpin() {
        const onDown = (event: PointerEvent) => {
            if (!this.started || event.target === this.iframe) return;
            if (isUIControl(event.target)) return;
            if (this.poseTween) this.poseTween.stop();
            this.dragging = true;
            this.dragStart = {
                x: event.clientX,
                y: event.clientY,
                yaw: this.pose.ry,
                pitch: this.pose.rx,
            };
            UIEventBus.dispatch('phoneSpin', {});
        };

        const onMove = (event: PointerEvent) => {
            if (!this.dragging) return;
            const dx = event.clientX - this.dragStart.x;
            const dy = event.clientY - this.dragStart.y;
            this.pose.ry = this.dragStart.yaw + dx * 0.012;
            this.pose.rx = THREE.MathUtils.clamp(
                this.dragStart.pitch + dy * 0.006,
                -0.6,
                0.6
            );
        };

        const onEnd = () => {
            if (!this.dragging) return;
            this.dragging = false;
            // Take the short way back to facing forward.
            this.pose.ry = Math.atan2(Math.sin(this.pose.ry), Math.cos(this.pose.ry));
            this.tweenPoseTo(
                { rx: 0, ry: 0, rz: 0, z: 0 },
                1100,
                TWEEN.Easing.Exponential.Out
            );
        };

        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onEnd);
        window.addEventListener('pointercancel', onEnd);
        window.addEventListener('blur', onEnd);
        // Stop the page from scrolling or zooming while the phone is being spun.
        window.addEventListener(
            'touchmove',
            (event) => {
                if (this.dragging) event.preventDefault();
            },
            { passive: false }
        );
    }

    applyPose() {
        this.phone.rotation.set(this.pose.rx, this.pose.ry, this.pose.rz);
        this.phone.position.set(0, 0, this.pose.z);
    }

    update() {
        this.applyPose();

        // Keep the CSS iframe glued to the screen as the phone moves.
        this.screenMesh.updateWorldMatrix(true, false);
        const scale = new THREE.Vector3();
        this.screenMesh.matrixWorld.decompose(
            this.cssObject.position,
            this.cssObject.quaternion,
            scale
        );

        if (this.audioManager) this.audioManager.update();
    }
}
