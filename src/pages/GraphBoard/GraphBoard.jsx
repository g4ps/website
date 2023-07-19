import {useEffect, useState, useRef, useCallback} from 'react';
import { useSelector } from 'react-redux';
import './GraphBoard.scss';


const rad = 30;

const GraphBoard = () => {

    const isDarkTheme = useSelector(state => state.theme.value);

    
    const callsRef = useRef([0, 0, 0, 0, 0, 0]);    
    const canvasRef = useRef(null);
    const graphRef = useRef({
        nodes: [],
        edges: []
    });
    const maxID = useRef(0);
    const prevNode = useRef(null);
    const keyRef = useRef([]);
    const mousePos = useRef([0, 0]);
    // const mouseDownRef = useRef([0, 0]);

    const [mouseDownPos, setMouseDownPos] = useState(null);

    const [currNode, setCurrNode] = useState(null);

    const [canvasRes, setCanvasRes] = useState([100, 100]);

    const [keyPress, setKeyPress] = useState([]);
    const [graph, setGraph] = useState(null);

    const sq_norm = (vec) => {
        let ret = 0;
        vec.map(i => ret += i ** 2);
        return ret;
    };

    const notColliding = useCallback((arr, pos, rad) => {
        for (let j = 0; j < arr.length; j++) {
            let i = arr[j];
            if (sq_norm([i.pos[0] - pos[0], i.pos[1] - pos[1]]) < (rad * 2) ** 2)
                return false;
        }
        return true;
    }, []);

    useEffect(() => {
        callsRef.current[0]++; 
        if (keyPress !== null) {
            if (keyPress === 'a') {
                if (notColliding(graphRef.current.nodes, mousePos.current, 30)) {
                    let currID = maxID.current;
                    maxID.current++;
                    graphRef.current.nodes.push({id: currID, pos: mousePos.current});
                    setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                }
            }
            if (keyPress === 'c') {
                graphRef.current = {
                    nodes: [],
                    edges: []
                };
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                setCurrNode(null);
            }
        }
    }, [keyPress, notColliding]);

    useEffect(() => {

        if (mouseDownPos !== null) {
            // debugger;
            callsRef.current[1]++; 
            let set = false;
            for (let i = 0; i < graph?.nodes?.length; i++) {
                let j = graph?.nodes[i];
                if (sq_norm([j.pos[0] - mouseDownPos[0], j.pos[1] - mouseDownPos[1]]) <
                    rad ** 2) {
                    setCurrNode(j.id);
                    set = true;
                }
            }
            if (!set)
                setCurrNode(null);
            setMouseDownPos(null);

        }

    }, [mouseDownPos, graph]);

    useEffect(() => {
        callsRef.current[2]++; 
    }, [graph]);

    useEffect(() => {
        callsRef.current[3]++; 
        if (currNode === null) {
            prevNode.current = null;
            return ;
        }

        let pn = prevNode.current;
        let nn = currNode;
        let f1 = graph?.nodes?.find(i => i.id === pn);
        let f2 = graph?.nodes?.find(i => i.id === nn);
        if (pn !== null && nn !== null &&
            f1 !== undefined &&
            f2 !== undefined 
           ) {
            let newNodes = [prevNode.current, currNode];
            if (graphRef.current.edges.find(i => i.nodes.toString() ===
                                            newNodes.toString()) === undefined) {
                let currID = maxID.current;
                maxID.current++;
                graphRef.current.edges.push({id: currID, nodes: newNodes});
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                setCurrNode(null);
                prevNode.current = null;
            }
        }
        else {
            prevNode.current = currNode;
        }
    }, [graph, currNode]);

    useEffect(() => {
        callsRef.current[4]++; 
        const canvasResolutionSet = () => {
            setCanvasRes([window.innerWidth, window.innerHeight - 60]);
        };
        
        const keyDown = (e) => {
            if (!e.repeat) {
                keyRef.current.push(e.key);
                keyRef.current = [...new Set(keyRef.current.map(i => i.toLowerCase()))];
                setKeyPress(e.key);
            }

        };
        const keyUp = (e) => {
            if (!e.repeat) {
                keyRef.current = (keyRef.current.filter(i => i !== e.key.toLowerCase()));
                setKeyPress(null);
            }
        };

        window.addEventListener("resize", canvasResolutionSet);
        window.addEventListener("keydown", keyDown);
        window.addEventListener("keyup", keyUp);
        canvasResolutionSet();
        return () => {
            window.removeEventListener("resize", canvasResolutionSet);
            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("keyup", keyUp);
        };
    }, []);

    useEffect(() => {
        callsRef.current[5]++; 
        const canvas = canvasRef.current;
        if (!canvas)
            return () => {};
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return () => {};

        const onMouseMove = (e) => {
            mousePos.current = [e.offsetX, e.offsetY];
        };

        const onMouseDown = (e) => {
            setMouseDownPos([e.offsetX, e.offsetY]);
            // console.log(mouseDownPos);
        };

        const onMouseUp = (e) => {
            setMouseDownPos(null);
        };
        
        canvasRef.current.addEventListener("mousemove", onMouseMove);
        canvasRef.current.addEventListener("mousedown", onMouseDown);
        canvasRef.current.addEventListener("mouseup", onMouseUp);
        let back_color = isDarkTheme ? "#444" : "#eee";
        let stroke_color = isDarkTheme ? "white" : "#444";

        const clearCanvas = () => {
            ctx.reset();
            // ctx.translate(.5, 0.5);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = back_color;
            ctx.fillRect(-1000000, -100000, 150000000, 150000000);
            ctx.strokeStyle = stroke_color;
            ctx.fillStyle = stroke_color;
        };

        const drawCirc = (start, rad = 30) => {
            ctx.beginPath();
            ctx.arc(start[0], start[1], rad, 0, Math.PI * 2, true); // Outer circle
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

        const draw = () => {
            
            graph?.nodes?.forEach((i => {
                if (currNode === i.id) {
                    ctx.strokeStyle = "blue";
                }
                drawCirc(i.pos, 30);
                ctx.strokeStyle = stroke_color;
            }));
            graph?.edges.forEach((i) => {
                let st = graph?.nodes?.find(j => j.id === i.nodes[0]).pos;
                let end = graph?.nodes?.find(j => j.id === i.nodes[1]).pos;
                drawEdge(st, end);
            });

            ctx.font = "14pt serif";
            // ctx.strokeText("Press 'a' to add a node, click on two nodes in succession to create a edge, press 'c' to clear", 20, 20);
            ctx.fillText("Press 'a' to add a vertex, click on two vertices in succession to create an edge, press 'c' to clear everything", 20, 20);
        };

        clearCanvas();
        draw();
        return () => {
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
        };
    }, [canvasRes, graph, isDarkTheme, currNode]);
    
    return (
        <div className="logicBoard">
          <h1>
            {JSON.stringify(keyPress)}
          </h1>
          <canvas ref={canvasRef} width={canvasRes[0]} height={canvasRes[1]}/>
          {/* <button style={{ */}
          {/*     padding: "20px", */}
          {/*     position: "fixed", */}
          {/*     top: "0", */}
          {/*     right: "40px", */}
          {/*     background: "green" */}
          {/* }} */}
          {/*         onClick={() => { */}
          {/*             console.log("currToll " + callsRef.current); */}
          {/*         }} */}
          {/* > */}
            
          {/* </button> */}
        </div>
    );
};

export default GraphBoard;
