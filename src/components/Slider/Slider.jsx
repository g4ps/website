import './Slider.scss';
import {useMemo} from 'react';

const Slider = ({min, max, value, setValue = () => {}}) => {

    const currHeight = 200;
    const bopHeight = 12; //TODO: remove magic numbers;

    const offc = useMemo(() => {
        const perc = (value - min) / (max - min);
        const sway = currHeight - bopHeight;
        return Math.round(sway * perc + bopHeight);
    }, [min, max, value]);

    if (min > max) {
        return (
            <div>
              max value in slider is less than min value
            </div>
        );
    }
    
    return <div className="evgSlider">
             <div className="bop"
                  onClick={() => setValue(min)}
             />
             <div
               className="inb"
               style={{
                   height: (offc - bopHeight) + "px"              
               }}
             />
             <div className="bop"/>
             <div
               className="inb"
               style={{
                   height: (currHeight - offc) + "px"              
               }}
             />
             <div className="bop"
                  onClick={() => setValue(max)}
             />
           </div>;
};

export default Slider;

