import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import CopyTrading from "./pages/CopyTrading"
import HomePage from "./pages/HomePage"


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/copy-trading" element={<CopyTrading />} />
      </Routes>
    </Router>
  )
}

export default App
