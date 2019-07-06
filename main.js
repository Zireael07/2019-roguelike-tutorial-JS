var player = {
    _x: 0,
    _y: 0,

    move: function(x,y) {
        this._x = this._x + x;
        this._y = this._y + y;
    }
}


var Game = {
    canvas: null,
    context: null,
    player: null,

    newGame: function(cnv) {
        this.canvas = cnv;
        this.context = cnv.getContext("2d");
        this.player = player;
    },

    //rendering functions from here down
    clearGame: function() {
        this.context.fillStyle = 'rgb(0,0,0)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    renderPlayer: function(){
        this.renderGfxTile(resources.get("gfx/human_m.png"), this.player._x, this.player._y);
    },
    renderGfxTile: function(img, x, y) {
        this.context.drawImage(img, x*32, y*32);
    }
}

// main key input handler
// key is the key code
function processKeyDown(key, player){
    switch (key) {
      case 37: player.move(-1, 0); break;  //left
      case 39: player.move(1, 0);  break;   //right
      case 38: player.move(0, -1); break;     //up
      case 40: player.move(0, 1);  break;    //down
      default: console.log(key);
    }
}

function setup(canvas) {
    console.log("setup...");
    //setup game
    Game.newGame(canvas);

    //what it says on the tin
    function mainLoop() {
        //test
        Game.clearGame();
        Game.renderPlayer();
        requestAnimationFrame(mainLoop);
    }
    
    //crucial! not part of main loop!
    requestAnimationFrame(mainLoop);


}


window.onload = function() {
    //get canvas
    var canvas = document.getElementById("canvas-game");
    canvas.width = 800
    canvas.height = 600

    //load assets
    resources.load([
        "gfx/human_m.png"
    ]);
    resources.setReady(setup, canvas);

    //keys
    function onKeyDown(event) {
        // prevent scrolling on arrow keys
        event.preventDefault();
        processKeyDown(event.keyCode, Game.player);
    }

    window.addEventListener("keydown", onKeyDown)



}