import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const Bag = () => {
  return (
    <mesh position={[0, -1, 0]}>
      <boxGeometry args={[2, 2, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

const Item = ({ position, delay }) => {
  const itemRef = useRef();
  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() + delay) % 2;
    itemRef.current.position.y = 2 - t * 1.5;
    itemRef.current.visible = t < 1.5;
  });

  return (
    <mesh ref={itemRef} position={position}>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={1} />
        <Bag />
        <Item position={[-0.5, 2, 0]} delay={0} />
        <Item position={[0.5, 2, 0]} delay={0.5} />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Loader;
