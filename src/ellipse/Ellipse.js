import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';

/** Shorthand to apply the given (x, y, rx, ry) to the SVG shape **/
const setXYR = (shape, x, y, rx, ry) => {  
  shape.setAttribute('cx', x);
  shape.setAttribute('cy', y);
  shape.setAttribute('rx', rx);
  shape.setAttribute('ry', ry);
}

/** 
 * Draws an SVG ellipse, either from an annotation, or an
 * (cx, cy, rx, ry)-tuple.
 */
export const drawEllipse = (cx, cy, rx, ry) => {
  const g = document.createElementNS(SVG_NAMESPACE, 'g');
  const innerEllipse  = document.createElementNS(SVG_NAMESPACE, 'ellipse');
  const outerEllipse  = document.createElementNS(SVG_NAMESPACE, 'ellipse');

  innerEllipse.setAttribute('class', 'a9s-inner');
  setXYR(innerEllipse, cx, cy, rx, ry);

  outerEllipse.setAttribute('class', 'a9s-outer');
  setXYR(outerEllipse, cx, cy, rx, ry);

  g.appendChild(outerEllipse);
  g.appendChild(innerEllipse);

  return g;
}

export const setEllipseSize = (g, cx, cy, rx, ry) => {
  const innerEllipse = g.querySelector('.a9s-inner');
  const outerEllipse = g.querySelector('.a9s-outer');

  setXYR(innerEllipse, cx, cy, rx, ry);
  setXYR(outerEllipse, cx, cy, rx, ry);
}

export const getEllipseSize = g => {
  const outerEllipse = g.querySelector('.a9s-outer');

  const cx = parseFloat(outerEllipse.getAttribute('cx'));
  const cy = parseFloat(outerEllipse.getAttribute('cy'));
  const rx = parseFloat(outerEllipse.getAttribute('rx'));
  const ry = parseFloat(outerEllipse.getAttribute('ry'));
  
  return { cx, cy, rx, ry };
}