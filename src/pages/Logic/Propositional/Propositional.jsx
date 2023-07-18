import {examples} from './examples.js';
import { useSelector, useDispatch } from 'react-redux';
import { useRef, useState, useEffect, useMemo } from 'react';
import { makeDark, makeLight, toggle } from '../../../features/theme/themeSlice.jsx';
import './Propositional.scss';

const symb = (str) => {
    if (str === "and")
        return "&";
    if (str === "or")
        return "|";
};

const logic_object_to_text_infix = (obj) => {
    
    if (obj.var) {
        return obj.var;
    }
    if (obj.op === "not") {
        return " ! (" + logic_object_to_text(obj.args[0]) + ")";
    }
    if (obj.op === "or" || obj.op === "and") {
        return `(${logic_object_to_text(obj.args[0])} ${symb(obj.op)}
                ${logic_object_to_text(obj.args[1])})`;
    }
    return "";
};

const logic_object_to_text = (obj) => {
    return logic_object_to_text_infix(obj);
};



const VisualLogicIn = ({obj, depth, showID, currPick}) => {

    const [hide, setHide] = useState(depth === 0);
    
    if (obj.var) {
        return (
            <div className="var">
              {obj.var + (showID ? (" " + obj.id) : "")}
            </div>
        );
    }
    return (
        <div className={`${obj.op} op ${hide ? "hide" : ""}`}>
          <div className="upper">
            <div/>
            <div className="name">
              {obj.op + (showID ? (" " + obj.id) : "")}
            </div>
            <div onClick={() => setHide(!hide)}>
              {hide ? "+" : "-"}
            </div>
          </div>

          <div className="args">
            {
                obj.args.map((i, pos) =>
                    <VisualLogicIn obj={i} depth={depth - 1} showID={showID} key={pos}/>
                )
            }
          </div>
          {
              hide &&
                  <div className="cdots">
                    ...
                  </div>
          }
        </div>
    );
};

const VisualLogicTable = ({obj}) => {

    const [currPick, setCurrPick] = useState([]);



    
    return (
        <div className="visualLogicTableWrapper">
          <div className="visualLogicTable">
            <VisualLogicIn
              obj={obj}
              depth={3}
              showID={false}
              currPick={currPick}
            />
          </div>
        </div>
    );
};


const VisualLogicTree = ({obj, picked, isDarkTheme, }) => {
    
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas.getContext) {            
            return ;
        }
        const ctx = canvas.getContext("2d");        
        let back_color = isDarkTheme ? "#444" : "#eee";
        let stroke_color = isDarkTheme ? "#eee" : "#444";
        ctx.fillStyle = back_color;
        ctx.fillRect(0, 0, 150000000, 150000000);
        ctx.strokeStyle = stroke_color;
        ctx.fillStyle = stroke_color;

        ctx.font = "20px serif";
        
        const drawCirc = (start, rad) => {
            ctx.beginPath();
            ctx.arc(start[0], start[1], rad, 0, Math.PI * 2, true); // Outer circle
            ctx.stroke();
        };

        const drawLine = (start, end) => {
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
        };

        const drawEdge = (start, end, rad=30) => {
            ctx.beginPath();
            const vec = [end[0] - start[0], end[1] - start[1]];
            let len = Math.sqrt(vec[0] ** 2 + vec[1] ** 2);
            let nrm = [vec[0] / len, vec[1] / len];
            ctx.moveTo(start[0] + nrm[0] * rad, start[1] + nrm[1] * rad);
            ctx.lineTo(end[0] - nrm[0] * rad, end[1] - nrm[1] * rad);
            ctx.stroke();
        };

        const drawNode = (start, rad, ins) => {
            drawCirc(start, rad);

            const toSymb = (ins) => {
                if (ins === "or")
                    return "∨";
                if (ins === "and")
                    return "∧";
                if (ins === "not")
                    return " ¬";
                return " " + ins;
            };
            
            ctx.fillText(toSymb(ins), start[0] - rad/2, start[1] + rad/4);
        };

        const drawGraph = (start=[40, 250], obj, rad=30, dir) => {

            drawNode(start, rad, obj.var || obj.op);

            if (!obj?.args )
                return ;

            const dx = 120;
            const dy = 120;

            if (obj?.args?.length === 1) {
                obj?.args?.map((i) => {
                    let endPath = [start[0], start[1] + dy];
                    drawGraph(endPath, i, rad, dir);
                    drawEdge(start, endPath, rad);
                });
            }
            if (obj?.args?.length === 2) {
                let i = 1;
                if (dir === "down")
                    i = 0; 
                obj?.args?.map((j, pos) => {
                    let endPath = [start[0] + dx * i, start[1] + dy];
                    drawGraph(endPath, j, rad, dir ||
                              (pos === 0 ? "up" : "down"));
                    drawEdge(start, endPath, rad);

                    if (dir !== "up" && dir !== "down")
                        i -= 1;
                    i -= 1;
                });
            }
        };

        drawGraph([750, 100], obj, 20);

        // drawCirc([40, 250], 30);
        // drawCirc([160, 130], 30);
        // drawCirc([160, 370], 30);
        
    }, [isDarkTheme, obj]);
    
    return (
        <div className="visualLogicTree">
          <canvas ref={canvasRef} width="1500" height="1500">
            logic tree canvas
          </canvas>
        </div>
    );
};

const Propositional = () => {

    const isDarkTheme = useSelector(state => state.theme.value);
    const dispatch = useDispatch();

    const id_obj = (obj) => {
        const mark = (obj, currID) => {
            obj.id = currID;
            currID++;
            if (obj.args)
                obj.args.map((i) => {
                    currID = mark(i, currID);
                });
            return currID;
        };
        let currObj = JSON.parse(JSON.stringify(obj));
        mark(currObj, 0);
        return currObj;
    };
    
    return (
        <div>
          <h1>
            Propositional Logic
          </h1>
          <h3>
            What's logic?
          </h3>
          <p>
            Logic is a thing that people use in order to draw conclusions.
            Examples include:
          </p>
          <ul>
            <li>
              If it's raining, then there's wet outside.
            </li>
            <li>
              If it's 2AM, then it's dark.
            </li>
            <li>
              If A, then B.
            </li>
          </ul>
          <p>
            
            Some things aren't that simple, but plenty 
          </p>
          <VisualLogicTable obj={id_obj(examples[0])}/>
          <VisualLogicTree obj={id_obj(examples[0])} isDarkTheme={isDarkTheme}/>
        </div>
    );
};

export default Propositional;
