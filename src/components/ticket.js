import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import tamblo from "tambola-generator"
import { useHistory } from 'react-router-dom';
import { updateDoc, doc } from "firebase/firestore"
import { fireStore } from "../firebase";
import { claimTicket, listAssignments, normalizeEmployeeCode, removeAssignment } from "../assignments";
import { listWinners } from "../winners";

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

function Ticket() {
    const [list, setList] = useState([]);
    const [player, setPlayers] = useState(0);
    const [sets, setSets] = useState(1);
    const [password, setPassword] = useState("")
    const [openField, setOpenField] = useState(false)
    const [assignments, setAssignments] = useState([])
    const [maxPlayers, setMaxPlayers] = useState(0)
    const [remaining, setRemaining] = useState(0)
    const [assignCode, setAssignCode] = useState("")
    const [assignName, setAssignName] = useState("")
    const [assignError, setAssignError] = useState("")
    const [assignNotice, setAssignNotice] = useState("")
    const [isAssigning, setIsAssigning] = useState(false)
    const [isLoadingAssign, setIsLoadingAssign] = useState(false)
    const [deletingCode, setDeletingCode] = useState("")
    const [winners, setWinners] = useState([])
    const [winnerError, setWinnerError] = useState("")
    const [isLoadingWinners, setIsLoadingWinners] = useState(false)
    const [activeTab, setActiveTab] = useState("generate")

    const history = useHistory()

    const refreshAssignments = async () => {
        setIsLoadingAssign(true)
        try {
            const result = await listAssignments()
            setAssignments(result.assignments)
            setMaxPlayers(result.maxPlayers)
            setRemaining(result.remaining)
        } catch (err) {
            setAssignError(err.message || "Could not load assignments")
        } finally {
            setIsLoadingAssign(false)
        }
    }

    const refreshWinners = async () => {
        setIsLoadingWinners(true)
        setWinnerError("")
        try {
            setWinners(await listWinners())
        } catch (err) {
            setWinnerError(err.message || "Could not load winners")
        } finally {
            setIsLoadingWinners(false)
        }
    }

    useEffect(() => {
        refreshAssignments()
        refreshWinners()
    }, [])

    const onManualAssign = async (event) => {
        event.preventDefault()
        setAssignError("")
        setAssignNotice("")

        const code = normalizeEmployeeCode(assignCode)
        if (!code) {
            setAssignError("Enter an employee id")
            return
        }
        if (!(assignName || "").trim()) {
            setAssignError("Enter the employee name")
            return
        }

        const already = assignments.find(row => row.employeeCode === code)
        if (already) {
            setAssignError(
                `${code} already has ticket ${already.ticketId}` +
                (already.name ? ` (${already.name})` : "") +
                ". A second ticket cannot be assigned to the same employee id."
            )
            return
        }

        setIsAssigning(true)
        try {
            const result = await claimTicket({ employeeCode: assignCode, name: assignName })
            if (result.existing) {
                setAssignError(
                    `${result.employeeCode} already has ticket ${result.ticketId}` +
                    (result.name ? ` (${result.name})` : "") +
                    ". A second ticket cannot be assigned to the same employee id."
                )
            } else {
                setAssignNotice(`Assigned ticket ${result.ticketId} to ${result.employeeCode}`)
                setAssignCode("")
                setAssignName("")
            }
            await refreshAssignments()
        } catch (err) {
            setAssignError(err.message || "Could not assign a ticket")
        } finally {
            setIsAssigning(false)
        }
    }

    const onDeleteAssignment = async (row) => {
        const confirmed = window.confirm(
            `Remove ticket ${row.ticketId} from ${row.employeeCode}` +
            (row.name ? ` (${row.name})` : "") +
            "? That ticket number can be assigned again."
        )
        if (!confirmed) return

        setAssignError("")
        setAssignNotice("")
        setDeletingCode(row.employeeCode)
        try {
            await removeAssignment(row.employeeCode)
            setAssignNotice(`Removed ticket ${row.ticketId} from ${row.employeeCode}`)
            await refreshAssignments()
        } catch (err) {
            setAssignError(err.message || "Could not remove that assignment")
        } finally {
            setDeletingCode("")
        }
    }

    const downloadParticipantsExcel = () => {
        if (!assignments.length) {
            setAssignError("No participants to download yet")
            return
        }

        const escapeXml = (value) => String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")

        const rowsXml = assignments.map(row => `
            <Row>
                <Cell><Data ss:Type="Number">${row.ticketId}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.employeeCode)}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.name || "")}</Data></Cell>
            </Row>`).join("")

        const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Participants">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Ticket</Data></Cell>
        <Cell><Data ss:Type="String">Employee ID</Data></Cell>
        <Cell><Data ss:Type="String">Name</Data></Cell>
      </Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`

        const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const stamp = new Date().toISOString().slice(0, 10)
        link.href = url
        link.download = `tambola-participants-${stamp}.xls`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    const downloadWinnersExcel = () => {
        if (!winners.length) {
            setWinnerError("No winners to download yet")
            return
        }

        const escapeXml = (value) => String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")

        const rowsXml = winners.map(row => `
            <Row>
                <Cell><Data ss:Type="Number">${row.ticketId}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.employeeCode)}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.category)}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.color)}</Data></Cell>
                <Cell><Data ss:Type="String">${escapeXml(row.wonAt)}</Data></Cell>
            </Row>`).join("")

        const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Winners">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Ticket</Data></Cell>
        <Cell><Data ss:Type="String">Employee ID</Data></Cell>
        <Cell><Data ss:Type="String">Name</Data></Cell>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Set</Data></Cell>
        <Cell><Data ss:Type="String">Won At</Data></Cell>
      </Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`

        const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `tambola-winners-${new Date().toISOString().slice(0, 10)}.xls`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    const updateTickets = async () => {
        if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
            const ticketDoc = doc(fireStore, "tickets", "tickets")
            let data = {
                list: JSON.stringify(list),
                players: parseInt(player),
                sets: sets,
                assigned_list: "",
                winners: ""
            }
            await updateDoc(ticketDoc, data)
            alert("tickets uploaded successfully")
            setOpenField(false)
            refreshAssignments()
            refreshWinners()
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

    const tabs = [
        { id: "generate", label: "Generate tickets", count: list.length },
        { id: "assigned", label: "Assigned list", count: assignments.length },
        { id: "winners", label: "Winner list", count: winners.length }
    ]

    return (
        <div className="tb-app">
            <main className="tb-main">
                <div className="tb-toolbar">
                    <Button variant="" className="tb-btn tb-btn--ghost tb-btn--sm" onClick={() => history.push("/")}>
                        &#8592; Home
                    </Button>
                    <h1 className="tb-admin-title">Admin section</h1>
                    <span className="tb-toolbar__spacer" />
                    {activeTab === "generate" && list.length > 0 &&
                        <Button variant="" className="tb-btn tb-btn--gold tb-btn--sm" onClick={() => setOpenField(v => !v)}>
                            Upload Tickets
                        </Button>
                    }
                </div>

                <div className="tb-tabs" role="tablist" aria-label="Admin sections">
                    {tabs.map(tab =>
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            id={`tb-tab-${tab.id}`}
                            aria-controls={`tb-tabpanel-${tab.id}`}
                            aria-selected={activeTab === tab.id}
                            className={`tb-tab ${activeTab === tab.id ? "is-active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}>
                            {tab.label}
                            <span className="tb-tab__count">{tab.count}</span>
                        </button>
                    )}
                </div>

                <div
                    id="tb-tabpanel-generate"
                    role="tabpanel"
                    aria-labelledby="tb-tab-generate"
                    hidden={activeTab !== "generate"}>
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
                </div>

                <div
                    id="tb-tabpanel-winners"
                    role="tabpanel"
                    aria-labelledby="tb-tab-winners"
                    hidden={activeTab !== "winners"}>
                <section className="tb-panel" aria-label="Winners">
                    <div className="tb-panel__head">
                        <h2 className="tb-panel__title">Winners</h2>
                        <span className="tb-chip">{winners.length} recorded</span>
                    </div>
                    <div className="tb-winners-actions">
                        <Button
                            variant=""
                            className="tb-btn tb-btn--ghost tb-btn--sm"
                            onClick={refreshWinners}
                            disabled={isLoadingWinners}>
                            {isLoadingWinners ? "Refreshing…" : "Refresh"}
                        </Button>
                        <Button
                            variant=""
                            className="tb-btn tb-btn--gold tb-btn--sm"
                            onClick={downloadWinnersExcel}
                            disabled={!winners.length}>
                            Download winners Excel
                        </Button>
                    </div>

                    {winnerError &&
                        <div className="tb-notice tb-winners-notice">
                            <strong>{winnerError}</strong>
                        </div>
                    }

                    {winners.length ?
                        <div className="tb-winners-table-wrap">
                            <table className="tb-assign-table tb-winners-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Employee id</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Set</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {winners.map((winner, index) =>
                                        <tr key={`${winner.ticketId}-${winner.color}-${winner.category}-${index}`}>
                                            <td>{winner.ticketId}</td>
                                            <td>{winner.employeeCode || "—"}</td>
                                            <td>{winner.name || "—"}</td>
                                            <td>{winner.category}</td>
                                            <td className="tb-winner-set">{winner.color}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div> :
                        <p className="tb-assign-empty">
                            {isLoadingWinners ? "Loading…" : "No winners have been recorded yet."}
                        </p>
                    }
                </section>
                </div>

                <div
                    id="tb-tabpanel-assigned"
                    role="tabpanel"
                    aria-labelledby="tb-tab-assigned"
                    hidden={activeTab !== "assigned"}>
                <section className="tb-panel" aria-label="Assigned tickets">
                    <div className="tb-panel__head">
                        <h2 className="tb-panel__title">Assigned tickets</h2>
                        <span className="tb-chip">
                            {assignments.length} / {maxPlayers || "—"} taken
                            {remaining ? ` · ${remaining} left` : ""}
                        </span>
                    </div>
                    <div className="tb-winners-actions">
                    <Button
                        variant=""
                        className="tb-btn tb-btn--ghost tb-btn--sm"
                        onClick={refreshAssignments}
                        disabled={isLoadingAssign}>
                        {isLoadingAssign ? "Refreshing…" : "Refresh"}
                    </Button>
                    <Button
                        variant=""
                        className="tb-btn tb-btn--gold tb-btn--sm"
                        onClick={downloadParticipantsExcel}
                        disabled={!assignments.length}>
                        Download Excel
                    </Button>
                    </div>

                    {assignments.length ?
                        <div className="tb-assign-table-wrap">
                            <table className="tb-assign-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Employee id</th>
                                        <th>Name</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map(row =>
                                        <tr key={`${row.employeeCode}-${row.ticketId}`}>
                                            <td>{row.ticketId}</td>
                                            <td>{row.employeeCode}</td>
                                            <td>{row.name || "—"}</td>
                                            <td>
                                                <Button
                                                    variant=""
                                                    className="tb-btn tb-btn--ghost tb-btn--sm"
                                                    onClick={() => onDeleteAssignment(row)}
                                                    disabled={!!deletingCode}>
                                                    {deletingCode === row.employeeCode ? "Removing…" : "Remove"}
                                                </Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div> :
                        <p className="tb-assign-empty">
                            {isLoadingAssign ? "Loading…" : "No employees have been assigned a ticket yet."}
                        </p>
                    }

                    <form className="tb-assign-form" onSubmit={onManualAssign}>
                        <div className="tb-field">
                            <label className="tb-label" htmlFor="admin-emp-code">Employee id</label>
                            <input
                                id="admin-emp-code"
                                className="tb-input"
                                placeholder="e.g. PM199"
                                autoComplete="off"
                                value={assignCode}
                                onChange={(e) => {
                                    setAssignCode(e.target.value)
                                    setAssignError("")
                                    setAssignNotice("")
                                }} />
                        </div>
                        <div className="tb-field">
                            <label className="tb-label" htmlFor="admin-emp-name">Name</label>
                            <input
                                id="admin-emp-name"
                                className="tb-input"
                                placeholder="employee name"
                                value={assignName}
                                onChange={(e) => setAssignName(e.target.value)} />
                        </div>
                        <Button
                            type="submit"
                            variant=""
                            className="tb-btn tb-btn--gold"
                            disabled={isAssigning}>
                            {isAssigning ? "Assigning…" : "Assign ticket"}
                        </Button>
                    </form>
                    {assignError &&
                        <div className="tb-notice tb-assignment-notice">
                            <strong>{assignError}</strong>
                        </div>
                    }
                    {assignNotice && !assignError &&
                        <p className="tb-assign-empty">{assignNotice}</p>
                    }
                </section>
                </div>
            </main>
        </div>
    );
}

export default React.memo(Ticket);
