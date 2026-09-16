import { collection, getDocs, runTransaction } from "firebase/firestore"
import { fireStore } from "./firebase"

const OPTIONS_FIELD = "options"

export const CLAIM_OPTIONS = [
    { id: "early5", label: "Early 5" },
    { id: "topLine", label: "Top Line" },
    { id: "fourCorners", label: "Four Corners" },
    { id: "middleLine", label: "Middle Line" },
    { id: "bottomLine", label: "Bottom Line" },
    { id: "fullHouse", label: "Full House" }
]

const ALL_LABELS = CLAIM_OPTIONS.map(option => option.label)

const KEY_TO_LABEL = CLAIM_OPTIONS.reduce((map, option) => {
    map[normalizeKey(option.id)] = option.label
    map[normalizeKey(option.label)] = option.label
    return map
}, {
    earlyfive: "Early 5",
    early: "Early 5",
    corners: "Four Corners",
    fourcorner: "Four Corners",
    middle: "Middle Line",
    bottom: "Bottom Line",
    full: "Full House"
})

function normalizeKey(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
}

function isEnabledValue(value) {
    if (value === true || value === 1) return true
    if (value === false || value === 0 || value == null) return false
    const normalized = String(value).trim().toLowerCase()
    return normalized === "true" || normalized === "on" || normalized === "yes" || normalized === "1"
}

function labelFor(value) {
    return KEY_TO_LABEL[normalizeKey(value)] || ""
}

async function getTicketsSnapshot() {
    const snapshot = await getDocs(collection(fireStore, "tickets"))
    const first = snapshot.docs[0]
    if (!first) throw new Error("Tickets are not ready yet")
    return first
}

function readOptions(raw) {
    if (typeof raw === "string") {
        try {
            return { value: JSON.parse(raw || "null"), asString: true }
        } catch (err) {
            return { value: null, asString: true }
        }
    }
    return { value: raw, asString: false }
}

export function parseClaimOptions(raw) {
    const { value } = readOptions(raw)

    if (Array.isArray(value)) {
        if (!value.length) return [...ALL_LABELS]
        const enabled = new Set(value.map(labelFor).filter(Boolean))
        return CLAIM_OPTIONS
            .map(option => option.label)
            .filter(label => enabled.has(label))
    }

    if (value && typeof value === "object") {
        const entries = Object.entries(value)
        if (!entries.length) return [...ALL_LABELS]

        const enabled = new Set(ALL_LABELS)
        entries.forEach(([key, flag]) => {
            const label = labelFor(key)
            if (!label) return
            if (isEnabledValue(flag)) enabled.add(label)
            else enabled.delete(label)
        })
        return CLAIM_OPTIONS
            .map(option => option.label)
            .filter(label => enabled.has(label))
    }

    return [...ALL_LABELS]
}

export async function listClaimOptions() {
    const snapshot = await getTicketsSnapshot()
    return parseClaimOptions(snapshot.data()[OPTIONS_FIELD])
}

export async function saveClaimOptions(enabledLabels) {
    const enabled = new Set(enabledLabels)
    const payload = CLAIM_OPTIONS.reduce((map, option) => {
        map[option.label] = enabled.has(option.label)
        return map
    }, {})

    const ticketsRef = (await getTicketsSnapshot()).ref

    return runTransaction(fireStore, async (transaction) => {
        const snapshot = await transaction.get(ticketsRef)
        if (!snapshot.exists()) throw new Error("Tickets are not ready yet")

        const { asString } = readOptions(snapshot.data()[OPTIONS_FIELD])
        transaction.update(ticketsRef, {
            [OPTIONS_FIELD]: asString ? JSON.stringify(payload) : payload
        })
        return CLAIM_OPTIONS
            .map(option => option.label)
            .filter(label => payload[label])
    })
}
