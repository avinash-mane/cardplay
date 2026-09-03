import React, { useEffect, useState } from "react";
import { Button, Spinner, FormCheck } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import sound from "../assets/spin.mp3"
import VerifyCard from "./VerifyCard";
import PlayCardQr from "./PlayCardQr";
import Footer from "./Footer";
const wins = [
  "Early 5",
  "Top Line",
  "Middle Line",
  "Bottom Line",
  "Four Corners",
  "Full House 1"
]

const TOTAL_NUMBERS = 90

function App() {
  const [list, setList] = useState([]);
  const [isWating, setIsWating] = useState(false);
  const [spinner, setSpiner] = useState(1);
  const [audio, setAudio] = useState(new Audio(sound));
  const history = useHistory();
  const [openDialog, setOpenDialog] = useState(false)
  const [openPlayCard, setOpenPlayCard] = useState(false)

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

  const latest = list.length ? list[list.length - 1] : null
  const previous = list.length > 1 ? list[list.length - 2] : null
  const recent = list.slice(0, -1).slice(-5).reverse()
  const isComplete = list.length >= TOTAL_NUMBERS

  const Board = () => {
    let tempList = []
    let row = []
    for (let i = 1; i <= 90; i++) {
      const isCalled = list.includes(i)
      const isLatest = latest === i

      row.push(
        <div
          key={i}
          className={`tb-cell ${isCalled ? "is-called" : ""} ${isLatest ? "is-latest" : ""}`}
          aria-label={`${i} ${isCalled ? "called" : "not called"}`}
          title={isCalled ? `${i} — called` : `${i} — not called`}>
          {i}
        </div>
      )

      if (i % 10 === 0) {
        tempList.push(<div className="tb-board__row" key={`row-${i}`}>{row}</div>)
        row = []
      }
    }
    return tempList;
  }

  return (
    <div className="tb-app">
      <main className="tb-main">
        <div className="tb-layout">
          <div className="tb-layout__side">
            <nav className="tb-side-actions" aria-label="Game actions">
              <Button variant="" className="tb-btn tb-btn--ghost tb-btn--sm" onClick={handleOnReset}>
                Reset
              </Button>
              <Button variant="" className="tb-btn tb-btn--ghost tb-btn--sm" onClick={() => history.push("/tickets")}>
                Generate Tickets
              </Button>
              <Button variant="" className="tb-btn tb-btn--gold tb-btn--sm" onClick={() => setOpenPlayCard(true)}>
                Play Card
              </Button>
              <Button variant="" className="tb-btn tb-btn--primary tb-btn--sm" onClick={onOpenDialog}>
                Verify Card
              </Button>
            </nav>

            <section className="tb-panel tb-caller" aria-label="Number caller">
              <span className="tb-chip tb-chip--gold">
                <span className="tb-chip__dot" aria-hidden="true" />
                {isComplete ? "All numbers called" : isWating ? "Drawing…" : "Ready to draw"}
              </span>

              <div className={`tb-orb ${isWating ? "tb-orb--spinning" : ""}`} aria-live="polite">
                {isWating ? (
                  <span className="tb-orb__number tb-orb__number--rolling">{spinner}</span>
                ) : latest ? (
                  <span className="tb-orb__number" key={latest}>{latest}</span>
                ) : (
                  <span className="tb-orb__idle">
                    <strong>Good luck!</strong>
                    <span>Hit spin to call the first number</span>
                  </span>
                )}
              </div>

              <Button
                variant=""
                className="tb-btn tb-btn--gold tb-btn--lg tb-btn--block"
                onClick={handleOnClick}
                disabled={isWating}>
                {isWating ?
                  <Spinner animation="border" size="sm" role="status" /> :
                  <>Spin &#x27F3;</>
                }
              </Button>

              <div className="tb-recent">
                <span className="tb-recent__label">Previous</span>
                {previous ? (
                  <span className="tb-recent__ball tb-recent__ball--previous">{previous}</span>
                ) : (
                  <span className="tb-recent__empty">No previous number yet</span>
                )}
                {recent.slice(1).map((n, index) => (
                  <span className="tb-recent__ball" key={`${n}-${index}`}>{n}</span>
                ))}
              </div>

              <div className="tb-progress">
                <div className="tb-progress__meta">
                  <span><b>{list.length}</b> called</span>
                  <span><b>{TOTAL_NUMBERS - list.length}</b> remaining</span>
                </div>
                <div
                  className="tb-progress__track"
                  role="progressbar"
                  aria-valuenow={list.length}
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_NUMBERS}>
                  <div
                    className="tb-progress__fill"
                    style={{ width: `${(list.length / TOTAL_NUMBERS) * 100}%` }} />
                </div>
              </div>
            </section>

            <section className="tb-panel" aria-label="Claims">
              <div className="tb-panel__head">
                <h2 className="tb-panel__title">Claims</h2>
              </div>
              <div className="tb-claims">
                {wins.map((label, index) =>
                  <FormCheck
                    key={label}
                    id={`claim-${index}`}
                    className="tb-claim"
                    label={label.trim()} />
                )}
              </div>
            </section>

            <Footer />

          </div>

          <section className="tb-panel" aria-label="Number board">
            <div className="tb-board">
              <Board />
            </div>
          </section>
        </div>
      </main>
      <VerifyCard openDialog={openDialog} setOpenDialog={setOpenDialog} list={list} />
      <PlayCardQr openDialog={openPlayCard} setOpenDialog={setOpenPlayCard} />
    </div>
  );
}

export default React.memo(App);
