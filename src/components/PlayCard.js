import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"
import { fireStore } from "../firebase";
import { Button } from "react-bootstrap";
import { useParams } from "react-router-dom"
import claps from "../assets/clap.mp3"
import img from "../assets/clapman.gif"
const colors = ["red", "green", "blue", "purple", "orange", "yellow"]
const tints = {
    red: "#e5484d",
    green: "#30a46c",
    blue: "#3e63dd",
    purple: "#8e4ec6",
    orange: "#f76b15",
    yellow: "#ffb224"
}
let rows = ["top", "middle", "bottom"]
const init = { all: 0, top: 0, bottom: 0, middle: 0, corner: 0 }

function PlayCard() {
    const [list, setList] = useState([]);
    const [sets, setSets] = useState(1);
    const [id, setId] = useState("")
    const { ticketId } = useParams()
    let tempId = ""
    const [audio, setAudio] = useState(new Audio(claps));
    const [players, setPlayers] = useState(0);
    const [selectedCard, setSelectedCard] = useState([])
    const [corners, setCorners] = useState([])
    const ticketCollectionRef = collection(fireStore, "tickets")
    const [showGIF, setShowGIF] = useState(null)

    const [myCard, setMyCard] = useState([...Array(3)].map(e => Array(9).fill(null)))
    const [myCount, setMyCount] = useState([])

    useEffect(() => {
        const getTickets = async () => {
            let data = await getDocs(ticketCollectionRef)
            data = data.docs[0].data()
            setList(JSON.parse(data.list))
            setSets(data.sets)
            setPlayers(data.players)
        }
        getTickets()
    }, [])

    useEffect(() => {
        if (ticketId) {
            setId(parseInt(ticketId))
        }
    }, [ticketId])

    useEffect(() => {
        if (showGIF) {
            setTimeout(() => {
                setShowGIF(null)
            }, 3500)
        }
    }, [showGIF])

    const setconerValues = (ar) => {
        let arr = []
        ar.map(card => {
            let temp1 = []
            card._entries[0].map(col => {
                if (col != 0) temp1.push(col)
            })
            let temp2 = []
            card._entries[2].map(col => {
                if (col != 0) temp2.push(col)
            })
            let temp = [temp1[0], temp1[4], temp2[0], temp2[4]]
            arr.push(temp)
        })
        setCorners(arr)
    }

    useEffect(() => {
        if (list.length > 0 && sets && parseInt(id) <= players && parseInt(id) > 0) {
            setMyCount([...Array(sets)].map(e => ({ ...init })))
            setMyCard([...Array(sets)].map(e => [...Array(3)].map(e => Array(9).fill(null))))
            let ar = []
            let start = (parseInt(id) - 1) * sets;
            for (let i = start; i < parseInt(id) * sets; i++) {
                ar.push(list[i])
            }
            setconerValues(ar)
            setSelectedCard(ar)
        }

    }, [id, list, players, sets])

    const onClick = (cardIndex, rowindex, colindex, col) => {
        if (col != 0) {
            let arr = [...myCard]
            let count = { ...myCount }
            if (arr[cardIndex][rowindex][colindex] === null) {
                arr[cardIndex][rowindex][colindex] = col
                count[cardIndex].all = myCount[cardIndex].all + 1
                count[cardIndex][rows[rowindex]] = myCount[cardIndex][rows[rowindex]] + 1

                if (corners[cardIndex].includes(col)) {
                    count[cardIndex].corner = myCount[cardIndex].corner + 1
                }

            } else {
                arr[cardIndex][rowindex][colindex] = null
                count[cardIndex].all = myCount[cardIndex].all - 1
                count[cardIndex][rows[rowindex]] = myCount[cardIndex][rows[rowindex]] - 1

                if (corners[cardIndex].includes(col)) {
                    count[cardIndex].corner = myCount[cardIndex].corner - 1
                }
            }
            setMyCard(arr)
            setMyCount(count)
            if (count[cardIndex].all == 15) {
                setShowGIF(cardIndex + 1)
                audio.play()
            }
        }
    }

    const claimRows = (count) => ([
        { label: "Early 5", done: count.all >= 5 },
        { label: "Top Line", done: count.top == 5 },
        { label: "Middle Line", done: count.middle == 5 },
        { label: "Bottom Line", done: count.bottom == 5 },
        { label: "Four Corners", done: count.corner == 4 },
        { label: "Full House 1", done: count.all == 15 }
    ])

    return (
        <div className="tb-app">
            <main className="tb-main">
                {id !== "" &&
                    <div className="tb-toolbar">
                        <span className="tb-chip tb-chip--gold">
                            <span className="tb-chip__dot" aria-hidden="true" />
                            Ticket {id}
                        </span>
                    </div>
                }
                {id === "" &&
                    <section className="tb-panel tb-gate">
                        <h2 className="tb-gate__title">Enter your ticket id</h2>
                        <p className="tb-gate__text">
                            Your ticket id was shared by the game host. Enter it to open your card.
                        </p>
                        <div className="tb-gate__form">
                            <div className="tb-field">
                                <label className="tb-label" htmlFor="ticket-id">Ticket id</label>
                                <input
                                    id="ticket-id"
                                    className="tb-input"
                                    placeholder="insert you ticket id"
                                    onChange={(e) => tempId = e.target.value} />
                            </div>
                            <Button
                                variant=""
                                className="tb-btn tb-btn--success tb-btn--lg tb-btn--block"
                                onClick={() => setId(tempId)}>
                                Submit
                            </Button>
                        </div>
                    </section>
                }

                <div className="tb-playcard">
                    <div className="tb-playcard__grid">
                        {selectedCard.map((card, cardindex) => {
                            const count = myCount[cardindex] || init
                            const color = colors[cardindex]
                            return (
                                <section
                                    className="tb-panel tb-playcard__card"
                                    key={`card-${cardindex}`}
                                    aria-label={`Ticket set ${color}`}>
                                    <div className="tb-ticket tb-ticket--play" style={{ "--ticket-accent": tints[color] || color }}>
                                        <div className="tb-ticket__head">
                                            <span className="tb-ticket__id">Ticket {id}</span>
                                            <span className="tb-ticket__tag">{color}</span>
                                        </div>
                                        <div className="tb-ticket__grid">
                                            {card._entries.map((row, rowindex) =>
                                                <div className="tb-ticket__row" key={`row-${rowindex}`}>
                                                    {row.map((col, colindex) => {
                                                        const marked = myCard[cardindex]?.[rowindex]?.[colindex]
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={`cell-${rowindex}-${colindex}`}
                                                                className={`tb-ticket__cell ${col ? "" : "tb-ticket__cell--blank"} ${marked ? "is-marked" : ""}`}
                                                                aria-pressed={col ? !!marked : undefined}
                                                                aria-label={col ? `${col}${marked ? ", marked" : ""}` : "blank"}
                                                                onClick={(e) => onClick(cardindex, rowindex, colindex, col)}>
                                                                {col || " "}
                                                            </button>
                                                        )
                                                    })}
                                                </div>)
                                            }
                                        </div>
                                        <div className="tb-ticket__foot">{count.all} / 15 marked</div>
                                    </div>

                                    {count.all == 15 && showGIF == cardindex + 1 ?
                                        <div className="tb-celebrate">
                                            <img src={img} alt="Applause" />
                                            <span>Full House!</span>
                                        </div> :
                                        <div className="tb-claimlist">
                                            <div className="tb-claimlist__title">Claims</div>
                                            {claimRows(count).map(claim =>
                                                <div
                                                    className={`tb-claimlist__row ${claim.done ? "is-done" : ""}`}
                                                    key={claim.label}>
                                                    <span>{claim.label}</span>
                                                    <span>{claim.done ? <>&#x2705;</> : <>&#10060;</>}</span>
                                                </div>
                                            )}
                                        </div>
                                    }
                                </section>
                            )
                        })}
                    </div>

                    {id !== "" && players != 0 && (parseInt(id) > players || id <= 0) &&
                        <div className="tb-notice">
                            <strong>Card not found</strong>
                            <span>Check the ticket id with your host and try again.</span>
                        </div>
                    }
                </div>
            </main>
        </div>
    );
}

export default React.memo(PlayCard);
