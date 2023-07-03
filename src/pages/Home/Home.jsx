import { Outlet, Link } from "react-router-dom";
import "./Home.scss";

const Home = () => {
    return (
        <div className="home">
          <h1>Mighty Gene's personal page</h1>
          <ul>
            <Link to="/contacts">
              <li>
                Gene's Bio and Contacts
              </li>
            </Link>
            <Link to="/maths">
              <li>
                Gene's doing Maths
              </li>
            </Link>
          </ul>
        </div>
    );
};

export default Home;
