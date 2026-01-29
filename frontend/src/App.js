import "./App.css";
import { Routes, Route } from "react-router-dom";
import Quotation from "./Pages/Quotation";
import ViewQuotation from "./Component/Form/ViewQuotation";
import LoginAction from "./Component/admin-console/LoginPageAdmin";
import Navbar from "./Component/Navbar";
function App() {
  return (<>
    <Navbar />
    <Routes>
      <Route path="/quotation" element={<Quotation />} />
      <Route path="/view" element={<ViewQuotation />} />
      <Route path="/login" element={<LoginAction />} />
    </Routes></>
  );  
}

export default App;
