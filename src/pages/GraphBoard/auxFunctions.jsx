//checks whether the current position is at least rad away (heh) from any node in arr
const notColliding = (arr, pos, rad) => {
    for (let j = 0; j < arr.length; j++) {
        let i = arr[j];
        if (sq_norm([i.pos[0] - pos[0], i.pos[1] - pos[1]]) < (rad * 2) ** 2)
            return false;
    }
    return true;
};

//basic check on whether the edge is touching any elements of array
const isTouching = (edg, idArr) => {
    return idArr.indexOf(edg[0]) >= 0 || idArr.indexOf(edg[1]) >= 0;            
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
};

//Square of a eucledian norm;
const sq_norm = (vec) => {
    let ret = 0;
    vec.map(i => ret += i ** 2);
    return ret;
};

const drawCirc = (ctx, start, rad = 30) => {
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
    //Here we implicitly use a 2D rotation matrix to draw arrows.
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

// for some fucking reason JS doesn't ship with this function,
// but it ships with half-assed OOP and a fucking zoo of string functions. Go figure
const uniq = (arr) => {

    return arr.filter((value, index, array) => array.indexOf(value) === index);
}

export {notColliding, isTouching, detectMob, sq_norm,
        drawCirc, drawAxis, drawFieldBox, drawEdge, uniq};
