import { Entity, Creature, AI, Inventory, Item } from "./entity.js"

import { GameMap } from "./gamemap.js"

import { createFOV } from "./fov.js";
import { tintImage } from "./tint_image.js";

//death
function death_player(Game){
    //console.log("Player killed");
    Game.gameMessage("You are DEAD!", 'rgb(255,0,0)');
    //change to a special state - prevents moving, among other things
    Game.game_state = GameStates.PLAYER_DEAD;
    //force refresh DOM render
    Game.onPlayerMoved();
}
function death_monster(Game){
    Game.gameMessage(this.owner.name + " is dead!", 'rgb(127,127,127)');
    //delete from game entities
    var index = Game.entities.indexOf( this.owner );
    if (index !== -1) {
        Game.entities.splice( index, 1 );
    }
}

//use functions
function use_heal(entity, Game){
    entity.creature.heal(4, Game);
    //delete from items
    var index = entity.inventory.items.indexOf( this.owner );
    if (index !== -1) {
	entity.inventory.items.splice( index, 1);
    }
    Game.gameMessage("You have used " + this.owner.name);
}


var player = new Entity(1, 1, "Player");
player.creature = new Creature(player, 20, 40, 30, death_player);
player.inventory = new Inventory(26);

//simple enum for JS
//https://stackoverflow.com/a/44447975
const GameStates = Object.freeze({
    PLAYER_TURN:   Symbol(0),
    ENEMY_TURN:  Symbol(1),
    PLAYER_DEAD: Symbol(2),
    SHOW_INVENTORY: Symbol(3),
});


var Game = {
    canvas: null,
    context: null,
    player: null,
    _map: null,
    visible: null,
    seen: null,
    rng: null,
    entities: [],
    game_state: null,
    previous_state: null,	
    messages: [],
    drawn: [],
    // to avoid losing track of it
    iso: null,

    newGame: function(cnv) {
        //this.canvas = cnv;
        //this.context = cnv.getContext("2d");
        this.player = player;
        this.rng = aleaPRNG();
        this.visible = new Set();
        this.seen = new Set();
        this.game_state = GameStates.PLAYER_TURN;
    },
    setupDOMMap: function() {
	console.log("Setup DOM for map...");
        var dom = document.getElementById("map");
        dom.style.width = "800px";
        dom.style.height = "600px";

	//var count = this._map._width * this._map._height;
	//for (var i=0;i<count;i++) {
	for (let x =0; x < this._map._width; x++){
            for (let y=0; y < this._map._height; y++){
	    	var div = document.createElement("div");
	    	div.style.width = "64px";
	    	div.style.height = "32px";
		div.style.position = "absolute";
	    	dom.appendChild(div);
		this.iso = this.isoPos(x,y);
		div.style.left = this.iso[0]+"px";
		div.style.top = this.iso[1]+"px";
	    }
	}
    },
    setupFOV: function() {
        this.refreshFOV = createFOV(
            this._map._width,
            this._map._height,
            (x, y) => this.revealTile(x, y),
            (x, y) => this._map.isOpaque(x, y)
          );
        
        this.refreshVisibility();
    },
    refreshVisibility: function() {
        this.visible.clear();
        this.refreshFOV(this.player._x, this.player._y, 4);
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
    placeEntities: function(map, max) {
        // Get a random number of monsters
        var num = this.rng.range(1, max);

        // taking a shortcut here: this map is rectangular so we can just place in rectangle
        for (let i = 0; i < num; i++){
            // Choose a random location in the map
            let x = this.rng.range(1, (map._height - 5))
            let y = this.rng.range(1, (map._width - 5))

            //console.log(x,y);
            let ent = new Entity(x,y, "kobold", "gfx/kobold.png");
            ent.creature = new Creature(ent, 5, 20,30, death_monster);
            ent.ai = new AI(ent);
            this.entities.push(ent);

	    //some items
	    ent = new Entity(x,y, "healing potion", "gfx/potion.png");
	    ent.item = new Item(ent, use_heal);
	    this.entities.push(ent);		
        }

    },
    //FOV
    isVisible: function(x, y) {
        return this.visible.has(`${x},${y}`);
    },
    isSeen(x, y) {
        return this.seen.has(`${x},${y}`);
    },
    revealTile: function(x, y) {
        const id = `${x},${y}`;
        this.visible.add(id);
        this.seen.add(id);
    },
    gameMessage: function(text, clr){
        this.messages.push([text, clr]);
    },
    onPlayerMoved: function(){
	this.clearDOM();
	this.draws();
    },
    enemyActions: function() {    
	ailoop:
            for (let index = 0; index < Game.entities.length; index++) {
                const entity = Game.entities[index];
                if (entity.ai != null){
                    //console.log("The " + entity.creature.name + " ponders the meaning of its existence.");
                    entity.ai.take_turn(Game.player, Game);

                    //break if player's dead!
                    if (Game.player.creature.dead){
                        //console.log("Break loop")
                        break ailoop;
                    }
                }

            }
            if (Game.game_state != GameStates.PLAYER_DEAD){
                Game.game_state = GameStates.PLAYER_TURN;
            }
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
    tileToIndex: function(x,y) {
	let y_in = y*this._map._width;
	let ind = y_in + x;
	//console.log("Pos: " + x + ", " + y + "= " + ind);
	return ind;
    },
    draws: function() {
        Game.renderMap(Game._map);
        Game.renderPlayer();
	Game.renderEntities(Game.entities);
	//nowhere else to put
	var dom = document.getElementById("map");
	var p = document.createElement("p");
	p.style = "color: rgb(255,0,0);";
	p.style.position = "absolute";
	p.style.top = "10px";
	p.style.left = "5px";
	p.innerHTML = "HP: " + Game.player.creature.hp + "/" + Game.player.creature.max_hp;
	dom.appendChild(p);
	Game.drawMessagesDOM();
	//draw inventory
	if (Game.game_state == GameStates.SHOW_INVENTORY){
	     Game.inventoryMenu("Press the key next to an item to use it, or Esc to cancel.", Game.player.inventory);
	}
    },
    //html dom functions
    clearDOM: function(){
	var dom = document.getElementById("map");
	var children = dom.childNodes;
	//ES 6
	for(var child of children){
    	    //console.log(children[child]);
	    var ch = child.childNodes;
	    // remove all imgs
	    while(child.firstChild) {
    		child.removeChild(child.firstChild);
	    }
	}
	//same deal for ui
	var ui = document.getElementById("ui");
	while(ui.firstChild) {
    		ui.removeChild(ui.firstChild);
	    }

    },
    renderGfxDOM: function(src, x,y, offset){
	var dom = document.getElementById("map");
	var img = document.createElement("img");
	img.src = src;
	//img.className = "img";
	var i = this.tileToIndex(x,y);
	img.style.position = "relative";
	img.style.left = offset[0]+"px";
	img.style.top = offset[1]+"px";
	dom.childNodes[i].appendChild(img);
    },
    drawMapTileDOM: function(x,y, tile) {
	var dom = document.getElementById("map");
	var img = document.createElement("img");
	if (tile == 0){
	   img.src = "gfx/wall_stone.png";
	}
	else{
	   img.src = "gfx/floor_cave.png";
	}
	img.style.position = "absolute";
        var i = this.tileToIndex(x,y);
	//console.log(dom.childNodes[0].childNodes);
	if (dom.childNodes[i].childNodes.length < 1){
	   dom.childNodes[i].appendChild(img);
	}
    },
    //intentionally aping functions using Canvas API
    drawMapTileTintDOM: function(x,y, tile) {
	var dom = document.getElementById("map");
	var img = document.createElement("img");
	
	if (tile == 0){
	   img.src = "gfx/wall_stone.png";
	}
	else{
	   img.src = "gfx/floor_cave.png";
	}
        var i = this.tileToIndex(x,y);
	img.className = "img";
	//background style doesn't care about transparency
        //var div = dom.childNodes[i];
	//div.style.background = 'rgba(127, 127,127, 0.5';
	//console.log(dom.childNodes[0].childNodes);
	if (dom.childNodes[i].childNodes.length < 1){
	   dom.childNodes[i].appendChild(img);
	}
    },
    drawMessagesDOM: function(){
        // what do we draw?
        this.drawn = null;
        if (this.messages.length < 5){
            this.drawn = this.messages
        }
        else{
            //slicing from end
            this.drawn = this.messages.slice(-5);
        }

        // draw
        var y = 0;
        for (let index = 0; index < this.drawn.length; index++) {
            const el = this.drawn[index];
	    var dom = document.getElementById("map");
	    var p = document.createElement("p");
	    p.style = "color: " + el[1] + ";";
	    p.style.position = "absolute";
	    p.style.top = 600-60+y + "px";
	    p.style.left = "5px";
	    p.innerHTML = el[0];
	    dom.appendChild(p);

            //this.context.font = "12px Arial";
            //this.context.fillStyle = el[1]; //'rgb(255, 255, 255)';
            //this.context.fillText(el[0], 5.0, this.canvas.height-50+y);
            y += 12;
        }
    },
    menuRender: function(header, options){
	var dom = document.getElementById("ui");
	var p = document.createElement("p");
	p.style.position = "absolute";
	p.style.top = "20px";
	p.style.left = "5px";
	p.innerHTML = header;
	dom.appendChild(p);

	var header_height = 14;
	var y = 0;
	var letter_index = 'a'.charCodeAt(0);

	//for (let option in options){
	for (let index = 0; index < options.length; index++) {
             const option = options[index];
             var p = document.createElement("p");
	     p.style.position = "absolute";
	     p.style.top = 20+header_height+y +"px";
	     p.style.left = "5px";
	     p.innerHTML = "(" + String.fromCharCode(letter_index) + ") " + option;
	     dom.appendChild(p);
	     letter_index += 1;
             y += 12;
	}
    },
    inventoryMenu: function(header, inventory){
	let options = [];
	// show a menu with each item of the inventory as an option
	if (inventory.items.length == 0){
	      options = ['Inventory is empty.'];
	}
	else{
	      //options = [item.name for item in inventory.items]		
		for (let index = 0; index < inventory.items.length; index++) {
                    const item = inventory.items[index];
		    options.push(item.name);
		}
	}
	this.menuRender(header, options);
    },
    inventorySelect: function(index){
	var item = this.player.inventory.items[index];
	if (item.item.use_function != null){
	    item.item.use_function(this.player, this);
	    this.game_state = GameStates.ENEMY_TURN;
	    //force refresh DOM render
            this.onPlayerMoved();
	    //for DOM
	    Game.enemyActions();
	}
    },

    //rendering functions from here down
    clearGame: function() {
        this.context.fillStyle = 'rgb(0,0,0)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    drawMapTile: function(x,y, tile){
        if (tile == 0){
            this.renderGfxTile(resources.get("gfx/wall_stone.png"), x, y);
        }
        else{
            this.renderGfxTile(resources.get("gfx/floor_cave.png"), x, y);
        }
    },
    drawMapTileTint: function(x,y, tile){
        if (tile == 0){
            this.context.drawImage(tintImage(resources.get("gfx/wall_stone.png"), "wall_stone_gray", 'rgb(127, 127,127)', 0.5), x, y);
        }
        else{
            this.context.drawImage(tintImage(resources.get("gfx/floor_cave.png"), "floor_cave_gray", 'rgb(127, 127, 127)', 0.5), x, y);
        }
    },
    renderMap: function(map){
    for (let x =0; x < map._width; x++){
        for (let y=0; y < map._height; y++){
	    //not necessary for DOM
            //this.iso = this.isoPos(x,y);
            if (this.isVisible(x,y)){
                this.drawMapTileDOM(x, y, map._tiles[x][y]);
            }
            else if (this.isSeen(x,y)){
                this.drawMapTileTintDOM(x, y, map._tiles[x][y]);
            }
        }
    }
    },
    renderPlayer: function(){
        //this.iso = this.isoPos(this.player._x, this.player._y);
        // entities need a slight offset to be placed more or less centrally
	this.renderGfxDOM("gfx/human_m.png", this.player._x, this.player._y, [8,8]);
        //this.renderGfxTile(resources.get("gfx/human_m.png"), this.iso[0]+8, this.iso[1]+8);
    },
    renderEntities: function(entities){
        for (let i = 0; i < entities.length; i++){
            if (this.isVisible(entities[i]._x, entities[i]._y)){
                //this.iso = this.isoPos(entities[i]._x, entities[i]._y);
                // entities need a slight offset to be placed more or less centrally
		this.renderGfxDOM(entities[i].tile, entities[i]._x, entities[i]._y, [8,8]);
                //this.renderGfxTile(resources.get("gfx/kobold.png"), this.iso[0]+8, this.iso[1]+8);
            }
        }
    },
    renderGfxTile: function(img, x, y) {
        this.context.drawImage(img, x, y);
    },
    drawMessages: function(){
        // what do we draw?
        this.drawn = null;
        if (this.messages.length < 5){
            this.drawn = this.messages
        }
        else{
            //slicing from end
            this.drawn = this.messages.slice(-5);
        }

        // draw
        var y = 0;
        for (let index = 0; index < this.drawn.length; index++) {
            const el = this.drawn[index];
            this.context.font = "12px Arial";
            this.context.fillStyle = el[1]; //'rgb(255, 255, 255)';
            this.context.fillText(el[0], 5.0, this.canvas.height-50+y);
            y += 10;
        }
    }
}

// main key input handler

function processKeyInventory(key){
    var index = key - 65; //65 is a

    if (index >= 0){
	Game.inventorySelect(index);
    }
}

// key is the key code
function processKeyDown(key){
    if (Game.game_state == GameStates.PLAYER_TURN){
	    switch (key) {
	      case 37: movePlayer(-1, 0); break;  //left
	      case 39: movePlayer(1, 0);  break;   //right
	      case 38: movePlayer(0, -1); break;     //up
	      case 40: movePlayer(0, 1);  break;    //down
	      // vim
	      case 72: movePlayer(-1, -0); break; // h
	      case 76: movePlayer(1, 0); break; // l
	      case 74: movePlayer(0, 1); break; // j
	      case 75: movePlayer(0, -1); break; // k
	      // diagonals
	      case 89: movePlayer(-1, -1); break; // y
	      case 85: movePlayer(1, -1); break; // u
	      case 66: movePlayer(-1, 1); break; // b
	      case 78: movePlayer(1, 1); break; // n
	      case 71: pickupItem(); break; //g
	      case 73: showInventory(); break; //i
	      default: console.log(key);
	    }
    }
    else if (Game.game_state == GameStates.SHOW_INVENTORY){
	processKeyInventory(key);
    }
}

// stubs called by jQuery onclick()
// ES 6 feature - export!
// they are also used by key input
export function movePlayer(x, y) {
    if (Game.game_state == GameStates.PLAYER_TURN){
        if (Game.player.move(x, y, Game)){
            Game.refreshVisibility();
	    //for DOM
	    Game.onPlayerMoved();
        }
        Game.game_state = GameStates.ENEMY_TURN;
	//for DOM
	Game.enemyActions();
	
    }
}

export function pickupItem() {
    if (Game.game_state == GameStates.PLAYER_TURN){
	   //console.log("Pressed pickup");
           for (let index = 0; index < Game.entities.length; index++) {
               const entity = Game.entities[index];
               if (entity.item != null && entity._x == Game.player._x && entity._y == Game.player._y){
                   Game.player.inventory.add_item(entity, Game);
			break; //only pick up one item at once
		   }
	   }
	    //for DOM
	    Game.onPlayerMoved();
    }
}

export function showInventory() {
    Game.previous_state = Game.game_state;
    Game.game_state = GameStates.SHOW_INVENTORY;
    //for DOM
    Game.onPlayerMoved();
}

function setup(canvas) {
    console.log("setup...");
    //setup game
    Game.newGame(canvas);
    Game.generateMap();
    Game.placeEntities(Game._map, 3);
    //uses map dimensions so has to come after it
    Game.setupDOMMap();
    Game.setupFOV();

    //new draw
    Game.draws();

    //for canvas
    //what it says on the tin
    function mainLoop() {
        Game.clearGame();
        Game.renderMap(Game._map);
        Game.renderPlayer();
        Game.renderEntities(Game.entities);
        Game.drawMessages();
        // AI turn
        if (Game.game_state == GameStates.ENEMY_TURN){
            Game.enemyActions();
        }

        requestAnimationFrame(mainLoop);
    }
    
    //crucial! not part of main loop!
    //requestAnimationFrame(mainLoop);


}


window.onload = function() {
    //get canvas
    //var canvas = document.getElementById("canvas-game");
    //canvas.width = 800
    //canvas.height = 600

    //load assets
    resources.load([
        "gfx/human_m.png",
        "gfx/wall_stone.png",
        "gfx/floor_cave.png",
        "gfx/kobold.png",
	"gfx/potion.png",
    ]);
    resources.setReady(setup, null);

    //keys
    function onKeyDown(event) {
        // prevent scrolling on arrow keys
        event.preventDefault();
        processKeyDown(event.keyCode, Game.player);
    }

    window.addEventListener("keydown", onKeyDown)



}
