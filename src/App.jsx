import AppController from "./components/app/AppController";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AppController />
    </>
  );
}

export default App;
