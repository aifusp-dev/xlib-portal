"use client";

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import * as THREE from 'three';

interface MCModelFace {
    texture: string;
    uv?: [number, number, number, number];
}

interface MCModelElement {
    from: [number, number, number];
    to: [number, number, number];
    faces: {
        north?: MCModelFace;
        south?: MCModelFace;
        east?: MCModelFace;
        west?: MCModelFace;
        up?: MCModelFace;
        down?: MCModelFace;
    };
}

interface MCModel {
    textures?: Record<string, string>;
    elements?: MCModelElement[];
}

const MinecraftElement = ({ element, textureUrls }: { element: MCModelElement, textureUrls: Record<string, string> }) => {
    const { from, to, faces } = element;
    
    // Minecraft scale is 0-16. We normalize to 1 unit.
    const size = [
        (to[0] - from[0]) / 16,
        (to[1] - from[1]) / 16,
        (to[2] - from[2]) / 16
    ] as [number, number, number];

    const position = [
        (from[0] + to[0]) / 32 - 0.5,
        (from[1] + to[1]) / 32 - 0.5,
        (from[2] + to[2]) / 32 - 0.5
    ] as [number, number, number];

    const materials = useMemo(() => {
        // Order: East, West, Up, Down, South, North (Three.js Box order)
        const faceKeys: (keyof MCModelElement['faces'])[] = ['east', 'west', 'up', 'down', 'south', 'north'];
        
        return faceKeys.map(key => {
            const face = faces[key];
            if (!face) return new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });

            const texVar = face.texture.replace('#', '');
            const url = textureUrls[texVar];

            if (!url) return new THREE.MeshStandardMaterial({ color: '#333' });

            const loader = new THREE.TextureLoader();
            const texture = loader.load(url);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            // Basic UV adjustment
            if (face.uv) {
                texture.repeat.set((face.uv[2] - face.uv[0]) / 16, (face.uv[3] - face.uv[1]) / 16);
                texture.offset.set(face.uv[0] / 16, 1 - (face.uv[3] / 16));
            }

            return new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
        });
    }, [faces, textureUrls]);

    return (
        <mesh position={position} material={materials}>
            <boxGeometry args={size} />
        </mesh>
    );
};

export const Model3DViewer = ({ model, textureUrls }: { model: MCModel, textureUrls: Record<string, string> }) => {
    if (!model.elements) return null;

    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [2, 2, 2], fov: 45 }} gl={{ antialias: false }}>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Stage environment="city" intensity={0.5} shadows={false}>
                    <Center>
                        <group>
                            {model.elements.map((el, i) => (
                                <MinecraftElement key={i} element={el} textureUrls={textureUrls} />
                            ))}
                        </group>
                    </Center>
                </Stage>
                <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
            </Canvas>
        </div>
    );
};
