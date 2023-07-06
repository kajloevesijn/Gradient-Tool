import React, { useState, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber'
import { ColorPicker } from './Components/ColorPicker';
import { ColorPickerButton } from './Components/ColorPickerButton';

function generateRGB() {
  return Math.floor((Math.random() * 125) + 100);
}

function generateSeed() {
  return Math.random();
}

const uniforms = {
  uTime: { value: 0 },
  uColor: { value: new THREE.Color('white') },
  uColor1: { value: new THREE.Color(`rgb(${generateRGB()},${generateRGB()},${generateRGB()})`) },
  uColor2: { value: new THREE.Color(`rgb(${generateRGB()},${generateRGB()},${generateRGB()})`) },
  uColor3: { value: new THREE.Color(`rgb(${generateRGB()},${generateRGB()},${generateRGB()})`) },
  uColor4: { value: new THREE.Color(`rgb(${generateRGB()},${generateRGB()},${generateRGB()})`) },
  uSeed: { value: generateSeed() },
  uScaleX: { value: 1 },
  uScaleY: { value: 1 },
  uScaleZ: { value: 1 },
  uAmplitude: { value: 10 },
  uSpeedX: { value: 1 },
  uSpeedY: { value: 1 },
  uSpeedZ: { value: 1 },
};

const vertexShader = `
precision mediump float;
uniform float uTime;
uniform float uSeed;
uniform float uScaleX;
uniform float uScaleY;
uniform float uScaleZ;
uniform float uSpeedX;
uniform float uSpeedY;
uniform float uSpeedZ;
uniform float uAmplitude;
varying vec2 vUv;
varying float noiseMap;
varying vec3 interpolatedPosition;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec3 fade(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

// Classic Perlin noise
float cnoise(vec3 P) {
  P += vec3(hash(1534.0));
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = inversesqrt(vec4(dot(g000, g000), dot(g100, g100), dot(g010, g010), dot(g110, g110)));
  g000 *= norm0.x;
  g100 *= norm0.y;
  g010 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = inversesqrt(vec4(dot(g001, g001), dot(g101, g101), dot(g011, g011), dot(g111, g111)));
  g001 *= norm1.x;
  g101 *= norm1.y;
  g011 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float snoise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n = p.x + p.y * 157.0 + 113.0 * p.z;
  return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                 mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
             mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                 mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
}

void main() {
  vUv = uv;

  vec3 pos = position;

  vec3 noisePos = vec3((pos.x * uScaleX) + uTime * uSpeedX, (pos.y * uScaleY) + uTime * uSpeedY, (pos.z * uScaleZ) + uTime * uSpeedZ);
  
  noiseMap = cnoise(noisePos);
  interpolatedPosition = noisePos * 0.9;
  pos.z += noiseMap * uAmplitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
  precision mediump float;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform float uTime;

  varying vec2 vUv;
  varying float noiseMap;

  vec3 blend4Colors(float t, vec3 color1, vec3 color2, vec3 color3, vec3 color4, vec3 thresholds) {
    // Ensure t is within the bounds [0, 1]
    t = clamp(t, 0.0, 1.0);

    // Determine the color intervals based on t
    if (t < thresholds.x) {
        // Blend between color1 and color2
        float adjustedT = t / thresholds.x;
        adjustedT = smoothstep(0.0, 1.0, adjustedT);
        return mix(color1, color2, adjustedT);
    } else if (t < thresholds.y) {
        // Blend between color2 and color3
        float adjustedT = (t - thresholds.x) / (thresholds.y - thresholds.x);
        adjustedT = smoothstep(0.0, 1.0, adjustedT);
        return mix(color2, color3, adjustedT);
    } else {
        // Blend between color3 and color4
        float adjustedT = (t - thresholds.y) / (1.0 - thresholds.y);
        adjustedT = smoothstep(0.0, 1.0, adjustedT);
        return mix(color3, color4, adjustedT);
    }
  }

varying vec3 interpolatedPosition;

vec3 hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.xxy + p.yzz) * p.zyx);
}

float cellNoise(vec3 position, vec2 resolution, float scale) {
  vec3 p = floor(position.xyz / scale);
  vec3 f = fract(position.xyz / scale);
  vec2 uv = (p.xy + 0.5) / (resolution.xy / scale);

  // Get the eight corner positions
  vec3 c000 = hash3(p);
  vec3 c100 = hash3(p + vec3(1.0, 0.0, 0.0));
  vec3 c010 = hash3(p + vec3(0.0, 1.0, 0.0));
  vec3 c110 = hash3(p + vec3(1.0, 1.0, 0.0));
  vec3 c001 = hash3(p + vec3(0.0, 0.0, 1.0));
  vec3 c101 = hash3(p + vec3(1.0, 0.0, 1.0));
  vec3 c011 = hash3(p + vec3(0.0, 1.0, 1.0));
  vec3 c111 = hash3(p + vec3(1.0, 1.0, 1.0));

  // Calculate the distance vectors
  vec3 d000 = f;
  vec3 d100 = f - vec3(1.0, 0.0, 0.0);
  vec3 d010 = f - vec3(0.0, 1.0, 0.0);
  vec3 d110 = f - vec3(1.0, 1.0, 0.0);
  vec3 d001 = f - vec3(0.0, 0.0, 1.0);
  vec3 d101 = f - vec3(1.0, 0.0, 1.0);
  vec3 d011 = f - vec3(0.0, 1.0, 1.0);
  vec3 d111 = f - vec3(1.0, 1.0, 1.0);

  // Calculate the dot products
  float dot000 = dot(c000.xyz, d000);
  float dot100 = dot(c100.xyz, d100);
  float dot010 = dot(c010.xyz, d010);
  float dot110 = dot(c110.xyz, d110);
  float dot001 = dot(c001.xyz, d001);
  float dot101 = dot(c101.xyz, d101);
  float dot011 = dot(c011.xyz, d011);
  float dot111 = dot(c111.xyz, d111);

  // Interpolate the dot products
  vec3 weight = smoothstep(0.0, 1.0, f);
  float noise = mix(
      mix(mix(dot000, dot100, weight.x), mix(dot010, dot110, weight.x), weight.y),
      mix(mix(dot001, dot101, weight.x), mix(dot011, dot111, weight.x), weight.y),
      weight.z
  );

  // Return the noise value
  return noise;
}

void main() {
    vec2 resolution = vec2(200.0, 200.0); // Set the resolution according to your needs
    float scale = 2.0; // Adjust the scale value as desired
    
    float noise = (cellNoise(interpolatedPosition, resolution, scale) + 0.5);

    gl_FragColor = vec4(blend4Colors(noise,uColor1,uColor2,uColor3,uColor4,vec3(0.2,0.4,0.6)), 1.0);
}
`;

const Wave = (props) => {

  const ref = useRef();

  useFrame(({ clock }) => {
    ref.current.uniforms.uTime.value = clock.getElapsedTime();

  });

  useEffect(() => {
    ref.current.uniforms.uScaleX.value = props.scaleX;
    ref.current.uniforms.uScaleY.value = props.scaleY;
    ref.current.uniforms.uScaleZ.value = props.scaleZ;
    ref.current.uniforms.uSpeedX.value = props.speedX;
    ref.current.uniforms.uSpeedY.value = props.speedY;
    ref.current.uniforms.uSpeedZ.value = props.speedZ;
    ref.current.uniforms.uAmplitude.value = props.amplitude;
  }, [props])

  return (
    <mesh>
      <planeBufferGeometry args={[16, 6, 100, 100]} />
      <shaderMaterial ref={ref}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      //wireframe
      />

    </mesh>
  )

}

export const BackgroundShader = () => {
  const [scaleX, setScaleX] = useState(21.0);
  const [scaleY, setScaleY] = useState(201.0);
  const [scaleZ, setScaleZ] = useState(11.0);
  const [amplitude, setAmplitude] = useState(100.0);

  const [speedX, setSpeedX] = useState(21.0);
  const [speedY, setSpeedY] = useState(11.0);
  const [speedZ, setSpeedZ] = useState(21.0);

  const [colorIndex, setColorIndex] = useState(0);

  const [colors, setColors] = useState([[60, 60, 60], [120, 120, 120], [180, 180, 180], [240, 240, 240]]);

  function refreshColors() {
    uniforms.uColor1.value = new THREE.Color(`rgb(${colors[0][0]},${colors[0][1]},${colors[0][2]})`);
    uniforms.uColor2.value = new THREE.Color(`rgb(${colors[1][0]},${colors[1][1]},${colors[1][2]})`);
    uniforms.uColor3.value = new THREE.Color(`rgb(${colors[2][0]},${colors[2][1]},${colors[2][2]})`);
    uniforms.uColor4.value = new THREE.Color(`rgb(${colors[3][0]},${colors[3][1]},${colors[3][2]})`);

  }

  function changeColor(newColors) {
    let copy = colors;

    copy[colorIndex][0] = newColors.r;
    copy[colorIndex][1] = newColors.g;
    copy[colorIndex][2] = newColors.b;
    console.log(copy);
    setColors(copy);
    refreshColors();
  }
  return (
    <div className='absolute w-full h-screen -z-50 overflow-clip'>
      <div className='h-[50rem] w-[250rem] -rotate-12 -translate-x-[10rem] -translate-y-[30rem] overflow-hidden'>
        <Canvas className='' camera={{ fov: 40, rotation: [0.25, 0, 0], position: [3, -2, 5] }}>
          <Suspense fallback={null}>
            <Wave scaleX={scaleX / 100} scaleY={scaleY / 100} scaleZ={scaleZ / 100} amplitude={amplitude / 100} speedX={speedX / 100} speedY={speedY / 100} speedZ={speedZ / 100} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
