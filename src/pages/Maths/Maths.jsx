import {useState, useEffect, useMemo} from 'react';
import links from '../../info.json';
import "./Maths.scss";

const Status = ({list}) => {
    if (Array.isArray(list) && list.length === 0) {
        return <div>Fetching data...</div>;
    }    
    return <div>"Something went terribly wrong while fetching data :( "</div>;
};

const Progress = ({chaptersTotal, chaptersFinished}) => {

    const [show, setShow] = useState(false);

    const progressColors = useMemo(() => {
        
        let ret = [];
        for (let i = 0; i < chaptersTotal; i++) {
            let deg = (i - chaptersFinished + 1);
            if (deg >= 1)
                deg = 1;
            if (deg <= 0)
                deg = 0;
            let hdeg = Math.floor(120 - deg * 120);
            let gdeg = deg !== 1 ? 100 : 0;
            let st = deg !== 1 ? 65 : 80;
            ret.push(`hsl( ${hdeg}, ${gdeg}%, ${st}%`) ;
        };
        return ret;
       
    }, [chaptersTotal, chaptersFinished]);
    
    return<div className="logicPreface">
            <button onClick={() => {setShow(!show)}}>
              {(!show ? "Show" : "Close") + " progress"}
            </button>
            <div
              style={{maxHeight: !show ? "0px": "500px"}}
              className="progress">
              {
                  progressColors.map((i, pos) => 
                      <div
                        key={pos}
                        className="progressTile"style={{backgroundColor: i}}>
                      </div>
                  )
              }
            </div>
          </div>;
};

const Course = ({name, author, edition, status, note, link, progress}) => {

    const text_status_map = (str) => {
        switch(str) {
        case "finished":
            return "Finished";
        case "in_progress":
            return "In progress";
        case "in_hiatus":
            return "In hiatus";
        default:
            return "Unknown";
        }
    };

    const status_to_var = (str) => {
        switch(str) {
        case "finished":
            return "--main-success";
        case "in_progress":
            return "--main-iffy";
        case "in_hiatus":
            return "--main-failure";
        default:
            break;
        }
        return "--main-unknown";
    };
    
    return <div className="course"
                style={{
                    background: `var(${status_to_var(status)})`,
                    border: `2px solid var(${status_to_var(status)}-border)`
                }}
           >
             <div className="upper">
               <div className="name">
                 {name}
               </div>
               <div className="author_and_edition">
                 <div>
                   {`by ${author}`}
                 </div>
                 <div>
                   {`${edition} edition`}
                 </div>
               </div>
             </div>
             <div className="status">
               {text_status_map(status)}
             </div>

             {progress && status !== "finished" && <Progress
                            chaptersTotal={progress.total_chapters}
                            chaptersFinished={progress.finished_chapters}
                          />}

             <a href={link}>Solutions</a>
           </div>;
};

const CoursesList = ({list, status}) => {

    const coursesList = useMemo(() => {
        return list.filter(i => i.status === status);
    }, [list, status]);
    
    return <div className="courses_list">
             {coursesList?.map((i, pos) =>
                 <Course
                   key={pos}
                   name={i.name}
                   author={i.author}
                   edition={i.edition}
                   status={i.status}
                   note={i.note}
                   link={i.link}
                   progress={i.progress}
                 />
             )}
           </div>;
};

const AllCourses = ({list, lastUpdate}) => {
    return (
        <div>
          <p>{`last update: ${lastUpdate} (D/M/Y)`}</p>
          <h2>Finished</h2>
          <CoursesList list={list} status={"finished"}/>
          <h2>In progress</h2>
          <CoursesList list={list} status={"in_progress"}/>
          <h2>In hiatus</h2>          
          <CoursesList list={list} status={"in_hiatus"}/>
        </div>
    );
};

const Maths = () => {

    const [list, setList] = useState([]);
    const [lastUpdate, setLastUpdate] = useState("");

    useEffect(() => {
        fetch(links.exercises_progress)
            .then((response) => response.json())
            .then((json) => {
                setList(json.data);
                setLastUpdate(json.last_update);
            })
            .catch((err) => {
                setList(null);
            });
    }, []);
    
    return <div>
             <header>
               <h1>Gene's doing maths (and CS related things)</h1>
               <p>
                 When Gene got free time he usualy does maths (or something CS-related).
                 His studies are partitioned into courses, and each course is based on a book.
                 Each course is either finished, in progress, or in a semi-permanent hiatus. 
                 Solutions for (some of) the exercies in the books are scrupulously
                 written down, and presented for your viewing pleasure.
               </p>
               <p>
                 Given that no one on the God's green earth (except for the Mighty Gene himself)
                 has seen or read any of those solutions, it goes without saying that they
                 are riddled with errors.
               </p>
               <p>
                 This page has a related <a href={links.exercises}>github repository</a>. If those
                 solutions helped you in any capacity, you can go there and give it a star.
               </p>               
             </header>
             
             {
                 Array.isArray(list) && list.length > 0 ?
                     <AllCourses list={list} lastUpdate={lastUpdate}/>: <Status list={list}/>
             }
           </div>
    ;
};

export default Maths;
