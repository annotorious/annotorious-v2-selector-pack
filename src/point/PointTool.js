import Tool, { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toRectFragment } from '@recogito/annotorious/src/selectors/RectFragment';
import EditablePoint from './EditablePoint';

const isPoint = annotation =>
  annotation.target.renderedVia?.name === 'point';
  
export default class PointTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);
  }

  startDrawing = (x, y, _, evt) => {
    // The top-most existing annotation at this position (if any) 
    const annotation = evt.target.closest('.a9s-annotation')?.annotation;

    // The point drawing tool will ALWAYS create a point annotation,
    // regardless of whether there's already an annotation underneath.
    // UNLESS the annotation underneath is itself a point!
    if (!annotation || !isPoint(annotation)) {
      const element = this.drawHandle(x, y);
      this.scaleHandle(element);

      this.g.appendChild(element);

      const target = {
        ...toRectFragment(x, y, 0, 0, this.env.image, this.config.fragmentUnit),
        renderedVia: {
          name: 'point'
        }
      };

      element.annotation = new Selection(target);

      this.emit('complete', element);
    } else {
      this.emit('cancel')
    }
  }

  stop = () => {
    // Nothing to do
  }

  get isDrawing() {
    // Point selection is an instant action - the
    // tool is never an 'drawing' state
    return false;
  }
  
  createEditableShape = annotation =>
    new EditablePoint(annotation, this.g, this.config, this.env);

}

PointTool.identifier = 'point';

PointTool.supports = annotation => {
  // Not needed, since the target.renderedVia property will be evaluated first
  return false;
}