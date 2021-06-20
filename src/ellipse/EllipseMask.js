import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { getEllipseSize } from './Ellipse';

export default class EllipseMask {

  constructor(imageDimensions, ellipse) {
    this.w = imageDimensions.naturalWidth;
    this.h = imageDimensions.naturalHeight;

    this.ellipse = ellipse;

    const { cx, cy, rx, ry } = getEllipseSize(this.ellipse);

    const ty = cy + ry;

    this.mask = document.createElementNS(SVG_NAMESPACE, 'path');
    this.mask.setAttribute('fill-rule', 'evenodd');    
    this.mask.setAttribute('class', 'a9s-selection-mask');

    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${cx} ${ty} a ${rx} ${ry} 0 1 1 1 0`);
  }

  redraw = () => {
    const { cx, cy, rx, ry } = getEllipseSize(this.ellipse);

    const ty = cy + ry;

    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${cx} ${ty} a ${rx} ${ry} 0 1 1 1 0`);
  }

  get element() {
    return this.mask;
  }

  destroy = () =>
    this.mask.parentNode.removeChild(this.mask)

}