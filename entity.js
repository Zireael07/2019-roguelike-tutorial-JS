import { findPath } from "./astar.js"

class Entity{
    constructor(x,y, name, tile){
        this._x = x;
        this._y = y;
        this.name = name
	    this.tile = tile
        //console.log("Created entity @ " + x + " " + y);
        //optional components
        this.creature = null;
	    this.item = null;
        this.inventory = null;
        this.equipment = null;
    }
    display_name(){
        if (this.item){
            if (this.equipment && this.equipment.equipped){
                return this.name + " (equipped)";
            }
            else{
                return this.name;
            }
        }
    };
    get_creatures_at(entities, x, y){
        //for...in statement iterates over user-defined properties in addition to the array elements
        for (let index = 0; index < entities.length; index++) {
            const entity = entities[index];
            if (entity.creature != null && entity._x == x && entity._y == y){
                return entity;
                }
            }
            return null;
    };
    // returns the equipment in a slot, or null if it's empty
    get_equipped_in_slot(slot){
        for (let index = 0; index = this.inventory.length; index++){
            const obj = this.inventory[index];
            if (obj.equipment != null && obj.equipment.slot == slot && obj.equipment.equipped){
                return obj.equipment;
            }
        }
    return null;
    };

    move(dx,dy, Game){
        var tx = this._x + dx
        var ty = this._y + dy
        
        if (tx < 0 || ty < 0){
            return false;
        }
        if (tx > Game._map._width || ty > Game._map._height){
            return false;
        }
    
        //is it a wall?
        if (Game._map._tiles[tx][ty] == 0){
            return false;
        }

        //check for creatures
        var target = this.get_creatures_at(Game.entities, tx, ty);
        if (target != null){
            //console.log("You kick " + target.name + " in the shins!");
            this.creature.attack(target, Game);
            //no need to refresh FOV
            return false;
        }

        this._x = this._x + dx;
        this._y = this._y + dy;
        return true;
    };
}

class Creature{
    constructor(owner, hp, def, att, die_f){
        this.owner = owner;
        this.hp = hp;
        this.max_hp = hp;
        this.defense = def;
        this.att = att;
        this.die_function = die_f;
        this.dead = false;
    }
    move_towards(tx, ty, Game){
        var dx = tx - this.owner._x
        var dy = ty - this.owner._y
        //var distance = math.sqrt(dx ** 2 + dy ** 2)
        var distance = distance_to(this.owner._x, this.owner._y, tx, ty);

        dx = Math.round(dx / distance);
        dy = Math.round(dy / distance);
        //console.log ("dx " + dx + " dy: " + dy);

        if ((!Game._map.isBlocked(this.owner._x + dx, this.owner._y + dy)) || (get_creatures_at(Game.entities, this.owner._x + dx, this.owner._y + dy))){
            //console.log("We can move to " + (this.owner._x + dx) + " " + (this.owner._y + dy));
            return this.owner.move(dx, dy, Game);
        }
    };
    move_astar(tx, ty, Game){
        console.log("Calling astar...");
        var astar = findPath(Game._map, [this.owner._x, this.owner._y], [tx, ty]);

        if (!astar.length < 1){
            // get the next point along the path (because #0 is our current position)
            // it was already checked for walkability by astar so we don't need to do it again
            // destructuring assignment
            [this.owner._x, this.owner._y] = astar[1]
        }
        else{
            // backup in case no path found
            this.move_towards(tx, ty, Game);
        }
    };
    // basic combat system
    take_damage(amount, Game){
        this.hp -= amount;
        // kill!
        if (this.hp <= 0){
            this.die_function(Game);
            this.dead = true;
        }
    };
    attack(target, Game){
        //paranoia
        if (target.creature.dead){
            //console.log("Target dead...")
            return;
        }

        var bonuses = 0;
        if (this.owner.inventory != null){
            var array = this.owner.inventory.equipped_items();
            for (let index = 0; index < array.length; index++) {
                const element = array[index];
                bonuses += element.equipment.attack;
            }
        }

        var damage = Game.rng.roller("1d6") + bonuses;

        var color = 'rgb(127,127,127)'
        if (target == Game.player){
            color = 'rgb(255,0,0)'
        }

        if (damage > 0){
            Game.gameMessage(this.owner.name + " attacks " + target.name + " for " + damage + " points of damage!", color);
            target.creature.take_damage(damage, Game);
        }
        else{
            Game.gameMessage(this.owner.name + " attacks " + target.name + " but does no damage", 'rgb(255,255,255)');
        }
    };
    heal(amount, Game){
	if (this.hp >= this.max_hp){
	    return;
	}
	//avoid overhealing
	var amt = Math.min(amount, this.max_hp-this.hp);
        this.hp += amt;
	Game.gameMessage("Your wounds start to feel better!", 'rgb(0, 255, 0)');
    };
}

class AI{
    constructor(owner){
        this.owner = owner;
    }
    take_turn(target, Game){ 
        //console.log("The " + this.owner.name + " wonders when it will get to move");
        var monster = this.owner
        // assume if we can see it, it can see us too
        if (Game.isVisible(monster._x, monster._y)){  
            if (distance_to(monster._x, monster._y, target._x, target._y) >= 2){
                //monster.creature.move_towards(target._x, target._y, Game);
                monster.creature.move_astar(target._x, target._y, Game);
            }
            else{ //if (target.creature.hp > 0){
                //console.log(this.owner.name + " insults you!");
                monster.creature.attack(target, Game);
            }
        }
    };
}

function distance_to(sx,sy, tx, ty){
    let dx = tx - sx;
    let dy = ty - sy;
    return (Math.sqrt(dx ** 2 + dy ** 2));
}

class Item{
    constructor(owner, use_f=null){
	this.owner = owner;
	this.use_function = use_f;
    }
}

class Equipment{
    constructor(owner, slot, att){
        this.owner = owner;
        this.slot = slot;
        this.equipped = false;
        this.attack = att;
    }
    toggle_equip(actor, Game){
    if (this.equipped){
        this.unequip(actor, Game);
    }
    else{
        this.equip(actor, Game);
    }
    };
    equip(actor, Game){
        var old_equipment = actor.get_equipped_in_slot(this.slot);
        if (old_equipment != null){
            old_equipment.unequip(actor);
        }
        this.equipped = true;
        Game.gameMessage("Item equipped", 'rgb(255,255,255)');
        
    };
    unequip(actor, Game){
        this.equipped = false;
        Game.gameMessage("Took off item", 'rgb(255,255,255');
    };
}

class Inventory{
    constructor(capacity){
	this.capacity = capacity;
	this.items = [];
    }
    add_item(item, Game){
	if (this.items.length > this.capacity){
	    return;
	}
	this.items.push(item);
	//delete from game entities
    	var index = Game.entities.indexOf( item );
    	if (index !== -1) {
           Game.entities.splice( index, 1 );
    	}
	Game.gameMessage("You pick up " + item.name, 'rgb(255,255,255)');
    };
    equipped_items(){
        let list_equipped = [];
        for (let index = 0; index < this.items.length; index++) {
            const item = this.items[index];
            if (item.equipment != null && item.equipment.equipped){
                list_equipped.push(item);
            }
        }
        return list_equipped;
    }
}

export {Entity, Creature, AI, Inventory, Item, Equipment}
