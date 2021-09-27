import RubberbandCircleTool from './circle/RubberbandCircleTool';
import RubberbandEllipseTool from './ellipse/RubberbandEllipseTool';
import RubberbandFreehandTool from './freehand/RubberbandFreehandTool';

const SelectorPack = (anno, config) => {

  anno.addDrawingTool(RubberbandCircleTool);
  anno.addDrawingTool(RubberbandEllipseTool);
  anno.addDrawingTool(RubberbandFreehandTool);
  
}

export default SelectorPack;
