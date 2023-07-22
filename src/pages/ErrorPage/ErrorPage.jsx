import TechDiff from "./technical_difficulties.jpg";
import {Link} from "react-router-dom";
import "./ErrorPage.scss";

const ErrorPage = () => {
    return (
        <div className="errPage">
          <h1>
            Whoopsie-daisy
          </h1>
          <img src={TechDiff} alt=""/>
          <p>
            This website doesn't have any pages on this URL :(
          </p>
          <Link to="..">Go to the home page</Link> 
        </div>
    );
};

export default ErrorPage;
