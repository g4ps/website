import {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import { useSelector } from 'react-redux';
import Slider from '../../components/Slider/Slider.jsx';
import './GraphBoard.scss';
import {notColliding, isTouching, detectMob, inInterval,
        sq_norm, drawCirc, drawAxis, drawFieldBox, drawEdge, uniq} from './auxFunctions.jsx';

import {exampleGraphs} from './exampleGraphs.jsx';

// Disclamer: vast majority of the stuff that's going
// on here was half-assed and was done purely for fun

// TODO: split this thing into several managable pieces

const settings = {
    showDebugingInfo: false,
    showCircleIDS: false,
    circleIDFont: "10pt Courier new",
    showCircleLogicSymbols: false,
    circleRadius: 20,
    showLogicControls: false,
    showZoomSlider: true,
    debugButton: false,
    showAddButton: true,
};


// const settings = {
//     showDebugingInfo: false,
//     showCircleIDS: false,
//     showCircleLogicSymbols: false,
//     circleRadius: 20,
//     showLogicControls: false,
//     showZoomSlider: true,
//     debugButton: false
// // };

const example_graph = exampleGraphs[1]; //TODO: add legs and interface for this thing


const findNode = (obj, id) => {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            let rt = findNode(obj[i], id);
            if (rt)
                return rt;
        }
        return null;
    }
    if (obj.id === id)
        return obj;
    return findNode(obj.args, id);
};

const findNodeParent = (obj, id) => {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            let rt = findNode(obj[i]);
            if (rt)
                return rt;
        }
        return null;
    }
    if (obj.id === id)
        return obj;
    return findNode(obj.args, id);

}

const objSubIds = (obj) => {
    let ret = [obj.id];
    obj.args.forEach(i =>
        ret = [...ret, ...objSubIds(i)]
    );
    return ret;
};

const areEqual = (arg1, arg2) => {
    //TODO this thing ought to be verbose somehow
    if (!arg1 || !arg2)
        return false;

    if (arg1.kind.pred || arg2.kind.pred) {
        return arg1.kind.pred === arg2.kind.pred;
    }
    if (arg1.kind !== arg2.kind)
        return false;
    if (arg1.kind === "imp") {
        for (let i = 0; i < 2; i++) {

            if (!areEqual(arg1.args[i], arg2.args[i]))
                return false;
        }
        return true;
    }
    if (arg1.args.length !== arg2.args.length)
        return false;
    for (let i = 0; i < arg1.args.length; i++) {
        let st = false;
        for (let j = 0; j < arg2.args.length; j++) {
            if (areEqual(arg1.args[i], arg2.args[j])) {
                st = true;
                break;
            }
        }
        if (!st)
            return false;
    }
    return true;
};

const inferencesArr = [
    {
        symb: "areEq?",
        argNum: 2,
        func: (obj, nodes) => {
            if (nodes.length !== 2)
                return false;
            let fst = findNode(obj, nodes[0]);
            let snd = findNode(obj, nodes[1]);
            return areEqual(fst, snd);
        }
    },
    {
        // Modus ponens (p -> q, p :== q)
        symb: "MP",
        name: "Modus Ponens",
        formula: "p -> q, p => q",        
        argNum: 2,
        func: (obj, nodes) => {
            let fst = null;
            let snd = null;
            let ret = null;
            for (let i = 0; i < obj.length && !(fst && snd); i++) {
                let j = obj[i];
                if (nodes.indexOf(j.id) >= 0) {
                    if (fst) //if both nodes are top-level
                        return null; 
                    fst = j;
                }
                else if (j.kind === "imp") {
                    let k = nodes.indexOf(j.args[0].id) >= 0;
                    if (k) {
                        if (snd)
                            return null;
                        snd = j.args[0];
                        ret = j.args[1];
                    }
                }
            }
            if (fst && snd) {
                return areEqual(fst, snd) ? ret : null;
            }
            return null;
        }
    },
    {
        symb: "MT",
        name: "Modus Tolens",
        formula: "p -> q, !q => !p",
        argNum: 2,
        func: (obj, nodes) => {
            let parentID = null;
            let fst = null;
            let snd = null;
            let ret = null;
            for (let i = 0; i < obj.length && !(fst && snd); i++) {
                let j = obj[i];
                if (nodes.indexOf(j.id) >= 0 && j.kind === "not") {
                    if (fst) //if both nodes are top-level
                        return null; 
                    fst = j;                    
                }
                else if (j.kind === "imp") {
                    let k = nodes.indexOf(j.args[1].id) >= 0;
                    if (k) {
                        if (snd)
                            return null;
                        parentID = j.id;
                        snd = j.args[1];
                        ret = j.args[0];
                    }
                }
            }
            ret = {
                id: null, //id in null indicates that this node is brand new
                kind: "not",
                explicitDirection: false, //we don't care about "not"'s direction
                suggest: parentID, // id of the node, to whose place this node should go
                args: [ret]
            };
            if (fst && snd) {
                return areEqual(fst.args[0], snd) ? ret : null;
            }
            return null;
        }
        
    },
    // {
    //     symb: "CD",
    //     name: "Constructive Dilemma",
    //     formula: "(p -> q) /\ (r -> s), p \/ r => q \/ s"
    // },
    // {
    //     symb: "DD",
    // },
    // {
    //     symb: "DS",
    // },
    // {
    //     symb: "HS",
    // },
    // {
    //     symb: "CJ",
    // },
    // {
    //     symb: "SM",
    // },
    // {
    //     symb: "AD",
    // },    
];

const replArr = [
    {
        symb: "Assoc",
    },
    {
        symb: "Com",
    },
    {
        symb: "Dist",
    },
    {
        symb: "Contra",
    },
    {
        symb: "DN",
    },
    {
        symb: "DML",
    },
    {
        symb: "Idem",
    },
    {
        symb: "equiv",
    },
    {
        symb: "impl",
    },
    {
        symb: "Exp",
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
        op: {pred: "P"},
        symb: "P"
    },
    {
        op: {pred: "Q"},
        symb: "Q"
    },
    {
        op: {pred: "R"},
        symb: "R"
    },
    {
        op: {pred: "S"},
        symb: "S"
    },
    {
        op: {var: "x"},
        symb: "x"
    },
];

const opToSymb = (str) => {
    return operationsArr.find(i => i.op === str ||
                              ((i.op.pred !== undefined || i.op.var !== undefined) &&
                               (i.op.pred === str.pred || i.op.var !== str.var)))?.symb;
};

const GraphBoard = () => {

    //TODO:
    // - add panning
    // - move legend into a more appropriate element
    // - add a mini-map
    // - add selection of a group of nodes

    const isDarkTheme = useSelector(state => state.theme.value);
    
    const back_color = isDarkTheme ? "#444" : "#eee";
    const stroke_color = isDarkTheme ? "white" : "#444";

    //This things is used in zoom calculations
    const wheelSensetivity = 0.0007;
    const nodeUnderMouseRef = useRef([]);

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
    
    const maxID = useRef(1); //current maximal ID for a node and/or edge
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

    const [lastMousePressField, setLastMousePressField] = useState([]);
    
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

    const maxScale = 4;
    const minScale = 1/4;

    //////////////////////////////////////////////////////////////////////////////////////////
    //
    // FFFF   OOO   L
    // F     O   O  L
    // FF    O   O  L
    // F     O   O  L
    // F      OOO   LLLLL
    //
    //  FOL
    //////////////////////////////////////////////////////////////////////////////////////////

    const predicates = [
        {
            name: "in",
            unicodeSymb: "∈",            
            latexSymb: "\in",
            commutative: false,
            transitive: false,
            arity: 2,            
        },
    ];
    
    //////////////////////////////////////////////////////////////////////////////////////////

    const addEdge = useCallback((st, fin) => {
        if (st === fin)
            return null;
        let currID = maxID.current;
        maxID.current++;
        graphRef.current.edges.push({id: currID, nodes: [st, fin]});
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        return currID;
    }, []);

    const addNode = useCallback((pos, kind) => {        
        let currID = maxID.current;
        maxID.current++;
        graphRef.current.nodes.push({id: currID, pos: pos.map(i => Math.round(i)),
                                     kind: kind || nodeMarker.current});
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        return currID;
    }, []);

    const deleteNode = useCallback((id) => {
        graphRef.current.nodes = graphRef.current.nodes.filter(i => i.id !== id);
        graphRef.current.edges = graphRef.current.edges.filter(i => i.nodes.indexOf(id) < 0);
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        setCurrNode(null);
    }, []);

    const changeScale = useCallback((ds) => {

        // Bound for the scale; sets the value in interval [minScale, maxScale]
        // BTW there's no check on sanity of the scale boundaries, so beware.
        let newScale = 2**(ds + Math.log2(scale)); //made this thing logarithmic for usability 
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

    const objToString = useCallback((obj) => {
        let fst;
        let needEnd = false;
        if (obj === null)
            return null;
        if (obj.kind !== null) {
            if (obj.kind.var)
                fst = obj.kind.var;
            else if (obj.kind.pred)
                fst = obj.kind.pred;
            else {
                fst = "(" + obj.kind;
                needEnd = true;
            }
        }
        // return "dfa";
        let ret = fst;
        obj.args.forEach(i =>
            ret += ` ${objToString(i)}`
        );
        if (needEnd)
            ret += ")";
        return ret;
    }, []);

    const graphToString = useMemo(() => {
        return graphToObj.map(i => objToString(i));
    }, [graphToObj]);


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
        else if (obj.kind.pred) {
            return obj.args.length === 0;
        }
        else if (obj.kind.var) {            
            return obj.args.length === 0;
        }
        return false;
    }, []);

    const isObjectValid = useMemo(() => {
        return isLogicalObjectValid(graphToObj);
    }, [graphToObj]);

    const completeGraph = useCallback((retObj, parentNode = null) => {
        if (retObj.id === null) {
            let newID = addNode(graph?.nodes?.find(i => i.id === retObj.suggest).pos
                                || [0, 0], retObj.kind);
            if (retObj.suggest)
                delete retObj.suggest;
            if (parentNode !== null) {
                addEdge(newID, parentNode);
            }
            retObj.args.forEach(i => addEdge(i.id, newID));
        }
        retObj.args.forEach(i => completeGraph(i, retObj.id));
        return ;        
    }, [addNode, addEdge, graph]);


    // const handleInference = useCallback((op) => {
    //     if (!isObjectValid) {
    //         console.log("No inference on logically invalid objects");
    //         return ;
    //     }
    //     //////////////////////////////////////////////////////////////////////
    //     // Current support is limited, so there's this thing
    //     //////////////////////////////////////////////////////////////////////
    //     const supported = ["MP",  "MT"];
    //     if (supported.indexOf(op.symb) < 0) {
    //         console.log(`${op.symb} is not currently supported`);
    //     }
    //     //////////////////////////////////////////////////////////////////////
    //     if (selected.length !== op.argNum) {
    //         console.log(`${op.symb} requires ${op.argNum} arguments`);            
    //         return ;
    //     }
    //     let ret = op.func(graphToObj, selected);
    //     if (ret === null) {
    //         console.log(`${op.name} could not be applied :(`);
    //         return ;
    //     }
    //     else {
    //         console.log(`${op.name} was successfully applied`);
    //         console.log(ret);
    //     }
    //     let retInd = objSubIds(ret);
    //     let total = connectedNodes.find(i => i.indexOf(selected[0]) >= 0).concat(
    //         connectedNodes.find(i => i.indexOf(selected[1]) >= 0));
    //     total = uniq(total);
    //     let toDelete = total.filter(i => retInd.indexOf(i) < 0);
    //     completeGraph(ret);
    //     toDelete.forEach(i =>
    //         deleteNode(i)
    //     );
    //     setSelected([]);

    // }, [graphToObj, selected, connectedNodes, isObjectValid, deleteNode]);
    
    const canvasFOV = useMemo(() => {
        return [canvasRes[0] / scale, canvasRes[1] / scale];
    }, [canvasRes, scale]);

    const fieldToCanvas = useCallback((vec) => {
        //Function that transfers field coordinates to
        //canvas unshifted unscaled coordinates
        if (vec === null || screenOffc === null || canvasRes === null)
            return [0, 0];
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

    const pressedMouseSpan = useMemo(() => {
        if (!isMousePressed)
            return null;
        return [lastMousePressField, fieldMousePos];
    }, [isMousePressed, fieldMousePos]);

    const selectionRect = useMemo(() => {
        if (!currNode)
            return pressedMouseSpan;
        return null;
    }, [currNode, pressedMouseSpan]);

    const underRect = useMemo(() => {
        let ret = null;
        if (!graph)
            return ret;
        if (!selectionRect)
            return ret;
        ret = graph.nodes.filter(i =>
            inInterval(selectionRect[0][0], selectionRect[1][0], i.pos[0]) &&
                inInterval(selectionRect[0][1], selectionRect[1][1], i.pos[1])
                
        ).map(i => i.id);
        return ret;
    }, [selectionRect, graph]);

    useEffect(() => {
        if (underRect)
            setSelected(underRect);
    }, [underRect]);

    const nodeUnderMouse = useMemo(() => {
        if (fieldMousePos === null || fieldMousePos.length !== 2)
            return [];
        nodeUnderMouseRef.current = graph?.nodes?.filter(i =>
            sq_norm([i.pos[0] - fieldMousePos[0], i.pos[1] - fieldMousePos[1]]) <
                settings.circleRadius ** 2
        ) || [];
        return nodeUnderMouseRef.current;
    }, [graph, fieldMousePos]);



    const clearEverything = useCallback(() => {
        graphRef.current = {
            nodes: [],
            edges: []
        };
        setGraph(JSON.parse(JSON.stringify(graphRef.current)));
        setSelected([]);
        setCurrNode(null);
    }, []); 

    const keyPressHandle = useCallback((key) => {
        //Handling of properly pressed (not raw inputs) keys
        key = key.toLowerCase();
        const doffc = 50 / scale;
        if (key === 'a') {
            if (fieldMouseRef.current &&
                notColliding(graphRef.current.nodes, fieldMouseRef.current, settings.circleRadius)) {
                addNode(fieldMouseRef.current);
            }
        }
        if (key === 's') {
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
        if (key === "h") {
            clearEverything();
            graphRef.current = JSON.parse(example_graph);
            let existingIDS = [...graphRef.current.nodes.map(i => i.id),
                             ...graphRef.current.edges.map(i => i.id)];
            maxID.current = Math.max(...existingIDS) + 1;
            setGraph(JSON.parse(example_graph));
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

    const handleMouseUnpress = useCallback((mdp) => {
        if (currNode !== null) {
            // If currNode was already chosen
            if (nodeUnderMouseRef.current.length === 0) {
                // If there's no node under the mouse during unpress, move the current node
                graphRef.current.nodes.find(i => i.id === currNode).pos = fieldMouseRef.current;
                setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                setCurrNode(null);
                return ;
            }
            else {
                // if there's a node under the mouse, add a path
                if (nodeUnderMouseRef.current.length === 0)
                    return ;
                let newNodes = [currNode, nodeUnderMouseRef.current[0].id];
                let curr_edge =
                    graphRef.current.edges.find(i => i.nodes.toString() === newNodes.toString());
                if (curr_edge === undefined) {
                    addEdge(newNodes[0], newNodes[1]);
                    if (!isDirectional.current) {
                        addEdge(newNodes[1], newNodes[0]);
                    }
                    setCurrNode(null);
                }
                else {
                    let ind = graphRef.current.edges.indexOf(curr_edge);
                    if (ind >= 0) {
                        graphRef.current.edges.splice(ind, 1);                    
                    }
                    setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                    setCurrNode(null);
                }
            }
        }
    }, [currNode, nodeUnderMouse]);

    // handling mouse press
    const handleMousePress = useCallback((mdp) => {
        setLastMousePressField(fieldMouseRef.current); // setting 
        let set = false;
        for (let i = 0; i < graph?.nodes?.length; i++) {
            let j = graph?.nodes[i];
            let k = canvasToField(mdp);
            if (sq_norm([j.pos[0] - k[0], j.pos[1] - k[1]]) <
                settings.circleRadius ** 2) {
                if (nodeMarker.current !== null) {
                    graphRef.current.nodes.find(k => k.id === j.id).kind =
                        JSON.parse(JSON.stringify(nodeMarker.current));
                    setGraph(JSON.parse(JSON.stringify(graphRef.current)));
                    nodeMarker.current = null;
                }
                else {
                    setCurrNode(j.id);
                    set = true;
                }
                if (shiftDown.current) {
                    setSelected(uniq([...selected, j.id]));
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
            handleMouseUnpress([e.offsetX, e.offsetY]);
        };
        
        const onMouseOut = (e) => {
            setIsMousePressed(false);
            setCurrNode(null);
        };

        const onWheel = (e) => {
            e.preventDefault();
            if (ctrlDown.current) {
                if (e.deltaY)
                    scaleOnPoint(- e.deltaY * wheelSensetivity, mousePos.current);
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
            if (selectionRect ) {
                ctx.save();
                ctx.strokeStyle = "#add8e6";
                ctx.fillStyle = "#add8e666";
                ctx.lineWidth = 1;
                let fst = fieldToCanvas(selectionRect[0]);
                let snd = fieldToCanvas(selectionRect[1]);
                ctx.rect(fst[0], fst[1], snd[0] - fst[0], snd[1] - fst[1]);
                ctx.fillRect(fst[0], fst[1], snd[0] - fst[0], snd[1] - fst[1]);
                ctx.stroke();
                ctx.restore();
            }
            if (currNode !== null) {
                let nd = graph?.nodes?.find(i => i.id === currNode);
                if (nd !== undefined) {
                    ctx.save();
                    ctx.strokeStyle = "orange";
                    ctx.fillStyle = "orange";
                    drawEdge(ctx, fieldToCanvas(nd.pos), fieldToCanvas(fieldMousePos),
                             settings.circleRadius);
                    drawCirc(ctx, fieldToCanvas(pressedMouseSpan ? pressedMouseSpan[1] : [0, 0]), settings.circleRadius);
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
                        drawEdge(ctx, fieldToCanvas(st), fieldToCanvas(end), settings.circleRadius);
                        ctx.restore();
                    }
                });
            }
        };
        
        window.requestAnimationFrame(draw);
    }, [selectionRect, graph, pressedMouseSpan, currNode, screenOffc,
        fieldToCanvas, stroke_color, canvasRes, scale, pressedMouseSpan]);

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
                if (settings.showCircleIDS) {
                    ctx.font = settings.circleIDFont || "16pt Courier new";
                    ctx.fillText(i.id, cnpos[0], cnpos[1]);
                    if (settings.showCircleLogicSymbols) {
                        if (i.kind) {
                            ctx.fillText(opToSymb(i.kind), cnpos[0], cnpos[1] + 15);
                        }
                    } 
                }
                if (selected.indexOf(i.id) >= 0) {
                    ctx.save();
                    ctx.strokeStyle = "#1E90FF";
                }
                drawCirc(ctx, cnpos, settings.circleRadius);
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
                drawEdge(ctx, fieldToCanvas(st), fieldToCanvas(end), settings.circleRadius);
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
             {
                 settings.showZoomSlider && 
                     <div className="slideControl">
                       <Slider
                         min={Math.log2(minScale)}
                         max={Math.log2(maxScale)}
                         value={Math.log2(scale)}
                       />
                     </div>
             }
             {
                 settings.showAddButton &&
                     <div/>
             }
             {settings.showLogicControls &&
              <>
                {/* <div className="labels"> */}
                {/*   {inferencesArr.map((i, pos) => */}
                {/*       <button key={pos} */}
                {/*               onClick={() => handleInference(i)}  */}
                {/*       > */}
                {/*         {i.symb} */}
                {/*       </button> */}
                {/*   )} */}
                {/*   {replArr.map((i, pos) => */}
                {/*       <button key={pos}> */}
                {/*         {i.symb} */}
                {/*       </button> */}
                {/*   )} */}
                {/* </div> */}
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
              </>
             }
             {settings.showDebugingInfo &&
              <div className="debugInfo">
                <div>
                  {`graphToString: ${JSON.stringify(graphToString)}`}
                </div>
                <div>
                  {`pressedMouseSpan: ${JSON.stringify(pressedMouseSpan)}`}
                </div>
                <div>
                  {`isMousePressed: ${JSON.stringify(isMousePressed)}`}
                </div>
                <div>
                  {`nodeUnderMouse: ${JSON.stringify(nodeUnderMouse)}`}
                </div>
                <div>
                {`isObjectValid: ${JSON.stringify(isObjectValid)}`}
              </div>
              <div>
                {`current node ID: ${currNode === null ? "none" : currNode}`}
              </div>
              <div>
                {`selected: ${JSON.stringify(selected)}`}
              </div>
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
              </div>}
             {settings.debugButton &&
              <button
                className="debugButton" onClick={() => {
                    console.log(testRef.current);
                }}>
                press
              </button>
             }
           </>
          }
        </div>
          );
    };

    export default GraphBoard;
