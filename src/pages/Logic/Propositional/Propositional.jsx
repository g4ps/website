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
    const translate = useRef(null);
    const zoom = useRef(1);
    const lastZoom = useRef(1);
    const isMouseDown = useRef(null);
    const once = useRef(null);
    const [smth, setSmth] = useState(0);

    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas.getContext) {            
            return ;
        }
        const ctx = canvas.getContext("2d");



        const draw = (translate, zm) => {
            // console.log(translate);
            // translate = [20, 20];
            // ctx.clearRect(0, 0, canvas.width, canvas.height);

            let back_color = isDarkTheme ? "#444" : "#eee";
            let stroke_color = isDarkTheme ? "white" : "#444";

            ctx.clearRect(0, 0, canvas.width, canvas.height);


            ctx.fillStyle = back_color;
            ctx.fillRect(-1000000, -100000, 150000000, 150000000);
            ctx.strokeStyle = stroke_color;
            ctx.fillStyle = stroke_color;
            
            zm && ctx.scale(zm, zm);
            translate && ctx.translate(translate[0] / zoom.current, translate[1] / zoom.current);
            // ctx.save();
            // ctx.setTransform(1, 0, 0, 1, 0, 0);
            // ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            ctx.font = "20px serif";
            
            const drawCirc = (start, rad) => {
                ctx.beginPath();
                ctx.arc(start[0], start[1], rad, 0, Math.PI * 2, true); // Outer circle
                ctx.stroke();
                ctx.closePath();                
            };

            const drawLine = (start, end) => {
                ctx.beginPath();
                ctx.moveTo(start[0], start[1]);
                ctx.lineTo(end[0], end[1]);
                ctx.stroke();
                ctx.closePath();
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

                const dx = 300;
                const dy = 100;

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
            // ctx.restore();
            drawGraph([50, 50], obj, 20);

        };



        isMouseDown.current = false;
        var downPosition = [0, 0];
        translate.current = [0, 0];
        draw(translate.current);




        if (!once.current) {
            once.current = true;
            // console.log("hello");

            canvasRef.current.addEventListener("mousedown", (e) => {
                isMouseDown.current = true;
                downPosition = [e.offsetX, e.offsetY];
                // console.log("mouse down " + downPosition);
            });
            canvasRef.current.addEventListener("mouseup", (e) => {
                // downPosition = [e.offsetX, e.offsetY];
                // console.log("mouse up " + downPosition);
                isMouseDown.current = false;
            });
            canvasRef.current.addEventListener("mousemove", (e) => {
                // console.log(e);
                if (isMouseDown.current) {
                    translate.current = [e.offsetX - downPosition[0], e.offsetY - downPosition[1]];
                    downPosition = [e.offsetX, e.offsetY];
                    draw(translate.current);
                }
            }, false);
            canvasRef.current.addEventListener("touchstart", (e) => {
                e.preventDefault();
                isMouseDown.current = true;
                downPosition = [e.touches[0].clientX, e.touches[0].clientY];
                // console.log("mouse down " + downPosition);
            }, false);
            canvasRef.current.addEventListener("touchend", (e) => {
                e.preventDefault();
                isMouseDown.current = false;
                // downPosition = [e.offsetX, e.offsetY];
                // console.log("mouse down " + downPosition);
            }, false);

            canvasRef.current.addEventListener("wheel", (e) => {
                e.preventDefault();
                console.log(e.deltaY);
                const delta = 0.05;
                let prevZoom = zoom.current;
                let newZoom = zoom.current;
                if (e.deltaY > 0)
                    newZoom += delta;
                else
                    newZoom -= delta;
                if (0.7 <= newZoom  && newZoom <= 5)
                    zoom.current = newZoom;
                draw(translate.current, zoom.current - prevZoom + 1);
            }, false);

            canvasRef.current.addEventListener("touchmove", (e) => {
                e.preventDefault();
                if (isMouseDown.current && e.touches.length === 1) {
                    translate.current = [e.touches[0].clientX - downPosition[0], e.touches[0].clientY - downPosition[1]];
                    downPosition = [e.touches[0].clientX, e.touches[0].clientY];
                    draw(translate.current);
                }
                if (e.touches.length === 2) {
                    
                }
            });
            canvasRef.current.addEventListener("mouseout", () => {
                isMouseDown.current = false;                
                // console.log("mouse out");
            });
        }




        
    }, [isDarkTheme, obj, smth]);
    
    return (
        <div className="visualLogicTree">
          <canvas ref={canvasRef} width="2000" height="1000">
            logic tree canvas
          </canvas>
          <button onClick={() => {
              setSmth(smth + 1);
              translate.current = [0, 0];
          }}>
            Push me
          </button>
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
            It's a bit tricky to give a proper defnition of logic, so that it is both
            correct and makes sence. Wiki defines logic as a study of correct reasoning.
            Informally, it's the thing, that allows
            people to draw conclusions from the information that they've got. For example,
            if you are going outside for some nice walk and someone tells you that it's
            raining, then you draw a conclusion that it's wet outside,
            therefore it's pretty miserable out there, thus you ought to stay inside
            and do something else.
          </p>
          <p>
            Let us look at the another example: imagine that you're standing in a warehouse and
            you're tasked with finding something that will support the weight of a car.
            Everywhere you look, you see lorbyderbs. You don't know what the hell a
            lorbyderb is, but on the packaging it says that lorbyderbs are specifically designed
            to support the weight of a car, and then some. Thus you can draw a conclusion
            that a lorbyderb can support the weight of a car, and therefore you task is complete.
          </p>
          <p>
            There's also a good ol' fashioned albeit morbid greek example:            
          </p>
          <ul>
            <li>
              All men are mortal
            </li>
            <li>
              Socrates is a man
            </li>
            <li>
              Therefore Socrates is mortal
            </li>
          </ul>
          <p>
            Now we can try to make those examples a bit more abstract and generalized, and
            conclude that we've got a rule
          </p>
          <ul>
            <li>
              All <b>A</b> are <b>B</b>
            </li>
            <li>
              <b>x</b> is <b>A</b>
            </li>
            <li>
              Therefore <b>x</b> is <b>B</b>
            </li>
          </ul>
          <p>
            We don't care now about the nature of the facts that we're talking about, as long
            as we know that they are true. For example, pretend for a while that you don't
            know any topology. Suppose that we know only that singletons are closed in Hausdorff
            spaces and that <b>x</b> is a singleton in a Hausdorff space.
            We can use our rule once again
          </p>
          <li>
            All singletons are closed in Hausdorff spaces
          </li>
          <li>
            <b>x</b> is a singleton in Hausdorff space
          </li>
          <li>
            Therefore <b>x</b> is closed.
          </li>
          <p>
            This example once again shows that even if we don't have any idea of what the hell
            is going on, as long as initial facts are true, the conclusions follow. 
          </p>
          <p>
            This is probably a good place to note that there're two kinds of logic: formal and
            informal. Informal logic is something that is akin to our example with rain:
            it does not give us concrete conclusions. Although it is raining outside,
            the whole world is outside and there bound to be a place where there's no rain.
            If it's 2AM, then it's not necessarily dark because you might be indoors and
            the light might be on. A given lorbyderb might have some defects in it, and
            can fail its task. Formal logic on the other hand is something that is always
            correct, has a lot of interesting things going on in it,
            it has a lot of uses and is a prerequisite for the informal logic.
            It is also a backbone of mathematics and by extension any other science under the
            sun. That's why this "book" is exclusively focused on the formal logic.
          </p>
          <p>            
            More of the rules such as the one that we've  exist, and
            all of them even have a name, but more
            about it later. Hopefully by now you've got a somewhat foggy understanding of what
            logic is.
          </p>
          <h3>
            What's propositional?
          </h3>
          <p>
            There are several kinds of formal logic: propositional, first-order, and higher-order.
            Propositional means that this logic is about propositions.
            Propositional logic is the easiest one to get acquainted with, and therefore we'll
            start with it. Given that it is a backbone of first order-logic, sometimes it's
            called a zeroeth-order logic, but we'll stick with the term "propositional".
          </p>
          
          <VisualLogicTable obj={id_obj(examples[0])}/>
          <VisualLogicTree obj={id_obj(examples[0])} isDarkTheme={isDarkTheme}/>
        </div>
    );
};

export default Propositional;
