import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"
import { fireStore } from "../firebase";

const wins = [
    "Early 5",
    "Top Line",
    "Middle Line",
    "Bottom Line",
    "Four Corners",
    "Full House",
]

const constSets = [1, 2, 3, 4, 5, 6];
const colors = ["red", "green", "blue", "purple", "orange", "yellow"]
const tints = {
    red: "#a3564f",
    green: "#4f7d63",
    blue: "#4d6382",
    purple: "#6b5a80",
    orange: "#a9744a",
    yellow: "#a08a43"
}

function VerifyCard({ openDialog, setOpenDialog, list }) {
    const [id, setId] = useState()
    const [color, setColor] = useState("red")
    const ticketCollectionRef = collection(fireStore, "tickets")
    const [onlineCards, setOnlineCards] = useState({})
    const [selectedCard, setSelectedCard] = useState([])

    const onCloseDialog = () => {
        setSelectedCard([])
        setOpenDialog(false)
    }

    useEffect(() => {
        const getTickets = async () => {
            let data = await getDocs(ticketCollectionRef)
            data = data.docs[0].data()
            setOnlineCards({ list: JSON.parse(data.list), sets: data.sets, players: data.players })
        }
        getTickets()
    }, [])

    useEffect(() => {
        if (id && color) {
            let b = parseInt(id - 1) * onlineCards.sets
            let a = colors.indexOf(color)
            setSelectedCard(onlineCards.list[a + b])
        }
    }, [id, color])

    const changeColor = (e) => setColor(e.target.value)

    const markedCount = selectedCard?._entries
        ? selectedCard._entries.flat().filter(col => col && list.includes(col)).length
        : 0

    return (
        <dialog open={openDialog} className="tb-dialog" aria-label="Verify a ticket">
            <div className="tb-dialog__panel">
                <div className="tb-dialog__head">
                    <div>
                        <h2 className="tb-dialog__title">Verify Ticket</h2>
                        <p className="tb-dialog__sub">Cross-check a claim against called numbers</p>
                    </div>
                    <button
                        type="button"
                        className="tb-dialog__close"
                        aria-label="Close verify dialog"
                        onClick={onCloseDialog}>
                        &#10005;
                    </button>
                </div>

                <div className="tb-dialog__fields">
                    <div className="tb-field">
                        <label className="tb-label" htmlFor="verify-card-id">Card id</label>
                        <input
                            id="verify-card-id"
                            className="tb-input"
                            placeholder="e.g. 4"
                            onChange={(e) => setId(e.target.value)}
                            type="number" />
                    </div>
                    <div className="tb-field">
                        <label className="tb-label" htmlFor="verify-card-color">Set colour</label>
                        <select id="verify-card-color" onChange={changeColor} className="tb-select">
                            {colors.map((c, index) => index < onlineCards.sets &&
                                <option key={c} value={c} style={{ background: c }}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="tb-dialog__body">
                    {id !== "" && onlineCards.players != 0 && (parseInt(id) > onlineCards.players || id <= 0) ?
                        <div className="tb-notice">
                            <strong>Card not found</strong>
                            <span>Enter a valid ticket id between 1 and {onlineCards.players}</span>
                        </div> :
                        <>
                            {selectedCard?._entries && (
                                <div className="tb-ticket tb-ticket--verify" style={{ "--ticket-accent": tints[color] || color }}>
                                    <div className="tb-ticket__head">
                                        <span className="tb-ticket__id">Ticket {id || "—"}</span>
                                        <span className="tb-ticket__tag">{color}</span>
                                    </div>
                                    <div className="tb-ticket__grid">
                                        {selectedCard._entries.map((row, rowindex) =>
                                            <div className="tb-ticket__row" key={`row-${rowindex}`}>
                                                {row.map((col, colindex) => <div
                                                    key={`cell-${rowindex}-${colindex}`}
                                                    className={`tb-ticket__cell ${col ? "" : "tb-ticket__cell--blank"} ${col && list.includes(col) ? "is-called" : ""}`}
                                                    title={col ? (list.includes(col) ? `${col} — called` : `${col} — not called`) : undefined}>
                                                    {col || " "}</div>)}
                                            </div>)
                                        }
                                    </div>
                                    <div className="tb-ticket__foot">
                                        {markedCount} / 15 numbers called
                                    </div>
                                </div>
                            )}
                        </>
                    }
                </div>

                <div className="tb-dialog__foot">
                    <button type="button" className="tb-btn tb-btn--ghost tb-btn--sm" onClick={onCloseDialog}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default React.memo(VerifyCard);
