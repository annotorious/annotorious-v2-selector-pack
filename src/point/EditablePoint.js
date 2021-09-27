import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { parseRectFragment } from '@recogito/annotorious/src/selectors/RectFragment';

import { drawPoint } from './Point';

export default class EditablePoint extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    const { x, y } = parseRectFragment(annotation);

    this.point = drawPoint(x, y);
    this.point.setAttribute('class', 'a9s-annotation editable selected');

    this.g.appendChild(this.point);
  }

  get element() { 
    return this.point;
  }

  destroy = () => {
    this.g.removeChild(this.point);
    
    super.destroy();
  }

}