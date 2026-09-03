import React from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";

function getPlayCardUrl() {
    const origin = window.location.origin;
    const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
    return `${origin}${base}/#/card`;
}

function PlayCardQr({ openDialog, setOpenDialog }) {
    const history = useHistory();
    const playCardUrl = getPlayCardUrl();
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(playCardUrl)}`;

    const onCloseDialog = () => setOpenDialog(false);

    const goToPlayCard = () => {
        setOpenDialog(false);
        history.push("/card");
    };

    return (
        <dialog open={openDialog} className="tb-dialog" aria-label="Play card QR code">
            <div className="tb-dialog__panel tb-dialog__panel--share">
                <div className="tb-dialog__head">
                    <div>
                        <h2 className="tb-dialog__title">Play Card</h2>
                        <p className="tb-dialog__sub">Scan the QR code to open the play card on your phone</p>
                    </div>
                    <button
                        type="button"
                        className="tb-dialog__close"
                        aria-label="Close play card dialog"
                        onClick={onCloseDialog}>
                        &#10005;
                    </button>
                </div>

                <div className="tb-qr">
                    <img
                        className="tb-qr__image"
                        src={qrSrc}
                        width="640"
                        height="640"
                        alt="QR code linking to the play card page" />
                    <p className="tb-qr__url">{playCardUrl}</p>
                </div>

                <div className="tb-dialog__foot tb-dialog__foot--center">
                    <Button
                        variant=""
                        className="tb-btn tb-btn--gold tb-btn--lg"
                        onClick={goToPlayCard}>
                        Open Play Card
                    </Button>
                </div>
            </div>
        </dialog>
    );
}

export default React.memo(PlayCardQr);
