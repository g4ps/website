import {useState, useEffect, useCallback} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.scss';
import Layout from './pages/Layout/Layout.jsx';
import Home from './pages/Home/Home.jsx';
import Maths from './pages/Maths/Maths.jsx';
import Contact from './pages/Contacts/Contacts.jsx';
import Logic from './pages/Logic/Logic.jsx';
import ErrorPage from './pages/ErrorPage/ErrorPage.jsx';
import Propositional from './pages/Logic/Propositional/Propositional.jsx';
import Progress from './pages/Logic/Progress/Progress.jsx';
import {makeDark, makeLight, toggle} from './features/theme/themeSlice.jsx';

const App = () =>  {
    const isDarkTheme = useSelector(state => state.theme.value);
    const dispatch = useDispatch();

    const setIsDarkTheme = (val) => {
        if (val) {
            dispatch(makeDark());
        }
        else {
            dispatch(makeLight());
        }
    }

    useEffect(() => {
        //setting proper variables to proper
        setIsDarkTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
        console.log("Howdy there, partner");
    }, []);

    useEffect(() => {

        if (isDarkTheme === null)
            return;
        if (isDarkTheme) {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
        
        // Initially body has a default background color in order to reduce white
        // flash before loading. This thing rewrites default value. Although it does it on every
        // iteration, it hardly matters in terms of speed.
        document.getElementsByTagName("body")[0].style.setProperty("background-color", "");
    }, [isDarkTheme]);

    const toggleDarkTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };
    
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
              <Route path="logic" element={<Logic />}/>
              <Route path="logic/progress" element={<Progress />}/>
              <Route path="logic/propositional" element={<Propositional />}/>
              <Route path="*" element={<ErrorPage />}/>
            </Route>
          </Routes>
        </BrowserRouter>
    );
};

export default App;
