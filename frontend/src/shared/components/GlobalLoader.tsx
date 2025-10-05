import styles from "./GlobalLoader.module.scss";

export default function GlobalLoader() {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.goose}>
          <pre>{`
            ░░░░░░░░░░░░░░░
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░
    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
        ░░░░░░░░░░░░░░░░░░░░░░░░░░
          `}</pre>
        </div>

        <div className={styles.title}>🦆 The Last of Guss</div>

        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <div className={styles.text}>
            <span className={styles.letter}>З</span>
            <span className={styles.letter}>а</span>
            <span className={styles.letter}>г</span>
            <span className={styles.letter}>р</span>
            <span className={styles.letter}>у</span>
            <span className={styles.letter}>з</span>
            <span className={styles.letter}>к</span>
            <span className={styles.letter}>а</span>
            <span className={styles.dots}>...</span>
          </div>
        </div>

        <div className={styles.subtitle}>
          Подготовка к битве с мутировавшим гусем
        </div>
      </div>
    </div>
  );
}
