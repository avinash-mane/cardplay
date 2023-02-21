import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"
import { fireStore } from "../firebase";

const wins = [
    "Early 5",
    "Top Line",
    "Middle Line",
    "Bottom Line",
    "Four Corners",
    "Full House 1",
    " Full House 2"
]

const constSets = [1, 2, 3, 4, 5, 6];
const colors = ["red", "green", "blue", "purple", "orange", "yellow"]

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

    return (
        <dialog open={openDialog}>
            <div>
                <div>
                    <input className="mr-3 p-1" style={{ width: "100px" }} placeholder="card id" onChange={(e) => setId(e.target.value)} type="number" />
                    <label className="mr-2">select Color : </label>
                    <select onChange={changeColor} className="px-2 py-1" >
                        {colors.map((c, index) => index < onlineCards.sets && <option value={c} style={{ background: c }}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="p-2">
                {id !== "" && onlineCards.players != 0 && (parseInt(id) > onlineCards.players || id <= 0) ?
                    <h3>Card Not Found</h3> :
                    <>{selectedCard?._entries?.map((row, rowindex) =>
                        <div style={{ display: "flex" }}>
                            {row.map((col) => <button
                                style={{
                                    width: "15%",
                                    minWidth: "40px",
                                    border: "1px solid",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "20px",
                                    padding: "2%",
                                    background: col ? list.includes(col) ? "#6c757d" : "#fff" : color,
                                    cursor: col ? "pointer" : "unset",
                                    textDecoration: list.includes(col) ? "line-through" : "none",
                                    textDecorationThickness: list.includes(col) ? "1px" : "none"
                                }}>
                                {col || " "}</button>)}
                        </div>)
                    }</>
                }
            </div>
            <div className="d-flex justify-content-end">
                <button type="button" class="btn btn-outline-danger btn-sm" onClick={onCloseDialog}>close</button>
            </div>
        </dialog>
    );
}

export default React.memo(VerifyCard);
