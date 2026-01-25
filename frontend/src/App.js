import "./App.css";
import { Routes, Route } from "react-router-dom";
import Quotation from "./Pages/Quotation";
import ViewQuotation from "./Component/Form/ViewQuotation";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Quotation />} />
      <Route path="/view" element={<ViewQuotation />} />
    </Routes>
  );
}

export default App;
