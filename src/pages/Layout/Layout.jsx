import { Outlet, Link, useLocation } from "react-router-dom";
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

    const {pathname} = useLocation();
    
    return (
        <div className="layout">
          <div className="content">
            <nav>
              {/* <Link to="/">Home</Link> */}
              {pathname !== "/" ?  <Link to="/">Home</Link> : <div/>}
              {pathname.split("/").length >= 3 ? <Link to=".." relative="path">Up</Link> : <div/>}
              <DarkModeButton onClick={toggleDarkTheme} currVal={isDarkTheme}/>
            </nav>
            <Outlet/>
          </div>
          <div className="eaegg">
            Howdy
          </div>
        </div>
    );
};

export default Layout;
