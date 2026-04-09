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

                float grain = noise( vUv * 600.0 + time * 0.05 );
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
        `,transparent:!0,side:THREE.DoubleSide});this.sun=new THREE.Mesh(e,t),this.scene.add(this.sun)}addLighting(){this.scene.add(new THREE.AmbientLight(4210752));var e=new THREE.DirectionalLight(16777215,.5);e.position.set(1,1,1),this.scene.add(e)}updateCamera(e,t){e/=t,t=1.15/(Math.tan(Math.PI/180*37.5)*e);this.camera.position.z=Math.max(3,t),this.camera.aspect=e,this.camera.updateProjectionMatrix()}setupResizeHandler(){window.addEventListener("resize",()=>{var e=this.container.offsetWidth,t=this.container.offsetHeight;this.updateCamera(e,t),this.renderer.setSize(e,t)})}animate(){requestAnimationFrame(()=>this.animate()),this.sun.rotation.y+=.005,this.sun.rotation.x+=.002,this.sun.material.uniforms.time.value=.001*performance.now(),this.renderer.render(this.scene,this.camera)}}class NightSky{constructor(e){this.container=document.getElementById(e),this.container&&"undefined"!=typeof THREE&&(this.mouseX=0,this.mouseY=0,this.targetMouseX=0,this.targetMouseY=0,this.scene=new THREE.Scene,this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),this.renderer=new THREE.WebGLRenderer({antialias:!1}),this.renderer.setSize(this.container.offsetWidth,this.container.offsetHeight),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.container.appendChild(this.renderer.domElement),this.createSky(),this.setupResizeHandler(),this.setupMouseHandler(),this.animate())}createSky(){var e=new THREE.PlaneGeometry(2,2);this.material=new THREE.ShaderMaterial({uniforms:{time:{value:0},resolution:{value:new THREE.Vector2(this.container.offsetWidth,this.container.offsetHeight)},mouse:{value:new THREE.Vector2(0,0)}},vertexShader:`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4( position.xy, 0.0, 1.0 );
            }
        `,fragmentShader:`
            uniform float time;
            uniform vec2 resolution;
            uniform vec2 mouse;
            varying vec2 vUv;

            float hash21( vec2 p ) {
                p = fract( p * vec2( 123.34, 456.21 ) );
                p += dot( p, p + 45.32 );
                return fract( p.x * p.y );
            }

            float noise( vec2 p ) {
                vec2 i = floor( p );
                vec2 f = fract( p );
                f = f * f * ( 3.0 - 2.0 * f );
                return mix(
                    mix( hash21( i ),               hash21( i + vec2( 1.0, 0.0 ) ), f.x ),
                    mix( hash21( i + vec2( 0.0, 1.0 ) ), hash21( i + vec2( 1.0, 1.0 ) ), f.x ),
                    f.y
                );
            }

            float fbm( vec2 p ) {
                float v = 0.0;
                float a = 0.5;
                mat2 m = mat2( 1.6, 1.2, -1.2, 1.6 );
                for ( int i = 0; i < 5; i++ ) {
                    v += a * noise( p );
                    p = m * p;
                    a *= 0.5;
                }
                return v;
            }

            float starLayer( vec2 uv, float scale, float probability, float size ) {
                vec2 cell    = floor( uv * scale );
                vec2 cellPos = fract( uv * scale ) - 0.5;
                float rnd = hash21( cell );
                if ( rnd > probability ) return 0.0;
                vec2 offset    = vec2( hash21( cell + 0.3 ) - 0.5, hash21( cell + 0.7 ) - 0.5 ) * 0.6;
                float dist     = length( cellPos - offset );
                float bri      = 0.5 + 0.5 * hash21( cell + 1.5 );
                float twinkle  = 0.75 + 0.25 * sin( time * ( 0.5 + bri * 2.0 ) + rnd * 6.28318 );
                return smoothstep( size, 0.0, dist ) * bri * twinkle;
            }

            void main() {
                float aspect = resolution.x / resolution.y;
                vec2 uv = ( vUv - 0.5 ) * vec2( aspect, 1.0 );

                // Slow sky rotation
                float angle = time * 0.015;
                float c = cos( angle );
                float s = sin( angle );
                uv = vec2( c * uv.x - s * uv.y, s * uv.x + c * uv.y );

                // Mouse parallax
                uv += mouse * 0.04;

                // === Milky Way ===
                float bandAngle = 1.1;
                float bandDist  = abs( uv.x * sin( bandAngle ) - uv.y * cos( bandAngle ) );
                float bandMask  = exp( -bandDist * bandDist * 3.5 );

                float nebula  = fbm( uv * 1.8 + vec2(  0.5,  0.3 ) ) * bandMask;
                float nebula2 = fbm( uv * 3.5 + vec2( -0.2,  0.8 ) ) * bandMask * 0.6;
                float nebulaTotal = nebula + nebula2;

                vec3 nebulaColor = mix(
                    vec3( 0.0,  0.02, 0.10 ),
                    vec3( 0.2,  0.25, 0.55 ),
                    clamp( nebulaTotal * 1.2, 0.0, 1.0 )
                );
                // Warm galactic core tint
                nebulaColor += vec3( 0.15, 0.10, 0.03 ) * smoothstep( 0.35, 0.75, nebula );

                // === Stars ===
                float mwBoost = 1.0 + bandMask * 1.6;

                float starBri = 0.0;
                starBri += starLayer( uv,  12.0, 0.04 * mwBoost, 0.045 );
                starBri += starLayer( uv,  25.0, 0.07 * mwBoost, 0.028 ) * 0.75;
                starBri += starLayer( uv,  55.0, 0.10 * mwBoost, 0.016 ) * 0.45;
                starBri += starLayer( uv, 110.0, 0.14 * mwBoost, 0.009 ) * 0.25;

                vec3 starColor = vec3( 0.85, 0.92, 1.0 ) * starBri;

                // Warm (orange) and cool (blue) colored stars
                starColor += vec3( 1.0, 0.65, 0.35 ) * starLayer( uv + 5.0, 10.0, 0.04, 0.04 ) * 0.4;
                starColor += vec3( 0.55, 0.75, 1.0 ) * starLayer( uv - 3.0, 10.0, 0.04, 0.04 ) * 0.4;

                // === Compose ===
                vec3 bgColor    = vec3( 0.01, 0.01, 0.04 );
                vec3 finalColor = bgColor + nebulaColor * 0.45 + starColor;

                gl_FragColor = vec4( finalColor, 1.0 );
            }
        `}),this.plane=new THREE.Mesh(e,this.material),this.scene.add(this.plane)}setupMouseHandler(){this.container.addEventListener("mousemove",e=>{var t=this.container.getBoundingClientRect();this.targetMouseX=(e.clientX-t.left)/t.width*2-1,this.targetMouseY=-((e.clientY-t.top)/t.height*2-1)}),this.container.addEventListener("mouseleave",()=>{this.targetMouseX=0,this.targetMouseY=0})}setupResizeHandler(){window.addEventListener("resize",()=>{var e=this.container.offsetWidth,t=this.container.offsetHeight;this.renderer.setSize(e,t),this.material.uniforms.resolution.value.set(e,t)})}animate(){requestAnimationFrame(()=>this.animate()),this.mouseX+=.05*(this.targetMouseX-this.mouseX),this.mouseY+=.05*(this.targetMouseY-this.mouseY),this.material.uniforms.time.value=.001*performance.now(),this.material.uniforms.mouse.value.set(this.mouseX,this.mouseY),this.renderer.render(this.scene,this.camera)}}class App{constructor(){this.startX,this.startY,this.startTime,this.scrollLeft,this.arrowStep=100,this.spaceStep=.8*window.innerWidth,this.batteryLevel=document.getElementById("battery-level"),this.location=document.getElementById("location"),this.targetScrollLeft=0,this.currentScrollLeft=0,this.scrollVelocity=0,this.isScrolling=!1,this.easing=.15,this.velocityFriction=.9,this.wheelMultiplier=.3,this.scrollOffset=.5,this.tapThreshold=10,this.tapTimeThreshold=300,this.isTouchDevice=window.matchMedia("(pointer: coarse)").matches,this.hasScrolled=!1,this.bindEvents(),this.setHeight(),this.fitHeaderText(),this.bouncePhoto(),this.logStuff()}bindEvents(){window.addEventListener("resize",this.fitHeaderText.bind(this)),document.addEventListener("touchstart",this.handleTouchScrollStart.bind(this),{passive:!0}),this.isTouchDevice?(document.addEventListener("touchmove",this.handleTouchScrollToTap.bind(this),{passive:!1}),document.addEventListener("touchend",this.handleTouchScrollEnd.bind(this),{passive:!0})):document.addEventListener("touchmove",this.handleTouchScrollMove.bind(this),{passive:!1}),document.addEventListener("keydown",this.handleKeyScroll.bind(this)),window.addEventListener("wheel",this.handleWheelScroll.bind(this),{passive:!1})}bouncePhoto(){let c=document.querySelector(".header"),d=document.querySelector(".header__photo");if(c&&d){let a=Math.random()*(c.offsetWidth-d.offsetWidth),s=Math.random()*(c.offsetHeight-d.offsetHeight),r=1.2,n=.9,l=0,h=()=>{var e=c.offsetWidth,t=c.offsetHeight,i=d.offsetWidth,o=d.offsetHeight;a+=r,s+=n,a<=0&&(a=0,r=Math.abs(r)),a+i>=e&&(a=e-i,r=-Math.abs(r)),s<=0&&(s=0,n=Math.abs(n)),s+o>=t&&(s=t-o,n=-Math.abs(n)),l+=.5,d.style.transform=`rotate(${l}deg)`,d.style.left=a+"px",d.style.top=s+"px",requestAnimationFrame(h)};h()}}fitHeaderText(){var i=document.querySelector(".header__about"),o=i&&i.querySelector("h1");if(i&&o){var a=i.clientHeight;let e=10,t=300;for(o.style.fontSize="";e<t-1;){var s=Math.floor((e+t)/2);o.style.fontSize=s+"px",o.scrollHeight<=a?e=s:t=s}o.style.fontSize=e+"px"}}setHeight(){window.matchMedia("(pointer: coarse)").matches&&(document.getElementById("container").style.height=window.innerHeight+"px")}logStuff(){var e=Array(10).join("☃"),t='color: #fff; text-shadow: 0px -1px 4px white, 0px -2px 10px yellow, 0px -10px 20px #ff8000, 0px -18px 40px red; font: 80px "Comic Sans";';console.log("%c "+e,t),console.log("%c Snow glad to see you",t),console.log("%c "+e,t)}logSize(){var e,t;"#size"===window.location.hash&&(e=document.createElement("div"),Object.assign(e.style,{position:"fixed",bottom:"20px",right:"20px",backgroundColor:"rgba(0, 0, 0, 0.7)",color:"white",fontFamily:"monospace",fontSize:"14px",padding:"10px",borderRadius:"5px",zIndex:"9999"}),document.body.appendChild(e),t=window.innerWidth,e.textContent=`Window: ${t}px × ${window.innerHeight}px`)}handleTouchScrollStart(e){this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.startTime=Date.now(),this.hasScrolled=!1}handleTouchScrollMove(e){e.preventDefault();var t=Math.abs(this.startX-e.touches[0].clientX),i=Math.abs(this.startY-e.touches[0].clientY);(10<t||10<i)&&(i<t?window.scrollBy({left:(this.startX-e.touches[0].clientX)*this.scrollOffset,behavior:"auto"}):window.scrollBy({left:(this.startY-e.touches[0].clientY)*this.scrollOffset,behavior:"auto"}))}handleTouchScrollToTap(e){e.preventDefault();var t=e.touches[0].clientX,e=e.touches[0].clientY,t=this.startX-t,e=this.startY-e;(Math.abs(t)>this.tapThreshold||Math.abs(e)>this.tapThreshold)&&!this.hasScrolled&&(this.hasScrolled=!0,t=Math.abs(t)>Math.abs(e)?t:e,window.scrollBy({left:window.innerWidth*(0<t?1:-1),behavior:"smooth"}))}handleTouchScrollEnd(e){var t,i,o;this.hasScrolled||(t=e.changedTouches[0].clientX,e=e.changedTouches[0].clientY,i=Date.now(),o=Math.abs(this.startX-t),e=Math.abs(this.startY-e),i=i-this.startTime,o<this.tapThreshold&&e<this.tapThreshold&&i<this.tapTimeThreshold&&(o=window.innerWidth/2,window.scrollBy({left:window.innerWidth*(t<o?-1:1),behavior:"smooth"})))}handleKeyScroll(e){if(" "==e.key||"Space"==e.code||32==e.keyCode)e.preventDefault(),e.shiftKey?window.scrollBy({left:-this.spaceStep,behavior:"smooth"}):window.scrollBy({left:this.spaceStep,behavior:"smooth"});else switch(e.key){case"ArrowUp":case"ArrowLeft":e.preventDefault(),e.metaKey?window.scrollTo({left:0,behavior:"smooth"}):window.scrollBy({left:-this.arrowStep,behavior:"smooth"});break;case"ArrowDown":case"ArrowRight":e.preventDefault(),e.metaKey?window.scrollTo({left:document.body.scrollWidth,behavior:"smooth"}):window.scrollBy({left:this.arrowStep,behavior:"smooth"})}}handleWheelScroll(e){e.preventDefault();e=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;this.scrollVelocity+=e*this.wheelMultiplier,this.isScrolling||(this.isScrolling=!0,this.targetScrollLeft=window.scrollX,this.smoothScroll())}smoothScroll(){this.scrollVelocity*=this.velocityFriction,this.targetScrollLeft+=this.scrollVelocity;var e=document.documentElement.scrollWidth-window.innerWidth,e=Math.max(0,Math.min(e,this.targetScrollLeft)),e=(e!==this.targetScrollLeft&&(this.targetScrollLeft=e,this.scrollVelocity=0),this.targetScrollLeft-window.scrollX);.5<Math.abs(e)||.5<Math.abs(this.scrollVelocity)?(window.scrollBy(e*this.easing,0),requestAnimationFrame(()=>this.smoothScroll())):(this.isScrolling=!1,this.targetScrollLeft=window.scrollX,this.scrollVelocity=0)}createScrollSettings(){let s=document.createElement("div");s.id="scroll-settings-panel",s.style.cssText=`
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
        `,s.appendChild(e);[{name:"arrowStep",label:"Arrow Step",min:10,max:500,step:10},{name:"easing",label:"Easing",min:.01,max:.5,step:.01},{name:"velocityFriction",label:"Velocity Friction",min:.7,max:.99,step:.01},{name:"scrollOffset",label:"Touch Offset",min:.1,max:2,step:.1},{name:"tapThreshold",label:"Tap Threshold (px)",min:5,max:50,step:5},{name:"tapTimeThreshold",label:"Tap Time (ms)",min:100,max:1e3,step:50}].forEach(t=>{var e=document.createElement("div"),i=(e.style.cssText="margin-bottom: 15px;",document.createElement("div")),o=(i.style.cssText="display: flex; justify-content: space-between; margin-bottom: 5px;",document.createElement("label"));o.textContent=t.label,o.style.cssText="color: #aaa;";let a=document.createElement("span");a.textContent=this[t.name],a.style.cssText="color: #0f0; font-weight: bold;",i.appendChild(o),i.appendChild(a);o=document.createElement("input");o.type="range",o.min=t.min,o.max=t.max,o.step=t.step,o.value=this[t.name],o.style.cssText="width: 100%; cursor: pointer;",o.addEventListener("input",e=>{e=parseFloat(e.target.value);this[t.name]=e,a.textContent=e}),e.appendChild(i),e.appendChild(o),s.appendChild(e)});let i=document.createElement("button"),t=(i.textContent="Hide",i.style.cssText=`
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            font-family: monospace;
        `,!1);s.querySelector("div").parentElement;i.addEventListener("click",()=>{(t=!t)?(Array.from(s.children).forEach((e,t)=>{0<t&&e!==i&&(e.style.display="none")}),i.textContent="Show",s.style.minWidth="120px"):(Array.from(s.children).forEach(e=>{e.style.display=""}),i.textContent="Hide",s.style.minWidth="280px")}),s.appendChild(i),document.body.appendChild(s),s.addEventListener("keydown",e=>{"ArrowUp"!==e.key&&"ArrowDown"!==e.key&&"ArrowLeft"!==e.key&&"ArrowRight"!==e.key&&" "!==e.key&&"Space"!==e.key||(e.preventDefault(),e.stopPropagation(),this.handleKeyScroll(e))}),document.addEventListener("keydown",e=>{"s"===e.key&&e.shiftKey&&e.metaKey&&(e.preventDefault(),s.style.display="none"===s.style.display?"":"none")})}async fetchLocalData(){try{var e=await fetch("https://us-central1-projects-342417.cloudfunctions.net/battery");if(!e.ok)throw new Error("Network response was not ok "+e.statusText);var t=await e.json();this.batteryLevel.textContent=`Battery: ${t.batteryLevel}%`,this.location.textContent="Location: "+t.location}catch(e){console.error("There was a problem with the fetch operation:",e),this.batteryLevel.innerHTML="",this.location.innerHTML=""}}}document.addEventListener("DOMContentLoaded",()=>{new SunOrb("header-sun"),new NightSky("footer-moon"),new App});