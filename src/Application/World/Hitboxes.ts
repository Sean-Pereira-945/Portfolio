import * as THREE from 'three';
import Application from '../Application';
import Camera from '../Camera/Camera';
import Sizes from '../Utils/Sizes';

const RENDER_WIREFRAME = false;

type HitboxConfig = {
    action: () => void;
};

export default class Hitboxes {
    application: Application;
    scene: THREE.Scene;
    hitboxes: { [key: string]: HitboxConfig };
    hitboxMeshes: THREE.Mesh[];
    camera: Camera;
    sizes: Sizes;
    raycaster: THREE.Raycaster;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.camera = this.application.camera;
        this.sizes = this.application.sizes;
        this.raycaster = new THREE.Raycaster();
        this.hitboxes = {};
        this.hitboxMeshes = [];

        this.createRaycaster();
        this.createInteractionZones();
    }

    createRaycaster() {
        window.addEventListener(
            'mousedown',
            (event) => {
                if (!this.camera?.instance) return;
                if (
                    typeof event.clientX !== 'number' ||
                    typeof event.clientY !== 'number'
                )
                    return;
                const pointer = new THREE.Vector2(
                    (event.clientX / this.sizes.width) * 2 - 1,
                    -(event.clientY / this.sizes.height) * 2 + 1
                );

                this.raycaster.setFromCamera(pointer, this.camera.instance);
                const intersects = this.raycaster.intersectObjects(
                    this.hitboxMeshes,
                    false
                );

                if (!intersects.length) return;

                event.preventDefault();
                event.stopPropagation();

                const hit = this.hitboxes[intersects[0].object.name];
                hit?.action();
            },
            true
        );
    }

    createInteractionZones() {
        const triggerMonitorZoom = () => {
            this.camera.trigger('enterMonitor');
        };

        this.createHitbox(
            'monitorHitbox',
            triggerMonitorZoom,
            new THREE.Vector3(0, 950, 200),
            new THREE.Vector3(2600, 1800, 900)
        );

        this.createHitbox(
            'keyboardHitbox',
            triggerMonitorZoom,
            new THREE.Vector3(0, 420, 1500),
            new THREE.Vector3(2800, 500, 900)
        );

        this.createHitbox(
            'mouseHitbox',
            triggerMonitorZoom,
            new THREE.Vector3(1700, 460, 1450),
            new THREE.Vector3(900, 500, 900)
        );
    }

    createHitbox(
        name: string,
        action: () => void,
        position: THREE.Vector3,
        size: THREE.Vector3
    ) {
        // create hitbox material
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: RENDER_WIREFRAME ? 0.08 : 0,
            depthWrite: false,
            wireframe: RENDER_WIREFRAME,
        });

        // create hitbox
        const hitbox = new THREE.Mesh(
            new THREE.BoxBufferGeometry(size.x, size.y, size.z),
            hitboxMaterial
        );

        // set name of the hitbox object
        hitbox.name = name;

        // set hitbox position
        hitbox.position.copy(position);

        // add hitbox to scene
        this.scene.add(hitbox);
        this.hitboxMeshes.push(hitbox);

        // add hitbox to hitboxes
        this.hitboxes[name] = { action };
    }
}
