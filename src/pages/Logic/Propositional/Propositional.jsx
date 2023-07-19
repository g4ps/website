import {examples} from './examples.js';
import { useSelector, useDispatch } from 'react-redux';
import { useRef, useState, useEffect, useMemo } from 'react';
import VisualLogicGraph from '../../../components/VisualLogicGraph/VisualLogicGraph.jsx';
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



const VisualLogicIn = ({obj, depth, showID, currPick, handleCurrPick}) => {

    const [hide, setHide] = useState(depth === 0);

    const isPick = useMemo(() => {
        return currPick?.find(i => i === obj.id) !== undefined ? "pick" : "";
    }, [currPick]);

    
    const handleClick = (e) => {
        e.stopPropagation();
        handleCurrPick(obj.id);
    };

    
    
    if (obj.var) {
        return (
            <div className={`var ${isPick}`}
                 onClick={handleClick}
            >
              {obj.var + (showID ? (" " + obj.id) : "")}
            </div>
        );
    }

    
    
    return (
        <div
        className={`${obj.op} op ${hide ? "hide" : ""} ${isPick}`}
          onClick={handleClick}
        >
          <div className="upper">
            <div/>
            <div className="name">
              {obj.op + (showID ? (" " + obj.id) : "")}
            </div>
            <div onClick={(e) =>
                {
                    e.stopPropagation();
                    setHide(!hide);
                }}>
              {hide ? "+" : "-"}
            </div>
          </div>

          <div className="args">
            {
                obj.args.map((i, pos) =>
                    <VisualLogicIn
                      obj={i}
                      depth={depth - 1}
                      showID={showID}
                      key={pos}
                      currPick={currPick}
                      handleCurrPick={handleCurrPick}
                    />
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

    const handleCurrPick = (id) => {
        // debugger;
        let n = currPick.slice();
        if (n.find(i => i === id) !== undefined) {
            n = n.filter(i => i !== id);
        }
        else {
            n.push(id);
        }
        setCurrPick(n);
    };

    const clearPick = () => setCurrPick([]);

    
    return (
        <div className="withPanels">
          <div className="visualLogicTableWrapper">
            <div className="visualLogicTable">
              <VisualLogicIn
                obj={obj}
                depth={3}
                showID={false}
                currPick={currPick}
                handleCurrPick={handleCurrPick}
              />
            </div>

          </div>
          <div className="controls">
            <button onClick={clearPick}>
              Clear
            </button>
            <button>
              Assoc
            </button>
            <button>
              Commut
            </button>
            <button>
              Commut
            </button>
            <button>
              ID
            </button>
            <button>
              Distr
            </button>
            <button>
              Idem
            </button>
            <button>
              Abs
            </button>
            <button>
              Complem
            </button>
            <button>
              DN
            </button>
            <button>
              DML
            </button>
            <button>
              rm
            </button>
          </div>
        </div>
        
    );
};

const Propositional = () => {

    const isDarkTheme = useSelector(state => state.theme.value);
    const dispatch = useDispatch();
    const [ops, setOps] = useState([]);

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

    const exam_obj = useMemo( () => {
        return id_obj(examples[0]);
    }, []);

    const result_obj = useMemo(() => {
        let n = JSON.parse(JSON.stringify(exam_obj));
        ops.map((i) => {
        });
    }, [exam_obj, ops]);

    const addOps = (name, args) => {
        let n = JSON.parse(JSON.stringify(ops));
        n.push({name: name, args: args});
        setOps(n);
    };

    const removeLastOp = () => {
        let n = JSON.parse(JSON.stringify(ops));
        n.pop();
        setOps(n);
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
            There's also a good ol' fashioned albeit a bit morbid greek example:            
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
            We can use our rule once again to get
          </p>
          <ul>
            <li>
              All singletons are closed in Hausdorff spaces
            </li>
            <li>
              <b>x</b> is a singleton in Hausdorff space
            </li>
            <li>
              Therefore <b>x</b> is closed.
            </li>
          </ul>          
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
            Propositional means that this logic is about propositions (we're going to
            explain the nature of propositions themselves a bit later).
            Propositional logic is the easiest one to get acquainted with, and therefore we'll
            start with it. Given that it is a backbone of first order-logic, sometimes it's
            called a zeroeth-order logic, but we'll stick with the term "propositional".
          </p>
          <p>
            Propositions in propositional logic are either true or false, and
            there's no in-between states.
          </p>
          <ul>
            <li>
              Fire is hot
            </li>
          </ul>
          <p>
            is either true or false. When we 
          </p>
          <VisualLogicTable
            obj={exam_obj}
            addOps={addOps}
            removeLastOp={removeLastOp}
          />
        </div>
    );
};

export default Propositional;
