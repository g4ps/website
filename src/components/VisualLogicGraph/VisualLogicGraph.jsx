import {useRef, useState, useEffect} from 'react';
import './VisualLogicGraph.scss';


const VisualLogicGraph = ({obj, picked, isDarkTheme, }) => {
    
    const canvasRef = useRef(null);
    const translate = useRef(null);
    const zoom = useRef(1);
    const lastZoom = useRef(1);
    const isMouseDown = useRef(null);
    const lastMousePos = useRef([0, 0]);
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
                
                ctx.strokeText(toSymb(ins), start[0] - rad/2, start[1] + rad/4);
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
            drawGraph([350, 50], obj, 20);

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
                lastMousePos.current = [e.offsetX, e.offsetY];
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
                // console.log(e.deltaY);
                const delta = 0.05;
                let prevZoom = zoom.current;
                let newZoom = zoom.current;
                if (e.deltaY > 0)
                    newZoom += delta;
                else
                    newZoom -= delta;
                if (0.5 <= newZoom  && newZoom <= 3)
                    zoom.current = newZoom;
                else
                    return;
                // translate.current = [lastMousePos.current[0], lastMousePos.current[1]];
                draw(translate.current, zoom.current - prevZoom + 1);
            }, false);

            canvasRef.current.addEventListener("touchmove", (e) => {
                //TODO touch moves
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
        <div className="visualLogicGraph">
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

export default VisualLogicGraph;
