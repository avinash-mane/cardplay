import React, { useEffect, useState } from "react";
import { Button, Spinner, FormCheck } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import sound from "../assets/spin.mp3"
import VerifyCard from "./VerifyCard";
const wins = [
  "Early 5",
  "Top Line",
  "Middle Line",
  "Bottom Line",
  "Four Corners",
  "Full House 1",
  " Full House 2"
]

function App() {
  const [list, setList] = useState([]);
  const [isWating, setIsWating] = useState(false);
  const [spinner, setSpiner] = useState(1);
  const [audio, setAudio] = useState(new Audio(sound));
  const history = useHistory();
  const [openDialog, setOpenDialog] = useState(false)

  const onOpenDialog = () => setOpenDialog(true)


  useEffect(() => {
    if (list.length) localStorage.setItem("numbers", JSON.stringify(list))
  }, [list])

  useEffect(() => {
    let stoaredList = JSON.parse(localStorage.getItem("numbers"))
    if (stoaredList) setList(stoaredList)
  }, [])

  const handleOnReset = () => {
    setList([])
    localStorage.removeItem("numbers")
  }

  const handleOnClick = () => {
    if (list.length < 90) {
      let intervalId = setInterval(() => {
        let number = Math.floor(Math.random() * (91 - 1) + 1)
        setSpiner(number)
      }, 50)
      let flag = true;
      while (flag) {
        let number = Math.floor(Math.random() * (91 - 1) + 1)
        if (!list.includes(number)) {
          setIsWating(true)
          // audio.play()
          flag = false
          setTimeout(() => {
            clearInterval(intervalId)
            setList([...list, number])
            setIsWating(false)
            // audio.remove()
          }, 2000)
        }
      }
    }
  }

  const Board = () => {
    let tempList = []
    let row = []
    for (let i = 1; i <= 90; i++) {

      row.push(<div
        className={`col  ${list.includes(i) ? "border-danger" : ""} rounded-pill mx-2 my-2`}
        style={{ backgroundColor: list.includes(i) ? "#d5e4f3" : "" }}>
        <span style={{ fontSize: "25px", color: !list.includes(i) ? "#6c757d" : "", fontWeight: !list.includes(i) ? "100" : "bold" }}><b>{i}</b></span>
      </div>)

      if (i % 10 === 0) {
        tempList.push(<div className="row" style={{ margin: "0px", width: "auto", borderLeft: "1px solid #fff", borderRight: "1px solid" }}>{row}</div>)
        row = []
      }
    }
    return tempList;
  }

  return (
    <div className="row" style={{ height: "100vh", border: "2px solid" }}>
      <div className="col-3 d-flex align-items-center flex-column pt-3" style={{ backgroundColor: "#adb5bd" }}>
        <div className="d-flex justify-content-center">
          <Button variant="info" onClick={handleOnReset} size="sm">
            Reset
          </Button>
          <Button className="ml-3" variant="secondary" onClick={() => history.push("/tickets")} size="sm">
            generate tickets
          </Button>
          <Button className="ml-3" style={{ zIndex: 1 }} variant="warning" onClick={() => history.push("/card")} size="sm">
            Play Card
          </Button>
          <Button className="ml-3" style={{ zIndex: 1 }} variant="danger" onClick={onOpenDialog} size="sm">
            Verify Card
          </Button>
        </div>
        <div style={{ fontSize: "20px" }} className="pt-2">Previous</div>
        <div style={{ width: "100px", height: "100px" }} className="d-flex align-items-center justify-content-center border border-secondary rounded-circle mb-1" >
          {list.length !== 0 &&
            <span style={{ fontSize: "60px", color: "grey" }}>
              {list[list.length - 2]}
            </span>
          }
        </div>
        <div style={{ width: "200px", height: "200px", background: "#d5e4f3" }} className="d-flex align-items-center justify-content-center border border-dark rounded-circle" >
          {isWating ?
            <span style={{ fontSize: "135px", color: "grey" }}>
              {spinner}
            </span> :
            list.length ?
              <span style={{ fontSize: list.length != 0 ? "135px" : "50px", fontWeight: "bold" }}>
                {list[list.length - 1]}
              </span> :
              <h2>Start With Spin &#x21e9;</h2>
          }
        </div>
        <Button className="mt-3" onClick={handleOnClick} disabled={isWating}>
          {isWating ?
            <Spinner animation="border" variant="info" /> :
            <>Spin &#x27F3;</>
          }
        </Button>
        <div class="d-flex flex-wrap mt-2 mx-4">
          {wins.map(label => <FormCheck style={{ width: "120px", textAlign: "left" }} className="p-2" label={label} />)}
        </div>
      </div>
      <div className="col-9 pt-2" style={{ height: "100%", backgroundColor: "#adb5bd", borderLeft: "1px solid" }}>
        <div>
          <h1><b>Good Luck...!</b></h1>
          <div class="d-flex mx-5 mb-5 bg-dark" style={{ borderColor: "#adb5bd", border: "5px solid #d5e4f3" }}>
            <Board />
          </div>
        </div>
      </div>
      <VerifyCard openDialog={openDialog} setOpenDialog={setOpenDialog} list={list}/>
    </div>
  );
}

export default React.memo(App);
