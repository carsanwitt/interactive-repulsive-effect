const radians = (degrees) => {
  return THREE.MathUtils.degToRad(degrees);
  //return degrees * Math.PI / 180;
}

const distance = (x1, y1, x2, y2) => {
  return distanceSqrd(x1, y1, x2, y2);
}

const distanceSqrd = (x1, y1, x2, y2) => {
  return Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
}

const map = (value, start1, stop1, start2, stop2) => {
  return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
}

const hexToRgbTreeJs = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

const meshPos = (row, col, gutter) => {
  return {x: col + (col * gutter), y: 0, z: row + (row * gutter)};
}

export {radians, distance, distanceSqrd, map, hexToRgbTreeJs, meshPos};
