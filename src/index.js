import RubberbandCircleTool from './circle/RubberbandCircleTool';
import RubberbandEllipseTool from './ellipse/RubberbandEllipseTool';
import RubberbandFreehandTool from './freehand/RubberbandFreehandTool';
import PointSelectionTool from './point/PointSelectionTool';

const SelectorPack = (anno, config) => {

  anno.addDrawingTool(RubberbandCircleTool);
  anno.addDrawingTool(RubberbandEllipseTool);
  anno.addDrawingTool(RubberbandFreehandTool);
  anno.addDrawingTool(PointSelectionTool);
  
}

export default SelectorPack;