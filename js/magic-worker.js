(function(global, factory){
    global.MagicWorker = factory();
    global.MagicWorker.version = "V1.0";
    global.MagicWorker.idea = "https://zhuanlan.zhihu.com/p/83001302?utm_source=qq&utm_medium=social&utm_oi=792482571123585024";
}(this, (function(){
    return function(func){
        return new Worker(
            URL.createObjectURL(new Blob(["(" + func.toString() + ")();"], {type: "application/javascript"})),
            {name: 'magic-worker' }
        );
    }
})));