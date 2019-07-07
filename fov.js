//https://github.com/maetl/roguelike-tutorial/blob/master/src/fov.js

const octantTransforms = [
  { xx: 1, xy: 0, yx: 0, yy: 1 },
  { xx: 1, xy: 0, yx: 0, yy: -1 },
  { xx: -1, xy: 0, yx: 0, yy: 1 },
  { xx: -1, xy: 0, yx: 0, yy: -1 },
  { xx: 0, xy: 1, yx: 1, yy: 0 },
  { xx: 0, xy: 1, yx: -1, yy: 0 },
  { xx: 0, xy: -1, yx: 1, yy: 0 },
  { xx: 0, xy: -1, yx: -1, yy: 0 }
];

function createFOV(width, height, reveal, isOpaque) {
  function castShadows(cx, cy, row, start, end, transform, radius) {
    let newStart = 0;
    if (start < end) return;

    let blocked = false;

    for (let distance = row; distance < radius && !blocked; distance++) {
      let deltaY = -distance;
      for (let deltaX = -distance; deltaX <= 0; deltaX++) {
        let currentX = cx + deltaX * transform.xx + deltaY * transform.xy;
        let currentY = cy + deltaX * transform.yx + deltaY * transform.yy;

        let leftSlope = (deltaX - 0.5) / (deltaY + 0.5);
        let rightSlope = (deltaX + 0.5) / (deltaY - 0.5);

        if (
          !(
            currentX >= 0 &&
            currentY >= 0 &&
            currentX < width &&
            currentY < height
          ) ||
          start < rightSlope
        ) {
          continue;
        } else if (end > leftSlope) {
          break;
        }

        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) <= radius) {
          reveal(currentX, currentY);
        }

        if (blocked) {
          if (isOpaque(currentX, currentY)) {
            newStart = rightSlope;
            continue;
          } else {
            blocked = false;
            start = newStart;
          }
        } else {
          if (isOpaque(currentX, currentY) && distance < radius) {
            blocked = true;
            castShadows(
              cx,
              cy,
              distance + 1,
              start,
              leftSlope,
              transform,
              radius
            );
            newStart = rightSlope;
          }
        }
      }
    }
  }

  return function refresh(cx, cy, radius) {
    //fix (reveal source tile)
    reveal(cx, cy);
    for (let octant of octantTransforms) {
      castShadows(cx, cy, 1, 1, 0, octant, radius);
    }
  }
}

export {
  createFOV
}
