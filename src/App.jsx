import { Canvas } from './Canvas';
import { CanvasProvider } from './context/CanvasProvider';

function App() {
  return (
    <CanvasProvider>
      <Canvas />
    </CanvasProvider>
  );
}

export default App;
