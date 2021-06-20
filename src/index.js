import RubberbandCircleTool from './circle/RubberbandCircleTool';
import RubberbandEllipseTool from './ellipse/RubberbandEllipseTool';

const SelectorPack = (anno, config) => {

  anno.addDrawingTool(RubberbandCircleTool);
  anno.addDrawingTool(RubberbandEllipseTool);
  
}

export default SelectorPack;