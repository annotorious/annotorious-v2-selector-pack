import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';

export default class LineMask {

  constructor(imageDimensions, line) {
    this.w = imageDimensions.naturalWidth;
    this.h = imageDimensions.naturalHeight;

    this.line = line;

    this.mask = document.createElementNS(SVG_NAMESPACE, 'path');
    this.mask.setAttribute('fill-rule', 'evenodd');
    this.mask.setAttribute('class', 'a9s-selection-mask');
    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${this.line.getAttribute('x1')} ${this.line.getAttribute('y1')} z`);
  }

  redraw = () => {
    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${this.line.getAttribute('x1')} ${this.line.getAttribute('y1')} ${this.line.getAttribute('x2')} ${this.line.getAttribute('y2')}z`);
  }

  get element() {
    return this.mask;
  }

  destroy = () =>
    this.mask.parentNode.removeChild(this.mask)

}