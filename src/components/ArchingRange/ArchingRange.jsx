import styles from "./ArchingRange.module.scss";
import {useMemo, useCallback} from 'react';

// eslint-disable-next-line
import Boop from '../Boop/Boop.jsx';

const tupleToString = (t) => {
    return "" + t[0] + " " + t[1];
};

//Size of the resulting svg
const size = 200;
//center of the circle
const center = [100, 120];
//Fraction of the circle filled
const circleFill = 0.7;
//Radius of the resulting arch
const rad = 95;
//Thickness of the circle
const thickness = 15;
//Color of the letter and the outline
const outlineTextColor = "var(--text-color)";

const ArchingRange = ({min, max, value}) => {

    const currFraction = useMemo(() => {
        //Converting value to fraction
        return (value - min) / (max - min);
    }, [min, max, value]);

    const fillColor = useMemo(() => {
        //color of the arch
        return `hsl(${currFraction * 100}, 100%, 50%)`;
    }, [currFraction]);

    const isLargeFlag = useCallback((fr) => {
        //in svgs we gotta have something called 'large-flag'. This thing takes care of this
        return circleFill * fr > .5 ? 1 : 0;
    }, []);

    const fracToAng = useCallback((frac) => {
        //converts fraction to angle
        return (frac * circleFill  + ((1 - circleFill) / 2)) * 2 * Math.PI;
    }, []);

    const fracToPosition = useCallback((frac, rad) => {
        //converts fraction to a position in SVg
        const ang = fracToAng(frac);
        return [Math.sin(-ang) * rad + center[0],
                Math.cos(ang) * rad + center[1]];
    }, [fracToAng]);

    const fracToPath = useCallback((frac) => {
        //returns a string of the path of the arch with respect to the given fraction
        return `M ${tupleToString(fracToPosition(0, rad))}
                A ${thickness/2} ${thickness/2} 0 0 0 ${tupleToString(fracToPosition(0, rad - thickness))}
                A ${rad - thickness} ${rad - thickness} 1 ${isLargeFlag(frac)} 1
                         ${tupleToString(fracToPosition(frac, rad - thickness))}
                A ${thickness/2} ${thickness/2} 1 1 0 ${tupleToString(fracToPosition(frac, rad))}
                A ${rad} ${rad} 0 ${isLargeFlag(frac)} 0 ${tupleToString(fracToPosition(0, rad))}
                `;
    }, [fracToPosition, isLargeFlag]);
    

    const getPath = useMemo(() => {
        //value arch
        return fracToPath(currFraction);
    }, [fracToPath, currFraction]);

    const getFullPath = useMemo(() => {
        //full arch, used for the outline
        return fracToPath(1);
    }, [fracToPath]);

    //There's some debugging things still in the return clause, maybe gonna use'em later
    return (
        <div className={styles.archingRange}>
          <svg widht={size} height={size}>
            {/* <circle cx={center[0]} cy={center[1]} r="800" fill="white"/> */}
            {/* <circle cx={center[0]} cy={center[1]} r={rad} stroke="grey"/> */}
            {/* <circle cx={center[0]} cy={center[1]} r={rad - thickness} stroke="grey"/> */}
            {/* {[0, 10, 80, 90, 100].map((i, pos) => */}
            {/*     <Boop key={pos} center={fracToPosition(i / 100, 95)}/> */}
            {/* )} */}
            {/* {[0, 10, 80, 90, 100].map((i, pos) => */}
            {/*     <Boop key={pos} center={fracToPosition(i / 100, 80)}/> */}
            {/* )} */}
            {/* <Boop center={fracToPosition(currFraction, 85)}/> */}
            <path d={getPath} /* fill="green" */
                  fill={fillColor} />
            <path d={getFullPath} /* fill="green" */
                  fill="transparent" stroke={outlineTextColor} />
            <text x={center[0]} y={center[1]} fill={outlineTextColor} >{value}</text>
          </svg>
        </div>
    );
};

export default ArchingRange;
