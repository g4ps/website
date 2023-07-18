import {useMemo} from 'react';
import './Sudoku.scss';

const Sudoku = () => {
    const map_arr = useMemo(() => {
        let ret = [];
        for (let i = 0; i < 81; i++) {
            ret.push(0);
        }
        return ret;
    }, []);
    
    return (
        <div className="sudoku">
          {
              map_arr.map((i) =>
                  <div>
                    i
                  </div>
        )}
        </div>
    );
};

export default Sudoku;
