import "./App.css";
import { Routes, Route } from "react-router-dom";
import Quotation from "./Pages/Quotation";
import ViewQuotation from "./Component/Form/ViewQuotation";
import LoginAction from "./Component/admin-console/LoginPageAdmin";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Quotation />} />
      <Route path="/view" element={<ViewQuotation />} />
      <Route path="/login" element={<LoginAction />} />
    </Routes>
  );
}

export default App;
