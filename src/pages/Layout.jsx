import { Outlet, Link } from "react-router-dom";
import "./Layout.css";

const Layout = () => {
  return (
      <div className="layout">

        <div className="content">
          <nav>
            <Link to="/">Home</Link>
          </nav>
          <Outlet />
        </div>
      </div>
  );
};

export default Layout;
