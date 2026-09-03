import React from "react";

function Footer({ note }) {
  return (
    <footer className="tb-footer">
      {note && (
        <>
          <span>{note}</span>
          <span className="tb-footer__sep" aria-hidden="true" />
        </>
      )}
      <span className="tb-footer__credit">
        Created by <span className="tb-footer__name">Avinash Mane</span>
      </span>
    </footer>
  );
}

export default React.memo(Footer);
