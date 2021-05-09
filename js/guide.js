
var userAgent = /android\s+([\d\.]+)/i.exec(navigator.userAgent); 
var isAndroid = userAgent ? true : false; //检测是否是安卓系统
var inWX = /micromessenger\s*\//i.test(navigator.userAgent); //true则是微信打开
var inQQ = /qq\s*\//i.test(navigator.userAgent); //true则是QQ打开
var inIOSWebApp = navigator.standalone; // ios webapp


function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

let info = document.querySelector("#info > p");
if(!isLandscape()) info.innerText = "请先横屏";

window.addEventListener("resize", function() {
    setTimeout(() => {
        if(!isLandscape()){
            info.innerText = "请先横屏";
        } else {
            info.innerText = "";
        }
    }, 1000)
}, false);