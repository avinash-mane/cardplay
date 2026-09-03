import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import tamblo from "tambola-generator"
import { useHistory } from 'react-router-dom';
import { collection, updateDoc, doc } from "firebase/firestore"
import { fireStore } from "../firebase";

const constSets = [1, 2, 3, 4, 5, 6];
const colors = ["red", "green", "blue", "purple", "orange", "yellow"]
const tints = {
    red: "#e5484d",
    green: "#30a46c",
    blue: "#3e63dd",
    purple: "#8e4ec6",
    orange: "#f76b15",
    yellow: "#ffb224"
}

function Ticket() {
    const [list, setList] = useState([]);
    const [player, setPlayers] = useState(0);
    const [sets, setSets] = useState(1);
    const [password, setPassword] = useState("")
    const [openField, setOpenField] = useState(false)


    const history = useHistory()

    const updateTickets = async () => {
        if (password === "admin123") {
            const ticketDoc = doc(fireStore, "tickets", "tickets")
            let data = {
                list: JSON.stringify(list),
                players: parseInt(player),
                sets: sets
            }
            await updateDoc(ticketDoc, data)
            alert("tickets uploaded successfully")
            setOpenField(false)
        } else {
            alert("password mismatch")
        }
    }
    const handelSubmit = () => {
        let tickets = tamblo.generateTickets(parseInt(player * sets))
        setList(tickets)
    }

    const Card = () => {
        const func = (card, index) => {
            let myID = Math.floor(index / sets) + 1
            let color = colors[index % sets]
            return (
                <div
                    key={`${myID}_${color}_${index}`}
                    id={`${myID}_${color}`}
                    className="tb-ticket"
                    style={{ "--ticket-accent": tints[color] || color }}>
                    <div className="tb-ticket__head">
                        <span className="tb-ticket__id">Ticket {myID}</span>
                        <span className="tb-ticket__tag">{color}</span>
                    </div>
                    <div className="tb-ticket__grid">
                        {card._entries.map((row, rowindex) =>
                            <div className="tb-ticket__row" key={`row-${rowindex}`}>
                                {row.map((col, colindex) =>
                                    <div
                                        key={`cell-${rowindex}-${colindex}`}
                                        className={`tb-ticket__cell ${col ? "" : "tb-ticket__cell--blank"}`}>
                                        {col || " "}
                                    </div>)}
                            </div>)
                        }
                    </div>
                    <div className="tb-ticket__foot">ticket : {`${myID}_${color}`}</div>
                </div>
            )
        }
        return func;
    }

    const tempCard = Card();

    return (
        <div className="tb-app">
            <main className="tb-main">
                <div className="tb-toolbar">
                    <Button variant="" className="tb-btn tb-btn--ghost tb-btn--sm" onClick={() => history.push("/")}>
                        &#8592; Home
                    </Button>
                    {list.length > 0 &&
                        <Button variant="" className="tb-btn tb-btn--gold tb-btn--sm" onClick={() => setOpenField(v => !v)}>
                            Upload Tickets
                        </Button>
                    }
                </div>
                {!list.length ?
                    <section className="tb-panel tb-gate">
                        <h2 className="tb-gate__title">Set up the game</h2>
                        <p className="tb-gate__text">
                            Choose how many players are joining and how many ticket sets each of
                            them receives.
                        </p>
                        <div className="tb-gate__form">
                            <div className="tb-field">
                                <label className="tb-label" htmlFor="player-count">Number of players</label>
                                <input
                                    id="player-count"
                                    className="tb-input"
                                    placeholder="enter number of players"
                                    onChange={(e) => setPlayers(e.target.value)}
                                    type="number" />
                            </div>
                            <div className="tb-field">
                                <label className="tb-label" htmlFor="set-count">Sets per player</label>
                                <select
                                    id="set-count"
                                    onChange={(e) => setSets(parseInt(e.target.value))}
                                    className="tb-select">
                                    {constSets.map(set => <option key={set} value={set}>{set}</option>)}
                                </select>
                            </div>
                            <Button
                                variant=""
                                className="tb-btn tb-btn--success tb-btn--lg tb-btn--block"
                                onClick={handelSubmit}>
                                Generate Tickets
                            </Button>
                        </div>
                    </section> :
                    <div className="tb-stack">
                        <section className="tb-panel">
                            <div className="tb-panel__head">
                                <h2 className="tb-panel__title">Generated tickets</h2>
                                <span className="tb-chip">
                                    {list.length} tickets &middot; {sets} set{sets > 1 ? "s" : ""} each
                                </span>
                            </div>
                            {openField &&
                                <div className="tb-inline-form">
                                    <input
                                        type="password"
                                        className="tb-input"
                                        placeholder="admin password"
                                        aria-label="Admin password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} />
                                    <Button
                                        variant=""
                                        className="tb-btn tb-btn--primary"
                                        onClick={updateTickets}>
                                        Submit
                                    </Button>
                                </div>
                            }
                        </section>

                        <div className="tb-tickets__grid">
                            {list.map((ticket, index) => tempCard(ticket, index))}
                        </div>
                    </div>
                }
            </main>
        </div>
    );
}

export default React.memo(Ticket);
