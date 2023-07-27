import React, { useState, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber'
import { ColorPicker } from './Components/ColorPicker';
import { ColorPickerButton } from './Components/ColorPickerButton';
import { Brands } from './Components/Brands';

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
  uColorResolution: { value: 20},
  uNoiseType: {value: '0' },
};

const noiseTypes = {
  cellNoise: '0',
  absCellNoise: '1',
  heightNoise: '2',
  heightCellMult: '3',
}

let currentNoiseType = noiseTypes.absCellNoise;

const vertexShader = `
precision mediump float;
uniform float uTime;
uniform float uSeed;
uniform float uScaleX;
uniform float uScaleY;
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

  vec3 noisePos = vec3((pos.x * uScaleX) + uTime * uSpeedX, (pos.y * uScaleY) + uTime * uSpeedY, (pos.z) + uTime * uSpeedZ);
  
  noiseMap = abs(cnoise(noisePos));
  interpolatedPosition = noisePos * 3.0;
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
  uniform float uColorResolution;
  uniform int uNoiseType;

  varying vec2 vUv;
  varying float noiseMap;

  vec3 gradientMap(vec3 color1, vec3 color2, vec3 color3, vec3 color4, float t) {
    vec3 finalColor = mix(mix(color1, color2, t), mix(mix(color2, color3, t), color4, t), t);
    return vec3(finalColor); 
  }

varying vec3 interpolatedPosition;

vec3 hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.xxy + p.yzz) * p.zyx);
}

float cellNoise(vec3 position, float scale) {
  vec3 p = floor(position.xyz / scale);
  vec3 f = fract(position.xyz / scale);

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
    float scale = uColorResolution; // Adjust the scale value as desired
    
    float noise = 0.0;

    if (uNoiseType == 0) {
      noise = (cellNoise(interpolatedPosition, scale) + 0.3) * 1.5;
    }else if (uNoiseType == 1){
      noise = (abs(cellNoise(interpolatedPosition, scale)))*3.0;
    } else if (uNoiseType == 2) {
      noise = noiseMap;
    } else if (uNoiseType == 3){
      noise = ((abs(cellNoise(interpolatedPosition, scale)))*3.0) * noiseMap;
    }

    gl_FragColor = vec4(gradientMap(uColor1,uColor2,uColor3,uColor4,noise), 1.0);
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
      <planeBufferGeometry args={[16, 6, 400, 400]} />
      <shaderMaterial ref={ref}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      //wireframe
      />

    </mesh>
  )

}

const Scene = () => {
  const [scaleX, setScaleX] = useState(51.0);
  const [scaleY, setScaleY] = useState(201.0);
  const [scaleZ, setScaleZ] = useState(11.0);
  const [amplitude, setAmplitude] = useState(100.0);

  const [speedX, setSpeedX] = useState(20.0);
  const [speedY, setSpeedY] = useState(10.0);
  const [speedZ, setSpeedZ] = useState(20.0);

  const [colorResolution, setcolorResolution] = useState(10.0);

  const [colorIndex, setColorIndex] = useState(0);

  const [colors, setColors] = useState([[230, 0, 143], [110, 195, 244], [112, 56, 255], [255, 186, 39]]);

  const [showPicker, setShowPicker] = useState(false);

  const [pickerPos, setPickerPos] = useState([220, 250]);

  const [noiseType, setNoiseType] = useState(noiseTypes.absCellNoise);

  const refs = useRef(null);

  function refreshColors() {
    uniforms.uColor1.value = new THREE.Color(`rgb(${colors[0][0]},${colors[0][1]},${colors[0][2]})`);
    uniforms.uColor2.value = new THREE.Color(`rgb(${colors[1][0]},${colors[1][1]},${colors[1][2]})`);
    uniforms.uColor3.value = new THREE.Color(`rgb(${colors[2][0]},${colors[2][1]},${colors[2][2]})`);
    uniforms.uColor4.value = new THREE.Color(`rgb(${colors[3][0]},${colors[3][1]},${colors[3][2]})`);
  }


  refreshColors();

  function openPicker(pickerIndex) {

    if (pickerIndex === colorIndex) {
      setShowPicker(!showPicker);
    }

    setColorIndex(pickerIndex);
  }

  function changeColor(newColors) {
    let copy = colors;

    copy[colorIndex][0] = newColors.r;
    copy[colorIndex][1] = newColors.g;
    copy[colorIndex][2] = newColors.b;

    setColors(copy);
    refreshColors();
  }

  function randomizeColors(){
    setColors([ [getRandomColorValue(),getRandomColorValue(),getRandomColorValue()],
                [getRandomColorValue(),getRandomColorValue(),getRandomColorValue()],
                [getRandomColorValue(),getRandomColorValue(),getRandomColorValue()],
                [getRandomColorValue(),getRandomColorValue(),getRandomColorValue()]])
  }

  function getRandomColorValue(){
    return Math.floor( Math.random() * 255);
  }

  useEffect(()=>{
    uniforms.uColorResolution.value = 100 / colorResolution;
  },[colorResolution])

  useEffect(() => {
    const boundingRect = refs.current?.getBoundingClientRect();
    setPickerPos([boundingRect.left, boundingRect.top])
    setShowPicker(true);

    // Use the top and left values as needed
    // to position another object with absolute positioning
    // e.g., set the style of the other object
    // using the calculated top and left values
  }, [colorIndex]);

  useEffect(() => {
    setShowPicker(false);
  }, [])

  useEffect(()=>{
    uniforms.uNoiseType.value = noiseType;
  },[noiseType])

  return (

    <div className='overflow-clip'>
      <div className='absolute w-screen -z-50 overflow-clip'>
        <div className='h-[50rem] w-[250rem] -rotate-12 -translate-x-[10rem] -translate-y-[30rem]'>
          <Canvas className='' camera={{ fov: 40, rotation: [0.25, 0, 0], position: [3, -2, 5] }}>
            <Suspense fallback={null}>
              <Wave scaleX={scaleX / 100} scaleY={scaleY / 100} scaleZ={scaleZ / 100} amplitude={amplitude / 100} speedX={speedX / 100} speedY={speedY / 100} speedZ={speedZ / 100}/>
            </Suspense>
          </Canvas>
        </div>
      </div>

    <div className='flex flex-row'>

    <div className='basis-1/5'></div>
    <div className='basis-3/5'>
      {showPicker && <div style={{ top: `${pickerPos[1] + 62}px`, left: `${pickerPos[0] - 7}px` }} className={`absolute overflow-hidden z-50`}>
        <ColorPicker currentColor={colors[colorIndex]} colorChanged={(newColors) => { changeColor(newColors) }} />
      </div>}

      <div className='z-50 p-4 text-base text-white bg-transparent'>
        <nav className=''>
          <ul className='flex justify-between font-semibold items-center select-none'>

            <li className='flex gap-8 justify-center items-center'>
              <span className='flex items-center -translate-y-0.5 text-2xl duration-200 hover:text-gray-300 font-bold'>stripes</span>
              <span className='duration-200 hover:text-gray-300'>Products</span>
              <span className='duration-200 hover:text-gray-300'>Solutions</span>
              <span className='duration-200 hover:text-gray-300'>Developers</span>
              <span className='duration-200 hover:text-gray-300'>Information</span>
              <span className='duration-200 hover:text-gray-300'>Prices</span>
            </li>

            <li className="flex gap-4 justify-center items-center">
              <span className='duration-200 hover:text-gray-300'>{"Contact us >"}</span>
              <span className='rounded-full bg-white/10 hover:bg-white/20 p-2 px-4 backdrop-blur-lg duration-200 hover:text-gray-300'>{"Log in >"}</span>
            </li>
          </ul>
        </nav>
      </div>

      <div className={`grid gap-4 mt-32 w-full]`}>
        <div className="flex justify-between h-[36rem]">
          <div className='mix-blend-overlay stroke-white'>
            <div className='w-[40rem] mr-8 font-semibold text-8xl text-stroke  tracking-tighter'>The online infrastructure for pretty waves</div>
            <div className='my-6 w-[30rem] text-xl '>Millions of companies worldwide, from start-ups to multinationals, use lines software and APIs to manage their graphics and conduct colors online.</div>
            <div className='flex gap-1 w-full items-center select-none'>
              <div className='duration-200 text-white bg-gray-900 hover:bg-gray-500 p-1 align-middle px-4 font-semibold rounded-full'>{'Start >'}</div>
              <div className='duration-200 font-semibold text-gray-900 hover:text-gray-500 p-1 px-4'>{'Contact us >'}</div>
            </div>
          </div>

          <div className="grid grid-rows-[auto,1fr] h-fit gap-2 border-2 border-white/50 w-[44rem] bg-white/30 rounded-md backdrop-blur-3xl shadow-2xl shadow-black p-2 translate-y-8">
            <div className='flex text-white gap-2'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>


              <p className='font-bold font-mono'>CONFIG</p>
            </div>

            <div className='font-bold w-full grid grid-cols-4 gap-2 select-none'>
              <div className='grid content-start bg-gray-800/40 rounded-md p-2 text-white backdrop-blur-3xl'>
                <p className='text-lg'>Wave Scale</p>

                <div className="h-1 rounded-full bg-white"></div>

                <div className=''>
                  <p className='py-1'>X:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={scaleX - 1} onChange={(e) => { setScaleX(Number(e.target.value) + 1) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Y:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={scaleY - 1} onChange={(e) => { setScaleY(Number(e.target.value) + 1) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Z:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={scaleZ - 1} onChange={(e) => { setScaleZ(Number(e.target.value) + 1) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Height:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={amplitude} onChange={(e) => { setAmplitude(Number(e.target.value)) }} />
                  </div>
                </div>


              </div>

              <div className='grid content-start  bg-gray-800/40 rounded-md p-2 text-white backdrop-blur-3xl'>
                <p className='text-lg'>Movement</p>

                <div className="h-1 rounded-full bg-white"></div>

                <div className=''>
                  <p className='py-1'>X:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={speedX} onChange={(e) => { setSpeedX(Number(e.target.value)) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Y:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={speedY} onChange={(e) => { setSpeedY(Number(e.target.value)) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Z:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={speedZ} onChange={(e) => { setSpeedZ(Number(e.target.value)) }} />
                  </div>
                </div>
              </div>

              <div className='grid content-start  bg-gray-800/40 rounded-md p-2 text-white backdrop-blur-3xl'>
                <p className='text-lg'>Color Noise</p>

                <div className="h-1 rounded-full bg-white"></div>

                <div className=''>
                  <p className='py-1'>Resolution:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={colorResolution} onChange={(e) => { setcolorResolution(Number(e.target.value)) }} />
                  </div>
                </div>

                <div className=''>
                  <p className='py-1'>Type:</p>
                  <div>
                    <label htmlFor="noiseTypes"></label>

                    <select onChange={(e) => {setNoiseType(noiseTypes[e.target.value])}} className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' name="noiseTypes" id="noiseTypes">
                      <option value="absCellNoise">Abs Cell</option>
                      <option value="cellNoise">Soft Cell</option>
                      <option value="heightNoise">Height</option>
                      <option value="heightCellMult">Hybrid Height</option>
                      
                    </select>
                  </div>
                </div>

              </div>

              <div className='grid content-start w-full overflow-hidden  bg-gray-800/40 rounded-md p-2 text-white backdrop-blur-3xl'>
                <p className='text-lg'>Color Picker</p>

                <div className="h-1 rounded-full bg-white"></div>

                {colors.map((color, index) => {
                  if (index === colorIndex) {
                    return (
                      <div ref={refs} key={index} className=''>
                        <p className='py-1'>Color {index + 1}:</p>
                        <ColorPickerButton index={index} buttonText={colorIndex === index && showPicker ? 'Close' : 'Change Color'} openPicker={() => { openPicker(index) }} color={color} />
                      </div>
                    )
                  } else {
                    return (
                      <div key={index} className=''>
                        <p className='py-1'>Color {index + 1}:</p>
                        <ColorPickerButton index={index} buttonText={colorIndex === index && showPicker ? 'Close' : 'Change Color'} openPicker={() => { openPicker(index) }} color={color} />
                      </div>
                    )
                  }

                })}
                <div className='pt-2'>
                  <button onClick={randomizeColors} className='duration-200 w-full hover:shadow-md rounded-md ring-2 ring-gray-500 hover:bg-slate-700 hover:ring-gray-100 bg-slate-800'>Randomize</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

          <Brands/>
        </div>
      </div>
      <div className='basis-1/5'></div>
    </div>

  )
}

const App = () => {
  return <Scene />
}

export default App;
