/// 拓展
EventTarget.prototype.once = function(type, handle){
    let self = this;
    let handlePro = function(event){
        handle(event);
        self.removeEventListener(type, handlePro);
    };
    self.addEventListener(type, handlePro);
}


/// 录制 内部实现
let recordContext;
let sendTouchHandle = function(){
    recordContext.postMessage(this._index);
};
let pias = document.querySelectorAll("#PianoPanel > .piano-wrap > div");
// 开始录制
function startRecord(){
    // 启动worker
    recordContext = MagicWorker(() => {
        // 此函数内部是worker作用域，不支持闭包

        function now(){ return parseInt(performance.now())};

        let start = now(),
            timeArray = [];
        self.addEventListener("message", (event) => {
            let message =  event.data;
            if(message === "stop") return;
            timeArray.push({
                time: now() - start,
                pia: event.data
            });
        });

        self.addEventListener("message", event => {
            let message =  event.data;
            if(message !== "stop") return;
            self.postMessage(serializaData(timeArray));
            self.close();
        });


        // 序列化数据
        function serializaData(timeArray){
            let result = "";
            for(let i = 1; i < timeArray.length; i++){
                timeArray[i].step = timeArray[i].time - timeArray[i - 1].time;
            }
            timeArray[0].step = timeArray[0].time;
            timeArray.forEach(node => {
                result += node.step + ":" + node.pia + ";";
            })
            return result;
        }

    });

    // 监听按键
    pias.forEach((pia, index) => {
        pia.addEventListener("touchstart", sendTouchHandle);
    });
}

// 停止录制
function stopRecord(retOutput){
    pias.forEach((pia, index) => {
        pia.removeEventListener("touchstart", sendTouchHandle);
    });
    recordContext.postMessage("stop");
    recordContext.addEventListener("message", event => {
        if(typeof retOutput === "function") retOutput(event.data);
    });
}


// 播放
function playRecord(data, callback){
    if(!data) return callback();
    let timeArray = [];
    if(data instanceof Array) {
        timeArray = data;
    }else{
        data.split(";").forEach(node => {
            if(!node) return;
            let nodeData = node.split(":");
            let step = parseInt(nodeData[0]);
            let pia = parseInt(nodeData[1]);
            if(step > 60000 || pia > 15 || pia < 0) throw new Error("序列格式异常");
            timeArray.push({
                step: step,
                pia: pia
            });
        });
        timeArray[0].time = timeArray[0].step;
        for(let i = 1; i < timeArray.length; i++){
            timeArray[i].time = timeArray[i - 1].time + timeArray[i].step;
        }
    }

    function play(node, pias){
        let tapDown = document.createEvent("TouchEvent");
        let tapUp = document.createEvent("TouchEvent");
        tapDown.initEvent("touchstart", true, true);
        tapUp.initEvent("touchend", true, true);
        setTimeout(() => {
            pias[node.pia].dispatchEvent(tapDown);
            setTimeout(() => {
                pias[node.pia].dispatchEvent(tapUp);
            }, 50);
        }, node.time);
    }

    timeArray.forEach(node => {
        play(node, pias);
    });

    if(typeof callback !== "function") return;
    let lastNode = timeArray[timeArray.length - 1];
    setTimeout(() => {
        callback();
    }, lastNode.time + 50);
}


//// 状态
let isRecordding = false;



//// UI部分
;(function(){
    let controls = document.querySelectorAll(".record-control > div");
    let recordArrayT = document.querySelector(".record-array-textarea");
    let recordArrayTContainer = document.querySelector("#arrayStore");
    let playButton = document.querySelector(".record-play > div");
    let recordButton = controls[0];
    let arrayButton = controls[1];
    let deviceCacheArray = localStorage.getItem("skypiano_user_array");

    if(deviceCacheArray) recordArrayTContainer.value = deviceCacheArray;

    controls.forEach(con => {
        con.addEventListener("touchstart", () => {
            con.style.backgroundColor = "rgb(90, 90, 90)";
        });
        con.addEventListener("touchend", () => {
            con.style.backgroundColor = "transparent";
        });
    });

    let startRecordHandle = () => {
        recordButton.style.backgroundColor = "rgb(90, 90, 90)";
        recordButton.innerText = "录制中...";
        recordButton.once("touchend", stopRecordHandle);
        startRecord();
    }

    let stopRecordHandle = () => {
        recordButton.style.backgroundColor = "transparent";
        recordButton.innerText = "录制";
        recordButton.once("touchend", startRecordHandle);
        stopRecord(sdata => {
            recordArrayTContainer.value = sdata;
            localStorage.setItem("skypiano_user_array", sdata);
        });
    }

    recordButton.once("touchend", startRecordHandle);



    // 打开序列
    let openArrayHandle = () => {
        recordArrayT.classList.add("open-textarea");
        arrayButton.once("touchend", closeArrayHandle);
        arrayButton.style.backgroundColor = "rgb(90, 90, 90)";
    }
    let closeArrayHandle = () => {
        recordArrayT.classList.remove("open-textarea");
        arrayButton.once("touchend", openArrayHandle);
        arrayButton.style.backgroundColor = "transparent";
    }

    arrayButton.once("touchend", openArrayHandle);



    // 播放
    let playArrayHandle = () => {
        playButton.style.backgroundColor = "rgb(90, 90, 90)";
        try {
            playRecord(recordArrayTContainer.value, pauseArrayHandle);
        } catch (error) {
            console.error(error);
            alert(error);
            pauseArrayHandle();
        }
    }
    // 停止播放
    let pauseArrayHandle = () => {
        playButton.style.backgroundColor = "transparent";
        playButton.once("touchend", playArrayHandle);
    }
    playButton.once("touchend", playArrayHandle);
    
}());