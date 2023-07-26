import {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import { useSelector } from 'react-redux';
import Slider from '../../components/Slider/Slider.jsx';
import './GraphBoard.scss';
import {notColliding, isTouching, detectMob,
        sq_norm, drawCirc, drawAxis, drawFieldBox, drawEdge, uniq} from './auxFunctions.jsx';

// Disclamer: vast majority of the stuff that's going
// on here was half-assed and was done purely for fun

// TODO: split this thing into several managable pieces

const rad = 30;

const inferencesArr = [
    {
        symb: "MP",
    },
    {
        symb: "MT",
    },
    {
        symb: "CD",
    },
    {
        symb: "DD",
    },
    {
        symb: "DS",
    },
    {
        symb: "HS",
    },
    {
        symb: "CJ",
    },
    {
        symb: "SM",
    },
    {
        symb: "AD",
    },    
];

const operationsArr = [
    {
        op: "and",
        symb: "\u2227"
    },
    {
        op: "or",
        symb: "\u2228"
    },
    {
        op: "not",
        symb: "\u00ac"
    },
    {
        op: "imp",
        symb: "\u21d2"
    },
    {
        op: "eqv",
        symb: "\u2194"
    },
    {
        op: "",
        symb: "CLR"
    },
    {
        op: {var: "P"},
        symb: "P"
    },
    {
        op: {var: "Q"},
        symb: "Q"
    },
    {
        op: {var: "R"},
        symb: "R"
    },
    {
        op: {var: "S"},
        symb: "S"
    },
];

const opToSymb = (str) => {
    return operationsArr.find(i => i.op === str ||
                              (i.op.var !== undefined && i.op.var === str.var))?.symb;
};

const GraphBoard = () => {

    //TODO:
    // - move legend into a more appropriate element
    // - add a mini-map
    // - add object handling
    // - add panning
    // - add selection of a group of nodes

    const isDarkTheme = useSelector(state => state.theme.value);
    
    const back_color = isDarkTheme ? "#444" : "#eee";
    const stroke_color = isDarkTheme ? "white" : "#444";

    //This things is used in zoom calculations
    const wheelSensetivity = 0.0007;

    //References for both canvases
    const canvasRef = useRef(null);
    const canvasOverRef = useRef(null);

    //Debugging thingy
    const testRef = useRef([0, 0, 0]);

    //doubles the graph state variable; redundant maybe is redundant
    const graphRef = useRef({
        nodes: [],
        edges: []
    });
    
    const maxID = useRef(0); //current maximal ID for a node and/or edge
    const prevNode = useRef(null); //revious value of currNode
    
    //Those two variables probably need to unite into something beautiful
    const ctrlDown = useRef(false);
    const shiftDown = useRef(false);

    //LOGIC: selection of node marker
    const nodeMarker = useRef(null); //this thing probably needs to be a state variable

    //Unused as of now; may have some usability later
    const isDirectional = useRef(true);
    
    const keyRef = useRef([]);
    const mousePos = useRef(null);

    //current position of the mouse with relation to the field; has doubling state variable
    const fieldMouseRef = useRef([0, 0]);
    
    const [mousePosState, setMousePosState] = useState(null);
    
    const [isMousePressed, setIsMousePressed] = useState(false);
    
    const [currNode, setCurrNode] = useState(null);

    const [canvasRes, setCanvasRes] = useState([500, 500]);

    const [keyPress, setKeyPress] = useState([]);
    const [graph, setGraph] = useState(null);

    const [scale, setScale] = useState(1.0); //current scale
    const [testState, setTestState] = useState(0);

    const [selected, setSelected] = useState([]);

    const [screenOffc, setScreenOffc] = useState([0, 0]); //left down corner of the canvas

    //Sets an invevrval for OX and OY, for which the field is defined
    const fieldSize = useMemo(() => [[-5000, 5000], [-5000, 5000]], []);

    const maxScale = 8;
    const minScale = 0.3;    

    const changeScale = useCallback((ds) => {
        // Bound for the scale; sets the value in interval [minScale, maxScale]
        // BTW there's no check on sanity of the scale boundaries, so beware.
        let newScale = ds + scale;
        newScale = Math.max(Math.min(maxScale, newScale), minScale);
        setScale(newScale);
        return newScale - scale;
    }, [scale]);

    const isMobile = useMemo(() => {
        // take a guess on what does this thing do
        return detectMob();        
    }, []);

    const connectedNodes = useMemo(() => {
        // Returns array of arrays of connected nodes
        // Probably runs in a square, or mamybe even worse
        // Works for now; TODO: make this thing better
        if (graph === null)
            return [];
        let nodes = graph.nodes.slice();
        let edges = graph.edges.slice();
        let ret = [];        
        while(nodes.length !== 0) {
            let tmp = [nodes[0].id];
            let set = true;
            while (set) {
                set = false;
                let nextEdges = [];
                let connections = [];
                edges.forEach((i) => {
                    if (isTouching(i.nodes, tmp)) {
                        set = true;
                        connections.push(i);
                    }
                    else {
                        nextEdges.push(i);
                    }
                });
                edges = nextEdges;
                connections.forEach(i => {
                    if (tmp.indexOf(i.nodes[0]) < 0)
                        tmp.push(i.nodes[0]);
                    if (tmp.indexOf(i.nodes[1]) < 0)
                        tmp.push(i.nodes[1]);
                });
                nodes = nodes.filter(i => tmp.indexOf(i.id) < 0);
            }
            ret.push(tmp);
        }        
        return ret;        
    }, [graph]);

    const topDogs = useMemo(() => {
        const getTopDog = (arr, graph) => {
            //Top dog is my name for a node in a connected directed
            // graph, into which all the other nodes lead
            // (i.e. top dog is a node out which nothing sticks out).
            //I'm pretty sure that there's alrady a more appropriate name for it,
            //but I'm too ignorant to care
            let na = arr.filter(i => {
                return graph.edges.find(j => j.nodes[0] === i ) === undefined;
            });
            return na;
        };
        return connectedNodes.map(i => getTopDog(i, graph));
    }, [connectedNodes]);

    const dawgToObj = useCallback((dawg, connected, graph) => {
        // TODO: test the ever-living shit out of this thing for now
        // TODO: improve performance
        let explicitDirection = false;
        if (dawg.length !== 1)
            return null;

        //Get the dawgs under the main dawg
        let subdawgs =
            // all edges, that connect to dawg
            graph.edges.map(i => i.nodes[1] === dawg[0] ? i.nodes[0] : null)        
            .filter(i => i !== null) // removing nulls from the last step (TODO: improve)
            .filter(i => connected.indexOf(i) >= 0); // removing unnecessary nodes (for recursion)

        //get the edges that go out of subdawgs
        const outDawgEdges = graph.edges.filter(i => subdawgs
                                                .indexOf(i.nodes[0]) >= 0);

        //edges out of subdawgs should only go to another subdawg or the dawg
        if (outDawgEdges.find(i => subdawgs.concat(dawg).indexOf(i.nodes[1]) < 0)) {
            //and if they don't, return appropriate result
            return null;
        }
        
        const interSubDawgEdges = outDawgEdges.filter(i => subdawgs.indexOf(i.nodes[0]) >= 0 &&
                                                  subdawgs.indexOf(i.nodes[1]) >= 0 );

        // between the subdawgs, either everyone talks and does it in orderly fashion
        // (i.e. in a list), or no one talks
        if (interSubDawgEdges !== undefined && interSubDawgEdges.length !== 0) {
            //TODO: go through this thing and verify correctness
            explicitDirection = true;
            if (interSubDawgEdges.length !== subdawgs.length - 1)
                return null;
            let fstSubDawg = subdawgs.filter(i =>
                interSubDawgEdges.filter(j => j.nodes[1] === i).length === 0);
            if (fstSubDawg.length !== 1)
                return null;
            fstSubDawg = fstSubDawg[0];
            let order = [fstSubDawg];
            while(order.length !== subdawgs.length) {
                // debugger;
                let nextDawg = order[order.length - 1];
                let talksTo = interSubDawgEdges.filter(i => i.nodes[0] === nextDawg);
                if (talksTo.length === 0 && order.length !== subdawgs - 1)
                    return null;
                if (talksTo.length > 1 || order.indexOf(talksTo[0].nodes[1]) >= 0)
                    return null;
                order.push(talksTo[0].nodes[1]);
            }
            subdawgs = order;
        }

        let args = [];

        connected = connected.filter(i => subdawgs.indexOf(i) < 0);
        for (let i = 0; i < subdawgs.length; i++) {
            let sbdObj = dawgToObj([subdawgs[i]], connected, graph);
            if (sbdObj === null)
                return null; //TODO: add exceptions and more descriptive errors
            args.push(sbdObj);
        }               
        
        return {
            id: dawg[0],
            kind: graph.nodes.find(i => i.id === dawg[0]).kind, //TODO: make it better
            explicitDirection: explicitDirection,
            args: args,            
        };
    }, []);

    const graphToObj = useMemo(() => {
        try {
            return topDogs.map((i, pos) => dawgToObj(i, connectedNodes[pos], graph));
        }
        catch(e) {
            return "ERROR";
        }
        
    }, [topDogs, connectedNodes, dawgToObj]);

    const isLogicalObjectValid = useCallback((obj) => {
        if (obj === null)
            return false;
        if (obj.length === 0)
            return true;
        else if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                if (!isLogicalObjectValid(obj[i]))
                    return false;
            }
            return true;
        }
        else if (obj.kind === "and" || obj.kind === "or" || obj.kind === "eqv") {
            return isLogicalObjectValid(obj.args);
        }
        else if (obj.kind === "imp") {
            if (obj.explicitDirection && obj.args.length === 2) {
                return isLogicalObjectValid(obj.args);                
            }
        }
        else if (obj.kind === "not" ) {
            if (obj.args.length === 1)
                return isLogicalObjectValid(obj.args);
        }
        else if (!obj.kind) {
            return false;
        }
        else if (obj.kind.var) {            
            return obj.args.length === 0;
        }
        return false;
    }, []);

    const isObjectValid = useMemo(() => {
        return isLogicalObjectValid(graphToObj);
    }, [graphToObj]);
    
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
        graphRef.current.nodes.push({id: currID, pos: pos, kind: nodeMarker.current});
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));        
    }, []);

    const clearEverything = useCallback(() => {
        graphRef.current = {
            nodes: [],
            edges: []
        };
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        setCurrNode(null);
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
        if (key === 'r') {
            setScale(1);
            setScreenOffc([0, 0]);
        }
        if (key === 'd' || key === 'delete') {
            if (currNode !== null) {
                deleteNode(currNode);

            }
            selected.map(i => deleteNode(i));
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
        if (key === "i") {
            scaleOnPoint(0.2, [400, 400]);
        }
    }, [currNode, changeScreenOffc, addNode,
        clearEverything, deleteNode,
        scale, screenOffc, changeScale, scaleOnPoint, selected]); 

    const handleMousePress = useCallback((mdp) => {
        if (currNode !== null) {
            if (notColliding(graphRef.current.nodes.filter(i => i.id !== currNode),
                             fieldMouseRef.current, rad)) {
                graphRef.current.nodes.find(i => i.id === currNode).pos = fieldMouseRef.current;
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                setCurrNode(null);
                return ;
            }
        }
        let set = false;

        for (let i = 0; i < graph?.nodes?.length; i++) {
            let j = graph?.nodes[i];
            let k = canvasToField(mdp);
            if (sq_norm([j.pos[0] - k[0], j.pos[1] - k[1]]) <
                rad ** 2) {
                if (nodeMarker.current !== null) {
                    graphRef.current.nodes.find(k => k.id === j.id).kind =
                        JSON.parse(JSON.stringify(nodeMarker.current));
                    setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                    nodeMarker.current = null;
                }
                else if (shiftDown.current) {
                    setSelected(uniq([...selected, j.id]));
                }
                else {
                    setCurrNode(j.id);
                    set = true;
                }
            }            
        }
        if (!set) {
            nodeMarker.current = null;
            if (!shiftDown.current)
                setSelected([]);
            setCurrNode(null);
        }
        // setMouseDownPos(null);
    }, [currNode, canvasToField, graph, selected]);


    useEffect(() => {
        // handling of change of current node ID. Used for selecting, drawing and whatnot
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
                if (!isDirectional.current) {
                    graphRef.current.edges.push({id: currID, nodes: [newNodes[1], newNodes[0]]});
                }
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
            if (e.key === "Shift") {
                shiftDown.current = true;
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
            if (e.key === "Shift") {
                shiftDown.current = false;
            }
        };
        
        const onMouseMove = (e) => {
            mousePos.current = [e.offsetX, e.offsetY];
            setMousePosState([e.offsetX, e.offsetY]);
        };

        const onMouseDown = (e) => {
            handleMousePress([e.offsetX, e.offsetY]);
            setIsMousePressed(true);
        };

        const onMouseUp = (e) => {
            setIsMousePressed(false);
        };

        const onMouseOut = (e) => {
            setIsMousePressed(false);
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
    }, [keyPressHandle, canvasRes, scaleOnPoint,
        changeScreenOffc, scale, handleMousePress]);

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

    // useEffect(() => {
    //     const canvas = canvasRef.current;
    //     if (!canvas)
    //         return ;
    //     const ctx = canvas.getContext("2d");
    //     if (!ctx)
    //         return ;
    //     ctx.translate(0, -canvasRes[1] * (scale - 1));
    //     ctx.scale(scale, scale);
    // }, []);

    useEffect(() => {
        //Underlying canvas handling
        
        // TODO: pretty sure that there's a way to reduce (or elminate) re-drawing
        // of underlying canvas during scaling and transitions. Given the fact
        // that right now it works borderline flawlessly, the task of making
        // optimizations is left for better times
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
                let cnpos = fieldToCanvas(i.pos);
                //////////////////////////////////////////////////////////////////////
                //Debugging option
                ctx.font = "16pt Courier new";
                ctx.fillText(i.id, cnpos[0], cnpos[1]);
                if (i.kind) {
                    ctx.fillText(opToSymb(i.kind), cnpos[0], cnpos[1] + 15);
                }
                //////////////////////////////////////////////////////////////////////
                if (selected.indexOf(i.id) >= 0) {
                    ctx.save();
                    ctx.strokeStyle = "#1E90FF";
                }
                drawCirc(ctx, cnpos, rad);
                if (selected.indexOf(i.id) >= 0) {
                    ctx.restore();
                }
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
        back_color, screenOffc, stroke_color, scale, fieldSize, selected]);
    
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
                   Press "r" to reset the view
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
             <div className="zoom">
               
             </div>
             <div className="slideControl">
               <Slider
                 min={minScale}
                 max={maxScale}
                 value={scale}
               />
             </div>
             <div className="labels">
               {inferencesArr.map((i, pos) =>
                   <button key={pos}>
                     {i.symb}
                   </button>
               )}
             </div>
             <div className="labels right">
               {operationsArr.map((i, pos) =>
                   <button onClick={() => {
                       nodeMarker.current = i.op;
                       setTestState(testState + 1);
                   }} key={pos}>
                     {i.symb}
                   </button>
               )}
             </div>
             <div className="debugInfo">
               <div>
                 {`isObjectValid: ${JSON.stringify(isObjectValid)}`}
               </div>
               <div>
                 {`current node ID: ${currNode === null ? "none" : currNode}`}
               </div>
               <div>
                 {`selected: ${JSON.stringify(selected)}`}
               </div>
               {/* <div> */}
               {/*   {`ctrlDown: ${JSON.stringify(ctrlDown.current)}`} */}
               {/* </div> */}
               {/* <div> */}
               {/*   {`shiftDown: ${JSON.stringify(ctrlDown.current)}`} */}
               {/* </div> */}
               <div>
                 {`connected graphs: ${JSON.stringify(connectedNodes)}`}
               </div>
               <div>
                 {`topDogs: ${JSON.stringify(topDogs)}`}
               </div>
               <div>
                 {`graphToObj: ${JSON.stringify(graphToObj)}`}
               </div>
               <div>
                 {`nodeMarker: ${JSON.stringify(nodeMarker.current)}`}
               </div>
               <div>
                 {`graph: ${JSON.stringify(graph)}`}
               </div>

               
             </div>
           </>
          }
        </div>
          );
    };

    export default GraphBoard;
