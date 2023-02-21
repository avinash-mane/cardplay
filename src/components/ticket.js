import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import tamblo from "tambola-generator"
import { useHistory } from 'react-router-dom';
import { collection, updateDoc, doc } from "firebase/firestore"
import { fireStore } from "../firebase";

const constSets = [1, 2, 3, 4, 5, 6];
const colors = ["red", "green", "blue", "purple", "orange", "yellow"]

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
            return <><div className="mb-4">
                <div id={`${myID}_${color}`} style={{ marginLeft: "20px", padding: "30px", background: "#fff" }} className="border border-success" >
                    <span>{color}</span>
                    {card._entries.map(row =>
                        <div class="row ">
                            {row.map(col => <div class="col border border-dark" style={{ width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", background: col ? "#fff" : color }}>{col || " "}</div>)}
                        </div>)
                    }
                    <span> ticket : {`${myID}_${color}`}</span>
                </div>
            </div>
            </>
        }
        return func;
    }

    const tempCard = Card();

    return (
        <>
            {!list.length ?
                <div className="row" style={{ height: "100vh", background: "#cccbab", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div>
                        <Button onClick={() => history.push("/")} size="sm" variant="success" className="mb-2">Home</Button>
                        <div>
                            <input style={{ padding: "10px" }} placeholder="enter number of players" onChange={(e) => setPlayers(e.target.value)} type="number" />
                        </div>
                        <div className="mt-2">
                            <label className="mr-3">select number of sets : </label>
                            <select onChange={(e) => setSets(parseInt(e.target.value))} className="px-2 py-1">
                                {constSets.map(set => <option value={set} >{set}</option>)}
                            </select>
                        </div>
                        <div className="mt-5">
                            <Button onClick={handelSubmit} variant="success">Generate Tickets</Button>
                        </div>
                    </div>
                </div> :
                <div style={{ background: "#cccbab" }} className="mb-5">
                    <Button onClick={() => history.push("/")} size="sm" variant="success" className="mb-2">Home</Button>
                    <Button onClick={() => setOpenField(v => !v)} size="sm" variant="warning" className="ml-2 mb-2">Upload Ticket</Button>
                    {openField && <div>
                        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button onClick={updateTickets} size="sm" variant="primary" className="ml-2 mb-2">Submit</Button>
                    </div>}
                    <div className="row" >
                        {list.map((ticket, index) => tempCard(ticket, index))}
                    </div>
                </div>
            }
        </>
    );
}

export default React.memo(Ticket);

