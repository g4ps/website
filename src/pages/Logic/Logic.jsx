import {useMemo, useState} from 'react';
import { Outlet, Link } from "react-router-dom";
import links from '../../info.json';
import './Logic.scss';

const Logic = () => {

    const dateToStr = (inp) => {
        const twoDig = (i) => {
            i = String(i);
            if (i.length == 1)
                return "0" + i;
            return i;
        };
        let d = new Date(inp);
        if (isNaN(d.getTime()))
            return "ERROR";
        return `${twoDig(d.getUTCDate())}.${twoDig(d.getUTCMonth() + 1)}.${twoDig(d.getUTCFullYear())}`;
    };

    const strLastUpdate = useMemo(() => {
        return dateToStr(links.logic_last_update);
    }, []);

    const daysFromLastUpdate = useMemo(() => {
        let d = new Date(links.logic_last_update);
        let n = new Date();
        return Math.floor((n - d) / (1000 * 60 * 60 * 24));
    }, []);

    const isDead = useMemo(() => {
        return daysFromLastUpdate > 60;
    }, [daysFromLastUpdate]);    

    
        
    return (
        <div className="logicPreface">
          <h1>
            Gene's doing logic (and you can too)
          </h1>
          <h3>
            What the hell is this? 
          </h3>
          <b>TLDR: an interactive book on logic</b>
          <p>            
            Gene's fascianated by a lot of stuff, and one of his current subjects of interest
            are automated theorem provers.
            One sunny georgian day, while he was doing one of the exercises in set theory,
            he noted that there's a lot of stuff that a computer might help him with,
            such as checking his exercises for correctness (because God know that he needs it).
            When he researched that subject a bit, he noted that there're plenty of projects,
            that might help him with it. Some of those projects include unfortunately
            named "Coq" and "Lean" (shoot, a fella could have a pretty good weekend in
            Vegas with all that stuff),
            and some other projects as well. All of those project
            seemed to be fitting the bill, but all of them have a pretty steep learning curve,
            a pretty shaggy interface, and don't offer much visualization,
            which Gene's pretty fond of. Thus Gene's decided that one day he might learn them
            some day, but had put those projects on the back burner.
          </p>
          <h3>
            Why sould I learn it?
          </h3>
          <p>
            Why not?
          </p>
          <h3>
            Is it a hard subject?
          </h3>
          <p>
            Not really
          </p>
          <h3>
            I like books more
          </h3>
          <p>
            There're plenty of books on the subject. Gene's favourites are
            "Mathematical Logic: An Introduction" by Daniel Cunningham and
            "Fundamentals of Logic and Computation" by Zhe Hou. I'm sure that
            you can buy them somewhere on the internet.
          </p>
          <h3>
            I hate your server's performance / I'm going into the wilderness without
            any internet connectivity soon
          </h3>
          <p>
            This website does not have no connection to any CDN's, and it doesn't
            require no internet connectivity.
            You can go to the <a href={links.website_repo}> website repository</a>,
            download the website source code, install the dependencies,
            and then run it without any problems irregardless of whether or not you've got
            any internet.
          </p>
          <h3>
            Is this thing finished? 
          </h3>
          {
              links.logic_progress === "finished" ?
              <p>
                Yes, it is. But Gene's standarts are pretty high, so you can expect some
                tweaks still coming here and there.
              </p>
              :
              <p>
                No, it's not.  <Link to="progress">Link to progress page</Link>
              </p>
          }
          <h3>
            Is this project dead? 
          </h3>
          {
              isDead ?
              <p>
                Yes, it is. The last update on this thing was done on {strLastUpdate} (D/M/Y),
                which is {daysFromLastUpdate} days ago, so it's pretty safe to say that the thing
                is at least in hiatus.
              </p>
              :
              <p>
                No, it's not. It's alive and kicking, and the last update on the thing was done
                on {strLastUpdate} (D/M/Y), which is {daysFromLastUpdate} day(s) ago.
              </p>
          }
          <h3>
            Is this thing free?
          </h3>
          <p>
            Yep. You can do pretty much whatever you wanna do with this thing,
            but if you do something serious with it, be sure to read the
            terms of license of this thing on a
            <a href={links.website_repo}> website repository</a> (it's an MIT license).
            Also, be sure to mention that the original creator of this thing is Gene.
          </p>
          <Link to="propositional">
            <button>
              Get stared
            </button>
          </Link>          
        </div>
    );
};

export default Logic;
