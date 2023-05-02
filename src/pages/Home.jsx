import { Outlet, Link } from "react-router-dom";

const Home = () => {
    return (
        <div>
          <h1>Mighty Gene's personal page</h1>
          <Link to="/maths">Gene's doing Maths</Link>
        </div>
    );
};

export default Home;
