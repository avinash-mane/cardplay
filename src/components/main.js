import React, { useEffect, useState } from "react";
import { Button, Spinner, FormCheck } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import sound from "../assets/spin.mp3"
import VerifyCard from "./VerifyCard";
import PlayCardQr from "./PlayCardQr";
import Footer from "./Footer";
import { listWinners } from "../winners";
const wins = [
  "Early 5",
  "Top Line",
  "Middle Line",
  "Bottom Line",
  "Four Corners",
  "Full House"
]

const TOTAL_NUMBERS = 90

const CONFETTI_COLORS = ["#f0b429", "#ffffff", "#7fd1b9", "#f2836b", "#9db4ff"]

// Pre-computed so every falling piece keeps a stable column, speed and drift.
const CONFETTI = Array.from({ length: 30 }, (_, index) => ({
  "--piece-left": `${(index * 3.37) % 100}%`,
  "--piece-drift": `${(index % 2 ? 1 : -1) * (2 + (index % 5))}vw`,
  "--piece-rotate": `${(2 + (index % 4)) * 180}deg`,
  "--piece-delay": `${((index * 43) % 120) / 60}s`,
  "--piece-duration": `${2.4 + ((index * 17) % 18) / 10}s`,
  "--piece-color": CONFETTI_COLORS[index % CONFETTI_COLORS.length]
}))

function App() {
  const [list, setList] = useState([]);
  const [isWating, setIsWating] = useState(false);
  const [spinner, setSpiner] = useState(1);
  const [audio, setAudio] = useState(new Audio(sound));
  const history = useHistory();
  const [openDialog, setOpenDialog] = useState(false)
  const [openPlayCard, setOpenPlayCard] = useState(false)
  const [claimedWins, setClaimedWins] = useState({})
  const [winnerPopup, setWinnerPopup] = useState(null)

  const onOpenDialog = () => setOpenDialog(true)

  const onWinnerAdded = (winner) => {
    setClaimedWins(current => ({ ...current, [winner.category]: true }))
    setWinnerPopup(winner)
  }

  useEffect(() => {
    if (!winnerPopup) return undefined
    const timeoutId = setTimeout(() => setWinnerPopup(null), 5000)
    return () => clearTimeout(timeoutId)
  }, [winnerPopup])

  useEffect(() => {
    if (list.length) localStorage.setItem("numbers", JSON.stringify(list))
  }, [list])

  useEffect(() => {
    let stoaredList = JSON.parse(localStorage.getItem("numbers"))
    if (stoaredList) setList(stoaredList)
  }, [])

  useEffect(() => {
    const loadWinnerCategories = async () => {
      try {
        const savedWinners = await listWinners()
        setClaimedWins(savedWinners.reduce((categories, winner) => ({
          ...categories,
          [winner.category]: true
        }), {}))
      } catch (err) {
        // Winner history should never prevent the caller board from loading.
      }
    }
    loadWinnerCategories()
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
              <Button variant="" className="tb-btn tb-btn--ghost tb-btn--sm" onClick={() => history.push("/admin_section")}>
                Admin Section
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
                    label={label.trim()}
                    checked={!!claimedWins[label]}
                    onChange={(event) => setClaimedWins(current => ({
                      ...current,
                      [label]: event.target.checked
                    }))} />
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
      {winnerPopup &&
        <div
          className="tb-winner-overlay"
          role="status"
          aria-live="polite"
          onClick={() => setWinnerPopup(null)}>
          <div className="tb-winner-rain" aria-hidden="true">
            {CONFETTI.map((piece, index) => (
              <span key={index} style={piece} />
            ))}
          </div>

          <div className="tb-winner-pop" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="tb-winner-pop__close"
              aria-label="Close winner announcement"
              onClick={() => setWinnerPopup(null)}>
              &#10005;
            </button>
            <div className="tb-winner-pop__flowers" aria-hidden="true">
              <span>🌸</span><span>🌼</span><span>🌸</span>
            </div>
            <span className="tb-winner-pop__eyebrow">Winner announced</span>
            <strong>{winnerPopup.name || winnerPopup.employeeCode}</strong>
            <span className="tb-winner-pop__category">{winnerPopup.category}</span>
            <small>Ticket {winnerPopup.ticketId} · {winnerPopup.color}</small>
          </div>
        </div>
      }
      <VerifyCard
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        list={list}
        onWinnerAdded={onWinnerAdded}
      />
      <PlayCardQr openDialog={openPlayCard} setOpenDialog={setOpenPlayCard} />
    </div>
  );
}

export default React.memo(App);
