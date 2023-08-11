import styles from './Slider.module.scss';
import {useMemo} from 'react';

const currHeight = 200;
const bopHeight = 12;

const Slider = ({min=0, max=100, value, setValue = () => {}}) => {

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
    
    return <div className={styles.evgSlider}>
             <div className={styles.bop}
                  onClick={() => setValue(min)}
             />
             <div
               className={styles.inb}
               style={{
                   height: (offc - bopHeight) + "px"              
               }}
             />
             <div
               draggable={true}
               className={styles.bop}
               onDrag={(e) => {
                   console.log(e);
               }}
             >
             </div>
             <div
               className={styles.inb}
               style={{
                   height: (currHeight - offc) + "px"              
               }}
             />
             <div className={styles.bop}
                  onClick={() => setValue(max)}
             />
           </div>;
};

export default Slider;

