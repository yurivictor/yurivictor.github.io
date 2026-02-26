class SunOrb{constructor(e){this.container=document.getElementById(e),this.container&&"undefined"!=typeof THREE&&(this.scene=new THREE.Scene,this.camera=new THREE.PerspectiveCamera(75,this.container.offsetWidth/this.container.offsetHeight,.1,1e3),this.renderer=new THREE.WebGLRenderer({antialias:!0,alpha:!0}),this.renderer.setClearColor(0,0),this.renderer.setSize(this.container.offsetWidth,this.container.offsetHeight),this.container.appendChild(this.renderer.domElement),this.createSun(),this.addLighting(),this.updateCamera(this.container.offsetWidth,this.container.offsetHeight),this.setupResizeHandler(),this.animate())}createSun(){var e=new THREE.SphereGeometry(1,64,64),t=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`
            uniform float time;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vUv = uv;
                vNormal = normalize( normalMatrix * normal );
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                vPosition = mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,fragmentShader:`
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;

            float noise( vec2 p ) {
                return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
            }

            void main() {
                vec2 center = vec2( 0.5, 0.5 );
                float dist = length( vUv - center );

                float gradient = smoothstep( 0.5, 0.0, dist );

                float grain = noise( vUv * 600.0 );
                grain = ( grain - 0.5 ) * 0.15;

                float pulse = 0.02 * sin( time * 0.5 );
                gradient = gradient + pulse;

                vec3 centerColor = vec3( 205.0/255.0, 170.0/255.0,  95.0/255.0 );
                vec3 midColor    = vec3( 220.0/255.0, 190.0/255.0, 125.0/255.0 );
                vec3 edgeColor   = vec3( 200.0/255.0, 165.0/255.0, 100.0/255.0 );

                vec3 finalColor;
                if ( gradient > 0.3 ) {
                    finalColor = mix( midColor, centerColor, ( gradient - 0.3 ) / 0.7 );
                } else {
                    finalColor = mix( edgeColor, midColor, gradient / 0.3 );
                }

                finalColor += grain;

                vec3 viewDirection = normalize( vPosition );
                float fresnel = abs( dot( viewDirection, vNormal ) );
                float alpha = smoothstep( 0.0, 0.4, fresnel ) * smoothstep( 0.55, 0.0, dist );

                gl_FragColor = vec4( finalColor, alpha );
            }
        `,transparent:!0,side:THREE.DoubleSide});this.sun=new THREE.Mesh(e,t),this.scene.add(this.sun)}addLighting(){this.scene.add(new THREE.AmbientLight(4210752));var e=new THREE.DirectionalLight(16777215,.5);e.position.set(1,1,1),this.scene.add(e)}updateCamera(e,t){e/=t,t=1.15/(Math.tan(Math.PI/180*37.5)*e);this.camera.position.z=Math.max(3,t),this.camera.aspect=e,this.camera.updateProjectionMatrix()}setupResizeHandler(){window.addEventListener("resize",()=>{var e=this.container.offsetWidth,t=this.container.offsetHeight;this.updateCamera(e,t),this.renderer.setSize(e,t)})}animate(){requestAnimationFrame(()=>this.animate()),this.sun.rotation.y+=.005,this.sun.rotation.x+=.002,this.sun.material.uniforms.time.value=.001*performance.now(),this.renderer.render(this.scene,this.camera)}}class App{constructor(){this.startX,this.startY,this.startTime,this.scrollLeft,this.arrowStep=100,this.spaceStep=.8*window.innerWidth,this.batteryLevel=document.getElementById("battery-level"),this.location=document.getElementById("location"),this.targetScrollLeft=0,this.currentScrollLeft=0,this.scrollVelocity=0,this.isScrolling=!1,this.easing=.15,this.velocityFriction=.9,this.wheelMultiplier=.3,this.scrollOffset=.5,this.tapThreshold=10,this.tapTimeThreshold=300,this.isTouchDevice=window.matchMedia("(pointer: coarse)").matches,this.hasScrolled=!1,this.bindEvents(),this.setHeight(),this.logStuff()}bindEvents(){document.addEventListener("touchstart",this.handleTouchScrollStart.bind(this),{passive:!0}),this.isTouchDevice?(document.addEventListener("touchmove",this.handleTouchScrollToTap.bind(this),{passive:!1}),document.addEventListener("touchend",this.handleTouchScrollEnd.bind(this),{passive:!0})):document.addEventListener("touchmove",this.handleTouchScrollMove.bind(this),{passive:!1}),document.addEventListener("keydown",this.handleKeyScroll.bind(this)),window.addEventListener("wheel",this.handleWheelScroll.bind(this),{passive:!1})}setHeight(){window.matchMedia("(pointer: coarse)").matches&&(document.getElementById("container").style.height=window.innerHeight+"px")}logStuff(){var e=Array(10).join("☃"),t='color: #fff; text-shadow: 0px -1px 4px white, 0px -2px 10px yellow, 0px -10px 20px #ff8000, 0px -18px 40px red; font: 80px "Comic Sans";';console.log("%c "+e,t),console.log("%c Snow glad to see you",t),console.log("%c "+e,t)}logSize(){var e,t;"#size"===window.location.hash&&(e=document.createElement("div"),Object.assign(e.style,{position:"fixed",bottom:"20px",right:"20px",backgroundColor:"rgba(0, 0, 0, 0.7)",color:"white",fontFamily:"monospace",fontSize:"14px",padding:"10px",borderRadius:"5px",zIndex:"9999"}),document.body.appendChild(e),t=window.innerWidth,e.textContent=`Window: ${t}px × ${window.innerHeight}px`)}handleTouchScrollStart(e){this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.startTime=Date.now(),this.hasScrolled=!1}handleTouchScrollMove(e){e.preventDefault();var t=Math.abs(this.startX-e.touches[0].clientX),i=Math.abs(this.startY-e.touches[0].clientY);(10<t||10<i)&&(i<t?window.scrollBy({left:(this.startX-e.touches[0].clientX)*this.scrollOffset,behavior:"auto"}):window.scrollBy({left:(this.startY-e.touches[0].clientY)*this.scrollOffset,behavior:"auto"}))}handleTouchScrollToTap(e){e.preventDefault();var t=e.touches[0].clientX,e=e.touches[0].clientY,t=this.startX-t,e=this.startY-e;(Math.abs(t)>this.tapThreshold||Math.abs(e)>this.tapThreshold)&&!this.hasScrolled&&(this.hasScrolled=!0,t=Math.abs(t)>Math.abs(e)?t:e,window.scrollBy({left:window.innerWidth*(0<t?1:-1),behavior:"smooth"}))}handleTouchScrollEnd(e){var t,i,o;this.hasScrolled||(t=e.changedTouches[0].clientX,e=e.changedTouches[0].clientY,i=Date.now(),o=Math.abs(this.startX-t),e=Math.abs(this.startY-e),i=i-this.startTime,o<this.tapThreshold&&e<this.tapThreshold&&i<this.tapTimeThreshold&&(o=window.innerWidth/2,window.scrollBy({left:window.innerWidth*(t<o?-1:1),behavior:"smooth"})))}handleKeyScroll(e){if(" "==e.key||"Space"==e.code||32==e.keyCode)e.preventDefault(),e.shiftKey?window.scrollBy({left:-this.spaceStep,behavior:"smooth"}):window.scrollBy({left:this.spaceStep,behavior:"smooth"});else switch(e.key){case"ArrowUp":case"ArrowLeft":e.preventDefault(),e.metaKey?window.scrollTo({left:0,behavior:"smooth"}):window.scrollBy({left:-this.arrowStep,behavior:"smooth"});break;case"ArrowDown":case"ArrowRight":e.preventDefault(),e.metaKey?window.scrollTo({left:document.body.scrollWidth,behavior:"smooth"}):window.scrollBy({left:this.arrowStep,behavior:"smooth"})}}handleWheelScroll(e){e.preventDefault();e=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;this.scrollVelocity+=e*this.wheelMultiplier,this.isScrolling||(this.isScrolling=!0,this.targetScrollLeft=window.scrollX,this.smoothScroll())}smoothScroll(){this.scrollVelocity*=this.velocityFriction,this.targetScrollLeft+=this.scrollVelocity;var e=this.targetScrollLeft-window.scrollX;.5<Math.abs(e)||.5<Math.abs(this.scrollVelocity)?(window.scrollBy(e*this.easing,0),requestAnimationFrame(()=>this.smoothScroll())):(this.isScrolling=!1,this.targetScrollLeft=window.scrollX,this.scrollVelocity=0)}createScrollSettings(){let s=document.createElement("div");s.id="scroll-settings-panel",s.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 280px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;var e=document.createElement("div");e.textContent="Scroll Settings",e.style.cssText=`
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        `,s.appendChild(e);[{name:"arrowStep",label:"Arrow Step",min:10,max:500,step:10},{name:"easing",label:"Easing",min:.01,max:.5,step:.01},{name:"velocityFriction",label:"Velocity Friction",min:.7,max:.99,step:.01},{name:"scrollOffset",label:"Touch Offset",min:.1,max:2,step:.1},{name:"tapThreshold",label:"Tap Threshold (px)",min:5,max:50,step:5},{name:"tapTimeThreshold",label:"Tap Time (ms)",min:100,max:1e3,step:50}].forEach(t=>{var e=document.createElement("div"),i=(e.style.cssText="margin-bottom: 15px;",document.createElement("div")),o=(i.style.cssText="display: flex; justify-content: space-between; margin-bottom: 5px;",document.createElement("label"));o.textContent=t.label,o.style.cssText="color: #aaa;";let n=document.createElement("span");n.textContent=this[t.name],n.style.cssText="color: #0f0; font-weight: bold;",i.appendChild(o),i.appendChild(n);o=document.createElement("input");o.type="range",o.min=t.min,o.max=t.max,o.step=t.step,o.value=this[t.name],o.style.cssText="width: 100%; cursor: pointer;",o.addEventListener("input",e=>{e=parseFloat(e.target.value);this[t.name]=e,n.textContent=e}),e.appendChild(i),e.appendChild(o),s.appendChild(e)});let i=document.createElement("button"),t=(i.textContent="Hide",i.style.cssText=`
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            font-family: monospace;
        `,!1);s.querySelector("div").parentElement;i.addEventListener("click",()=>{(t=!t)?(Array.from(s.children).forEach((e,t)=>{0<t&&e!==i&&(e.style.display="none")}),i.textContent="Show",s.style.minWidth="120px"):(Array.from(s.children).forEach(e=>{e.style.display=""}),i.textContent="Hide",s.style.minWidth="280px")}),s.appendChild(i),document.body.appendChild(s),s.addEventListener("keydown",e=>{"ArrowUp"!==e.key&&"ArrowDown"!==e.key&&"ArrowLeft"!==e.key&&"ArrowRight"!==e.key&&" "!==e.key&&"Space"!==e.key||(e.preventDefault(),e.stopPropagation(),this.handleKeyScroll(e))}),document.addEventListener("keydown",e=>{"s"===e.key&&e.shiftKey&&e.metaKey&&(e.preventDefault(),s.style.display="none"===s.style.display?"":"none")})}async fetchLocalData(){try{var e=await fetch("https://us-central1-projects-342417.cloudfunctions.net/battery");if(!e.ok)throw new Error("Network response was not ok "+e.statusText);var t=await e.json();this.batteryLevel.textContent=`Battery: ${t.batteryLevel}%`,this.location.textContent="Location: "+t.location}catch(e){console.error("There was a problem with the fetch operation:",e),this.batteryLevel.innerHTML="",this.location.innerHTML=""}}}document.addEventListener("DOMContentLoaded",()=>{new SunOrb("header-sun"),new App});