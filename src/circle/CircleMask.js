import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { getCircleSize } from './Circle';

export default class CircleMask {

  constructor(imageDimensions, circle) {
    this.w = imageDimensions.naturalWidth;
    this.h = imageDimensions.naturalHeight;

    this.circle = circle;

    const { cx, cy, r } = getCircleSize(this.circle);

    const ty = cy + r;

    this.mask = document.createElementNS(SVG_NAMESPACE, 'path');
    this.mask.setAttribute('fill-rule', 'evenodd');    
    this.mask.setAttribute('class', 'a9s-selection-mask');

    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${cx} ${ty} a ${r} ${r} 0 1 1 1 0`);
  }

  redraw = () => {
    const { cx, cy, r } = getCircleSize(this.circle);

    const ty = cy + r;

    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${cx} ${ty} a ${r} ${r} 0 1 1 1 0`);
  }

  get element() {
    return this.mask;
  }

  destroy = () =>
    this.mask.parentNode.removeChild(this.mask)

}