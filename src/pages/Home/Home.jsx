import { Link } from "react-router-dom";
import "./Home.scss";

const Home = () => {
    return (
        <div className="home">
          <h1>Mighty Gene's personal page</h1>
          <ul>
            <Link to="/showOff">
              <li>
                Gene's showing off
              </li>
            </Link>
            <Link to="/graphBoard">
              <li>
                GraphBoard
              </li>
            </Link>            
            <Link to="/maths">
              <li>
                Gene's doing Maths
              </li>
            </Link>
            <Link to="/contacts">
              <li>
                Gene's Bio and Contacts
              </li>
            </Link>
          </ul>
        </div>
    );
};

export default Home;
