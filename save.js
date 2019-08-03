//https://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      //serialize game state
      if (key == "game_state"){
        return value.toString().slice(-2, -1);
      }
      if (key == "previous_state" && value != null){
        return value.toString().slice(-2, -1);
      }
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          //get name of the object being referenced so that we can visually identify it in the dump
          return "@" + value.name;
        }
        seen.add(value);
      }
      //properly serialize sets
      if (typeof value === 'object' && value instanceof Set) {
        //spread operator
        return [...value];
      }
     
      return value;
    };
  };


function saveJS(object) {
    var json = JSON.stringify(object, getCircularReplacer());
    console.log(json);
    //save to local storage
    localStorage.setItem("save", json);
}

function loadJS() {
    var save = localStorage.getItem('save');
    var obj = JSON.parse(save);
    console.log(obj);
    return obj;
}

export {saveJS, loadJS}