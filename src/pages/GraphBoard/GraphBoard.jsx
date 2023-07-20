import {useEffect, useState, useRef, useCallback} from 'react';
import { useSelector } from 'react-redux';
import './GraphBoard.scss';

const drawCirc = (ctx, start, rad = 30) => {
    ctx.beginPath();
    ctx.arc(start[0], start[1], rad, 0, Math.PI * 2, true); // Outer circle
    ctx.stroke();
    ctx.closePath();                
};

const drawEdge = (ctx, start, end, rad=30) => {
    ctx.beginPath();
    const vec = [end[0] - start[0], end[1] - start[1]];
    let len = Math.sqrt(vec[0] ** 2 + vec[1] ** 2);
    let nrm = [vec[0] / len, vec[1] / len];
    ctx.moveTo(start[0] + nrm[0] * rad, start[1] + nrm[1] * rad);
    let endpos = [end[0] - nrm[0] * rad, end[1] - nrm[1] * rad];
    ctx.lineTo(endpos[0], endpos[1]);
    const arrowLen = rad / 2;
    //Rotation matrix
    ctx.lineTo(endpos[0] - (nrm[0] * 0.866 * arrowLen) - (nrm[1] * 0.5 * arrowLen) ,
               endpos[1] + (nrm[0] * 0.5 * arrowLen) - (nrm[1] * 0.866 * arrowLen));
    ctx.lineTo(endpos[0] - (nrm[0] * 0.866) * arrowLen + (nrm[1] * 0.5) * arrowLen,
               endpos[1] - (nrm[0] * 0.5 * arrowLen) - (nrm[1] * 0.866 * arrowLen));
    ctx.lineTo(endpos[0], endpos[1]);
    ctx.stroke();
    ctx.fill();
};

const rad = 30;

const GraphBoard = () => {

    const isDarkTheme = useSelector(state => state.theme.value);

    const  back_color = isDarkTheme ? "#444" : "#eee";
    const stroke_color = isDarkTheme ? "white" : "#444";
    const callsRef = useRef([0, 0, 0, 0, 0, 0]);    
    const canvasRef = useRef(null);
    const canvasOverRef = useRef(null);

    const graphRef = useRef({
        nodes: [],
        edges: []
    });
    const maxID = useRef(0);
    const prevNode = useRef(null);
    const keyRef = useRef([]);
    const mousePos = useRef(null);
    const [mousePosState, setMousePosState] = useState(null);

    const [mouseDownPos, setMouseDownPos] = useState(null);
    const [isMousePressed, setIsMousePressed] = useState(false);
    
    const [currNode, setCurrNode] = useState(null);

    const [canvasRes, setCanvasRes] = useState([100, 100]);

    const [keyPress, setKeyPress] = useState([]);
    const [graph, setGraph] = useState(null);

    const [tempNodeID, setTempNodeID] = useState(null);
    const [tempNodePos, setTempNodePos] = useState(null);

    const sq_norm = (vec) => {
        let ret = 0;
        vec.map(i => ret += i ** 2);
        return ret;
    };

    useEffect(() => {
        console.log(graph);
    }, [graph]);

    const notColliding = useCallback((arr, pos, rad) => {
        for (let j = 0; j < arr.length; j++) {
            let i = arr[j];
            if (sq_norm([i.pos[0] - pos[0], i.pos[1] - pos[1]]) < (rad * 2) ** 2)
                return false;
        }
        return true;
    }, []);


    useEffect(() => {
        if (isMousePressed) {
            if (currNode) {
                setTempNodeID(currNode);
                // console.log(currNode);
            }
        }
        else {
            setTempNodeID(null);
            // console.log(null);
        }
    }, [isMousePressed, currNode]);

    const keyPressHandle = useCallback((key) => {
        if (key === 'a') {
            if (mousePos.current &&
                notColliding(graphRef.current.nodes, mousePos.current, 30)) {
                let currID = maxID.current;
                maxID.current++;
                graphRef.current.nodes.push({id: currID, pos: mousePos.current});
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
            }
        }
        if (key === 'c') {
            graphRef.current = {
                nodes: [],
                edges: []
            };
            setGraph(JSON.parse(JSON.stringify(graphRef.current)));
            setCurrNode(null);
        }
        if (key === 'd') {
            if (currNode !== null) {
                graphRef.current.nodes = graphRef.current.nodes.filter(i => i.id !== currNode);
                graphRef.current.edges = graphRef.current.edges.filter(i => i.nodes.indexOf(currNode) < 0);
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                setCurrNode(null);
            }
        }
    }, [notColliding, currNode]);

    const mouseDownHandle = useEffect(() => {
        if (mouseDownPos !== null) {
            callsRef.current[1]++;
            if (currNode !== null) {
                let k = currNode;
                if (notColliding(graphRef.current.nodes.filter(i => i.id !== currNode), mousePos.current, rad)) {
                    graphRef.current.nodes.find(i => i.id === currNode).pos = mousePos.current;
                    setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                    setCurrNode(null);
                    setMouseDownPos(null);
                    return ;
                }
            }
            let set = false;
            for (let i = 0; i < graph?.nodes?.length; i++) {
                let j = graph?.nodes[i];
                if (sq_norm([j.pos[0] - mouseDownPos[0], j.pos[1] - mouseDownPos[1]]) <
                    rad ** 2) {
                    setCurrNode(j.id);
                    set = true;
                }
            }
            if (!set) {
                setCurrNode(null);
            }
            setMouseDownPos(null);

        }
    }, [currNode, mouseDownPos, graph]);

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
            let curr_edge =
                graphRef.current.edges.find(i => i.nodes.toString() === newNodes.toString());
            if (curr_edge === undefined) {
                let currID = maxID.current;
                maxID.current++;
                graphRef.current.edges.push({id: currID, nodes: newNodes});
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                setCurrNode(null);
                prevNode.current = null;
            }
            else {
                let ind = graphRef.current.edges.indexOf(curr_edge);
                if (ind >= 0) {
                    graphRef.current.edges.splice(ind, 1);
                    
                }
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
        const canvas = canvasOverRef.current;
        if (!canvas)
            return () => {};
        
        const canvasResolutionSet = () => {
            setCanvasRes([window.innerWidth, window.innerHeight - 60]);
        };
        
        const keyDown = (e) => {
            if (!e.repeat) {
                keyRef.current.push(e.key);
                keyRef.current = [...new Set(keyRef.current.map(i => i.toLowerCase()))];
                keyPressHandle(e.key);
            }

        };
        
        const keyUp = (e) => {
            if (!e.repeat) {
                keyRef.current = (keyRef.current.filter(i => i !== e.key.toLowerCase()));
                setKeyPress(null);
            }
        };
        
        const onMouseMove = (e) => {
            mousePos.current = [e.offsetX, e.offsetY];
            setMousePosState([e.offsetX, e.offsetY]);
        };

        const onMouseDown = (e) => {
            setMouseDownPos([e.offsetX, e.offsetY]);
            setIsMousePressed(true);
        };

        const onMouseUp = (e) => {
            setIsMousePressed(false);
            setMouseDownPos(null);
        };

        const onMouseOut = (e) => {
            setIsMousePressed(false);
            setMouseDownPos(null);
        };
        window.addEventListener("resize", canvasResolutionSet);
        window.addEventListener("keydown", keyDown);
        window.addEventListener("keyup", keyUp);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);
        canvasResolutionSet();
        return () => {
            window.removeEventListener("resize", canvasResolutionSet);
            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("keyup", keyUp);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseout", onMouseOut);
        };
    }, [keyPressHandle]);


    useEffect(() => {

        //Higher canvas handling
        
        const canvas = canvasOverRef.current;
        if (!canvas)
            return ;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return ;
        const clearCanvas = () => {
            ctx.reset();
            // ctx.translate(.5, 0.5);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = stroke_color;
            ctx.fillStyle = "transparent";
            ctx.fillRect(-1000000, -100000, 150000000, 150000000);
        };

        const draw = () => {
            if (currNode !== null) {
                let nd = graph?.nodes?.find(i => i.id === currNode);
                if (nd !== undefined) {
                    ctx.save();
                    ctx.strokeStyle = "blue";
                    drawCirc(ctx, mousePosState, 30);
                    ctx.restore();
                }
                graph?.edges.forEach((i) => {
                    if (currNode !== null && i.nodes.indexOf(currNode) >= 0) {
                        ctx.save();
                        ctx.strokeStyle  = stroke_color;
                        ctx.fillStyle  = stroke_color;
                        let st = i.nodes[0] === nd.id ? mousePosState : 
                            graph?.nodes?.find(j => j.id === i.nodes[0]).pos;
                        let end = i.nodes[1] === nd.id ? mousePosState : 
                            graph?.nodes?.find(j => j.id === i.nodes[1]).pos;
                        // let st = i.nodes[0] === nd.id ? nd.pos : 
                        //     graph?.nodes?.find(j => j.id === i.nodes[0]).pos;
                        // let end = i.nodes[1] === nd.id ? nd.pos : 
                        //     graph?.nodes?.find(j => j.id === i.nodes[1]).pos;
                        drawEdge(ctx, st, end);
                        ctx.restore();
                    }

                });
            }
        };

        clearCanvas();
        draw();
        
    }, [graph, mousePosState, currNode]);

    useEffect(() => {
        callsRef.current[5]++; 
        const canvas = canvasRef.current;
        if (!canvas)
            return ;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return ;
               
        ctx.imageSmoothingEnabled = false;
        const clearCanvas = () => {
            ctx.reset();
            // ctx.translate(.5, 0.5);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = back_color;
            ctx.fillRect(-1000000, -100000, 150000000, 150000000);
            ctx.strokeStyle = stroke_color;
            ctx.fillStyle = stroke_color;
        };

        const draw = () => {            
            graph?.nodes?.forEach((i => {
                if (currNode === i.id) {
                    ctx.save();
                    ctx.setLineDash([5, 5]);
                }
                drawCirc(ctx, i.pos, 30);
                if (currNode === i.id) {
                    ctx.restore();
                }
            }));
            graph?.edges.forEach((i) => {
                if (i.nodes.indexOf(currNode) >= 0) {
                    ctx.save();
                    ctx.setLineDash([5, 5]);                    
                }
                let st = graph?.nodes?.find(j => j.id === i.nodes[0]).pos;
                let end = graph?.nodes?.find(j => j.id === i.nodes[1]).pos;
                drawEdge(ctx, st, end);
                if (i.nodes.indexOf(currNode) >= 0) {
                    ctx.restore();
                }
            });
        };

        clearCanvas();
        draw();
    }, [canvasRes, graph, isDarkTheme, currNode]);
    
    return (
        <div className="logicBoard">
          <h1>
            {JSON.stringify(keyPress)}
          </h1>
          <div className="legend">
            <ul>
              <li>
                Press "a" to add a node
              </li>
              <li>
                Press "c" to clear the field
              </li>
              <li>
                Press on a node and then predd "d" to delete the node
              </li>
              <li>
                Press on consecutive nodes to draw an edge
              </li>            
            </ul>
            
          </div>
          <canvas ref={canvasRef} width={canvasRes[0]} height={canvasRes[1]}/>
          <canvas
            className="canvasOver"
            ref={canvasOverRef}
            width={canvasRes[0]}
            height={canvasRes[1]}
          />
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
          {/* >             */}
          {/* </button> */}
        </div>
    );
};

export default GraphBoard;
