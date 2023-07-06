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
  interpolatedPosition = noisePos * 2.0;
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
    vec2 resolution = vec2(5.0, 5.0); // Set the resolution according to your needs
    float scale = 5.0; // Adjust the scale value as desired
    
    float noise = (abs(cellNoise(interpolatedPosition, resolution, scale)))*2.5;

    gl_FragColor = vec4(blend4Colors(noise,uColor1,uColor2,uColor3,uColor4,vec3(0.125,0.250,0.375)), 1.0);
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

const Scene = () => {
  const [scaleX, setScaleX] = useState(51.0);
  const [scaleY, setScaleY] = useState(201.0);
  const [scaleZ, setScaleZ] = useState(11.0);
  const [amplitude, setAmplitude] = useState(100.0);

  const [speedX, setSpeedX] = useState(21.0);
  const [speedY, setSpeedY] = useState(11.0);
  const [speedZ, setSpeedZ] = useState(21.0);

  const [colorIndex, setColorIndex] = useState(0);

  const [colors, setColors] = useState([[230, 0, 143], [110, 195, 244], [112, 56, 255], [255, 186, 39]]);

  const [showPicker, setShowPicker] = useState(false);

  const [pickerPos, setPickerPos] = useState([220, 250]);

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
    } else {

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

  useEffect(() => {
    const boundingRect = refs.current?.getBoundingClientRect();
    console.log(boundingRect)

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

  return (
    <div className=''>
      <div className='absolute w-full h-screen -z-50 overflow-clip'>
        <div className='h-[50rem] w-[250rem] -rotate-12 -translate-x-[10rem] -translate-y-[30rem] overflow-hidden'>
          <Canvas className='' camera={{ fov: 40, rotation: [0.25, 0, 0], position: [3, -2, 5] }}>
            <Suspense fallback={null}>
              <Wave scaleX={scaleX / 100} scaleY={scaleY / 100} scaleZ={scaleZ / 100} amplitude={amplitude / 100} speedX={speedX / 100} speedY={speedY / 100} speedZ={speedZ / 100} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {showPicker && <div style={{ top: `${pickerPos[1] + 62}px`, left: `${pickerPos[0] - 7}px` }} className={`absolute overflow-hidden z-50`}>
        <ColorPicker currentColor={colors[colorIndex]} colorChanged={(newColors) => { changeColor(newColors) }} />
      </div>}




      <div className='z-50 p-4 text-base ml-[22%] text-white bg-transparent'>
        <nav className=''>
          <ul className='flex gap-40 font-semibold items-center select-none'>

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

      <div className={`grid gap-4 mt-32 ml-[22%] w-full]`}>
        <div className="flex overflow-hidden h-[36rem]">
          <div>
            <div className='w-[40rem] mr-8 font-semibold text-8xl mix-blend-overlay tracking-tighter'>The online infrastructure for pretty waves</div>
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

            <div className='font-bold w-full grid grid-cols-3 gap-2 select-none'>
              <div className='grid content-start  bg-gray-800/40 rounded-md p-2 text-white backdrop-blur-3xl'>
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
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={speedX - 1} onChange={(e) => { setSpeedX(Number(e.target.value) + 1) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Y:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={speedY - 1} onChange={(e) => { setSpeedY(Number(e.target.value) + 1) }} />
                  </div>
                </div>
                <div className=''>
                  <p className='py-1'>Z:</p>
                  <div >
                    <input className='duration-200 w-full pl-1 rounded-md ring-2 ring-gray-500 hover:ring-gray-100 bg-slate-800' type="text" name="" id="" value={speedZ - 1} onChange={(e) => { setSpeedZ(Number(e.target.value) + 1) }} />
                  </div>
                </div>


              </div>
              <div className='grid content-start w-full overflow-hidden  bg-gray-800/40 rounded-md p-2 text-white backdrop-blur-3xl'>
                <p className='text-lg'>Colors</p>

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
                <div className='pt-7'>
                  <button className='duration-200 w-full hover:shadow-md rounded-md ring-2 ring-gray-500 hover:bg-slate-700 hover:ring-gray-100 bg-slate-800'>???</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex ml-[25%]'>
        <section className='grid mt-8'>
          <div className="flex h-20 ">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><g fill="none" fillRule="evenodd"><title>Booking.com logo</title><path fill="var(--userLogoColor, #273B7D)" fillRule="nonzero" d="M84.88 11.71a2.19 2.19 0 112.18 2.2c-1.2 0-2.18-.99-2.18-2.2"></path><path fill="var(--userLogoColor, #499FDD)" fillRule="nonzero" d="M119.34 26.28a2.19 2.19 0 114.36 0c0 1.21-.98 2.2-2.18 2.2-1.2 0-2.18-.99-2.18-2.2"></path><path fill="var(--userLogoColor, #273B7D)" fillRule="nonzero" d="M49.04 25.34c-1.88 0-3.19-1.5-3.19-3.63 0-2.14 1.3-3.63 3.19-3.63 1.9 0 3.21 1.5 3.21 3.63 0 2.17-1.3 3.63-3.21 3.63zm0-10.45a6.62 6.62 0 00-6.87 6.82 6.62 6.62 0 006.87 6.82c4 0 6.9-2.87 6.9-6.82s-2.9-6.82-6.9-6.82zm31.61 7.16c-.15-.3-.33-.54-.52-.73l-.12-.13.13-.12c.18-.2.37-.43.55-.69l3.5-5.22h-4.26l-2.63 4.08c-.15.22-.45.33-.9.33h-.6v-7.72c0-1.55-.97-1.76-2-1.76H72v18.24h3.78v-5.47h.36c.43 0 .72.05.85.28l2.09 3.94c.58 1.06 1.16 1.25 2.25 1.25h2.9l-2.16-3.57-1.43-2.71m18.35-7.19c-1.92 0-3.15.85-3.84 1.58l-.23.23-.08-.32c-.2-.77-.88-1.2-1.9-1.2h-1.7l.02 13.17H95v-6.07c0-.6.07-1.1.23-1.58a3.08 3.08 0 013.04-2.3c1.17 0 1.63.62 1.63 2.21v5.74c0 1.36.63 2 2 2h1.78v-8.37c0-3.33-1.63-5.1-4.7-5.1m-11.87.31h-1.78l.01 10.18v2.98h3.73l.02-11.16c0-1.35-.65-2-1.98-2M63.77 25.34c-1.88 0-3.19-1.5-3.19-3.63 0-2.14 1.31-3.63 3.2-3.63 1.88 0 3.2 1.5 3.2 3.63 0 2.17-1.29 3.63-3.2 3.63zm0-10.45a6.62 6.62 0 00-6.87 6.82 6.62 6.62 0 006.87 6.82c4 0 6.9-2.87 6.9-6.82s-2.9-6.82-6.9-6.82z"></path><path fill="var(--userLogoColor, #499FDD)" fillRule="nonzero" d="M144.19 25.34c-1.88 0-3.2-1.5-3.2-3.63 0-2.14 1.32-3.63 3.2-3.63 1.89 0 3.21 1.5 3.21 3.63 0 2.17-1.3 3.63-3.21 3.63zm0-10.45a6.62 6.62 0 00-6.87 6.82 6.62 6.62 0 006.87 6.82c3.99 0 6.9-2.87 6.9-6.82s-2.91-6.82-6.9-6.82z"></path><path fill="var(--userLogoColor, #273B7D)" fillRule="nonzero" d="M111.6 24.76c-2.06 0-2.79-1.8-2.79-3.47 0-.74.19-3.15 2.58-3.15 1.2 0 2.78.34 2.78 3.27 0 2.77-1.4 3.35-2.58 3.35zm4.52-9.64c-.71 0-1.26.29-1.53.8l-.1.2-.18-.14a5.1 5.1 0 00-3.45-1.15c-3.51 0-5.87 2.64-5.87 6.56 0 3.92 2.44 6.66 5.94 6.66 1.19 0 2.13-.28 2.88-.85l.3-.22v.37c0 1.76-1.15 2.73-3.2 2.73-1 0-1.92-.25-2.53-.47-.8-.24-1.26-.04-1.58.76l-.3.74-.42 1.07.26.14c1.32.7 3.03 1.12 4.59 1.12 3.2 0 6.92-1.64 6.92-6.24l.01-12.08h-1.74zM35.07 25.19H32v-3.66c0-.78.3-1.19.98-1.28h2.08c1.48 0 2.44.94 2.45 2.46 0 1.55-.94 2.48-2.45 2.48zM32 15.33v-.96c0-.84.36-1.24 1.14-1.3h1.56c1.34 0 2.15.81 2.15 2.15 0 1.03-.55 2.22-2.1 2.22H32v-2.1zm6.96 3.65l-.55-.31.48-.42a4.41 4.41 0 001.5-3.43c0-2.87-2.22-4.72-5.66-4.72h-4.37a1.92 1.92 0 00-1.85 1.9v16.26h6.3c3.82 0 6.28-2.08 6.28-5.3 0-1.74-.8-3.23-2.13-3.98z"></path><path fill="var(--userLogoColor, #499FDD)" fillRule="nonzero" d="M167.84 14.9c-1.56 0-3.06.73-4.03 1.95l-.27.35-.21-.39c-.7-1.26-1.9-1.9-3.56-1.9-1.74 0-2.9.96-3.45 1.54l-.36.39-.13-.5c-.2-.74-.85-1.14-1.83-1.14h-1.58l-.02 13.12h3.6v-5.8c0-.5.06-1 .19-1.53.34-1.4 1.28-2.9 2.86-2.75.97.1 1.45.85 1.45 2.3v7.78h3.6v-5.8c0-.63.07-1.1.2-1.58.3-1.33 1.28-2.7 2.8-2.7 1.1 0 1.51.62 1.51 2.3v5.86c0 1.33.6 1.92 1.92 1.92h1.69v-8.38c0-3.34-1.47-5.04-4.37-5.04m-32.61 8.86c0 .02-1.55 1.64-3.58 1.64-1.85 0-3.72-1.13-3.72-3.67 0-2.18 1.45-3.71 3.53-3.71.67 0 1.43.24 1.55.64l.02.07c.28.92 1.11.97 1.28.97h1.96V18c0-2.27-2.88-3.09-4.81-3.09-4.15 0-7.15 2.89-7.15 6.86s2.97 6.86 7.07 6.86c3.56 0 5.5-2.34 5.5-2.37l.11-.12-1.55-2.58-.2.21"></path></g><title>Booking logo</title></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" fill="none" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><path fill="var(--userLogoColor, #03F)" fillRule="evenodd" d="M45 4h31.92v31.92H45V4zm17.149 25.522h5.49V10.399h-5.49a9.562 9.562 0 000 19.123z" clipule="evenodd"></path><path fill="var(--userLogoColor, #03F)" d="M139.59 11.136a1.2 1.2 0 00-1.199 1.198v.042a1.199 1.199 0 002.398 0v-.042a1.2 1.2 0 00-1.199-1.198zm-41.719 3.818a5.03 5.03 0 00-2.12.428 4.631 4.631 0 00-1.557 1.137 5.015 5.015 0 00-.955 1.65 5.788 5.788 0 000 3.885c.212.602.536 1.159.955 1.64.435.481.965.866 1.557 1.13.668.294 1.39.44 2.12.428a4.784 4.784 0 001.743-.314 3.62 3.62 0 001.32-.852l.102-.105v.996h2.122v-9.749h-2.122v.999l-.102-.105a3.643 3.643 0 00-1.32-.85 4.79 4.79 0 00-1.743-.318zm2.991 3.764c.344.9.344 1.894 0 2.793a2.85 2.85 0 01-.701 1.003c-.29.262-.63.462-1 .59a3.477 3.477 0 01-1.138.191 2.843 2.843 0 01-1.219-.259 3.073 3.073 0 01-.948-.69 3.035 3.035 0 01-.614-1.012 3.614 3.614 0 010-2.46 3.03 3.03 0 01.614-1.022c.269-.29.59-.524.948-.69.38-.173.794-.26 1.211-.254a3.5 3.5 0 011.139.19c.373.13.715.335 1.004.604.303.285.543.631.704 1.016zm6.078-5.96h-2.123v9.215c0 .909.306 1.644.911 2.186.604.542 1.528.82 2.749.82h1.547V23.13h-1.528c-1.035 0-1.559-.518-1.559-1.538v-4.516h3.084v-1.848h-3.081v-2.472zm8.716 2.196a5.041 5.041 0 00-2.121.428 4.65 4.65 0 00-1.554 1.137 5.02 5.02 0 00-.961 1.65 5.835 5.835 0 00-.334 1.945 5.72 5.72 0 00.334 1.935c.214.603.54 1.16.961 1.64.434.482.963.87 1.554 1.135a5.06 5.06 0 002.121.428 4.782 4.782 0 001.742-.314 3.645 3.645 0 001.321-.852l.096-.105v.996h2.125v-9.749h-2.12v.999l-.096-.105a3.636 3.636 0 00-1.326-.85 4.786 4.786 0 00-1.742-.318zm2.992 3.764c.344.9.344 1.894 0 2.793a2.87 2.87 0 01-.701 1.003 2.933 2.933 0 01-1.003.593 3.483 3.483 0 01-1.139.191 2.842 2.842 0 01-1.219-.259 3.056 3.056 0 01-.947-.69 3.016 3.016 0 01-.615-1.012 3.551 3.551 0 01-.215-1.224c0-.421.072-.84.214-1.235.135-.38.344-.727.616-1.024.268-.289.59-.523.947-.69a2.838 2.838 0 011.219-.258 3.5 3.5 0 011.139.19c.373.13.714.335 1.003.604.302.286.541.633.701 1.018zm22.014-3.49h-2.122v9.75h2.122v-9.75zm12.737-4.092a1.2 1.2 0 00-1.199 1.198v.042a1.199 1.199 0 002.398 0v-.042a1.2 1.2 0 00-1.199-1.198zm1.072 4.093h-2.122v9.75h2.122v-9.75zm-23.712 6.029v-6.03h-2.122v6.03a2.006 2.006 0 11-4.012 0v-6.03h-2.123v5.936a4.134 4.134 0 004.129 4.129 4.082 4.082 0 003.024-1.329l.043-.046.043.046a4.125 4.125 0 007.151-2.8v-5.936h-2.121v6.03a2.006 2.006 0 11-4.012 0zm17.797-1.918c1.364-1.423 2.042-3.163 2.327-4.084l.008-.028h-2.197c-.515 1.345-1.698 3.562-4.011 4.058v-7.987h-2.059v13.68h2.063v-3.594a6.348 6.348 0 002.223-.754l2.293 4.344h2.33l-2.977-5.635zm-62.414-2.838a4.966 4.966 0 00-1.06 1.59 5.114 5.114 0 00-.388 2.001c-.006.688.126 1.37.387 2.006a4.896 4.896 0 001.06 1.601c.455.453.996.81 1.59 1.05a5.241 5.241 0 002 .377h2.84V23.23h-2.71a2.961 2.961 0 01-1.2-.243 2.824 2.824 0 01-.94-.668 3.114 3.114 0 01-.61-.99 3.591 3.591 0 010-2.479c.14-.365.347-.7.61-.99.264-.282.584-.505.94-.654a3.07 3.07 0 011.2-.232h2.71v-1.898h-2.84a5.242 5.242 0 00-2 .382 4.825 4.825 0 00-1.59 1.045z"></path><title>Catawiki logo</title></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><title>Deliveroo logo</title><path fill="var(--userLogoColor, #00CDBE)" fillRule="evenodd" d="M82.75 27.47h2.92l-.48-2.25V11.85h-2.8v6.1c-.84-.96-2-1.53-3.35-1.53-2.8 0-4.96 2.28-4.96 5.64 0 3.35 2.16 5.64 4.95 5.64 1.4 0 2.59-.59 3.43-1.6l.3 1.37h-.01zm55.18-8.05c.57 0 1.1.14 1.57.48l1.33-2.96a3.83 3.83 0 00-2.02-.54 3.4 3.4 0 00-2.98 1.61l-.3-1.36h-2.87l.46 2.12v8.7h2.8v-6.9a2.18 2.18 0 012.01-1.15zm8.19 5.36c-1.62 0-2.82-1.06-2.82-2.72 0-1.68 1.2-2.73 2.82-2.73 1.63 0 2.8 1.05 2.8 2.73 0 1.66-1.17 2.72-2.8 2.72zm-69.33-2.72c0-1.68 1.2-2.73 2.81-2.73 1.64 0 2.81 1.05 2.81 2.73 0 1.66-1.17 2.72-2.8 2.72-1.62 0-2.82-1.06-2.82-2.72zm81.69 2.72c-1.62 0-2.81-1.06-2.81-2.72 0-1.68 1.2-2.73 2.8-2.73 1.65 0 2.82 1.05 2.82 2.73 0 1.66-1.17 2.72-2.81 2.72zm-66.03-5.62c1.45 0 2.4.68 2.68 1.91h-5.37c.32-1.23 1.26-1.9 2.69-1.9zm33.4 0c1.44 0 2.38.68 2.68 1.91h-5.37c.31-1.23 1.25-1.9 2.68-1.9zm-13.63 8.3h4.5l2.9-10.81h-3.03l-2.14 8.76-2.15-8.76h-3l2.92 10.82zm-7.2 0h2.79v-10.8h-2.79v10.82zm-12.15.2c1.56 0 3.1-.41 4.37-1.23l-1.07-2.39c-1 .53-2.12.84-3.25.84-1.47 0-2.5-.57-2.94-1.61h7.85a6 6 0 00.13-1.28c0-3.36-2.33-5.6-5.46-5.6-3.15 0-5.46 2.26-5.46 5.64 0 3.44 2.29 5.64 5.84 5.64zm71.13-5.6c0-3.36-2.35-5.64-5.52-5.64-3.17 0-5.52 2.28-5.52 5.64 0 3.35 2.35 5.64 5.52 5.64 3.17 0 5.52-2.29 5.52-5.64zm-37.78 5.64c1.55 0 3.08-.42 4.37-1.24l-1.08-2.39c-1 .52-2.12.84-3.25.84-1.47 0-2.5-.57-2.94-1.62h7.85a6 6 0 00.13-1.27c0-3.36-2.33-5.6-5.46-5.6-3.15 0-5.46 2.26-5.46 5.64 0 3.44 2.3 5.64 5.84 5.64zm19.9 0c3.17 0 5.52-2.29 5.52-5.64 0-3.36-2.35-5.64-5.52-5.64-3.17 0-5.52 2.28-5.52 5.64 0 3.35 2.35 5.64 5.52 5.64zm-46.39-.23h2.8V11.85h-2.8v15.62zm6.7-12.31c.98 0 1.74-.76 1.74-1.76s-.76-1.76-1.74-1.76c-1.01 0-1.77.75-1.77 1.76 0 1 .76 1.76 1.77 1.76zM58.47 2l-1.6 15-2.73-12.65-8.54 1.8 2.72 12.63L36 21.36l2.18 10.1L59.85 36l4.95-10.97L67.16 2.9l-8.7-.9zm-6.85 21.75c-.44.4-1.04.37-1.66.16-.63-.2-.9-.95-.67-1.85.18-.67 1-.77 1.42-.78.16 0 .32.03.46.1.3.12.8.4.9.83.14.62 0 1.14-.45 1.54zm6.28.7c-.33.55-1.18.62-2.02.22-.56-.27-.56-.97-.5-1.39.03-.23.13-.45.28-.63.2-.25.53-.58.92-.6.64-.01 1.18.27 1.49.78.3.5.15 1.06-.17 1.62z"></path></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><title>Ticketswap logo</title><path fill="var(--userLogoColor, #00B8F6)" fillRule="evenodd" d="M164.49 16.82a5.12 5.12 0 015.19 5.1c0 2.82-2.3 5.12-5.19 5.12-1 0-1.93-.27-2.72-.9v5.84h-2.53V17h2.53v.73a4.16 4.16 0 012.72-.91zm-128.81-2.4c.64 0 1.25.26 1.7.71l7.38 7.37a3.2 3.2 0 004.54 0v.01c.4-.4.7-.9.83-1.45l5.9 5.9a11.24 11.24 0 01-16.95 1.22L30 19.1l3.98-3.97a2.39 2.39 0 011.7-.71zm73.78 2.4a4.95 4.95 0 014.91 5.1 5 5 0 01-.06.8h-7.44v.01c.28 1.2 1.25 2.03 2.71 2.03.9 0 1.83-.33 2.4-1.1l1.73 1.39a5 5 0 01-4.11 2c-2.95 0-5.2-2.2-5.2-5.07 0-2.77 1.95-5.16 5.06-5.16zM76.4 13.7V17H79v2.43h-2.6v3.9c0 .7.18 1.33 1.1 1.33.62 0 1.22-.1 1.22-.1v2.24h.01s-.73.24-1.95.24c-1.91 0-2.9-1.25-2.9-3.17v-4.44h-1.56V17h1.55v-3.3h2.53zm75.91 3.12c.99 0 1.92.26 2.7.9V17h2.54v9.77h-2.54v-.63c-.77.63-1.7.9-2.7.9a5.15 5.15 0 01-5.19-5.12c0-2.83 2.3-5.1 5.19-5.1zm-62.34 0c1.84 0 3.46.93 4.38 2.33l-2.16 1.25a2.71 2.71 0 00-4.92 1.52c0 1.46 1.22 2.7 2.7 2.7.96 0 1.8-.5 2.28-1.26l2.14 1.28a5.22 5.22 0 01-4.42 2.4 5.15 5.15 0 01-5.2-5.12c0-2.83 2.31-5.1 5.2-5.1zm28.89-3.12V17h2.6v2.43h-2.6v3.9c0 .7.18 1.33 1.09 1.33.64 0 1.23-.1 1.23-.1v2.24h-.01s-.73.24-1.94.24c-1.91 0-2.9-1.25-2.9-3.17v-4.44h-1.55V17h1.54v-3.3h2.54zm7.6 3.12c.87 0 2.45.2 3.56 1.24l-1.34 1.8a3.91 3.91 0 00-2.2-.73c-.84 0-1 .37-1 .61 0 1.38 4.9.72 4.9 4.2 0 1.8-1.3 3.1-3.77 3.1-1.82 0-2.98-.7-3.87-1.37l1.34-1.94c.9.78 2 1.01 2.7 1.01.9 0 1.19-.37 1.19-.71 0-1.47-4.96-.57-4.96-4.08 0-1.8 1.28-3.13 3.45-3.13zm-28.5-5.27v9.24L101.5 17h3.24l-4.27 4.47 4.7 5.3h-3.35l-3.86-4.35v4.35h-2.53V11.55h2.53zM133.54 17l1.97 6.42 2.3-6.42h2.23l2.26 6.42 2-6.42h2.85l-3.51 9.77h-2.52l-2.2-6.23-2.11 6.23h-2.63L130.7 17h2.84zM83.6 17v9.77h-2.54V17h2.54zM46.22 9.03c3.25-.23 6.45.96 8.75 3.26v-.01l9.08 9.08-3.97 3.98c-.93.93-2.47.93-3.4 0l-7.38-7.39v.01a3.22 3.22 0 00-5.37 1.44l-5.9-5.9a11.24 11.24 0 018.2-4.47zm106.09 10.22a2.7 2.7 0 00-2.7 2.67c0 1.46 1.22 2.7 2.7 2.7 1.5 0 2.7-1.24 2.7-2.7a2.7 2.7 0 00-2.7-2.67zm12.22-.09a2.71 2.71 0 00-2.76 2.66v.22a2.71 2.71 0 105.42-.12 2.71 2.71 0 00-2.66-2.76zm-55.09-.03a2.6 2.6 0 00-2.5 1.75h4.88c-.14-1-1.17-1.75-2.38-1.75zm-27.1-6.94c.91 0 1.6.68 1.6 1.58 0 .91-.69 1.6-1.6 1.6-.9 0-1.6-.69-1.6-1.6 0-.9.7-1.58 1.6-1.58z"></path></svg>

          </div>

          <div className='flex'>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><title>Treatwell logo</title><path fill="var(--userLogoColor, #FF4A1B)" fillRule="evenodd" d="M161 9l-3.88.39v21.33H161V9zm-7.76 0l-3.87.39v21.33h3.87V9zm-48.87 16.24v-12.6h-.34l-6.1 5.57v.1h2.57v8.11c0 3 1.67 4.58 4.18 4.58 1.95 0 3.48-.93 4.52-2.6v-.2c-.65.23-1.21.34-1.8.34-1.9 0-3.03-1.24-3.03-3.3zm-58.16 0v-12.6h-.18L40 18.21v.1h2.33v8.11c0 3 1.83 4.58 4.35 4.58a5.2 5.2 0 004.52-2.6v-.2c-.65.23-1.25.34-1.84.34-1.86 0-3.15-1.24-3.15-3.3zm44.98-8.47v13.95h3.88V16.34l-3.88.43zm-33.35-.43l-3.88.45v13.93h3.88V16.34zm80.43 8.22a6.5 6.5 0 001.9.28c3.1 0 5.7-2.09 5.7-4.57 0-2.18-2.07-3.9-5.06-3.93v.2c.96.5 1.19 1.72 1.19 2.8 0 2.76-1.73 4.85-3.73 5.02v.2zm-67.8 0c.54.17 1.2.28 1.9.28 3.1 0 5.68-2.09 5.68-4.57 0-2.18-2.06-3.9-5.06-3.93v.2c.96.5 1.19 1.72 1.19 2.8 0 2.76-1.73 4.85-3.7 5.02v.2zm69.55-8.22c-4.15 0-7.23 3.14-7.23 7.43 0 4.3 2.94 7.23 7.03 7.23a6.38 6.38 0 006.07-3.84v-.26a5.66 5.66 0 01-3.67 1.16c-3.22 0-5.22-2.03-5.22-5.45 0-2.51 1.1-5.17 3.02-6.07v-.2zm-67.8 0c-4.14 0-7.25 3.14-7.25 7.43 0 4.3 2.94 7.23 7.03 7.23 2.77 0 5-1.38 6.08-3.84v-.26a5.66 5.66 0 01-3.68 1.16c-3.19 0-5.22-2.06-5.22-5.45 0-2.51 1.13-5.17 3.05-6.07v-.2zM86.16 31c1.92 0 3.37-1.16 4.27-2.94v-.17c-.48.26-1.07.43-1.7.43-2.2-.03-3.8-1.95-3.8-4.89 0-3.84 2.34-6.44 5.41-6.44v-.22a6.14 6.14 0 00-2.37-.43c-4.15 0-7.31 3.3-7.31 7.85 0 3.9 2.23 6.81 5.5 6.81zm19.4-12.7h3.87v-1.53h-3.88v1.54zm-58.18.04h3.88v-1.58h-3.88v1.58zm76.4-1.57h-4.65l5.96 14.15h.28l2.17-4.55-3.76-9.6zm-8.14 0h-4.27l5.84 14.15h.28l2.17-4.55-4.03-9.6zm12.02 0c.7 1.38 1.3 3.95 1.3 5.3h.2l2.76-5.31h-4.26zm-69.03 3.86c.87-.9 2.23-1.15 3.44-1.15.8 0 1.23.17 1.6.34v-3.28c-.23-.09-.55-.2-.98-.2-2.23 0-3.58 1.53-4.06 4.15v.14z"></path></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><title>Felyx logo</title><path fill="var(--userLogoColor, #007542)" d="M97.447 15.035c.146 0 .264.12.264.266v8.566c0 1.911.328 3.018 2.006 3.018.924 0 1.696-.291 2.235-.843.487-.498.755-1.185.755-1.935v-5.443c0-.601-.137-.703-.547-.703h-.012l-.892-.056a.266.266 0 01-.247-.267v-2.337c0-.147.118-.266.264-.266h5.11c.146 0 .265.12.265.266v14.491c0 4.85-2.326 7.208-7.11 7.208-1.802 0-4.321-.342-5.65-.994a.268.268 0 01-.148-.24v-4.078c0-.137.106-.254.242-.266l2.698-.23a.262.262 0 01.201.07.27.27 0 01.086.197v1.37c0 .525.125.727.557.896.535.2 1.166.288 2.045.288 2.452 0 3.644-1.38 3.644-4.221v-1.71a5.608 5.608 0 01-1.878 1.386 6.635 6.635 0 01-2.75.584c-1.561 0-2.763-.449-3.571-1.335-.826-.905-1.244-2.274-1.244-4.068v-6.046c0-.45-.084-.614-.558-.642l-.892-.056a.266.266 0 01-.248-.267v-2.337c0-.147.118-.266.264-.266zm37.01 11.331c1.138 0 2.1.98 2.1 2.14 0 1.16-.962 2.114-2.1 2.114-1.137 0-2.072-.954-2.072-2.114s.935-2.14 2.073-2.14zM65.634 8.643c1.248 0 2.983.448 4.037 1.042.11.062.16.2.118.323l-.79 2.264a.26.26 0 01-.145.155.246.246 0 01-.21-.009c-.794-.413-1.83-.691-2.579-.691-.647 0-1.099.179-1.38.548-.277.362-.411.928-.411 1.73v1.205h3.997a.26.26 0 01.255.264v2.375a.26.26 0 01-.255.265h-3.997v9.61l2.17.108a.26.26 0 01.243.264v2.259a.26.26 0 01-.255.265h-7.486a.26.26 0 01-.255-.265v-2.142c0-.138.1-.251.232-.263l.89-.084c.485-.054.659-.18.659-.788v-8.964h-2.216a.26.26 0 01-.255-.265v-2.375a.26.26 0 01.255-.264h2.216v-.936c0-2.417.535-5.63 5.162-5.63zm11.643 5.672c1.482 0 2.727.39 3.6 1.128.907.766 1.387 1.884 1.387 3.235 0 2.117-.999 3.663-2.969 4.595-1.355.64-3.17.985-5.394 1.023.088.923.38 1.658.867 2.188.582.631 1.435.951 2.538.951 1.607 0 2.783-.706 3.529-1.236a.256.256 0 01.216-.04c.075.02.136.073.17.145l1.062 2.308c.05.11.022.24-.07.317-.69.585-2.68 1.69-5.26 1.69-4.667 0-7.134-2.689-7.134-7.777 0-2.322.663-4.436 1.866-5.952 1.338-1.685 3.271-2.575 5.592-2.575zm11.576-5.672c.135 0 .245.12.245.269v18.804l1.344.077c.13.008.233.126.233.268v2.29c0 .148-.11.269-.245.269h-6.462c-.135 0-.245-.12-.245-.269v-2.17c0-.14.096-.256.223-.268l.855-.085c.44-.054.637-.178.637-.768V12.143c0-.37-.126-.497-.52-.526l-.908-.056c-.13-.008-.232-.126-.232-.268V8.912c0-.148.11-.269.246-.269zm27.3 6.38c.145 0 .263.12.263.269v2.256c0 .14-.107.258-.245.268l-.8.056c-.145.01-.25.062-.287.145-.038.084-.01.203.076.319l1.536 2.084 1.903-2.515-.79-.059a.267.267 0 01-.244-.267v-2.287c0-.148.118-.268.263-.268h5.893c.145 0 .263.12.263.268v2.226c0 .14-.108.258-.245.268l-.83.056c-.4.024-.653.19-1.046.681l-3.169 4.075 3.746 5.064 1.372.164c.132.016.232.13.232.266v2.26a.266.266 0 01-.263.268h-6.932a.266.266 0 01-.264-.268v-2.257c0-.14.108-.258.247-.267l.858-.057c.179-.009.26-.054.278-.093.023-.05-.007-.178-.126-.34l-1.657-2.212-2.066 2.61.953.062a.266.266 0 01.246.267v2.287a.266.266 0 01-.263.268h-6.042a.266.266 0 01-.263-.268v-2.259c0-.139.102-.253.238-.266l.858-.085c.454-.055.7-.207 1.055-.652l3.319-4.229-3.512-4.94-1.37-.164a.266.266 0 01-.232-.266v-2.2c0-.147.118-.267.263-.267zM134.419 3a7.382 7.382 0 013.107.698 7.571 7.571 0 013.14 2.705 7.744 7.744 0 011.264 3.361c.225 1.769-.09 3.436-.966 4.978-.265.467-.585.902-.884 1.348-.462.69-.928 1.377-1.393 2.065l-2.56 3.79c-.392.583-.783 1.166-1.176 1.747a1.14 1.14 0 01-.156.19c-.226.214-.529.222-.747-.001-.127-.13-.227-.29-.332-.442-.21-.304-.414-.612-.62-.918-.83-1.23-1.657-2.462-2.487-3.692-.547-.81-1.099-1.618-1.643-2.432l-.591-.88a18.163 18.163 0 01-.564-.897c-.475-.815-.751-1.711-.886-2.653a7.931 7.931 0 01.665-4.528 7.88 7.88 0 011.26-1.913 7.648 7.648 0 011.83-1.496 7.354 7.354 0 012.692-.944c.346-.05.698-.059 1.047-.086zM77.084 17.26c-2.23 0-3.165 2.187-3.298 4.12.927-.026 2.19-.148 3.206-.564 1.104-.451 1.663-1.15 1.663-2.078 0-.552-.204-1.479-1.571-1.479zm57.417-2.805l-.122.001c-.471.006-.853.408-.847.894l.036 3.307c.005.486.395.88.866.874l.122-.001c.472-.006.853-.408.848-.894l-.036-3.307c-.005-.486-.395-.88-.867-.874zm2.01-8.463a.425.425 0 00-.308.133l-.872.938s-.455-.086-.836-.098v-.001h-.032c-.476.013-.856.1-.856.1l-.877-.94a.423.423 0 00-.307-.132l-2.492.004a.199.199 0 00-.196.203v.274c0 .13.097.237.224.237l2.137.009a.25.25 0 01.226.149l.46 1c-.32.238-.257 1.022-.213 1.576.013.16.024.3.024.403l-.418.151a.267.267 0 00-.173.24s-.089 2.889-.127 2.981c-.274.512-.384 1.183-.384 2.326 0 1.142.996 2.202 1.33 2.674.071.1.235.056.235-.068 0-.428-.012-.833-.024-1.209-.056-1.835-.09-3 1.422-3.024 1.513.024 1.478 1.188 1.422 3.024-.011.376-.023.78-.023 1.209 0 .124.163.168.234.068.335-.472 1.33-1.532 1.33-2.674 0-1.143-.11-1.814-.383-2.326-.038-.092-.127-2.98-.127-2.98a.267.267 0 00-.174-.24l-.417-.152c0-.103.011-.243.024-.403.044-.554.107-1.338-.213-1.576l.46-1a.253.253 0 01.229-.15l2.174-.008c.127 0 .265-.106.265-.237V6.2c0-.112-.123-.203-.233-.203zm-2.056 1.234c.535.002 1.516.075 1.297 2.33-.247 2.549-.151 4.212-.39 4.02-.24-.193-1.435-.218-1.807-.01-.372.207-.118-1.416-.43-4.013-.27-2.231.758-2.327 1.278-2.327zm.016.666c-.415 0-.75.375-.75.837 0 .462.335.837.75.837.414 0 .75-.375.75-.837 0-.462-.336-.837-.75-.837z"></path></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" fill="none" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><path fill="var(--userLogoColor, #FF3F52)" d="M90.593 29.874h20.547a.547.547 0 00.552-.543v-1.484c0-.3-.247-.543-.552-.543H88.532a.548.548 0 00-.552.543v11.608c0 .3.247.544.552.544h22.608a.547.547 0 00.552-.544v-1.484c0-.3-.247-.543-.552-.543H90.594v-2.49h20.349a.547.547 0 00.552-.543v-1.484c0-.3-.247-.543-.553-.543H90.595V29.87l-.002.004zm-10.04-16.281a.548.548 0 00-.553.543v11.72c0 .3.247.542.553.542h10.536c3.546 0 6.548-2.726 6.653-6.209.11-3.618-2.854-6.596-6.513-6.596H80.553zm2.01 2.518h8.666c2.231 0 4.035 1.824 3.95 4.034-.081 2.104-1.906 3.735-4.047 3.735h-8.57v-7.769zM96.829.012a.548.548 0 00-.553.543v11.598h-.002c0 .3.249.543.553.543h1.511a.548.548 0 00.552-.543v-2.55c0-.3.249-.542.553-.542h7.162l2.221 3.385c.1.154.276.248.463.248h1.797c.437 0 .7-.477.464-.837l-2.212-3.372c1.416-.779 2.374-2.269 2.364-3.975-.014-2.474-2.184-4.498-4.703-4.498h-10.17zm2.062 2.571h8.137c1 0 1.897.694 2.039 1.666.177 1.205-.775 2.244-1.968 2.244H98.89h.001v-3.91zM88.963 0a.562.562 0 00-.539.393l-3.577 11.61-.003-.002c-.108.349.157.7.528.7h1.579a.553.553 0 00.528-.385l.47-1.525a.561.561 0 01.54-.393h3.26a.561.561 0 01.533.372l.552 1.567a.552.552 0 00.522.366h1.582c.388 0 .66-.375.533-.734L91.387.366A.55.55 0 0090.865 0h-1.901zm1.021 4.564a.154.154 0 01.151.103l1.114 3.164h-2.384V7.83l.973-3.158a.153.153 0 01.146-.108zM115.17 2.57h4.273a.547.547 0 00.552-.544V.543c0-.3-.247-.543-.552-.543h-6.335a.548.548 0 00-.553.543v11.609c0 .299.247.543.553.543h6.335a.547.547 0 00.552-.543v-1.485a.548.548 0 00-.552-.543h-4.273v-2.49h4.068a.548.548 0 00.553-.543V5.607c0-.3-.247-.543-.553-.543h-4.068V2.569zM80.553 12.694h3.008a.548.548 0 00.552-.544v-1.484a.548.548 0 00-.552-.543h-.946V.543c0-.3-.247-.543-.553-.543h-1.51A.548.548 0 0080 .543v11.609c0 .299.247.543.553.543v-.001zm38.89 24.735h-6.335a.548.548 0 00-.553.543v1.484c0 .3.247.543.553.543h6.335a.547.547 0 00.552-.543v-1.484c0-.3-.247-.543-.552-.543zM105.1 13.446c-3.675 0-6.666 2.939-6.666 6.55 0 3.611 2.991 6.55 6.666 6.55h.087c3.675 0 6.666-2.938 6.666-6.55 0-3.611-2.99-6.55-6.666-6.55h-.087zm-.003 2.523h.09c2.26 0 4.099 1.808 4.099 4.027 0 2.22-1.84 4.026-4.099 4.026h-.09c-2.26 0-4.098-1.805-4.098-4.026 0-2.22 1.839-4.027 4.098-4.027zM86.574 27.298h-6.022a.547.547 0 00-.552.543v1.496c0 .3.247.542.553.542h1.73v9.577c0 .3.246.544.552.544h1.459a.548.548 0 00.553-.544V29.88h1.73a.549.549 0 00.552-.543V27.84c0-.3-.247-.543-.553-.543l-.002.001zm33.422-13.163V32.89c0 2.05-1.728 3.712-3.827 3.654-2.026-.056-3.612-1.744-3.612-3.736V14.135c0-.3.247-.543.553-.543h1.51c.306 0 .553.243.553.543v18.713c0 .561.464 1.091 1.035 1.127a1.098 1.098 0 001.176-1.084V14.135c0-.3.247-.543.552-.543h1.511c.305 0 .553.243.553.543h-.004z"></path><title>Laredoute logo</title></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" fill="none" className="UserLogo variant-- " preserveAspectRatio="xMidYMid meet" viewBox="0 0 200 40"><path fill="var(--userLogoColor, #000)" fillRule="evenodd" d="M104.482 20.235c0-8.206 5.8-13.103 13.313-13.103 6.723 0 11.205 3.441 11.205 8.206 0 4.5-3.823 7.412-8.041 7.412-2.373 0-4.086-.397-5.273-1.323-.395-.398-.659-.265-.659.132 0 1.72.659 3.044 1.714 4.235.923.927 2.636 1.588 4.218 1.588a9.742 9.742 0 004.482-1.059c1.318-.661 2.373-.396 3.032.662.791 1.192-.264 2.78-1.187 3.838-1.713 1.853-5.009 3.177-9.227 3.177-8.568-.265-13.577-6.088-13.577-13.765zM86.95 25.662c.79 0 1.318.397 1.846 1.323l2.372 3.838c.923 1.456 1.714 2.515 3.427 2.515 1.714 0 2.637-.662 3.428-2.647 1.054-2.382 2.241-5.426 3.163-9.397 1.187-4.5 1.714-7.147 1.714-9.397s-.659-3.573-3.164-3.97C96.441 7.264 91.827 7 86.95 7s-9.49.265-12.786.794C71.659 8.324 71 9.647 71 11.897s.527 4.897 1.582 9.397c1.054 3.97 2.109 6.883 3.164 9.397.922 1.985 1.713 2.647 3.427 2.647 1.713 0 2.504-1.059 3.427-2.515l2.373-3.838c.659-.794 1.186-1.323 1.977-1.323z" clipRule="evenodd"></path><title>WeTransfer logo</title></svg>

          </div>
        </section>
      </div>
    </div>

  )
}

const App = () => {
  return <Scene />
}

export default App;
