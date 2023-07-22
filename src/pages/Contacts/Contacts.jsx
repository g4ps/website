import {useEffect, useState, useMemo} from 'react';
import {Link} from "react-router-dom";
import links from '../../info.json';
import "./Contacts.scss";


const Employment = () => {

    const [empStatus, setEmpStatus] = useState("loading");

    useEffect(() => {
        fetch(links.statuses)
            .then((response) => response.json())
            .then((json) => {
                setEmpStatus(json.employment_status);
            })
            .catch(() => {
                setEmpStatus("not_found");
            });
    }, []);

    
    const bcolorEmp = useMemo(() => {
        switch(empStatus) {
        case "employed":
            return "var(--main-employed)";
        case "iffy":
            return "var(--main-maybe-employed)";
        case "unemployed":
            return "var(--main-unemployed)";
        default:
            return "#aaaaaa";
        };        
    }, [empStatus]);

    const textEmp = useMemo(() => {
        switch(empStatus) {
        case "loading":
            return "loading";
        case "employed" : case "iffy" : case "unemployed":
            return empStatus[0].toUpperCase() + empStatus.substr(1);
        default:
            return "impossible to know";
        };
    }, [empStatus]);

    const mainText = useMemo(() => {
        const textArr = {
            employed: `This means that Gene is happily working hard (or hardly working, who knows)
                on delivering the best product known to man. This also means that you can't
                get Gene for cheap, but doesn't mean that you can't get him for some absurd
                amount of money. Getting in touch can't harm no one, so you can try you
                luck anyways.`,
            iffy : `Gene is known for many of his mighty skills, and one of those
                skills is to see writing on the wall. Maybe there's a disagreement about
                something important, maybe company is having a bit of a trouble or
                maybe current employer just hates Gene's guts. Whatever it is, Gene's days
                are counted and this means that you can get Gene for cheap.`,
            unemployed : `That means that Gene is currently up for grabs.  
                If you are an employer, then this means that you've got  
                once-in-a-lifetime opportunity to employ this state-of-the-art fella for  
                next to nothing.  
                All you gotta do is to contact him through  
                one of the provided contacts, so don't wait and call now!`,
            loading: "loading...",
            default: `Gene's a capable developer, and that also means that Gene
                is capable of making mistakes. One of those mistakes happened here, and his
                website can't get his employment status, probably because he forgot to add a
                comma somewhere. You can do Gene a solid by writing him and letting him know
                that he fudged this one up.`
        };
        
        return textArr[empStatus] || textArr["default"];
    }, [empStatus]);
    
    return (<div>
              <h3>
                Gene's current employment status is <span className="empStatusVal" style={{
                    backgroundColor: bcolorEmp
                }}>{textEmp}</span>
              </h3>
              <p>
                {mainText}
              </p>
            </div>);
    
};

const Contacts = () => {
    return <div className="contact">
             <h1>About Gene (and his contacts)</h1>
             <Employment/>
             <h3>
               contacts
             </h3>
             <ul>
               <li>
                 <a href={"mailto://" + links.mail}>E-mail</a> (preferred method of communication)
               </li>
               <li>
                 <a href={links.telegram}>Telegram</a> 
               </li>
               <li>
                 <a href={links.github}>Github</a>
               </li>
             </ul>
             <p>
               Although Gene passionately hates any social media, he likes to have cash,
               and that's why he's got a              
             </p>
             <ul>
               <li>
                 <a href={links.linked}>LinkedIn</a>
               </li>
             </ul>
             
             <h3>
               About Gene
             </h3>
             <p>
               <b>TLDR:</b> Gene is a great frontend-developer (React) with experience in backend. Loves
               CS and maths. Knows English and Russian.
             </p>
             <p>
               Gene is a talanted developer, who's currently located in Tbilisi, Georgia
               (country, not the state). Although he likes the weather there, he likes having
               cash a bit more than that, and therefore he can change his location based on
               where the wind is currently blowing.
             </p>
             <p>
               Like many great things in our life, Gene has many names. This is not because
               he is involved in something that you shouldn't be involved in, but because there
               is about a dozen ways
               (<a href="https://en.wikipedia.org/wiki/Yevgeny">yes, really</a>) to
               translate his name in English. His favorite one is (drumroll please...) Gene.
             </p>
             <p>
               Professionally Gene is known as the top-notch frontend-developer with a 3+
               years of experience. He is best known for his skills in React, JS, HTML,
               CSS, NodeJS, Python and PHP. He is also known as a great collegue, who doesn't
               buckle under pressure and is always happy to help.
               List of areas of his employment is short and sweet: banking industry and freelance.
               Although Gene would've loved to provide links to his works, he can't
               because all of them were made for internal use only. On display he's got
               miscelanious projects on his github and a couple of things on this website,
               such as:
             </p>
             <ul>
               <li>
                 <Link to='../graphBoard'>GraphBoard</Link>
               </li>
             </ul>
             <p>
               Semi-professionally Gene's known as the Gene of all trades. He's got experience
               with C, C++, Python, Scheme, several kinds of assembler for several
               kinds of platforms, and a lot of other languages. When it comes to technology he
               knows Docker, he knows UNIX and he probably knows a lot of other stuff, but he's
               too shy to admit it. Gene also knows data structures and algorithms like no one else,
               and he can prove it. If Gene doesn't know something, then it's because he's
               currently trying to learn it. 
             </p>             
             <p>
               Although Gene does not have any formal education (outside of being
               an <a href="/files/certificate_fthemis.pdf">Alumni of Ecole 42</a>),
               he compensates for it with a hefty amount
               of <Link to="../maths" >self-education</Link> (although that page represents the latest
               in Gene's self-education, it is not a exhaustive list).
               When Gene talks about his education, he likes to brag about the time
               when he
               had <a href="http://math.buffalostate.edu/~cunnindw/Errata2.pdf">fixed</a> a
               typo in a book. By doing so, he usually tries to say that although his
               education is not formal, it is nothing to sneeze at.
               When it comes to languages, Gene knows his English, Russian and he even
               knows a bit of Greek.
             </p>
             <p>
               Other than that, Gene is an open-source enthusiast and a philanthropist. His
               favourite editor is Emacs, his favourite charity
               is <a href="https://podari-zhizn.ru/en">Gift of Life</a>,
               he religiously believes that the word "standard"
               should end with a "t", he uses the word "howdy" way too much, he thinks that
               notation "injective, surjective" is ten times better than "one-to-one, onto",
               his favourite flavor of English is American
               (with the exception of word "favourite"), he likes Oxford commas, and
               he believes in GCH.
             </p>
           </div>;
};

export default Contacts;
