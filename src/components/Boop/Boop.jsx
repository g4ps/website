const Boop = ({center, rad=5, fill="red"}) => {
    //Simple boop
    return (
        <circle cx={center[0]} cy={center[1]} r={rad} fill={fill}/>
    );
};

export default Boop;
