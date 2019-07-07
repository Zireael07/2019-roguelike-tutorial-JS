import { GameMap } from "./gamemap.js"

var player = {
    _x: 1,
    _y: 1,

    move: function(dx,dy, map) {
        var tx = this._x + dx
        var ty = this._y + dy
        
        if (tx < 0 || ty < 0){
            return
        }
        if (tx > map._width || ty > map._height){
            return
        }
    
        if (map._tiles[tx][ty] == 0){
            return
        }

        this._x = this._x + dx;
        this._y = this._y + dy;
    }
}

var Game = {
    canvas: null,
    context: null,
    player: null,
    _map: null,

    newGame: function(cnv) {
        this.canvas = cnv;
        this.context = cnv.getContext("2d");
        this.player = player;
    },

    generateMap: function() {
        let map = [];
        for (let x = 0; x < 20; x++) {
          map.push([]);
          for (let y = 0; y < 20; y++) {
            map[x].push(1); //floor
          }
        }

        //walls around the map
        for (let x =0; x < 20; x++){
            map[x][0] = 0;
            map[x][19] = 0;
        }

        for (let y = 0; y < 20; y++){
            map[0][y] = 0;
            map[19][y] = 0;
        }

        this._map = new GameMap(map);
    },

    //rendering functions from here down
    clearGame: function() {
        this.context.fillStyle = 'rgb(0,0,0)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    isoPos: function(x,y) {
        // those values work for Gervais isometric tiles
        let HALF_TILE_HEIGHT = 16
        let HALF_TILE_WIDTH = 32
        let offset_x = 80
        let tile_x = (x - y) * HALF_TILE_WIDTH + offset_x
        let tile_y = (x + y) * HALF_TILE_HEIGHT
  
        return [tile_x,tile_y];
    },
    drawMapTile: function(x,y, tile){
        if (tile == 0){
            this.renderGfxTile(resources.get("gfx/wall_stone.png"), x, y);
        }
        else{
            this.renderGfxTile(resources.get("gfx/floor_cave.png"), x, y);
        }
    },
    renderMap: function(map){
    for (let x =0; x < map._width; x++){
        for (let y=0; y < map._height; y++){
            let iso = this.isoPos(x,y);
            this.drawMapTile(iso[0], iso[1], map._tiles[x][y]);
        }
    }
    },
    renderPlayer: function(){
        let iso = this.isoPos(this.player._x, this.player._y);
        // entities need a slight offset to be placed more or less centrally
        this.renderGfxTile(resources.get("gfx/human_m.png"), iso[0]+8, iso[1]+8);
    },
    renderGfxTile: function(img, x, y) {
        this.context.drawImage(img, x, y);
    }
}

// main key input handler
// key is the key code
function processKeyDown(key){
    switch (key) {
      case 37: Game.player.move(-1, 0, Game._map); break;  //left
      case 39: Game.player.move(1, 0, Game._map);  break;   //right
      case 38: Game.player.move(0, -1, Game._map); break;     //up
      case 40: Game.player.move(0, 1, Game._map);  break;    //down
      default: console.log(key);
    }
}

// stubs called by jQuery onclick()
// ES 6 feature - export!
export function moveUp() {
    Game.player.move(0, -1);
}

export function moveDown() {
    Game.player.move(0, 1);
}

export function moveLeft() {
    Game.player.move(-1, 0);
}

export function moveRight() {
    Game.player.move(1, 0);
}

function setup(canvas) {
    console.log("setup...");
    //setup game
    Game.newGame(canvas);
    Game.generateMap();

    //what it says on the tin
    function mainLoop() {
        //test
        Game.clearGame();
        Game.renderMap(Game._map);
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
        "gfx/human_m.png",
        "gfx/wall_stone.png",
        "gfx/floor_cave.png",
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