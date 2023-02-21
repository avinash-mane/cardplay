import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"
import { fireStore } from "../firebase";
import { Button } from "react-bootstrap";
import { useParams } from "react-router-dom"
import claps from "../assets/clap.mp3"
import img from "../assets/clapman.gif"
const colors = ["red", "green", "blue", "purple", "orange", "yellow"]
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

    return (
        <div style={{background: "peru"}}>
            {id === "" && <div>
                <input placeholder="insert you ticket id" className='m-5 p-3' onChange={(e) => tempId = e.target.value} />
                <Button onClick={() => setId(tempId)} className='m-5' variant="success">Submit</Button>
            </div>
            }
            {id && <h2>Ticket : {id}</h2>}
            {selectedCard.map((card, cardindex) => <div style={{background: "#fff", border: "1px solid" }} className="d-sm-flex p-1 p-md-3 m-0 m-md-3">
                <div className="w-sm-100 col-sm-9 p-0">
                    {card._entries.map((row, rowindex) =>
                        <div style={{ display: "flex", height: "30%" }}>
                            {row.map((col, colindex) => <button
                                style={{
                                    // lexBasis: 0,
                                    // flexGrow: 1,
                                    // maxWidth: "100%",
                                    width: "15%",
                                    minWidth: "30px",
                                    border: "1px solid",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "20px",
                                    padding: "2%",
                                    background: col ? (myCard[cardindex][rowindex][colindex] ? "#6c757d" : "#fff") : colors[cardindex],
                                    cursor: col ? "pointer" : "unset",
                                    textDecoration: myCard[cardindex][rowindex][colindex] ? "line-through" : "none",
                                    textDecorationThickness: myCard[cardindex][rowindex][colindex] ? "1px" : "none"
                                }}
                                onClick={(e) => onClick(cardindex, rowindex, colindex, col)}>
                                {col || " "}</button>)}
                        </div>)
                    }
                </div>
                {myCount[cardindex].all == 15 ?
                    showGIF == cardindex + 1 && <img src={img} height="180px" className="p-2"></img> :
                    <div style={{ textAlign: "left", marginLeft: "10px", fontSize: "14px", fontWeight: "600" }}>
                        <div style={{ padding: "3px" }}>
                            Early 5: {myCount[cardindex].all >= 5 ? <>&#x2705;</> : <>&#10060;</>}
                        </div>
                        <div style={{ padding: "3px" }}>
                            Top Line: {myCount[cardindex].top == 5 ? <>&#x2705;</> : <>&#10060;</>}
                        </div>
                        <div style={{ padding: "3px" }}>
                            Middle Line: {myCount[cardindex].middle == 5 ? <>&#x2705;</> : <>&#10060;</>}
                        </div>
                        <div style={{ padding: "3px" }}>
                            Bottom Line: {myCount[cardindex].bottom == 5 ? <>&#x2705;</> : <>&#10060;</>}
                        </div>
                        <div style={{ padding: "3px" }}>
                            Four Corners: {myCount[cardindex].corner == 4 ? <>&#x2705;</> : <>&#10060;</>}
                        </div>
                        <div style={{ padding: "3px" }}>
                            Full House 1: {myCount[cardindex].all == 15 ? <>&#x2705;</> : <>&#10060;</>}
                        </div>
                    </div>}
            </div>)}
            {id !== "" && players != 0 && (parseInt(id) > players || id <= 0) && <h1>Card Not Found</h1>}
        </div>
    );
}

export default React.memo(PlayCard);
