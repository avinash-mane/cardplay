import { collection, getDocs, runTransaction } from "firebase/firestore"
import { fireStore } from "./firebase"

const ASSIGNED_FIELD = "assigned_list"

// "pm199", " PM-199 " and "Pm 199" all resolve to the same employee.
export function normalizeEmployeeCode(code) {
    return (code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
}

// Everything lives in the first document of the tickets collection.
async function getTicketsSnapshot() {
    const snapshot = await getDocs(collection(fireStore, "tickets"))
    const first = snapshot.docs[0]
    if (!first) throw new Error("Tickets are not ready yet")
    return first
}

// assigned_list may be a native array, a JSON string, or missing entirely.
function readAssigned(data) {
    const raw = data ? data[ASSIGNED_FIELD] : null

    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw || "[]")
            return { rows: Array.isArray(parsed) ? parsed : [], asString: true }
        } catch (err) {
            return { rows: [], asString: true }
        }
    }
    if (Array.isArray(raw)) return { rows: raw.filter(Boolean), asString: false }
    if (raw && typeof raw === "object") return { rows: Object.values(raw), asString: false }
    return { rows: [], asString: false }
}

function rowCode(row) {
    if (!row) return ""
    return normalizeEmployeeCode(row.employeeCode || row.employee_code || row.code || row.empId || "")
}

function rowTicketId(row) {
    if (!row) return 0
    return parseInt(row.ticketId || row.ticket_id || row.ticket || 0, 10) || 0
}

function toRecord(row, code) {
    return { employeeCode: code, name: row.name || "", ticketId: rowTicketId(row) }
}

function nextFreeTicketId(rows, maxPlayers) {
    const used = new Set(rows.map(rowTicketId).filter(id => id > 0))
    for (let id = 1; id <= maxPlayers; id++) {
        if (!used.has(id)) return id
    }
    return 0
}

export async function findAssignment(employeeCode) {
    const code = normalizeEmployeeCode(employeeCode)
    if (!code) throw new Error("Enter your employee id")

    const snapshot = await getTicketsSnapshot()
    const { rows } = readAssigned(snapshot.data())
    const match = rows.find(row => rowCode(row) === code)

    return match ? toRecord(match, code) : null
}

export async function listAssignments() {
    const snapshot = await getTicketsSnapshot()
    const data = snapshot.data()
    const { rows } = readAssigned(data)
    const maxPlayers = parseInt(data.players, 10) || 0

    const assignments = rows
        .map(row => toRecord(row, rowCode(row)))
        .filter(row => row.employeeCode)
        .sort((a, b) => a.ticketId - b.ticketId)

    return { assignments, maxPlayers, remaining: Math.max(0, maxPlayers - assignments.length) }
}

export async function claimTicket({ employeeCode, name }) {
    const code = normalizeEmployeeCode(employeeCode)
    const displayName = (name || "").trim()

    if (!code) throw new Error("Enter your employee id")
    if (!displayName) throw new Error("Enter your name")

    const ticketsRef = (await getTicketsSnapshot()).ref

    // A transaction on the single tickets document keeps concurrent scans
    // from handing the same ticket to two people.
    return runTransaction(fireStore, async (transaction) => {
        const snapshot = await transaction.get(ticketsRef)
        if (!snapshot.exists()) throw new Error("Tickets are not ready yet")

        const data = snapshot.data()
        const { rows, asString } = readAssigned(data)

        const match = rows.find(row => rowCode(row) === code)
        if (match) {
            return { ...toRecord(match, code), existing: true }
        }

        const maxPlayers = parseInt(data.players, 10) || 0
        if (!maxPlayers) throw new Error("Tickets are not ready yet")

        const nextId = nextFreeTicketId(rows, maxPlayers)
        if (!nextId) throw new Error("All tickets have been assigned")

        // serverTimestamp() is rejected inside arrays, so store an ISO string.
        const record = {
            employeeCode: code,
            name: displayName,
            ticketId: nextId,
            assignedAt: new Date().toISOString()
        }
        const updated = [...rows, record]

        transaction.update(ticketsRef, {
            [ASSIGNED_FIELD]: asString ? JSON.stringify(updated) : updated
        })
        return { ...record, existing: false }
    })
}

export async function removeAssignment(employeeCode) {
    const code = normalizeEmployeeCode(employeeCode)
    if (!code) throw new Error("Enter your employee id")

    const ticketsRef = (await getTicketsSnapshot()).ref

    return runTransaction(fireStore, async (transaction) => {
        const snapshot = await transaction.get(ticketsRef)
        if (!snapshot.exists()) throw new Error("Tickets are not ready yet")

        const data = snapshot.data()
        const { rows, asString } = readAssigned(data)
        const match = rows.find(row => rowCode(row) === code)
        if (!match) throw new Error("No assignment found for that employee id")

        const updated = rows.filter(row => rowCode(row) !== code)
        transaction.update(ticketsRef, {
            [ASSIGNED_FIELD]: asString ? JSON.stringify(updated) : updated
        })
        return toRecord(match, code)
    })
}
