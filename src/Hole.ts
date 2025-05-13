import * as THREE from "three";

const DAMPING = 0.03;
const DRAG = 1 - DAMPING;
const MASS = 0.1;
const TIMESTEP = 18 / 1000;
const TIMESTEP_SQ = TIMESTEP * TIMESTEP;
const GRAVITY = 981 * 1.4;
const WIND_STRENGTH = 20;

class Particle {
    position: THREE.Vector3;
    previous: THREE.Vector3;
    original: THREE.Vector3;
    a: THREE.Vector3;
    mass: number;
    invMass: number;
    tmp: THREE.Vector3;
    tmp2: THREE.Vector3;

    constructor(x: number, y: number, z: number, mass: number) {
        this.position = new THREE.Vector3(x, y, z);
        this.previous = new THREE.Vector3(x, y, z);
        this.original = new THREE.Vector3(x, y, z);
        this.a = new THREE.Vector3(0, 0, 0);
        this.mass = mass;
        this.invMass = 1 / mass;
        this.tmp = new THREE.Vector3();
        this.tmp2 = new THREE.Vector3();
    }

    addForce(force: THREE.Vector3) {
        this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
    }

    integrate(timesq: number) {
        const newPos = this.tmp.subVectors(this.position, this.previous);
        newPos.multiplyScalar(DRAG).add(this.position);
        newPos.add(this.a.multiplyScalar(timesq));

        this.tmp = this.previous;
        this.previous = this.position;
        this.position = newPos;

        this.a.set(0, 0, 0);
    }
}

class Cloth {
    w: number;
    h: number;
    particles: Particle[];
    constraints: [Particle, Particle, number][];

    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;
        this.particles = [];
        this.constraints = [];

        const restDistance = 0.1;

        // Create particles
        for (let v = 0; v <= h; v++) {
            for (let u = 0; u <= w; u++) {
                this.particles.push(
                    new Particle(u * restDistance, v * restDistance, 0, MASS)
                );
            }
        }

        // Create constraints
        for (let v = 0; v < h; v++) {
            for (let u = 0; u < w; u++) {
                this.constraints.push([
                    this.particles[this.index(u, v)],
                    this.particles[this.index(u, v + 1)],
                    restDistance,
                ]);

                this.constraints.push([
                    this.particles[this.index(u, v)],
                    this.particles[this.index(u + 1, v)],
                    restDistance,
                ]);
            }
        }
    }

    index(u: number, v: number): number {
        return u + v * (this.w + 1);
    }
}

export class Hole {
    mesh: THREE.Group;
    private flag: THREE.Group;
    private flagWaveTime: number = 0;
    private holeRadius: number = 0.05;
    private flagHeight: number = 0.3;
    private cloth: Cloth;
    private clothGeometry: THREE.BufferGeometry;
    private clothMesh: THREE.Mesh;
    private windForce: THREE.Vector3;
    private gravity: THREE.Vector3;
    private waveTime: number = 0.3;
    private originalPositions: any[] = [];
    private flagWidth: number = 0;

    constructor(position: THREE.Vector3) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        this.originalPositions=[];

        // Create hole
        const holeGeometry = new THREE.CylinderGeometry(
            this.holeRadius,
            this.holeRadius,
            0.1,
            32
        );
        const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.8,
            metalness: 0.2,
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.y = -0.05;
        this.mesh.add(hole);

        // Create flag pole
        const poleGeometry = new THREE.CylinderGeometry(
            0.005,
            0.005,
            this.flagHeight,
            8
        );
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.5,
            metalness: 0.8,
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = this.flagHeight / 2;
        this.mesh.add(pole);

        // Initialize cloth simulation
        this.cloth = new Cloth(10, 10);
        this.windForce = new THREE.Vector3();
        this.gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(MASS);

        // Create flag cloth
        this.flag = new THREE.Group();
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            roughness: 0.5,
        });

        // Create cloth geometry
        const clothFunction = (u: number, v: number, target: THREE.Vector3) => {
            const x = (u - 0.5) * 0.2;
            const y = (v + 0.5) * 0.2;
            const z = 0;
            target.set(x, y, z);
        };

        // Create vertices for the cloth
        const vertices = [];
        const indices = [];
        const uvs = [];

        for (let v = 0; v <= this.cloth.h; v++) {
            for (let u = 0; u <= this.cloth.w; u++) {
                const x = (u / this.cloth.w - 0.5) * 0.2;
                const y = (v / this.cloth.h + 0.5) * 0.2;
                const z = 0;
                vertices.push(x, y, z);
                uvs.push(u / this.cloth.w, v / this.cloth.h);
            }
        }

        // Create indices for triangles
        for (let v = 0; v < this.cloth.h; v++) {
            for (let u = 0; u < this.cloth.w; u++) {
                const a = u + v * (this.cloth.w + 1);
                const b = u + 1 + v * (this.cloth.w + 1);
                const c = u + (v + 1) * (this.cloth.w + 1);
                const d = u + 1 + (v + 1) * (this.cloth.w + 1);

                indices.push(a, b, d);
                indices.push(a, d, c);
            }
        }

        this.clothGeometry = new THREE.BufferGeometry();
        this.clothGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        );
        this.clothGeometry.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(uvs, 2)
        );
        this.clothGeometry.setIndex(indices);
        this.clothMesh = new THREE.Mesh(this.clothGeometry, flagMaterial);
        this.flag.add(this.clothMesh);
        this.flag.position.set(0.05, this.flagHeight / 2, 0);
        this.flag.scale.set(0.5, 0.5, 0.5);
        this.mesh.add(this.flag);
        console.log("originalPositions",this.originalPositions);
    }

    update(delta: number) {
        this.waveTime += delta;

        const waveFrequency = 2.5;
        const waveSpeed = 3.0;
        const waveAmplitude = 0.1;
        const phaseShift = 1.5;

        const positions = this.clothGeometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            this.originalPositions.push({
                x: positions.getX(i),
                y: positions.getY(i),
                z: positions.getZ(i),
            });
        }

        let minX = Infinity,
            maxX = -Infinity;
        for (const pos of this.originalPositions) {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
        }
        this.flagWidth = maxX - minX;
        

        for (let i = 0; i < positions.count; i++) {
            const original = this.originalPositions[i];

            const distanceFromPole =
                (original.x - this.originalPositions[0].x) / this.flagWidth;

            if (distanceFromPole < 0.05) {
                positions.setXYZ(i, original.x, original.y, original.z);
                continue;
            }

            const waveEffect = distanceFromPole * distanceFromPole;

            const timeOffset = this.waveTime * waveSpeed;
            const yOffset =
                Math.sin(distanceFromPole * waveFrequency + timeOffset) *
                waveAmplitude *
                waveEffect/2;
            const zOffset =
                Math.sin(
                    distanceFromPole * waveFrequency + timeOffset + phaseShift
                ) *
                waveAmplitude *
                waveEffect;

            positions.setXYZ(
                i,
                original.x,
                original.y + yOffset,
                original.z + zOffset
            );
        }

        positions.needsUpdate = true;
        this.clothGeometry.computeVertexNormals();
    }

    isBallInHole(ballPosition: THREE.Vector3): boolean {
        const distance = new THREE.Vector2(
            ballPosition.x - this.mesh.position.x,
            ballPosition.z - this.mesh.position.z
        ).length();
        return distance < this.holeRadius;
    }
}
