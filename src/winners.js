import { collection, getDocs, runTransaction } from "firebase/firestore"
import { fireStore } from "./firebase"
import { normalizeEmployeeCode } from "./assignments"

const WINNERS_FIELD = "winners"

async function getTicketsSnapshot() {
    const snapshot = await getDocs(collection(fireStore, "tickets"))
    const first = snapshot.docs[0]
    if (!first) throw new Error("Tickets are not ready yet")
    return first
}

function readRows(raw) {
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

function readAssignments(raw) {
    return readRows(raw).rows
}

function assignmentTicketId(row) {
    return parseInt(row?.ticketId || row?.ticket_id || row?.ticket || 0, 10) || 0
}

function normalizeWinner(row) {
    return {
        ticketId: parseInt(row?.ticketId || 0, 10) || 0,
        employeeCode: normalizeEmployeeCode(row?.employeeCode || ""),
        name: (row?.name || "").trim(),
        color: (row?.color || "").toLowerCase(),
        category: (row?.category || "").trim(),
        wonAt: row?.wonAt || ""
    }
}

export async function listWinners() {
    const snapshot = await getTicketsSnapshot()
    const { rows } = readRows(snapshot.data()[WINNERS_FIELD])

    return rows
        .map(normalizeWinner)
        .filter(row => row.ticketId && row.category)
        .sort((a, b) => (a.wonAt || "").localeCompare(b.wonAt || ""))
}

export async function addWinner({ ticketId, color, category }) {
    const parsedTicketId = parseInt(ticketId, 10)
    const normalizedColor = (color || "").trim().toLowerCase()
    const normalizedCategory = (category || "").trim()

    if (!parsedTicketId) throw new Error("Select a valid ticket")
    if (!normalizedColor) throw new Error("Select a ticket colour")
    if (!normalizedCategory) throw new Error("Select a win category")

    const ticketsRef = (await getTicketsSnapshot()).ref

    return runTransaction(fireStore, async (transaction) => {
        const snapshot = await transaction.get(ticketsRef)
        if (!snapshot.exists()) throw new Error("Tickets are not ready yet")

        const data = snapshot.data()
        const { rows, asString } = readRows(data[WINNERS_FIELD])
        const existing = rows
            .map(normalizeWinner)
            .find(row =>
                row.ticketId === parsedTicketId &&
                row.color === normalizedColor &&
                row.category.toLowerCase() === normalizedCategory.toLowerCase()
            )

        if (existing) {
            throw new Error(`${normalizedCategory} is already recorded for this ticket set`)
        }

        const assignment = readAssignments(data.assigned_list)
            .find(row => assignmentTicketId(row) === parsedTicketId)

        if (!assignment) {
            throw new Error("This ticket is not assigned to a participant")
        }

        const record = {
            ticketId: parsedTicketId,
            employeeCode: normalizeEmployeeCode(
                assignment.employeeCode || assignment.employee_code || assignment.code || assignment.empId || ""
            ),
            name: (assignment.name || "").trim(),
            color: normalizedColor,
            category: normalizedCategory,
            wonAt: new Date().toISOString()
        }
        const updated = [...rows, record]

        transaction.update(ticketsRef, {
            [WINNERS_FIELD]: asString ? JSON.stringify(updated) : updated
        })

        return record
    })
}
