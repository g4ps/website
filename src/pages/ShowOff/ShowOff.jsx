import {useState, useCallback} from 'react';
import ArchingRange from '../../components/ArchingRange/ArchingRange.jsx';
import EvgGraph from '../../components/EvgGraph/EvgGraph.jsx';
import "./ShowOff.scss";

const min = 0;
const max = 100;

const GraphShowOff = ({children}) => {
    const [value, setValue] = useState([42, 22, 100, 15, 0, 32, 19]);

    const changeValue = useCallback((pos, val) => {
        setValue(value.map((i, p) => p === pos ? val : i));
    }, [value]);
    
    return (
        <div className="numericalShowOff">
          <EvgGraph data={value}/>
          {value.map((i, pos) =>
              <input
                key={pos}
                type="range"
                value={value[pos]}
                onInput={(e) => changeValue(pos, e.target.value)}
              />
          )}
          <div>
            {value.toString()}
          </div>
        </div>
    );
};

const NumericalShowOff = ({children}) => {
    const [value, setValue] = useState(42);
    
    return (
        <div className="numericalShowOff">
          <ArchingRange min={min} max={max} value={value}/>
          <input
            type="range"
            onInput={(e) => setValue(e.target.value)}
          />
          <div>
            {value}
          </div>
        </div>
    );
};

const ShowOff = () => {
    return (
        <div className="showOff">
          <h1>Gene's showing off</h1>
          <p>
            Sometimes Gene likes to make different elements. For some reason he desided to
            put'em here
          </p>
          <div className="gallery">
            <NumericalShowOff/>
            <GraphShowOff/>
          </div>
        </div>
    );
};

export default ShowOff;
