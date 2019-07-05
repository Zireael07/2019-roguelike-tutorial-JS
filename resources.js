// simple loader based on  https://github.com/jlongster/canvas-game-bootstrap
// & https://codepen.io/dipscom/pen/bdyEZY

(function() {
    //it's 2019, use a proper map! (ES 6 feature [!])
    var resourceCache = new Map();
    var func;
    var cnv;
    var count = 0;

    // Load an array of image urls
    function load(urlOrArr) {
        count = urlOrArr.length;
        //urlOrArr.forEach(function(url) {
        for (n =0;n < urlOrArr.length; n++){
            url = urlOrArr[n];
            console.log("Loading..." + url);
            _load(url);
        }
    }

    function _load(url) {
        //if(resourceCache[url]) {
        if (resourceCache.has(url)){
            return resourceCache.get(url);
        }
        else {
            var img = new Image();
            img.onload = function() {
                console.log("onload");
                resourceCache.set(url, img);
                //resourceCache[url] = img;
                
                countReady();
            };
            //resourceCache[url] = false;
            resourceCache.set(url, false);
            img.src = url;
        }
    }

    function get(url) {
        // console.log("Getting... " + url);
        // if (resourceCache.has(url) && resourceCache.get(url) != false){
        //     console.log("We have " + resourceCache.get(url));
        // }
        
        //return resourceCache[url];
        return resourceCache.get(url)
    }

    function getURLs(){
        urls = []
        console.log("Getting list of all URLs loaded");
        console.log(resourceCache);
        // resourceCache.keys is an iterator, so it can't be returned directly
        for (k of resourceCache.keys())
            urls.push(k);
        return urls;
    }

    function countReady() {
        //console.log("Count " + count);
        // Once loaded
        // Subtract one from the count of images loading
        count--;
        //console.log("After sub "  +count);
        // When the count reaches zero
        if( count === 0 ) {
        // All images have loaded
            onReady(func, cnv);
        }
    }

    //tell us what the callback does
    function setReady(fnc, cv) {
        func = fnc
        cnv = cv
    }

    function onReady() {
        console.log("JS onready");
        //call callback
        func(cnv);
    }

    window.resources = {
        load: load,
        get: get,
        onReady: onReady,
        setReady: setReady,
    }
})();
