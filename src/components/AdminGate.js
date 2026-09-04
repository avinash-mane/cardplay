import React, { useState } from "react";
import { Button } from "react-bootstrap";

const STORAGE_KEY = "tb-admin-unlocked"
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD

function AdminGate({ children }) {
    const [unlocked, setUnlocked] = useState(
        () => localStorage.getItem(STORAGE_KEY) === "true"
    )
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const onSubmit = (event) => {
        event.preventDefault()
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem(STORAGE_KEY, "true")
            setError("")
            setUnlocked(true)
        } else {
            setError("That password does not match. Please try again.")
            setPassword("")
        }
    }

    // Without a configured password the host screens would be permanently
    // unreachable, so fall through instead of locking everyone out.
    if (unlocked || !ADMIN_PASSWORD) return children

    return (
        <div className="tb-app">
            <main className="tb-main">
                <section className="tb-panel tb-gate">
                    <h2 className="tb-gate__title">Host access</h2>
                    <p className="tb-gate__text">
                        This screen is for the game host. Enter the admin password to
                        continue. Players do not need this &mdash; their ticket link opens
                        straight away.
                    </p>
                    <form className="tb-gate__form" onSubmit={onSubmit}>
                        <div className="tb-field">
                            <label className="tb-label" htmlFor="admin-gate-password">
                                Admin password
                            </label>
                            <input
                                id="admin-gate-password"
                                type="password"
                                className="tb-input"
                                placeholder="admin password"
                                autoComplete="current-password"
                                autoFocus
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError("")
                                }} />
                        </div>
                        {error &&
                            <div className="tb-notice">
                                <strong>{error}</strong>
                            </div>
                        }
                        <Button
                            type="submit"
                            variant=""
                            className="tb-btn tb-btn--success tb-btn--lg tb-btn--block">
                            Unlock
                        </Button>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default React.memo(AdminGate);
