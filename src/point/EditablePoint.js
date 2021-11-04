import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { parseRectFragment } from '@recogito/annotorious/src/selectors/RectFragment';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';

export default class EditablePoint extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    const { x, y } = parseRectFragment(annotation, env.image);

    this.container = document.createElementNS(SVG_NAMESPACE, 'g');

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');

    this.point = this.drawHandle(x, y);
    this.point.addEventListener('mousedown', this.onGrab);
    
    this.elementGroup.appendChild(this.point);

    this.container.appendChild(this.elementGroup);
    g.appendChild(this.container);
  }

  onScaleChanged = () => 
    this.scaleHandle(this.point);

  get element() {
    return this.elementGroup;
  }

  onGrab = evt => {
    console.log('grab!');
  }

  updateState = annotation => {
    /*
    const { x, y, w, h } = parseRectFragment(annotation, this.env.image);
    this.setSize(x, y, w, h);
    */
  }

  destroy() {
    this.container.parentNode.removeChild(this.container);
    super.destroy();
  }

}