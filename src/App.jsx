import {useState, useEffect} from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import Layout from './pages/Layout.jsx';
import Home from './pages/Home.jsx';
import Maths from './pages/Maths.jsx';
import Contact from './pages/Contact.jsx';

const App = () =>  {
    
    return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="contact" element={<Contact />} />
              <Route path="maths" element={<Maths />} />
            </Route>
          </Routes>
        </BrowserRouter>
    );
};

export default App;
