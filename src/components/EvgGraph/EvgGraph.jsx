// eslint-disable-next-line
import Boop from '../Boop/Boop.jsx';

import styles from './EvgGraph.module.scss';
import {useMemo, useCallback} from 'react';

const tupleToString = (t) => {
    return "" + t[0] + " " + t[1];
};

//Size of the resulting svg
const height = 200;
const width = 300;
const pad = 0.9;

//Color of the letter and the outline
const outlineTextColor = "var(--text-color)";

const EvgGraph = ({data = []}) => {

    const datumRange = useMemo(() => {
        return [Math.min(...data), Math.max(...data)];
        // eslint-disable-next-line
    }, []);

    const dataLength = useMemo(() => {
        return data.length;
        // eslint-disable-next-line
    }, []);

    const datumToSvgPos = useCallback((datum, ord) => {
        const range = datumRange[1] - datumRange[0];
        const yp = height - ((datum - datumRange[0]) / range * height) * pad
              - (1 - pad) * height / 2;
        const xp = width * ord / (dataLength - 1);
        return [xp, yp];
    }, [datumRange, dataLength]);

    const svgPositions = useMemo(() => {
        return data.map((i, pos) => datumToSvgPos(i, pos));
    }, [data, datumToSvgPos]);

    const graphPath = useMemo(() => {
        let ret =  `M ${width} ${height} L 0 ${height} `;
        svgPositions.forEach(i => {
            ret += ` L ${tupleToString(i)} `;
        });
        ret += ` L ${width} ${height}  `;
        return ret;
    }, [svgPositions]);
    
    return (
        <div className={styles.evgGraph}>
        <svg widht={width} height={height} viewBox={`-2 -2 ${width + 5} ${height + 5}`}>
            {/* <linearGradient id="myGradient" gradientTransform="rotate(90)"> */}
            {/*   <stop offset="5%" stop-color="blue" /> */}
            {/*   <stop offset="50%" stop-color="transparent" /> */}
            {/* </linearGradient> */}
            <path d={graphPath} fill="url(#myGradient)" stroke={outlineTextColor}/>
            {svgPositions.map((i, pos) =>
                <Boop key={pos} center={i} fill={"blue"} rad={3}/>
            )}
          </svg>
        </div>
    );
};

export default EvgGraph;
