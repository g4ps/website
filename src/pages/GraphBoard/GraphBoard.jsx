import {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import { useSelector } from 'react-redux';
import './GraphBoard.scss';

const rad = 15;

const notColliding = (arr, pos, rad) => {
    for (let j = 0; j < arr.length; j++) {
        let i = arr[j];
        if (sq_norm([i.pos[0] - pos[0], i.pos[1] - pos[1]]) < (rad * 2) ** 2)
            return false;
    }
    return true;
};

const detectMob = () =>  {
    //stolen from StackOverflow;
    //if the user-agent is mobile, returns true;
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

const sq_norm = (vec) => {
    let ret = 0;
    vec.map(i => ret += i ** 2);
    return ret;
};

// const movingHandling = (ctx, currentOffc, screenOffc) => {
//     if (currentOffc.current.toString() !== screenOffc.toString()) {
//         let k = currentOffc.current;
//         let j = screenOffc;
//         let ret = screenOffc.slice(0);
//         let diff = [screenOffc[0] - currentOffc.current[0],
//                     screenOffc[1] - currentOffc.current[1]];
//         ctx.translate(-diff[0], diff[1]);
//     }
// };

const drawCirc = (ctx, start, rad = 30) => {
    // debugger;
    ctx.beginPath();
    ctx.arc(start[0], start[1], rad, 0, Math.PI * 2, true); // Outer circle
    ctx.stroke();
    ctx.closePath();                
};

const drawAxis = (ctx, bound, convert) => {
    ctx.save();
    ctx.lineWidth = 5;
    let ox = [convert([bound[0][0], 0]), convert([bound[0][1], 0])];
    let oy = [convert([0, bound[1][0]]), convert([0, bound[1][1]])];
    // debugger;
    ctx.beginPath();
    ctx.moveTo(ox[0][0], ox[0][1]);
    ctx.lineTo(ox[1][0], ox[1][1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(oy[0][0], oy[0][1]);
    ctx.lineTo(oy[1][0], oy[1][1]);
    ctx.stroke();
    ctx.restore();
}

const drawFieldBox = (ctx, bound, convert) => {
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "red";
    //Boundaries of the field
    let lines = [
        [convert([bound[0][0], bound[1][0]]), convert([bound[0][1], bound[1][0]])],
        [convert([bound[0][0], bound[1][1]]), convert([bound[0][1], bound[1][1]])],
        [convert([bound[0][0], bound[1][1]]), convert([bound[0][0], bound[1][0]])],
        [convert([bound[0][1], bound[1][1]]), convert([bound[0][1], bound[1][0]])],
    ];
    // debugger;
    for (let i = 0; i < lines.length; i++) {
        ctx.beginPath();
        ctx.moveTo(lines[i][0][0], lines[i][0][1]);
        ctx.lineTo(lines[i][1][0], lines[i][1][1]);
        ctx.stroke();
    }
    ctx.restore();
};

const drawEdge = (ctx, start, end, rad=30) => {
    ctx.beginPath();
    const vec = [end[0] - start[0], end[1] - start[1]];
    let len = Math.sqrt(vec[0] ** 2 + vec[1] ** 2);
    let nrm = [vec[0] / len, vec[1] / len];
    ctx.moveTo(start[0] + nrm[0] * rad, start[1] + nrm[1] * rad);
    let endpos = [end[0] - nrm[0] * rad, end[1] - nrm[1] * rad];
    ctx.lineTo(endpos[0], endpos[1]);
    const arrowLen = rad / 3;
    //Here we essentially use a 2D rotation matrix to draw arrows.
    //For explanation go to wiki or any good linear algebra book

    const cst = 0.8660254037844387;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endpos[0], endpos[1]);
    ctx.lineTo(endpos[0] - (nrm[0] * cst * arrowLen) - (nrm[1] * 0.5 * arrowLen),
               endpos[1] + (nrm[0] * 0.5 * arrowLen) - (nrm[1] * cst * arrowLen));
    ctx.lineTo(endpos[0] - (nrm[0] * cst) * arrowLen + (nrm[1] * 0.5) * arrowLen,
               endpos[1] - (nrm[0] * 0.5 * arrowLen) - (nrm[1] * cst * arrowLen));
    ctx.lineTo(endpos[0], endpos[1]);
    ctx.stroke();
    ctx.fill();
};



const GraphBoard = () => {

    const isDarkTheme = useSelector(state => state.theme.value);
    const back_color = isDarkTheme ? "#444" : "#eee";
    const stroke_color = isDarkTheme ? "white" : "#444";

    const wheelSensetivity = 0.0007;
    
    const canvasRef = useRef(null);
    const canvasOverRef = useRef(null);

    const testRef = useRef([0, 0, 0]);

    const graphRef = useRef({
        nodes: [],
        edges: []
    });
    const maxID = useRef(0);
    const prevNode = useRef(null);
    const ctrlDown = useRef(false);
    const keyRef = useRef([]);
    const mousePos = useRef(null);
    // const currentOffc = useRef([0, 0]);
    const fieldMouseRef = useRef([0, 0]);
    const [mousePosState, setMousePosState] = useState(null);
    const [mouseDownPos, setMouseDownPos] = useState(null);
    
    const [isMousePressed, setIsMousePressed] = useState(false);
    
    const [currNode, setCurrNode] = useState(null);

    const [canvasRes, setCanvasRes] = useState([500, 500]);

    const [keyPress, setKeyPress] = useState([]);
    const [graph, setGraph] = useState(null);

    const [scale, setScale] = useState(1.0);

    const [screenOffc, setScreenOffc] = useState([0, 0]); //left down corner of the canvas

    //Sets an invevrval for OX and OY, for which the field is defined
    const fieldSize = useMemo(() => [[-5000, 5000], [-5000, 5000]], []);

    const changeScale = useCallback((ds) => {
        // Bound for the scale; sets the value in interval [0.3, 8]
        let newScale = ds + scale;
        newScale = Math.max(Math.min(8, newScale), 0.3);
        setScale(newScale);
        return newScale - scale;
    }, [scale]);

    const isMobile = useMemo(() => {
        return detectMob();        
    }, []);
    
    const canvasFOV = useMemo(() => {
        return [canvasRes[0] / scale, canvasRes[1] / scale];
    }, [canvasRes, scale]);

    const fieldToCanvas = useCallback((vec) => {
        //Function that transfers field coordinates to
        //canvas unshifted unscaled coordinates
        return [vec[0] - screenOffc[0], canvasRes[1] - vec[1] + screenOffc[1]];
    }, [screenOffc, canvasRes]);

    const canvasToField = useCallback((vec) => {
        //Function that transfers canvas coordinates to
        //scaled field coordinates.
        if (vec === null)
            return null;
        // let sc = screenOffc;
        // let cr = canvasRes;
        return [Math.floor(vec[0] / scale) + screenOffc[0], Math.floor((canvasRes[1] - vec[1]) / scale) + screenOffc[1]];
    }, [screenOffc, scale, canvasRes]);

    const changeScreenOffc = useCallback((dx, dy) => {
        //Bound for screenOffcet; boundary values are located in fieldSize 
        let n = [screenOffc[0] + dx, screenOffc[1] + dy];
        const setWithinBoundaries = (bound, arg) => {
            for (let i = 0; i < 2; i++) {
                if (arg[i] < bound[i][0]) {
                    arg[i] = bound[i][0];
                }
                if (arg[i] > bound[i][1] - canvasFOV[i]) {
                    arg[i] = bound[i][1] - canvasFOV[i];
                }
            }
        };
        setWithinBoundaries(fieldSize, n);
        setScreenOffc(n);
    }, [screenOffc, canvasFOV, fieldSize]);

    const scaleOnPoint = useCallback((ds, point) => {
        // scales the canvas around specified point (usually around the mouse coordinates)
        // inputs raw mouse coordinates
        if (point === null)
            return ;
        let dse = changeScale(ds);
        let dx = ((point[0] / scale) * dse) / (scale + dse);
        let py = canvasRes[1] - point[1];
        let dy = ((py / scale) * dse) / (scale + dse);
        
        changeScreenOffc(dx, dy);
    }, [scale, changeScale, canvasRes, changeScreenOffc]);

    const fieldMousePos = useMemo(() => {
        //outputs current field coordinates. Raison d'etre is unclear since
        //there's already a ref with the same values
        fieldMouseRef.current = canvasToField(mousePosState);
        return fieldMouseRef.current;
    }, [mousePosState, canvasToField]);

    const addNode = useCallback((pos) => {
        let currID = maxID.current;
        maxID.current++;
        graphRef.current.nodes.push({id: currID, pos: pos});
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));        
    }, []);

    const clearEverything = useCallback(() => {
        graphRef.current = {
            nodes: [],
            edges: []
        };
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        setCurrNode(null);

        //////////////////////////////////////////////////////////////////////
        // Reference points for scaling and whatnot (debug)
        //////////////////////////////////////////////////////////////////////
        // for (let i = 1; i <= 8; i *= 2) {
        //     addNode([0, Math.floor(canvasRes[1] / i)]);
        // }
        // for (let i = 1; i <= 8; i *= 2) {
        //     addNode([Math.floor(canvasRes[0] / i), 0]);
        // }
        // addNode([400, 400]);
        // addNode([0, canvasRes[1] / 2]);
        // addNode([canvasRes[0] / 2, 0]);
        // addNode([canvasRes[0] / 4, 0]);
        // addNode([canvasRes[0] / 4 * 3, 0]);
        // addNode([canvasRes[0] / 6 * 2, 0]);
        // addNode([canvasRes[0] / 6 * 4, 0]);
        // addNode([canvasRes[0] / 2, 100]);
        // addNode([canvasRes[0] / 4, 100]);
        // addNode([canvasRes[0] / 4 * 3, 100]);
        // addNode([canvasRes[0] / 6 * 2, 100]);
        // addNode([canvasRes[0] / 6 * 4, 100]); 
        // addNode([canvasRes[0] / 1.6, 0]);
    }, []); 



    const deleteNode = useCallback((id) => {
        graphRef.current.nodes = graphRef.current.nodes.filter(i => i.id !== id);
        graphRef.current.edges = graphRef.current.edges.filter(i => i.nodes.indexOf(id) < 0);
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        setCurrNode(null);
    }, []);

    const keyPressHandle = useCallback((key) => {
        //Handling of properly pressed (not raw inputs) keys
        key = key.toLowerCase();
        const doffc = 50 / scale;
        if (key === 'a') {
            if (fieldMouseRef.current &&
                notColliding(graphRef.current.nodes, fieldMouseRef.current, rad)) {
                addNode(fieldMouseRef.current);
            }
        }
        if (key === 'c') {
            clearEverything();
        }
        if (key === 'd' || key === 'delete') {
            if (currNode !== null) {
                deleteNode(currNode);
            }
        }
        //Debug and whatnot 
        if (key === "arrowup") {
            changeScreenOffc(0, doffc); 
        }
        if (key === "arrowdown") {
            changeScreenOffc(0, -doffc); 
        }
        if (key === "arrowleft") {
            changeScreenOffc(-doffc, 0); 
        }
        if (key === "arrowright") {
            changeScreenOffc(doffc, 0); 
        }
        if (key === "p") {
            changeScale(0.2);
        }
        if (key === "l") {
            changeScale(-0.2);
        }
        if (key === "m") {
            console.log(fieldMouseRef.current);
        }
        if (key === "s") {
            console.log(screenOffc);
        }
        // if (key === "u") {
        //     scaleOnPoint(0.1, [0, 792]);
        // }
        if (key === "i") {
            scaleOnPoint(0.2, [400, 400]);
        }
    }, [currNode, changeScreenOffc, addNode,
        clearEverything, deleteNode,
        scale, screenOffc, changeScale, scaleOnPoint]); 

    

    useEffect(() => {
        //handling of proper mouse events; TODO: make this thing a function
        if (mouseDownPos !== null) {
            if (currNode !== null) {
                if (notColliding(graphRef.current.nodes.filter(i => i.id !== currNode), fieldMouseRef.current, rad)) {
                    graphRef.current.nodes.find(i => i.id === currNode).pos = fieldMouseRef.current;
                    setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                    setCurrNode(null);
                    setMouseDownPos(null);
                    return ;
                }
            }
            let set = false;

            for (let i = 0; i < graph?.nodes?.length; i++) {
                let j = graph?.nodes[i];
                let k = canvasToField(mouseDownPos);
                if (sq_norm([j.pos[0] - k[0], j.pos[1] - k[1]]) <
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
    }, [currNode, mouseDownPos, graph, canvasToField]);


    useEffect(() => {
        //handling of change of current node ID. Used for selecting, drawing and whatnot
        //TODO: consider making this a proper function.
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
        //adding events to windows and canvases
        const canvas = canvasOverRef.current;
        if (!canvas)
            return () => {};
        
        const canvasResolutionSet = () => {
            let nr = [window.innerWidth, window.innerHeight - 60];
            if (canvasRes.toString() !== nr.toString())
                setCanvasRes(nr);
        };
        
        const keyDown = (e) => {
            if (!e.repeat) {
                keyRef.current.push(e.key);
                keyRef.current = [...new Set(keyRef.current.map(i => i.toLowerCase()))];
                keyPressHandle(e.key);
            }
            if (e.key === "Control") {
                ctrlDown.current = true;
            }
        };
        
        const keyUp = (e) => {
            if (!e.repeat) {
                keyRef.current = (keyRef.current.filter(i => i !== e.key.toLowerCase()));
                setKeyPress(null);
            }
            if (e.key === "Control") {
                ctrlDown.current = false;
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

        const onWheel = (e) => {
            e.preventDefault();
            if (ctrlDown.current) {
                if (e.deltaY)
                    scaleOnPoint(- e.deltaY * wheelSensetivity, mousePos.current);
                // console.log(e.deltaY);
            }
            else {
                changeScreenOffc(e.deltaX / scale, -(e.deltaY / scale));
            }
        };
        
        canvasResolutionSet();
        window.addEventListener("resize", canvasResolutionSet);
        window.addEventListener("keydown", keyDown);
        window.addEventListener("keyup", keyUp);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);
        canvas.addEventListener("wheel", onWheel);
        return () => {
            window.removeEventListener("resize", canvasResolutionSet);
            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("keyup", keyUp);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseout", onMouseOut);
            canvas.removeEventListener("wheel", onWheel);
        };
    }, [keyPressHandle, canvasRes, scaleOnPoint, changeScreenOffc, scale]);


    // There're two canvases: one on top with all the moving stuff, and one underlying
    // with (somewhat) static image. Split is used for optimization purposes

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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = stroke_color;
            ctx.fillStyle = "transparent";
            ctx.fillRect(-1000000, -100000, 150000000, 150000000);
            // movingHandling(ctx, currentOffc, screenOffc);
        };

        const draw = () => {
            testRef.current[1]++;
            clearCanvas();
            ctx.translate(0, -canvasRes[1] * (scale - 1));
            ctx.scale(scale, scale);
            if (currNode !== null) {
                let nd = graph?.nodes?.find(i => i.id === currNode);
                if (nd !== undefined) {
                    ctx.save();
                    ctx.strokeStyle = "orange";
                    ctx.fillStyle = "orange";
                    drawEdge(ctx, fieldToCanvas(nd.pos), fieldToCanvas(fieldMousePos), rad);
                    drawCirc(ctx, fieldToCanvas(fieldMousePos), rad);
                    ctx.restore();
                }
                graph?.edges.forEach((i) => {
                    if (currNode !== null && i.nodes.indexOf(currNode) >= 0) {
                        ctx.save();
                        ctx.strokeStyle  = stroke_color;
                        ctx.fillStyle  = stroke_color;
                        let st = i.nodes[0] === nd.id ? fieldMousePos : 
                            graph?.nodes?.find(j => j.id === i.nodes[0]).pos;
                        let end = i.nodes[1] === nd.id ? fieldMousePos : 
                            graph?.nodes?.find(j => j.id === i.nodes[1]).pos;
                        drawEdge(ctx, fieldToCanvas(st), fieldToCanvas(end), rad);
                        ctx.restore();
                    }
                });
            }
        };

        window.requestAnimationFrame(draw);
    }, [graph, fieldMousePos, currNode, screenOffc,
        fieldToCanvas, stroke_color, canvasRes, scale]);

    useEffect(() => {
        //Underlying canvas handling
        
        const canvas = canvasRef.current;
        if (!canvas)
            return ;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return ;
        
        ctx.imageSmoothingEnabled = false;
        const clearCanvas = () => {
            ctx.reset();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = back_color;
            ctx.fillRect(-1000000, -100000, 150000000, 150000000);
            ctx.strokeStyle = stroke_color;
            ctx.fillStyle = stroke_color;            
        };

        const draw = () => {
            clearCanvas();
            
            ctx.translate(0, -canvasRes[1] * (scale - 1));
            ctx.scale(scale, scale);
            testRef.current[2]++;
            drawAxis(ctx, fieldSize, fieldToCanvas);
            drawFieldBox(ctx, fieldSize, fieldToCanvas);
            graph?.nodes?.forEach((i => {
                if (currNode === i.id) {
                    ctx.save();
                    ctx.setLineDash([3, 3]);
                }
                drawCirc(ctx, fieldToCanvas(i.pos), rad);
                if (currNode === i.id) {
                    ctx.restore();
                }
            }));
            graph?.edges.forEach((i) => {
                if (i.nodes.indexOf(currNode) >= 0) {
                    ctx.save();
                    ctx.setLineDash([3, 3]);
                }
                let st = graph?.nodes?.find(j => j.id === i.nodes[0]).pos;
                let end = graph?.nodes?.find(j => j.id === i.nodes[1]).pos;
                drawEdge(ctx, fieldToCanvas(st), fieldToCanvas(end), rad);
                if (i.nodes.indexOf(currNode) >= 0) {
                    ctx.restore();
                }
            });
        };
        window.requestAnimationFrame(draw);
        
    }, [canvasRes, graph, isDarkTheme, currNode, fieldToCanvas,
        back_color, screenOffc, stroke_color, scale, fieldSize]);
    
    return (
        <div className="logicBoard">
          {isMobile &&
           <>
             <h1>
               This page is meant to be seen on desktop :( 
             </h1>
             <p>
               Mobile version coming later
             </p>
           </>
             }
          {!isMobile &&
           <>
             <div className="legend">
               <ul>
                 <li>
                   Press "a" to add a node
                 </li>
                 <li>
                   Press "c" to clear the field
                 </li>
                 <li>
                   Press on a node and then press "d" to delete the node
                 </li>
                 <li>
                   Press on consecutive nodes to draw an edge
                 </li>
                 <li>
                   Ctrl + scroll to zoom
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
           </>
          }
        </div>
            );
    };

    export default GraphBoard;
