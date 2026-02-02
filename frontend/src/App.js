import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Component/Navbar";
import Login from "./Component/admin-console/login/login";
import Quotation from "./Component/Form/QuotationForm";
import ViewQuotation from "./Component/Form/ViewQuotation";

function App() {
  const isLoggedIn = sessionStorage.getItem("Loggedin");

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Supervisor & Admin can create quotation */}
        <Route
          path="/quotation"
          element={
            isLoggedIn ? <Quotation /> : <Navigate to="/login" replace />
          }
        />

        {/* Admin only can view all quotations */}
        <Route
          path="/view"
          element={
            isLoggedIn && sessionStorage.getItem("UserRole") === "admin" ? (
              <ViewQuotation />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
