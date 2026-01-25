import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Quotation from './Pages/Quotation';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Quotation />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
