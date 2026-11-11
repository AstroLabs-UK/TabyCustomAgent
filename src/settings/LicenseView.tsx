/** In-app license summary — full text in repo LICENSE */
export function LicenseView() {
  return (
    <section className="card module-card" data-testid="license-view">
      <h2>License</h2>
      <p className="hint">
        Custom Taby Agent is free for <strong>personal, non-commercial</strong>{" "}
        use.
      </p>
      <ul className="module-list" style={{ listStyle: "disc", paddingLeft: 18 }}>
        <li>Commercial use requires written approval.</li>
        <li>
          Changing the name, branding, or purpose requires written approval from
          Lucas Stevens (lucas@astrolabs.uk).
        </li>
        <li>
          Face GIFs and related animations acknowledge{" "}
          <a
            href="https://github.com/TRIIIS-LABS/firmware-taby"
            target="_blank"
            rel="noreferrer"
          >
            TRIIIS-LABS/firmware-taby
          </a>
          .
        </li>
      </ul>
      <p className="hint" style={{ marginTop: 12 }}>
        Full terms: see <code>LICENSE</code> in the project repository.
      </p>
      <p className="hint">
        Contact:{" "}
        <a href="mailto:lucas@astrolabs.uk">lucas@astrolabs.uk</a>
      </p>
    </section>
  );
}
