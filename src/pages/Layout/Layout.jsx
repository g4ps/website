import { Outlet, Link } from "react-router-dom";
import "./Layout.scss";
import {ReactComponent as Night} from "./night.svg";
import {ReactComponent as Day} from "./day.svg";

const DarkModeButton = ({currVal, onClick}) => {
    return (
        <button className="darkModeButton" onClick={onClick}>
          {currVal ? <Night/> : <Day/>}
        </button>
    );
}

const Layout = ({
    isDarkTheme,
    toggleDarkTheme
}) => {
    
    return (
        <div className="layout">
          <div className="content">
            <nav>
              <Link to="/">Home</Link>
              <DarkModeButton onClick={toggleDarkTheme} currVal={isDarkTheme}/>
            </nav>
            <Outlet/>
          </div>
        </div>
    );
};

export default Layout;
