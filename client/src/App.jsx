import { useAuth } from "./AuthContext";
import LoginForm from "./components/LoginForm";
import TPVApp from "./components/TPVApp";

function App() {
  const { usuario } = useAuth();

  // Si no hay usuario autenticado, mostrar login
  if (!usuario) {
    return <LoginForm />;
  }

  // Si hay usuario autenticado, mostrar TPV
  return <TPVApp />;
}

export default App;
