import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { parseRectFragment } from '@recogito/annotorious/src/selectors/RectFragment';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { toFragment } from './Point';

export default class EditablePoint extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    const { x, y } = parseRectFragment(annotation, env.image);

    this.container = document.createElementNS(SVG_NAMESPACE, 'g');

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');

    this.point = this.drawHandle(x, y);
    this.point.addEventListener('mousedown', this.onGrab);
    
    this.elementGroup.appendChild(this.point);

    this.container.appendChild(this.elementGroup);
    g.appendChild(this.container);

    // true if te mouse has grabbed the point
    this.isGrabbed = false;
  }

  onScaleChanged = () => 
    this.scaleHandle(this.point);

  get element() {
    return this.elementGroup;
  }

  onGrab = () => {
    this.isGrabbed = true;
  }

  onMouseMove = evt => {
    if (evt.button !== 0) return;  // left click

    if (this.isGrabbed) {
      const {x, y} = this.getSVGPoint(evt);

      this.setHandleXY(this.point, x, y);

      const target = toFragment(x, y, this.env.image, this.config.fragmentUnit);
      this.emit('update', target);
    }
  }

  onMouseUp = () => {
    this.isGrabbed = false;
  }

  updateState = annotation => {
    const { x, y } = parseRectFragment(annotation, this.env.image);
    this.setHandleXY(this.point, x, y);
  }

  destroy() {
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('mouseup', this.onMouseUp);

    this.container.parentNode.removeChild(this.container);
    super.destroy();
  }

}