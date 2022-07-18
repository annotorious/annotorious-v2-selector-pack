import Tool from '@recogito/annotorious/src/tools/Tool';
import RubberbandLine from './RubberbandLine';
import EditableLine from './EditableLine';

/**
 * A rubberband selector for Line fragments.
 */
export default class RubberbandLineTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);

    this._isDrawing = false;
    
    document.addEventListener('keydown', evt => {
      if (evt.key == "z" && evt.ctrlKey) {
        this.undo();
      }
      
      if (evt.key == 'n') {
        this.newPart();
      }
    });  
  }

  startDrawing = (x, y) => {
    this._isDrawing = true;
    
    this.attachListeners({
      mouseMove: this.onMouseMove,
      mouseUp: this.onMouseUp,
    });
    
    this.rubberband = new RubberbandLine([ x, y ], this.g, this.env);
  }

  stop = () => {
    this.detachListeners();
    
    this._isDrawing = false;

    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }
  undo = () =>{
    if (this.rubberband){
      this.rubberband.undo();

    }
  }
  newPart = () =>{
    if (this.rubberband){
      this.rubberband.newPart();

    }
  }

  onMouseMove = (x, y) =>
    this.rubberband.dragTo([ x, y ]);

  onMouseUp = (x, y, evt) => {
    if (evt.altKey){
      this.onDblClick(evt);
    } else if (evt.ctrlKey) {
      this.rubberband.undo();
    } else{
      // TODO: see when this is useful
      // const { width, height } = this.rubberband.getBoundingClientRect();

      // const minWidth = this.config.minSelectionWidth || 4;
      // const minHeight = this.config.minSelectionHeight || 4;
      
      if (this.rubberband.points.length == 2) {
        this.rubberband.addPoint([ x, y ]); 
        // check if both coordinates are same
        if (this.rubberband.points[0] == this.rubberband.points[2] && this.rubberband.points[1] == this.rubberband.points[3]) {
          this.emit('cancel');
          this.stop();
        }
        else{
          this._isDrawing = false;
          const shape = this.rubberband.element;
          shape.annotation = this.rubberband.toSelection();
          this.emit('complete', shape);
          this.stop();
        }
      }
    }
  }
  

  get isDrawing() {
    return this._isDrawing;
  }

  get isDrawing() {
    return this._isDrawing;
  }

  createEditableShape = annotation => 
    new EditableLine(annotation, this.g, this.config, this.env);

}

RubberbandLineTool.identifier = 'line';

RubberbandLineTool.supports = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector)
    return selector.value?.match(/^<svg.*<line/g);
}