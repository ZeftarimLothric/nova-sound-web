import { PlantaProvider, usePlanta } from './context/PlantaContext';
import Main from './Pages/Main';
import Login from './Pages/Login';

function AppContent() {
  const { estaAutenticado } = usePlanta();

  if (!estaAutenticado) {
    return <Login />;
  }

  return <Main />;
}

export default function App() {
  return (
    <PlantaProvider>
      <AppContent />
    </PlantaProvider>
  );
}