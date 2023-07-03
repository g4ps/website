import { Outlet, Link } from "react-router-dom";

const Home = () => {
    return (
        <div>
          <h1>Mighty Gene's personal page</h1>
          <ul>
            <li>
              <Link to="/contacts">Gene's Bio and Contacts</Link>
            </li>
            <li>
              <Link to="/maths">Gene's doing Maths</Link>
            </li>
          </ul>
        </div>
    );
};

export default Home;
