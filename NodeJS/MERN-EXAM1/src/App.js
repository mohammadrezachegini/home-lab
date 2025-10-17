import React from 'react'; 
import "bootstrap/dist/css/bootstrap.min.css"; 
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; 
import MainPage from './components/mainpage.component';
import ShowBook from './components/showbook.component';
function App() {
  return (
      <div className="container">
      <br />
      <Router> 
       <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/showbook" element={<ShowBook />} />

       </Routes>
      </Router>
     
      </div>
  );
}

export default App;
