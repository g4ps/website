import {useState, useEffect, useCallback} from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import logo from './logo.svg';
import './App.scss';
import Layout from './pages/Layout/Layout.jsx';
import Home from './pages/Home/Home.jsx';
import Maths from './pages/Maths/Maths.jsx';
import Contact from './pages/Contacts/Contacts.jsx';

const App = () =>  {

    const [isDarkTheme, setIsDarkTheme] = useState(true);

    useEffect(() => {
        //setting proper variables to proper 
        setIsDarkTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);

    }, []);

    useEffect(() => {

        if (isDarkTheme === null)
            return;
        if (isDarkTheme) {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
        
        //Initially body has a default background color in order to reduce white
        //flash before loading. This thing rewrites default value. Although it does it on every
        //iteration, it hardly matters in terms of speed.
        document.getElementsByTagName("body")[0].style.setProperty("background-color", "");
    }, [isDarkTheme]);

    const toggleDarkTheme = useCallback(() => {
        setIsDarkTheme(!isDarkTheme);
    }, [isDarkTheme]);
    
    return (
        <BrowserRouter>
          <Routes>
            <Route path="/"
                   element={
                       <Layout
                         isDarkTheme={isDarkTheme}
                         toggleDarkTheme={toggleDarkTheme}
                       />
                   }>
              <Route index element={<Home />} />
              <Route path="contacts" element={<Contact />} />
              <Route path="maths" element={<Maths />}/>
              <Route path="maths" element={<Maths />}/>
            </Route>
          </Routes>
        </BrowserRouter>
    );
};

export default App;
