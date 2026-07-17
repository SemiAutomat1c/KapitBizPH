import styles from "./KapitBizRelay.module.css";

export default function DemoDataNotice() {
  return (
    <p className={styles.demoNotice}>
      <strong>Simulated demo event.</strong> Incident, capacity, timing, and transaction details are seeded for this demo.
    </p>
  );
}
