<div width="100%">
    <svg fill="none" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
    <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P');

                body {
                    background: #1b1b1b none repeat scroll 0 0;
                    margin: 0;
                    min-height: 100% !important;
                    height:100% !important;
                    min-width: 100% !important;
                    width: 100% !important;
                }

                @font-face {
                    src: url(https://fonts.googleapis.com/css2?family=Press+Start+2P);
                    font-family: "Terminal";
                }

                .screen::before {
                    background: transparent linear-gradient(to bottom, #56565666 0%, #22262d88 100%) repeat scroll 0 0;
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate3d(-50%, -50%, 0);
                    min-width: 100%;
                    width:100% !important;
                    font-weight: 600;
                    min-height: 100%;
                    height:100%;
                    z-index: -1;
                }

                .scanlines .overlay {
                    min-height: 100%;
                    height:100%;
                    left: 0;
                    position: absolute;
                    top: 0;
                    min-width: 100%;
                    width:100%;
                    opeacity: 0.35;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .scanlines .overlay::after {
                    position: absolute;
                    left: 0;
                    top: 0;
                    min-width: 100%;
                    min-height: 100%;
                    background-image: url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/86186/crt.png");
                    background-repeat: repeat;
                    background-blend-mode: color-burn;
                    content: "";
                }

                .scanlines .overlay::before {
                    position: absolute;
                    width: 100%;
                    min-width:100%;
                    min-height:100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    right: 0;
                    content: " ";
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.125) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
                    z-index: 2;
                    background-size: 100% 2px, 3px 100%;
                    pointer-events: none;
                    background-repeat: repeat;
                }

                .picture {
                    min-height: 100%;
                    overflow: hidden;
                    min-width: 100%;
                    z-index: -1;
                    transform: scale(3, 3);
                    background: transparent linear-gradient(to bottom, #8b9cbecc 0%, #323431aa 100%);
                    background-repeat: repeat;
                }

                .menu {
                    opacity: 0;
                    background-color: #0badff;
                    box-sizing: border-box;
                    font-family: "Press Start 2P";
                    opacity: 0.86;
                    font-size: 60% !important;
                    height: auto;
                    text-align: center;
                    text-transform: uppercase;
                    width: 63%;
                    text-shadow: 2px 2px 0 #000000, -3px -3px 0 #000000, 2px -2px 0 #000000, -3px 3px 0 #000000;
                    filter: blur(1.5px);
                    color: #f4f4f4;
                    -webkit-animation: jerkup 100ms infinite;
                    background-repeat: no-repeat;
                    overflow: hidden;
                    animation: jerkup 100ms infinite;
                }

                .menu header {
                    color: #ffffaf;
                    margin-bottom: 10px;
                    margin-top: 10px;
                    padding: 5px 5px 10px 10px;
                    -webkit-animation: 1s ease 200ms normal none infinite running glitch;
                    animation: 2s ease 200ms normal none infinite running glitch;
                    font-weight: 900;
                    font-shadow: #f4f4f4 0.55rem 0.55rem solid;
                    font-size: 1.85rem;
                }

                .menu ul {
                    margin: 0;
                    padding: 0;
                    -webkit-animation: 5s ease 2000ms normal none infinite running glitch;
                    animation: 5s ease 2000ms normal none infinite running glitch;
                }

                .menu ul li {
                    box-sizing: border-box;
                    list-style: outside none none;
                    padding: 3px;
                }

                .menu ul li.active {
                    background-color: #f4f4f466;
                    text-shadow: 0.5rem 0.5rem solid #1b1d24cc;
                }

                .menu ul li  {
                    color: #fff;
                    font-size: 1.75rem;
                    text-decoration: none;
                }

                .menu footer {
                    background-color: #00ffcc;
                    display: inline-flex;
                    margin-top: 5px;
                    padding: 12.5px 15px;
                    -webkit-animation: 15s ease 4000ms normal none infinite running glitch;
                    animation: 15s ease 4000ms normal none infinite running glitch;
                }

                .menu footer::after {
                    clear: both;
                    content: " ";
                    display: table;
                }

                .menu footer .key {
                    padding: 0.5rem;
                    width: 30%;
                    font-size: 65% !important;
                    font-weight: 900;

                }
               a {
                    background-color: #555555 !important;
                    border: 1px solid #f4f4f4 !important;
                    font-size: 1rem;
                    border-radius: 0.5rem;
                    display: inline-block;
                    padding: 1rem;

                }
                
                .faded {
                    color: #727f96
                }
                .on .picture {
                    -webkit-animation: 6000ms linear 0ms normal forwards 1 running on;
                    animation: 6000ms linear 0ms normal forwards 1 running on;
                }

                .off .picture {
                    -webkit-animation: 1750ms cubic-bezier(0.23, 1, 0.32, 1) 0ms normal forwards 1 running off;
                    animation: 1750ms cubic-bezier(0.23, 1, 0.32, 1) 0ms normal forwards 3 running off;
                }

                .text {
                    color: #E42026;
                    content: "AUX";
                    opacity: 0;
                    filter: blur(0.35px); 
                    font-size: 90%; 
                    left: 5%;
                    position: absolute;
                    text-shadow: 0 0 3px #ff3d81;
                    top: 10%;
                    width: 200px;
                }

                .on .text,
                .on .menu {
                    opacity: 1;
                    transition: opacity 10ms ease 2000ms;
                }

                @-webkit-keyframes on {
                    0% {
                        transform: scale(1, 0.8) translate3d(0, 0, 0);
                        filter: brightness(4);
                        opacity: 1;
                    }

                    3.5% {
                        transform: scale(1, 0.8) translate3d(0, 100%, 0);
                    }

                    3.6% {
                        transform: scale(1, 0.8) translate3d(0, -100%, 0);
                        opacity: 1;
                    }

                    9% {
                        transform: scale(1.3, 0.6) translate3d(0, 100%, 0);
                        filter: brightness(4);
                        opacity: 0;
                    }

                    11% {
                        transform: scale(1, 1) translate3d(0, 0, 0);
                        filter: contrast(0) brightness(0);
                        opacity: 0;
                    }

                    100% {
                        transform: scale(1, 1) translate3d(0, 0, 0);
                        filter: contrast(1) brightness(1.2) saturate(1.3);
                        opacity: 1;
                    }
                }

                @keyframes on {
                    0% {
                        transform: scale(1, 0.8) translate3d(0, 0, 0);
                        filter: brightness(4);
                        opacity: 1;
                    }

                    3.5% {
                        transform: scale(1, 0.8) translate3d(0, 100%, 0);
                    }

                    3.6% {
                        transform: scale(1, 0.8) translate3d(0, -100%, 0);
                        opacity: 1;
                    }

                    9% {
                        transform: scale(1.3, 0.6) translate3d(0, 100%, 0);
                        filter: brightness(4);
                        opacity: 0;
                    }

                    11% {
                        transform: scale(1, 1) translate3d(0, 0, 0);
                        filter: contrast(0) brightness(0);
                        opacity: 0;
                    }

                    100% {
                        transform: scale(1, 1) translate3d(0, 0, 0);
                        filter: contrast(1) brightness(1.2) saturate(1.3);
                        opacity: 1;
                    }
                }

                @-webkit-keyframes off {
                    0% {
                        transform: scale(1, 1);
                        filter: brightness(1);
                    }

                    40% {
                        transform: scale(1, 0.005);
                        filter: brightness(100);
                    }

                    70% {
                        transform: scale(1, 0.005);
                    }

                    90% {
                        transform: scale(0.005, 0.005);
                    }

                    100% {
                        transform: scale(0, 0);
                    }
                }

                @keyframes off {
                    0% {
                        transform: scale(1, 1);
                        filter: brightness(1);
                    }

                    40% {
                        transform: scale(1, 0.005);
                        filter: brightness(100);
                    }

                    70% {
                        transform: scale(1, 0.005);
                    }

                    90% {
                        transform: scale(0.005, 0.005);
                    }

                    100% {
                        transform: scale(0, 0);
                    }
                }

                .text span {
                    filter: blur(1px);
                    position: absolute;
                }

                .text span:nth-child(1) {
                    color: #e91e63;
                    margin-left: -2px;
                    filter: blur(2px);
                }

                .text span:nth-child(2) {
                    color: #ff3d81;
                    margin-left: 2px;
                    filter: blur(2px);
                }

                .text span:nth-child(3) {
                    color: #2fb1d4;
                    position: 20px 0;
                    filter: blur(1px);
                }

                .text span:nth-child(4) {
                    color: #f4f4f4;
                    filter: blur(1px);
                    text-shadow: 0 0 50px rgba(255, 255, 255, 0.4);
                }

                .text span:nth-child(5) {
                    color: rgba(255, 255, 255, 0.1);
                    filter: blur(15px);
                }

                .text span {
                    -webkit-animation: blur 10ms infinite, jerk 30ms infinite;
                    animation: blur 28ms infinite, jerk 43ms infinite;
                }

                @-webkit-keyframes blur {
                    0% {
                        filter: blur(1px);
                        opacity: 0.8;
                    }

                    50% {
                        filter: blur(1px);
                        opacity: 1;
                    }

                    100% {
                        filter: blur(1px);
                        opacity: 0.8;
                    }
                }

                @keyframes blur {
                    0% {
                        filter: blur(1px);
                        opacity: 0.8;
                    }

                    50% {
                        filter: blur(1px);
                        opacity: 1;
                    }

                    100% {
                        filter: blur(1px);
                        opacity: 0.8;
                    }
                }

                @-webkit-keyframes jerk {
                    50% {
                        transform: translateX(1px);
                    }

                    51% {
                        transform: translateX(0);
                    }
                }

                @keyframes jerk {
                    50% {
                        transform: translateX(1px);
                    }

                    51% {
                        transform: translateX(0);
                    }
                }

                @-webkit-keyframes jerkup {
                    0% {
                        transform: translateY(1px);
                    }

                    100% {
                        transform: translateY(0);
                    }
                }

                @keyframes jerkup {
                    0% {
                        transform: translateY(1px);
                    }

                    100% {
                        transform: translateY(0);
                    }
                }

                .text span:nth-child(2) {
                    -webkit-animation: jerkup 1s infinite;
                    animation: jerkup 1s infinite;
                }

                .text span:nth-child(3) {
                    -webkit-animation: glitch1 1s infinite;
                    animation: glitch1 1s infinite;
                }

                @-webkit-keyframes glitch1 {
                    0% {
                        transform: translateX(0);
                    }

                    30% {
                        transform: translateX(0);
                    }

                    31% {
                        transform: translateX(10px);
                    }

                    32% {
                        transform: translateX(0);
                    }

                    98% {
                        transform: translateX(0);
                    }

                    100% {
                        transform: translateX(10px);
                    }
                }

                @keyframes glitch1 {
                    0% {
                        transform: translateX(0);
                    }

                    30% {
                        transform: translateX(0);
                    }

                    31% {
                        transform: translateX(10px);
                    }

                    32% {
                        transform: translateX(0);
                    }

                    98% {
                        transform: translateX(0);
                    }

                    100% {
                        transform: translateX(10px);
                    }
                }

                .text span:nth-child(2) {
                    -webkit-animation: glitch2 1s infinite;
                    animation: glitch2 1s infinite;
                }

                @-webkit-keyframes glitch2 {
                    0% {
                        transform: translateX(0);
                    }

                    30% {
                        transform: translateX(0);
                    }

                    31% {
                        transform: translateX(-10px);
                    }

                    32% {
                        transform: translateX(0);
                    }

                    98% {
                        transform: translateX(0);
                    }

                    100% {
                        transform: translateX(-10px);
                    }
                }

                @keyframes glitch2 {
                    0% {
                        transform: translateX(0);
                    }

                    30% {
                        transform: translateX(0);
                    }

                    31% {
                        transform: translateX(-10px);
                    }

                    32% {
                        transform: translateX(0);
                    }

                    98% {
                        transform: translateX(0);
                    }

                    100% {
                        transform: translateX(-10px);
                    }
                }

                .overlay .text {
                    -webkit-animation: 30s ease 6000ms normal none infinite running glitch;
                    animation: 30s ease 6000ms normal none infinite running glitch;
                }

                @-webkit-keyframes glitch {
                    40% {
                        opacity: 1;
                        transform: scale(1, 1);
                        transform: skew(0, 0);
                    }

                    41% {
                        opacity: 0.8;
                        transform: scale(1, 1.2);
                        transform: skew(80deg, 0);
                    }

                    42% {
                        opacity: 0.8;
                        transform: scale(1, 1.2);
                        transform: skew(-50deg, 0);
                    }

                    43% {
                        opacity: 1;
                        transform: scale(1, 1);
                        transform: skew(0, 0);
                    }
                }

                @keyframes glitch {
                    40% {
                        opacity: 1;
                        transform: scale(1, 1);
                        transform: skew(0, 0);
                    }

                    41% {
                        opacity: 0.8;
                        transform: scale(1, 1.2);
                        transform: skew(80deg, 0);
                    }

                    42% {
                        opacity: 0.8;
                        transform: scale(1, 1.2);
                        transform: skew(-50deg, 0);
                    }

                    43% {
                        opacity: 1;
                        transform: scale(1, 1);
                        transform: skew(0, 0);
                    }
                }
            </style>
            <main class="scanlines on">
                <div class="screen">
                    <canvas id="canvas" class="picture"></canvas>
                        <div class="text">
                            <span>AUX</span>
                        </div>
                        <div class="menu">
                            <header>
                                Thomas Leon Highbaugh
                            </header>
                            <ul>
                                <li class="active">Software Engineer</li>
                                <li>Linux Professional</li>
                                <li>Digital Artist</li>
                                <li>Aspiring Prompt Engineer</li>
                            </ul>
                            <footer>
                                <div class="key"> <span><a href="https://thomasleonhighbaugh.me">PORTFOLIO</a></span></div>
                                  <div class="key"><span><a href="https://resume-thomas-leon-highbaugh.vercel.app/">  RESUME</a></span></div> 
                                    <div class="key"><span><a href="https://biolink-delta.vercel.app/">CONTACT </a></span></div>
                            </footer>
                        </div>
                    </div>
            </main>
        </div>
    </foreignObject>
    <script type="text/javascript">
        <![CDATA[
        var main = document.querySelector('main'),
        canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        text = document.querySelector('.text'),
        ww = window.innerWidth,
        menu = document.querySelector('.menu'),
        ul = menu.querySelector('ul'),
        idx = 0,
        count = ul.childElementCount - 1,
        toggle = true,
        frame;

    // Set canvas size
    canvas.width = ww / 3;
    canvas.height = (ww * 0.5625) / 3;

    // Generate CRT noise
    function snow() {

        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            d = ctx.createImageData(w, h),
            b = new Uint32Array(d.data.buffer),
            len = b.length;

        for (var i = 0; i < len; i++) {
            b[i] = ((255 * Math.random()) | 0) << 24;
        }

        ctx.putImageData(d, 0, 0);
    }

    function animate() {
        snow();
        frame = requestAnimationFrame(animate);
    };

    // Glitch
    for (i = 0; i < 4; i++) {
        var span = text.firstElementChild.cloneNode(true);
        text.appendChild(span);
    }

    window.addEventListener('DOMContentLoaded', function(e) {
        setTimeout(function() {
            main.classList.add('on');
            main.classList.remove('off');
            animate();
        }, 1000);
    });

    window.addEventListener('keydown', function(e) {
        var key = e.keyCode;
        var prev = idx;
        if (key == 38 || key == 40) {
            e.preventDefault();

            switch (key) {
                case 38:
                    if (idx > 0) {
                        idx--;
                    }
                    break;
                case 40:
                    if (idx < count) {
                        idx++;
                    }
                    break;
            }

            ul.children[prev].classList.remove('active');
            ul.children[idx].classList.add('active');
        }
    }, false);
        ]]>
    </script>
</svg>

  <br />
  <hr />
  <br />
<details>
<summary> <b>||| Portfolio | Resume | Contact ||| </b></summary>
<br/>

<a href="https://thomasleonhighbaugh.me"> <img width="200px" src="portfolio-button.svg" alt="Portfolio"/> </a> <a href="https://resume-thomas-leon-highbaugh.vercel.app/" > <img width="200px" src="resume.svg" alt="Resume"> </a> <a href="https://biolink-delta.vercel.app"> <img width="200px" float="right" src="contact_button.svg" alt="contact button"/></a>



  <br />
  <hr />
  <br />
  </details>
  
  <details>
    <summary>||| Account | Stats |||</summary>
      <img src="https://raw.githubusercontent.com/Thomashighbaugh/github-stats/master/generated/overview.svg#gh-dark-mode-only" alt="user stats"/>
    <img src="https://raw.githubusercontent.com/Thomashighbaugh/github-stats/master/generated/languages.svg#gh-dark-mode-only" alt="user stats" />
  </details>
